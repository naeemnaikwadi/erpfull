const express = require('express');
const router = express.Router();
const Examination = require('../models/Examination');
const ExamResult = require('../models/ExamResult');
const ExamPaperAssignment = require('../models/ExamPaperAssignment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const Classroom = require('../models/Classroom');

// Get all examinations with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, course, branch, semester, examType, status } = req.query;
    const filter = {};
    
    if (course) filter.course = course;
    if (branch) filter.branch = branch;
    if (semester) filter.semester = parseInt(semester);
    if (examType) filter.examType = examType;
    if (status) filter.examStatus = status;

    const examinations = await Examination.find(filter)
      .populate('createdBy', 'name email')
      .populate('invigilators', 'name email')
      .sort({ examDate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Examination.countDocuments(filter);

    res.json({
      examinations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get examination by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const examination = await Examination.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('invigilators', 'name email');
    
    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    res.json(examination);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new examination
router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create examinations' });
    }

    const examinationData = {
      ...req.body,
      createdBy: req.user.id
    };

    const examination = new Examination(examinationData);
    await examination.save();

    res.status(201).json(examination);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update examination
router.put('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const examination = await Examination.findById(req.params.id);
    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    Object.assign(examination, req.body);
    await examination.save();

    res.json(examination);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update examination status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update examination status' });
    }

    const { status } = req.body;
    const examination = await Examination.findById(req.params.id);
    
    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    examination.examStatus = status;
    await examination.save();

    res.json(examination);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get examination results
router.get('/:id/results', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, grade } = req.query;
    const filter = { examId: req.params.id };
    
    if (status) filter.status = status;
    if (grade) filter.grade = grade;

    const results = await ExamResult.find(filter)
      .populate('admissionId', 'firstName lastName email')
      .populate('createdBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ marksObtained: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ExamResult.countDocuments(filter);

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit examination result
router.post('/:id/results', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to submit results' });
    }

    const examination = await Examination.findById(req.params.id);
    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    const resultData = {
      ...req.body,
      examId: req.params.id,
      totalMarks: examination.totalMarks,
      createdBy: req.user.id
    };

    const result = new ExamResult(resultData);
    await result.save();

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update examination result
router.put('/results/:resultId', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await ExamResult.findById(req.params.resultId);
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    Object.assign(result, req.body);
    await result.save();

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Publish results
router.patch('/:id/results/publish', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to publish results' });
    }

    await ExamResult.updateMany(
      { examId: req.params.id },
      { 
        resultStatus: 'Published',
        publishedAt: new Date(),
        reviewedBy: req.user.id
      }
    );

    res.json({ message: 'Results published successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get examination statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Examination.aggregate([
      {
        $group: {
          _id: '$examStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalExaminations = await Examination.countDocuments();
    const upcomingExams = await Examination.countDocuments({
      examDate: { $gte: new Date() },
      examStatus: 'Scheduled'
    });

    res.json({
      statusBreakdown: stats,
      totalExaminations,
      upcomingExams
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete examination
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const examination = await Examination.findById(req.params.id);
    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    // Check if there are results for this examination
    const resultsCount = await ExamResult.countDocuments({ examId: req.params.id });
    if (resultsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete examination with existing results' 
      });
    }

    await Examination.findByIdAndDelete(req.params.id);
    res.json({ message: 'Examination deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== EXAM PAPER ASSIGNMENT ROUTES ====================

// Create exam paper assignment
router.post('/:id/assign-paper', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to assign exam papers' });
    }

    const examination = await Examination.findById(req.params.id);
    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    const { questionPaper, answerKey, instructions, specialNotes, assignToAdminId } = req.body;

    const assignment = await ExamPaperAssignment.create({
      examId: req.params.id,
      assignmentId: `ASSIGN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionPaper,
      answerKey,
      instructions,
      specialNotes,
      status: 'Uploaded',
      createdBy: req.user.id
    });

    // If coordinator assigns to a department admin immediately
    if (assignToAdminId) {
      const admin = await User.findOne({ _id: assignToAdminId, role: 'admin' });
      if (!admin) {
        return res.status(400).json({ message: 'Invalid admin to assign' });
      }
      assignment.status = 'Assigned';
      assignment.assignedDate = new Date();
      assignment.reviewNotes = `Assigned to Admin: ${admin.name}`;
      await assignment.save();
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin assigns papers to specific instructors
router.post('/assignments/:assignmentId/assign-to-instructors', auth, async (req, res) => {
  try {
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { assignmentId } = req.params;
    const { instructorIds = [], dueDate, instructions } = req.body;

    const assignment = await ExamPaperAssignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Validate instructors
    const instructors = await User.find({ _id: { $in: instructorIds }, role: 'instructor' });
    if (instructors.length !== instructorIds.length) {
      return res.status(400).json({ message: 'Invalid instructor IDs provided' });
    }

    assignment.assignedTo = instructors.map(inst => ({
      instructorId: inst._id,
      instructorName: inst.name,
      assignedAt: new Date(),
      status: 'Assigned'
    }));
    assignment.dueDate = dueDate || assignment.dueDate;
    assignment.instructions = instructions || assignment.instructions;
    assignment.status = 'Assigned';
    assignment.assignedDate = new Date();
    await assignment.save();

    res.json({ message: 'Instructors assigned successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Instructor submits evaluated papers and marks (MSE/ESE)
router.post('/assignments/:assignmentId/instructor-submit', auth, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { assignmentId } = req.params;
    const { evaluatedPapers = [], notes } = req.body;

    const assignment = await ExamPaperAssignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const isAssigned = assignment.assignedTo.some(a => a.instructorId.toString() === req.user.id);
    if (!isAssigned) return res.status(403).json({ message: 'Not assigned to this instructor' });

    assignment.evaluationResults.push({
      instructorId: req.user.id,
      evaluatedPapers,
      submittedAt: new Date(),
      status: 'Submitted'
    });

    const assn = assignment.assignedTo.find(a => a.instructorId.toString() === req.user.id);
    if (assn) {
      assn.status = 'Completed';
      assn.completedAt = new Date();
      assn.notes = notes;
    }

    await assignment.save();
    res.json({ message: 'Evaluation submitted', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin forwards compiled results back to coordinator and publishes
router.post('/assignments/:assignmentId/admin-forward', auth, async (req, res) => {
  try {
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { assignmentId } = req.params;
    const assignment = await ExamPaperAssignment.findById(assignmentId).populate('examId');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    assignment.status = 'Returned';
    assignment.returnedDate = new Date();
    await assignment.save();

    res.json({ message: 'Forwarded to exam coordinator', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ISE1/ISE2 marks entry by instructor (out of 10)
router.post('/:id/ise-marks', auth, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.params;
    const { componentType, marks = [] } = req.body; // marks: [{ studentId, obtained }]

    const exam = await Examination.findById(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    if (!['ISE1', 'ISE2'].includes(exam.examType)) {
      return res.status(400).json({ message: 'Only for ISE1/ISE2' });
    }

    const created = [];
    for (const m of marks) {
      const percentage = (m.obtained / 10) * 100;
      const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : percentage >= 40 ? 'D' : 'F';
      const status = m.obtained >= 4 ? 'Pass' : 'Fail';
      const result = await ExamResult.create({
        studentId: m.studentId,
        admissionId: null,
        examId: id,
        course: exam.course,
        branch: exam.branch,
        semester: exam.semester,
        academicYear: exam.academicYear,
        subject: exam.subject,
        subjectCode: exam.subjectCode,
        marksObtained: m.obtained,
        totalMarks: 10,
        percentage,
        grade,
        status,
        internalMarks: m.obtained,
        resultStatus: 'Published',
        createdBy: req.user.id
      });
      created.push(result);
    }

    res.json({ message: 'ISE marks saved', results: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get exam paper assignments for exam controller
router.get('/assignments', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { page = 1, limit = 10, status, examType } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (examType) {
      const exams = await Examination.find({ examType });
      query.examId = { $in: exams.map(exam => exam._id) };
    }

    const assignments = await ExamPaperAssignment.find(query)
      .populate('examId', 'examName examType subject course branch semester')
      .populate('assignedTo.instructorId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ExamPaperAssignment.countDocuments(query);

    res.json({
      assignments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get exam paper assignments for instructor
router.get('/instructor/assignments', auth, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    let query = {
      'assignedTo.instructorId': req.user.id
    };
    if (status) query['assignedTo.status'] = status;

    const assignments = await ExamPaperAssignment.find(query)
      .populate('examId', 'examName examType subject course branch semester examDate')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ExamPaperAssignment.countDocuments(query);

    res.json({
      assignments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit evaluation results
router.post('/assignments/:assignmentId/submit-evaluation', auth, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { assignmentId } = req.params;
    const { evaluatedPapers, notes } = req.body;

    const assignment = await ExamPaperAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Find the instructor's assignment
    const instructorAssignment = assignment.assignedTo.find(
      a => a.instructorId.toString() === req.user.id
    );

    if (!instructorAssignment) {
      return res.status(403).json({ message: 'Not assigned to this instructor' });
    }

    // Update evaluation results
    const evaluationResult = {
      instructorId: req.user.id,
      evaluatedPapers,
      submittedAt: new Date(),
      status: 'Submitted'
    };

    assignment.evaluationResults.push(evaluationResult);
    
    // Update instructor assignment status
    instructorAssignment.status = 'Completed';
    instructorAssignment.completedAt = new Date();
    instructorAssignment.notes = notes;

    await assignment.save();

    res.json({
      message: 'Evaluation submitted successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get exam dashboard for exam controller
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get examination statistics
    const examStats = await Examination.aggregate([
      {
        $group: {
          _id: '$examStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get exam type statistics
    const examTypeStats = await Examination.aggregate([
      {
        $group: {
          _id: '$examType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get assignment statistics
    const assignmentStats = await ExamPaperAssignment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get result statistics
    const resultStats = await ExamResult.aggregate([
      {
        $group: {
          _id: '$resultStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent examinations
    const recentExams = await Examination.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get upcoming examinations
    const upcomingExams = await Examination.find({
      examDate: { $gte: new Date() },
      examStatus: 'Scheduled'
    })
      .populate('createdBy', 'name email')
      .sort({ examDate: 1 })
      .limit(10);

    res.json({
      examStats,
      examTypeStats,
      assignmentStats,
      resultStats,
      recentExams,
      upcomingExams,
      totalExaminations: await Examination.countDocuments(),
      totalAssignments: await ExamPaperAssignment.countDocuments(),
      totalResults: await ExamResult.countDocuments()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's exam results
router.get('/student/:studentId/results', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10, examType, semester } = req.query;
    
    // Check if student is accessing their own results
    if (req.user.role === 'student' && req.user.prn !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view other student results' });
    }

    let filter = { studentId };
    if (examType) {
      const exams = await Examination.find({ examType });
      filter.examId = { $in: exams.map(exam => exam._id) };
    }
    if (semester) filter.semester = parseInt(semester);

    const results = await ExamResult.find(filter)
      .populate('examId', 'examName examType subject course branch semester examDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ExamResult.countDocuments(filter);

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk create exam results
router.post('/:id/bulk-results', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const examination = await Examination.findById(req.params.id);
    if (!examination) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    const { results } = req.body; // Array of result objects

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: 'Results array is required' });
    }

    const createdResults = [];
    const errors = [];

    for (const resultData of results) {
      try {
        const result = await ExamResult.create({
          ...resultData,
          examId: req.params.id,
          totalMarks: examination.totalMarks,
          createdBy: req.user.id
        });
        createdResults.push(result);
      } catch (error) {
        errors.push({ studentId: resultData.studentId, error: error.message });
      }
    }

    res.json({
      message: `Successfully created ${createdResults.length} results`,
      createdCount: createdResults.length,
      failedCount: errors.length,
      results: createdResults,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export examination data
router.get('/export', auth, async (req, res) => {
  try {
    if (!['admin', 'exam_controller'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { format = 'json', type = 'examinations', examType, course } = req.query;
    
    let filter = {};
    if (examType) filter.examType = examType;
    if (course) filter.course = course;

    if (type === 'examinations') {
      const examinations = await Examination.find(filter)
        .populate('createdBy', 'name email')
        .populate('invigilators', 'name email')
        .sort({ examDate: 1 });

      if (format === 'csv') {
        const csvData = examinations.map(exam => ({
          'Exam ID': exam.examId,
          'Exam Name': exam.examName,
          'Exam Type': exam.examType,
          'Subject': exam.subject,
          'Course': exam.course,
          'Branch': exam.branch,
          'Semester': exam.semester,
          'Academic Year': exam.academicYear,
          'Exam Date': exam.examDate,
          'Start Time': exam.startTime,
          'End Time': exam.endTime,
          'Duration': exam.duration,
          'Venue': exam.venue,
          'Total Marks': exam.totalMarks,
          'Status': exam.examStatus
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=examinations.csv');
        
        const csv = Object.keys(csvData[0] || {}).join(',') + '\n' +
          csvData.map(row => Object.values(row).join(',')).join('\n');
        
        res.send(csv);
      } else {
        res.json(examinations);
      }
    } else {
      const results = await ExamResult.find(filter)
        .populate('examId', 'examName examType subject course branch semester')
        .populate('admissionId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        const csvData = results.map(result => ({
          'Student ID': result.studentId,
          'Student Name': `${result.admissionId.firstName} ${result.admissionId.lastName}`,
          'Email': result.admissionId.email,
          'Exam Name': result.examId.examName,
          'Exam Type': result.examId.examType,
          'Subject': result.subject,
          'Course': result.course,
          'Branch': result.branch,
          'Semester': result.semester,
          'Marks Obtained': result.marksObtained,
          'Total Marks': result.totalMarks,
          'Percentage': result.percentage,
          'Grade': result.grade,
          'Status': result.status,
          'Result Status': result.resultStatus
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=exam_results.csv');
        
        const csv = Object.keys(csvData[0] || {}).join(',') + '\n' +
          csvData.map(row => Object.values(row).join(',')).join('\n');
        
        res.send(csv);
      } else {
        res.json(results);
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
