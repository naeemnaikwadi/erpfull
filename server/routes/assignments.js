const express = require('express');
const router = express.Router();


const { auth, instructorOnly, studentOnly } = require('../middleware/auth');

//const {adminOnly} = require('../middleware/adminOnly');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const CloudinaryService = require('../services/cloudinaryService');
const Enrollment = require('../models/Enrollment'); // Added Enrollment model

// @route   POST api/assignments
// @desc    Create a new assignment (Instructor/Admin)
// @access  Private
router.post('/', auth, upload.single('assignmentPattern'), async (req, res) => {
  try {
    const { title, description, courseId, classroomId, dueDate, maxScore, instructions, allowLateSubmission } = req.body;
    
    // Check if user is instructor or admin
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only instructors and admins can create assignments.' });
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
      return res.status(403).json({ error: 'Access denied. You can only create assignments for your own courses.' });
    }

    const assignmentData = {
      title,
      description,
      courseId,
      classroomId,
      instructorId: req.user.id,
      dueDate: new Date(dueDate),
      maxScore: parseInt(maxScore) || 10,
      instructions: instructions || '',
      allowLateSubmission: allowLateSubmission === 'true'
    };

    // Handle assignment pattern upload if provided
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinaryResult = await CloudinaryService.uploadFile(
          req.file.buffer, 
          req.file, 
          'smart-learning/assignments/patterns'
        );
        
        assignmentData.assignmentPattern = {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadedBy: req.user.id,
          uploadedAt: new Date(),
          cloudinaryUrl: cloudinaryResult.cloudinaryUrl,
          cloudinaryId: cloudinaryResult.cloudinaryId
        };
      } catch (uploadError) {
        console.error('Assignment pattern upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload assignment pattern' });
      }
    }

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    res.status(201).json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/assignments/course/:courseId
// @desc    Get all assignments for a course
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

    const assignments = await Assignment.find({ 
      courseId, 
      isActive: true 
    }).populate('instructorId', 'name email');

    res.json({ assignments });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/assignments/:id
