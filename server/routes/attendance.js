const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { auth } = require('../middleware/auth');
const XLSX = require('xlsx');

// Apply authentication middleware to all routes
router.use(auth);

// Helper function to check instructor access
const checkInstructorAccess = (req, res, next) => {
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Instructor role required.' });
  }
  next();
};

// Helper function to check admin access
const checkAdminAccess = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// ==================== INSTRUCTOR ROUTES ====================

// Get instructor's courses
router.get('/instructor/courses', checkInstructorAccess, async (req, res) => {
  try {
    // First, get classrooms where this instructor is assigned
    const assignedClassrooms = await Classroom.find({
      'instructors.instructorId': req.user.id,
      'instructors.isActive': true
    }).select('_id name');

    if (assignedClassrooms.length === 0) {
      return res.status(200).json({ 
        message: 'No classrooms assigned to this instructor. Please contact admin to assign you to a classroom.',
        courses: [],
        assignedClassrooms: []
      });
    }

    // Get courses created by this instructor in assigned classrooms
    const classroomIds = assignedClassrooms.map(c => c._id);
    const courses = await Course.find({ 
      instructor: req.user.id,
      classroom: { $in: classroomIds }
    })
      .populate('classroom', 'name')
      .select('title code description classroom');
    
    if (courses.length === 0) {
      return res.status(200).json({ 
        message: 'No courses created yet. Please create courses in your assigned classrooms.',
        courses: [],
        assignedClassrooms: assignedClassrooms.map(c => ({ id: c._id, name: c.name }))
      });
    }
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Compatibility alias: Update attendance for a specific date using PUT /api/attendance/:attendanceId
router.put('/:attendanceId', checkInstructorAccess, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { attendanceRecords } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Verify instructor has access to this course
    if (attendance.instructor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied to this attendance record' });
    }

    // Check if attendance is locked
    if (attendance.isLocked) {
      return res.status(400).json({ message: 'Attendance record is locked and cannot be modified' });
    }

    // Update attendance records
    attendance.attendanceRecords = attendanceRecords.map(record => ({
      student: record.studentId,
      status: record.status,
      remarks: record.remarks || '',
      markedAt: new Date()
    }));

    await attendance.save();

    const updatedAttendance = await Attendance.findById(attendanceId)
      .populate('course', 'title code')
      .populate('instructor', 'name email')
      .populate('attendanceRecords.student', 'name email prn');

    res.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance (alias route):', error);
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
  }
});

// Get enrolled students for a course
router.get('/course/:courseId/students', checkInstructorAccess, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify instructor has access to this course
    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email prn course branch semester')
      .select('student enrollmentDate');

    let students = enrollments.map(enrollment => ({
      _id: enrollment.student._id,
      name: enrollment.student.name,
      email: enrollment.student.email,
      prn: enrollment.student.prn,
      course: enrollment.student.course,
      branch: enrollment.student.branch,
      semester: enrollment.student.semester
    }));

    // Fallback: if no enrollments, return classroom members as students
    if (students.length === 0) {
      const courseDoc = await Course.findById(courseId).select('classroom');
      if (courseDoc?.classroom) {
        const classroom = await Classroom.findById(courseDoc.classroom)
          .populate('students', 'name email prn')
          .select('students');
        if (classroom?.students?.length) {
          students = classroom.students.map(s => ({
            _id: s._id,
            name: s.name,
            email: s.email,
            prn: s.prn
          }));
        }
      }
    }

    res.json(students);
  } catch (error) {
    console.error('Error fetching course students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Mark attendance for a course
router.post('/mark', checkInstructorAccess, async (req, res) => {
  try {
    const { 
      courseId, 
      date, 
      startTime, 
      endTime, 
      attendanceRecords, 
      semester, 
      academicYear 
    } = req.body;

    // Verify instructor has access to this course
    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    // Check if attendance already exists for this date and course
    const existingAttendance = await Attendance.findOne({
      course: courseId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    // Get enrolled students count
    const totalStudents = await Enrollment.countDocuments({ course: courseId });

    // Create attendance record
    const attendance = new Attendance({
      course: courseId,
      instructor: req.user.id,
      date: new Date(date),
      classTime: {
        startTime,
        endTime
      },
      attendanceRecords: attendanceRecords.map(record => ({
        student: record.studentId,
        status: record.status,
        remarks: record.remarks || ''
      })),
      totalStudents,
      semester,
      academicYear
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('course', 'title code')
      .populate('instructor', 'name email')
      .populate('attendanceRecords.student', 'name email prn');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
});

// Update attendance for a specific date
router.put('/update/:attendanceId', checkInstructorAccess, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { attendanceRecords } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Verify instructor has access to this course
    if (attendance.instructor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied to this attendance record' });
    }

    // Check if attendance is locked
    if (attendance.isLocked) {
      return res.status(400).json({ message: 'Attendance record is locked and cannot be modified' });
    }

    // Update attendance records
    attendance.attendanceRecords = attendanceRecords.map(record => ({
      student: record.studentId,
      status: record.status,
      remarks: record.remarks || '',
      markedAt: new Date()
    }));

    await attendance.save();

    const updatedAttendance = await Attendance.findById(attendanceId)
      .populate('course', 'title code')
      .populate('instructor', 'name email')
      .populate('attendanceRecords.student', 'name email prn');

    res.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
  }
});

// Get attendance records for a course
router.get('/course/:courseId', checkInstructorAccess, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    // Verify instructor has access to this course
    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    const query = { course: courseId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'title code')
      .populate('instructor', 'name email')
      .populate('attendanceRecords.student', 'name email prn')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendanceRecords,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
  }
});

// Get course attendance statistics
router.get('/course/:courseId/stats', checkInstructorAccess, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify instructor has access to this course
    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    const stats = await Attendance.getCourseAttendanceStats(courseId, startDate, endDate);
    
    // Get individual student statistics
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email prn');

    const studentStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        const studentAttendance = await Attendance.getStudentAttendanceSummary(
          enrollment.student._id, 
          courseId
        );
        
        const totalClasses = studentAttendance.reduce((sum, stat) => sum + stat.count, 0);
        const presentClasses = studentAttendance.find(s => s._id === 'Present')?.count || 0;
        const lateClasses = studentAttendance.find(s => s._id === 'Late')?.count || 0;
        const absentClasses = studentAttendance.find(s => s._id === 'Absent')?.count || 0;
        
        return {
          student: enrollment.student,
          totalClasses,
          presentClasses,
          lateClasses,
          absentClasses,
          attendancePercentage: totalClasses > 0 ? Math.round(((presentClasses + lateClasses) / totalClasses) * 100) : 0
        };
      })
    );

    res.json({
      courseStats: stats[0] || {
        totalClasses: 0,
        averageAttendance: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0
      },
      studentStats
    });
  } catch (error) {
    console.error('Error fetching course statistics:', error);
    res.status(500).json({ message: 'Error fetching course statistics', error: error.message });
  }
});

