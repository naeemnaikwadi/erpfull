// server/routes/instructorRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const { auth, instructorOnly } = require('../middleware/auth');
const Assignment = require('../models/Assignment');
let PDFDocument;
try { PDFDocument = require('pdfkit'); } catch (_) {}

// GET /api/instructor/stats/:instructorId
router.get('/stats/:instructorId', async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    // Count courses
    const totalCourses = await Course.countDocuments({ instructor: instructorId });

    // Count total students (assumes 'studentsEnrolled' array)
    const courses = await Course.find({ instructor: instructorId });
    const totalStudents = courses.reduce((acc, course) => acc + (course.studentsEnrolled?.length || 0), 0);

    // Calculate average rating (assumes 'rating' on course)
    const ratedCourses = courses.filter(course => course.rating);
    const averageRating = ratedCourses.length
      ? (ratedCourses.reduce((acc, c) => acc + c.rating, 0) / ratedCourses.length).toFixed(2)
      : 0;

    // Active learners (unique students engaged in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeLearnersSet = new Set();
    courses.forEach(course => {
      (course.studentsEnrolled || []).forEach(s => activeLearnersSet.add(String(s)));
    });

    // Monthly enrollments (last 12 months) using Enrollment model
    const Enrollment = require('../models/Enrollment');
    const courseIds = courses.map(c => c._id);
    let monthlyEnrollments = [];
    if (courseIds.length > 0) {
      monthlyEnrollments = await Enrollment.aggregate([
        { $match: { course: { $in: courseIds } } },
        {
          $group: {
            _id: { year: { $year: '$enrolledAt' }, month: { $month: '$enrolledAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
    }

    res.json({
      totalCourses,
      totalStudents,
      averageRating: Number(averageRating) || 0,
      totalRatings: courses.reduce((acc, c) => acc + (c.ratings?.length || 0), 0),
      activeLearners: activeLearnersSet.size,
      monthlyEnrollments: monthlyEnrollments.map(m => ({
        year: m._id.year,
        month: m._id.month,
        count: m.count
      }))
    });
  } catch (err) {
    console.error('Instructor stats error:', err);
    res.status(500).json({ error: 'Failed to fetch instructor stats' });
  }
});

// GET /api/instructor/courses
router.get('/courses', auth, instructorOnly, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('classroom', 'name')
      .populate('studentsEnrolled', 'name email')
      .sort({ createdAt: -1 });

    res.json({ courses });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/instructor/classrooms
router.get('/classrooms', auth, instructorOnly, async (req, res) => {
  try {
    const classrooms = await Classroom.find({ instructor: req.user.id })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    res.json({ classrooms });
  } catch (error) {
    console.error('Error fetching instructor classrooms:', error);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

module.exports = router;

// Export instructor overview PDF
router.get('/stats/:instructorId/export.pdf', async (req, res) => {
  try {
    if (!PDFDocument) {
      return res.status(503).json({ message: 'PDF generation not available' });
    }
    const instructorId = req.params.instructorId;
    const courses = await Course.find({ instructor: instructorId });
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((acc, c) => acc + (c.studentsEnrolled?.length || 0), 0);
    const ratedCourses = courses.filter(c => c.rating);
    const averageRating = ratedCourses.length ? (ratedCourses.reduce((acc, c) => acc + c.rating, 0) / ratedCourses.length).toFixed(2) : 0;

    const Enrollment = require('../models/Enrollment');
    const courseIds = courses.map(c => c._id);
    const monthly = courseIds.length > 0 ? await Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: { y: { $year: '$enrolledAt' }, m: { $month: '$enrolledAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]) : [];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=instructor_overview.pdf');
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text('Instructor Overview', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Courses: ${totalCourses}`);
    doc.text(`Total Students: ${totalStudents}`);
    doc.text(`Average Rating: ${averageRating}`);
    doc.moveDown();
    doc.text('Monthly Enrollments', { underline: true });
    monthly.forEach(m => doc.text(`${m._id.y}-${String(m._id.m).padStart(2,'0')}: ${m.count}`));
    doc.end();
  } catch (err) {
    console.error('Instructor export error:', err);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// Alias grading endpoint for assignments under /api/instructor
// Matches frontend: PUT /api/instructor/assignments/:id/submissions/:submissionId/grade
router.put('/assignments/:id/submissions/:submissionId/grade', auth, instructorOnly, async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (assignment.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const submission = assignment.submissions.id(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    submission.score = parseInt(score);
    submission.feedback = feedback;
    submission.isGraded = true;
    submission.gradedBy = req.user.id;
    submission.gradedAt = new Date();
    await assignment.save();
    res.json({ message: 'Submission graded successfully', submission });
  } catch (err) {
    console.error('Instructor grade alias error:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});