// @desc    Get a specific assignment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('instructorId', 'name email')
      .populate('courseId', 'name')
      .populate('classroomId', 'name');

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check access permissions
    const course = await Course.findById(assignment.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const classroom = await Classroom.findById(assignment.classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    const isInstructor = course.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isEnrolled = classroom.students.includes(req.user.id);

    if (!isInstructor && !isAdmin && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For students, don't show instructor-specific data
    if (!isInstructor && !isAdmin) {
      const assignmentObj = assignment.toObject();
      assignmentObj.submissions = assignmentObj.submissions.filter(sub => 
        sub.studentId.toString() === req.user.id
      );
      return res.json(assignmentObj);
    }

    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/assignments/:id
// @desc    Update an assignment
// @access  Private (Instructor/Admin)
router.put('/:id', auth, upload.single('assignmentPattern'), async (req, res) => {
  try {
    const { title, description, dueDate, maxScore, instructions, allowLateSubmission } = req.body;
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && assignment.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {
      title: title || assignment.title,
      description: description || assignment.description,
      dueDate: dueDate ? new Date(dueDate) : assignment.dueDate,
      maxScore: maxScore ? parseInt(maxScore) : assignment.maxScore,
      instructions: instructions !== undefined ? instructions : assignment.instructions,
      allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission === 'true' : assignment.allowLateSubmission
    };

    // Handle assignment pattern update if provided
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinaryResult = await CloudinaryService.uploadFile(
          req.file.buffer, 
          req.file, 
          'smart-learning/assignments/patterns'
        );
        
        updateData.assignmentPattern = {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadedBy: req.user.id,
          uploadedAt: new Date(),
          cloudinaryUrl: cloudinaryResult.cloudinaryUrl,
          cloudinaryId: cloudinaryResult.cloudinaryId
        };
      } catch (uploadError) {
        console.error('Assignment pattern upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload assignment pattern' });
      }
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedAssignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE api/assignments/:id
// @desc    Delete an assignment
// @access  Private (Instructor/Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && assignment.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST api/assignments/:id/submit
// @desc    Submit assignment (Student)
// @access  Private
router.post('/:id/submit', auth, upload.single('submission'), async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit assignments' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if student is enrolled in the course
    const classroom = await Classroom.findById(assignment.classroomId);
    if (!classroom || !classroom.students.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' });
    }

    // Check if assignment is still active
    if (!assignment.isActive) {
      return res.status(400).json({ error: 'Assignment is no longer active' });
    }

    // Check if due date has passed
    if (new Date() > new Date(assignment.dueDate) && !assignment.allowLateSubmission) {
      return res.status(400).json({ error: 'Assignment due date has passed and late submissions are not allowed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Submission file is required' });
    }

    // Check if student has already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.studentId.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already submitted this assignment' });
    }

    // Upload submission file to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await CloudinaryService.uploadFile(
        req.file.buffer, 
        req.file, 
        'smart-learning/assignments/submissions'
      );
    } catch (uploadError) {
      console.error('Assignment submission upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload assignment submission' });
    }

    // Create submission
    const submission = {
      studentId: req.user.id,
      studentName: req.user.name || req.user.fullName || 'Student',
      submittedAt: new Date(),
      fileUrl: cloudinaryResult.cloudinaryUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      cloudinaryId: cloudinaryResult.cloudinaryId,
      status: new Date() > new Date(assignment.dueDate) ? 'late' : 'submitted',
      isGraded: false,
      score: 0,
      feedback: '',
      gradedBy: null,
      gradedAt: null
    };

    assignment.submissions.push(submission);
    await assignment.save();

    res.json({ message: 'Assignment submitted successfully', submission });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/assignments/:id/submissions
// @desc    Get all submissions for an assignment (Instructor/Admin)
// @access  Private
router.get('/:id/submissions', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('submissions.studentId', 'name email fullName')
      .populate('submissions.gradedBy', 'name email');
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check permissions
    const course = await Course.findById(assignment.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Transform submissions to include proper student information
    const submissions = assignment.submissions.map(submission => ({
      _id: submission._id,
      studentId: submission.studentId,
      student: {
        _id: submission.studentId._id,
        name: submission.studentId.name || submission.studentId.fullName || 'Unknown Student',
        email: submission.studentId.email || 'No email'
      },
      submittedAt: submission.submittedAt,
      fileUrl: submission.fileUrl,
      fileName: submission.fileName,
      fileSize: submission.fileSize,
      cloudinaryId: submission.cloudinaryId,
      isGraded: submission.isGraded,
      graded: submission.isGraded, // For backward compatibility
      score: submission.score,
      feedback: submission.feedback,
      gradedBy: submission.gradedBy,
      gradedAt: submission.gradedAt,
      status: submission.status
    }));

    res.json({ submissions });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Download assignment pattern
router.get('/:id/download-pattern', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if user has access to this assignment
    if (req.user.role === 'student') {
      // Check if student is enrolled in the course
      const enrollment = await Enrollment.findOne({
        studentId: req.user.id,
        courseId: assignment.courseId
      });
      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'instructor') {
      // Check if instructor owns the course
      const course = await Course.findById(assignment.courseId);
      if (!course || course.instructor.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (!assignment.assignmentPattern) {
      return res.status(404).json({ error: 'Assignment pattern file not found' });
    }

    const downloadUrl = assignment.assignmentPattern.cloudinaryUrl || assignment.assignmentPattern.fileUrl;
    if (!downloadUrl) {
      return res.status(404).json({ error: 'Assignment pattern file not found' });
    }

    // Return the URL as JSON for frontend to handle
    res.json({ url: downloadUrl });
  } catch (error) {
    console.error('Download pattern error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/assignments/:id/submissions/:submissionId/download
// @desc    Download assignment submission
// @access  Private
router.get('/:id/submissions/:submissionId/download', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check permissions
    const course = await Course.findById(assignment.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isStudent = req.user.role === 'student';

    if (!isInstructor && !isAdmin && !isStudent) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Students can only download their own submissions
    if (isStudent && submission.studentId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!submission.cloudinaryId) {
      return res.status(404).json({ error: 'Submission file not found' });
    }

    // Redirect to Cloudinary URL for download
    res.redirect(submission.fileUrl);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST api/assignments/:id/grade/:submissionId
// @desc    Grade a submission (Instructor/Admin)
// @access  Private
router.post('/:id/grade/:submissionId', auth, async (req, res) => {
  try {
    const { score, feedback } = req.body;
    
    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && assignment.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Update submission
    submission.score = parseInt(score);
    submission.feedback = feedback;
    submission.isGraded = true;
    submission.gradedBy = req.user.id;
    submission.gradedAt = new Date();

    await assignment.save();

    res.json({ message: 'Submission graded successfully', submission });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;