// ==================== STUDENT ROUTES ====================

// Get student's attendance for all courses
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate, semester } = req.query;

    // Verify student can only access their own data (unless admin)
    if (req.user.role !== 'admin' && req.user.id.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = { 'attendanceRecords.student': studentId };
    if (courseId) query.course = courseId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (semester) {
      query.semester = semester;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'title code')
      .populate('instructor', 'name email')
      .sort({ date: -1 });

    // Filter to only show the specific student's records
    const filteredRecords = attendanceRecords.map(record => {
      const studentRecord = record.attendanceRecords.find(
        r => r.student.toString() === studentId
      );
      return {
        _id: record._id,
        course: record.course,
        instructor: record.instructor,
        date: record.date,
        classTime: record.classTime,
        semester: record.semester,
        academicYear: record.academicYear,
        status: studentRecord ? studentRecord.status : 'Absent',
        remarks: studentRecord ? studentRecord.remarks : '',
        markedAt: studentRecord ? studentRecord.markedAt : null
      };
    });

    res.json(filteredRecords);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Error fetching student attendance', error: error.message });
  }
});

// Get student's attendance summary by course
router.get('/student/:studentId/summary', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student can only access their own data (unless admin)
    if (req.user.role !== 'admin' && req.user.id.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get student's enrolled courses
    const enrollments = await Enrollment.find({ student: studentId })
      .populate('course', 'title code');

    const courseSummaries = await Promise.all(
      enrollments.map(async (enrollment) => {
        const stats = await Attendance.getStudentAttendanceSummary(
          studentId, 
          enrollment.course._id
        );
        
        const totalClasses = stats.reduce((sum, stat) => sum + stat.count, 0);
        const presentClasses = stats.find(s => s._id === 'Present')?.count || 0;
        const lateClasses = stats.find(s => s._id === 'Late')?.count || 0;
        const absentClasses = stats.find(s => s._id === 'Absent')?.count || 0;
        
        return {
          course: enrollment.course,
          totalClasses,
          presentClasses,
          lateClasses,
          absentClasses,
          attendancePercentage: totalClasses > 0 ? Math.round(((presentClasses + lateClasses) / totalClasses) * 100) : 0
        };
      })
    );

    res.json(courseSummaries);
  } catch (error) {
    console.error('Error fetching student attendance summary:', error);
    res.status(500).json({ message: 'Error fetching student attendance summary', error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all attendance records (admin only)
router.get('/admin/all', checkAdminAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, instructorId, startDate, endDate } = req.query;

    const query = {};
    if (courseId) query.course = courseId;
    if (instructorId) query.instructor = instructorId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'title code')
      .populate('instructor', 'name email')
      .populate('attendanceRecords.student', 'name email prn')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(query);

    res.json({
      attendanceRecords,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching all attendance records:', error);
    res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
  }
});

// Get attendance statistics (admin only)
router.get('/admin/stats', checkAdminAccess, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          averageAttendance: { $avg: '$attendancePercentage' },
          totalPresent: { $sum: '$presentCount' },
          totalAbsent: { $sum: '$absentCount' },
          totalLate: { $sum: '$lateCount' }
        }
      }
    ]);

    // Get course-wise statistics
    const courseStats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$course',
          totalClasses: { $sum: 1 },
          averageAttendance: { $avg: '$attendancePercentage' },
          totalPresent: { $sum: '$presentCount' },
          totalAbsent: { $sum: '$absentCount' },
          totalLate: { $sum: '$lateCount' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          course: { title: 1, code: 1 },
          totalClasses: 1,
          averageAttendance: { $round: ['$averageAttendance', 2] },
          totalPresent: 1,
          totalAbsent: 1,
          totalLate: 1
        }
      }
    ]);

    res.json({
      overallStats: stats[0] || {
        totalClasses: 0,
        averageAttendance: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0
      },
      courseStats
    });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({ message: 'Error fetching attendance statistics', error: error.message });
  }
});

