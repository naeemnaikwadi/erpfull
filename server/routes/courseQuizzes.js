const express = require('express');
const router = express.Router();
const { auth }= require('../middleware/auth');
const CourseQuiz = require('../models/CourseQuiz');
const Course = require('../models/Course');
const Classroom = require('../models/Classroom');
const CourseQuizAttempt = require('../models/CourseQuizAttempt');

// @route   POST api/course-quizzes
// @desc    Create a new course quiz (Instructor/Admin)
// @access  Private
// Normalize question payload coming from various frontends
function normalizeQuestions(questions) {
  if (!Array.isArray(questions)) return [];

  return questions.map((question, index) => {
    // Map frontend types to backend enum
    let normalizedType = question.type;
    if (normalizedType === 'mcq-single') normalizedType = 'mcq';
    if (normalizedType === 'mcq-multiple') normalizedType = 'multiple_choice';
    if (normalizedType === 'numeric') normalizedType = 'numerical';
    if (normalizedType === 'long-answer') normalizedType = 'long_answer';

    const processedQuestion = {
      question: question.question,
      type: normalizedType,
      points: question.points || 1,
      difficulty: question.difficulty || 'medium',
      explanation: question.explanation || ''
    };

    if (normalizedType === 'mcq' || normalizedType === 'multiple_choice') {
      // Frontend may send options as array of strings and correct answer(s) as indices
      const optionsArray = Array.isArray(question.options) ? question.options : [];
      const options = optionsArray.map((opt, optIndex) => {
        const text = typeof opt === 'string' ? opt : (opt?.text ?? '');
        let isCorrect = false;
        if (normalizedType === 'mcq') {
          // correctAnswer may be index (string/number) or text
          const ca = question.correctAnswer;
          if (ca !== undefined && ca !== null && ca !== '') {
            const caIndex = typeof ca === 'string' ? parseInt(ca, 10) : Number(ca);
            if (!Number.isNaN(caIndex)) {
              isCorrect = caIndex === optIndex;
            } else if (typeof ca === 'string') {
              isCorrect = ca === text;
            }
          }
        } else if (normalizedType === 'multiple_choice') {
          // correctAnswers may be array of indices or texts
          const cas = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
          isCorrect = cas.some((entry) => {
            if (typeof entry === 'number') return entry === optIndex;
            if (typeof entry === 'string') {
              const idx = parseInt(entry, 10);
              if (!Number.isNaN(idx)) return idx === optIndex;
              return entry === text;
            }
            return false;
          });
        }
        return { text, isCorrect };
      });

      processedQuestion.options = options;
      // Also keep a compact correctAnswer string for convenience
      if (normalizedType === 'mcq') {
        const idx = typeof question.correctAnswer === 'string' ? parseInt(question.correctAnswer, 10) : Number(question.correctAnswer);
        processedQuestion.correctAnswer = !Number.isNaN(idx) && options[idx] ? options[idx].text : (question.correctAnswer || '');
      } else {
        const cas = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
        const texts = cas.map((entry) => {
          if (typeof entry === 'number' && options[entry]) return options[entry].text;
          if (typeof entry === 'string') {
            const idx = parseInt(entry, 10);
            if (!Number.isNaN(idx) && options[idx]) return options[idx].text;
            return entry;
          }
          return '';
        }).filter(Boolean);
        processedQuestion.correctAnswer = texts.join(',');
      }
    } else if (normalizedType === 'long_answer') {
      processedQuestion.longAnswerGuidelines = question.longAnswerGuidelines || '';
    } else if (normalizedType === 'numerical') {
      if (question.numericAnswer === undefined || question.numericAnswer === null || question.numericAnswer === '') {
        throw new Error(`Question ${index + 1}: Numeric answer is required for numerical questions`);
      }
      processedQuestion.numericAnswer = Number(question.numericAnswer);
      processedQuestion.numericTolerance = Number(question.numericTolerance || 0);
    }

    return processedQuestion;
  });
}

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, courseId, classroomId, questions, timeLimit, passingScore, allowRetakes, maxAttempts } = req.body;
    
    // Check if user is instructor or admin
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only instructors and admins can create quizzes.' });
    }

    // Validate course and classroom
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Check if user has access to this course/classroom
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only create quizzes for your own courses.' });
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }

    // Process and validate each question (tolerant to frontend formats)
    const processedQuestions = normalizeQuestions(questions);

    const quiz = await CourseQuiz.create({
      title,
      description,
      courseId,
      classroomId,
      instructorId: req.user.id,
      questions: processedQuestions,
      timeLimit: timeLimit || 30,
      passingScore: passingScore || 70,
      allowRetakes: allowRetakes !== false,
      maxAttempts: maxAttempts || 3
    });

    res.status(201).json(quiz);
  } catch (err) {
    console.error(err.message);
    if (err.message.includes('Question')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/course-quizzes/course/:courseId
// @desc    Get all quizzes for a course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const classroom = await Classroom.findById(course.classroom);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Check access permissions
    const isInstructor = course.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isEnrolled = classroom.students.includes(req.user.id);

    if (!isInstructor && !isAdmin && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const quizzes = await CourseQuiz.find({ 
      courseId, 
      isActive: true 
    }).populate('instructorId', 'name email');

    res.json({ quizzes });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/course-quizzes/:id
// @desc    Get a specific course quiz
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await CourseQuiz.findById(req.params.id)
      .populate('instructorId', 'name email')
      .populate('courseId', 'name')
      .populate('classroomId', 'name');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check access permissions
    const course = await Course.findById(quiz.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const classroom = await Classroom.findById(quiz.classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const isInstructor = course.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isEnrolled = classroom.students.includes(req.user.id);

    if (!isInstructor && !isAdmin && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For students, don't show correct answers or isCorrect flags
    if (!isInstructor && !isAdmin) {
      const quizObj = quiz.toObject();
      quizObj.questions = quizObj.questions.map(q => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined,
        options: Array.isArray(q.options)
          ? q.options.map(opt => ({ text: opt.text }))
          : undefined
      }));
      return res.json(quizObj);
    }

    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/course-quizzes/:id
// @desc    Update a course quiz
// @access  Private (Instructor/Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, questions, timeLimit, passingScore, allowRetakes, maxAttempts } = req.body;
    
    const quiz = await CourseQuiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {
      title: title || quiz.title,
      description: description || quiz.description,
      timeLimit: timeLimit || quiz.timeLimit,
      passingScore: passingScore || quiz.passingScore,
      allowRetakes: allowRetakes !== undefined ? allowRetakes : quiz.allowRetakes,
      maxAttempts: maxAttempts || quiz.maxAttempts
    };

    if (questions && questions.length > 0) {
      updateData.questions = normalizeQuestions(questions);
    }

    const updatedQuiz = await CourseQuiz.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedQuiz);
  } catch (err) {
    console.error(err.message);
    if (err.message.includes('Question')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE api/course-quizzes/:id
// @desc    Delete a course quiz
// @access  Private (Instructor/Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await CourseQuiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await CourseQuiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;

// Start a course quiz attempt
router.post('/:id/start', auth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await CourseQuiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const course = await Course.findById(quiz.courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const classroom = await Classroom.findById(quiz.classroomId);
    if (!classroom) return res.status(404).json({ error: 'Classroom not found' });

    const isEnrolled = classroom.students.includes(req.user.id);
    const isAdmin = req.user.role === 'admin';
    const isInstructor = course.instructor.toString() === req.user.id;
    if (!isEnrolled && !isAdmin && !isInstructor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Enforce attempts
    const attempts = await CourseQuizAttempt.find({ studentId: req.user.id, quizId });
    if (attempts.length >= (quiz.maxAttempts || 3)) {
      return res.status(400).json({ error: 'Maximum attempts exceeded for this quiz' });
    }

    const attempt = await CourseQuizAttempt.create({
      studentId: req.user.id,
      quizId,
      maxScore: quiz.totalPoints,
      attemptNumber: attempts.length + 1
    });

    res.json({ message: 'Quiz started', attemptId: attempt._id, timeLimit: quiz.timeLimit, totalQuestions: quiz.questions.length });
  } catch (err) {
    console.error('Course quiz start error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Submit course quiz answers
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { attemptId } = req.body;
    const rawAnswers = req.body.answers;
    const answers = typeof rawAnswers === 'string' ? JSON.parse(rawAnswers) : rawAnswers;

    const quiz = await CourseQuiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    const attempt = await CourseQuizAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'Quiz attempt not found' });
    if (attempt.studentId.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    if (attempt.status === 'completed') return res.status(400).json({ error: 'Quiz already completed' });

    const questionMap = new Map(quiz.questions.map(q => [String(q._id), q]));
    const processedAnswers = (answers || []).map(a => {
      const q = questionMap.get(String(a.questionId));
      if (!q) return null;
      const ans = { questionId: q._id, answer: a.answer, timeSpent: a.timeSpent || 0, isCorrect: false, pointsEarned: 0 };
      // Auto-grade for MCQ and numerical
      if (q.type === 'mcq' || q.type === 'multiple_choice') {
        // Correct answers from options with isCorrect
        const correctTexts = (q.options || []).filter(o => o.isCorrect).map(o => o.text);
        if (q.type === 'mcq') {
          const given = typeof a.answer === 'number' || /^[0-9]+$/.test(a.answer) ? Number(a.answer) : a.answer;
          const givenText = typeof given === 'number' ? (q.options?.[given]?.text) : given;
          ans.isCorrect = !!correctTexts.find(t => t === givenText);
        } else {
          const givenList = Array.isArray(a.answer) ? a.answer : (typeof a.answer === 'string' ? a.answer.split(',').map(s=>s.trim()) : []);
          const givenTexts = givenList.map(entry => {
            const idx = parseInt(entry, 10);
            if (!Number.isNaN(idx) && q.options?.[idx]) return q.options[idx].text;
            return entry;
          });
          ans.isCorrect = correctTexts.length === givenTexts.length && correctTexts.every(t => givenTexts.includes(t));
        }
        ans.pointsEarned = ans.isCorrect ? (q.points || 1) : 0;
      } else if (q.type === 'numerical') {
        const numeric = Number(a.answer);
        const tol = Number(q.numericTolerance || 0);
        ans.isCorrect = Math.abs(numeric - Number(q.numericAnswer)) <= tol;
        ans.pointsEarned = ans.isCorrect ? (q.points || 1) : 0;
      } else {
        // long_answer left for manual grading
        ans.pointsEarned = 0;
      }
      return ans;
    }).filter(Boolean);

    attempt.answers = processedAnswers;
    attempt.completeAttempt();
    attempt.totalScore = processedAnswers.reduce((t, a) => t + (a.pointsEarned || 0), 0);
    attempt.percentage = Math.round((attempt.totalScore / (attempt.maxScore || 1)) * 100);
    attempt.passed = attempt.percentage >= (quiz.passingScore || 70);
    await attempt.save();

    res.json({ message: 'Quiz submitted', attempt: attempt });
  } catch (err) {
    console.error('Course quiz submit error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Instructor: view results for a course quiz
router.get('/:id/results', auth, async (req, res) => {
  try {
    const quiz = await CourseQuiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (req.user.role !== 'admin' && quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const attempts = await CourseQuizAttempt.find({ quizId: quiz._id })
      .populate('studentId', 'name email fullName')
      .sort({ completedAt: -1, createdAt: -1 });
    
    // Transform the data to match frontend expectations
    const results = attempts.map(attempt => ({
      _id: attempt._id,
      student: {
        _id: attempt.studentId._id,
        name: attempt.studentId.name || attempt.studentId.fullName || 'Unknown Student',
        email: attempt.studentId.email || 'No email'
      },
      score: attempt.percentage || 0,
      totalScore: attempt.totalScore || 0,
      maxScore: attempt.maxScore || 1,
      passed: attempt.passed || false,
      completedAt: attempt.completedAt || attempt.createdAt,
      createdAt: attempt.createdAt,
      status: attempt.status || 'completed'
    }));
    
    res.json({ results });
  } catch (err) {
    console.error('Course quiz results error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Instructor: grade long-answer answers
router.put('/attempts/:attemptId/grade', auth, async (req, res) => {
  try {
    const { grades } = req.body; // [{questionId, pointsEarned, feedback}]
    const attempt = await CourseQuizAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    const quiz = await CourseQuiz.findById(attempt.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (req.user.role !== 'admin' && quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const gradeMap = new Map((grades || []).map(g => [String(g.questionId), g]));
    attempt.answers = attempt.answers.map(ans => {
      const g = gradeMap.get(String(ans.questionId));
      if (g && typeof g.pointsEarned === 'number') {
        ans.pointsEarned = g.pointsEarned;
        if (typeof g.feedback === 'string') ans.feedback = g.feedback;
      }
      return ans;
    });
    const total = attempt.answers.reduce((t, a) => t + (a.pointsEarned || 0), 0);
    attempt.totalScore = total;
    attempt.percentage = Math.round((total / (attempt.maxScore || 1)) * 100);
    attempt.passed = attempt.percentage >= (quiz.passingScore || 70);
    await attempt.save();
    res.json({ message: 'Attempt graded', attempt });
  } catch (err) {
    console.error('Course quiz grade error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