// Export attendance data (admin only)
router.get('/admin/export', checkAdminAccess, async (req, res) => {
  try {
    const { courseId, instructorId, startDate, endDate, format = 'xlsx' } = req.query;

    const query = {};
    if (courseId) query.course = courseId;
    if (instructorId) query.instructor = instructorId;
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'title code')
      .populate('instructor', 'name email')
      .populate('attendanceRecords.student', 'name email prn')
      .sort({ date: -1 });

    // Flatten the data for export
    const exportData = [];
    attendanceRecords.forEach(record => {
      record.attendanceRecords.forEach(studentRecord => {
        exportData.push({
          'Date': record.date.toLocaleDateString(),
          'Course': record.course.title,
          'Course Code': record.course.code,
          'Instructor': record.instructor.name,
          'Student Name': studentRecord.student.name,
          'Student Email': studentRecord.student.email,
          'PRN': studentRecord.student.prn,
          'Status': studentRecord.status,
          'Remarks': studentRecord.remarks || '',
          'Class Time': `${record.classTime.startTime} - ${record.classTime.endTime}`,
          'Total Students': record.totalStudents,
          'Present Count': record.presentCount,
          'Absent Count': record.absentCount,
          'Late Count': record.lateCount,
          'Attendance %': record.attendancePercentage
        });
      });
    });

    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_export.xlsx');
      res.send(buffer);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting attendance data:', error);
    res.status(500).json({ message: 'Error exporting attendance data', error: error.message });
  }
});

module.exports = router;
