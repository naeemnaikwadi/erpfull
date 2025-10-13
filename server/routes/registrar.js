const express = require('express');
const router = express.Router();
const Transcript = require('../models/Transcript');
const ExamResult = require('../models/ExamResult');
const User = require('../models/User');
const Admission = require('../models/Admission');
const { auth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Middleware to ensure only registrars and admins can access these routes
router.use((req, res, next) => {
  if (!['admin', 'registrar'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Registrar access only.' });
  }
  next();
});

// Get registrar dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get transcript statistics
    const transcriptStats = await Transcript.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent transcript requests
    const recentTranscripts = await Transcript.find()
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get graduation statistics
    const graduationStats = await Transcript.aggregate([
      {
        $group: {
          _id: {
            course: '$course',
            academicYear: '$academicYear'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get overall statistics
    const overallStats = {
      totalTranscripts: await Transcript.countDocuments(),
      issuedTranscripts: await Transcript.countDocuments({ status: 'Issued' }),
      pendingTranscripts: await Transcript.countDocuments({ status: 'Draft' }),
      verifiedTranscripts: await Transcript.countDocuments({ isVerified: true })
    };

    res.json({
      transcriptStats,
      recentTranscripts,
      graduationStats,
      overallStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transcripts
router.get('/transcripts', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      course, 
      academicYear,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (course) filter.course = course;
    if (academicYear) filter.academicYear = academicYear;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transcripts = await Transcript.find(filter)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transcript.countDocuments(filter);

    res.json({
      transcripts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transcript by ID
router.get('/transcripts/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email');

    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    res.json(transcript);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate transcript for student
router.post('/transcripts/generate', async (req, res) => {
  try {
    const { studentId, course, branch, academicYear, semester } = req.body;

    // Check if transcript already exists
    const existingTranscript = await Transcript.findOne({ studentId });
    if (existingTranscript) {
      return res.status(400).json({ message: 'Transcript already exists for this student' });
    }

    // Get student's exam results
    const examResults = await ExamResult.find({ studentId })
      .populate('examId', 'examName examType subject course branch semester examDate')
      .sort({ semester: 1, createdAt: 1 });

    if (examResults.length === 0) {
      return res.status(400).json({ message: 'No exam results found for this student' });
    }

    // Calculate overall performance
    const totalCredits = examResults.reduce((sum, result) => sum + (result.credits || 0), 0);
    const earnedCredits = examResults.reduce((sum, result) => {
      if (result.grade && !['F', 'U', 'I', 'W'].includes(result.grade)) {
        return sum + (result.credits || 0);
      }
      return sum;
    }, 0);

    // Calculate CGPA
    const gradePointMap = {
      'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0, 'U': 0, 'I': 0, 'W': 0
    };
    
    const totalGradePoints = examResults.reduce((sum, result) => {
      const gradePoints = gradePointMap[result.grade] || 0;
      return sum + (gradePoints * (result.credits || 0));
    }, 0);

    const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    // Determine overall grade
    let overallGrade = 'Pass';
    if (cgpa >= 8.0) overallGrade = 'Distinction';
    else if (cgpa >= 7.0) overallGrade = 'First Class';
    else if (cgpa >= 6.0) overallGrade = 'Second Class';
    else if (cgpa < 4.0) overallGrade = 'Fail';

    // Create transcript
    const transcript = await Transcript.create({
      studentId,
      admissionId: examResults[0].admissionId,
      course,
      branch,
      academicYear,
      semester,
      transcriptNumber: `TRANS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'Draft',
      totalCredits,
      earnedCredits,
      cgpa: Math.round(cgpa * 100) / 100,
      overallGrade,
      subjects: examResults.map(result => ({
        subjectCode: result.subjectCode || '',
        subjectName: result.subject,
        credits: result.credits || 0,
        grade: result.grade,
        marks: result.marksObtained,
        maxMarks: result.totalMarks,
        semester: result.semester,
        academicYear: result.academicYear,
        status: result.status
      })),
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Transcript generated successfully',
      transcript
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify transcript
router.patch('/transcripts/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationNotes } = req.body;

    const transcript = await Transcript.findById(id);
    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    transcript.isVerified = true;
    transcript.verifiedBy = req.user.id;
    transcript.verificationNotes = verificationNotes;
    transcript.verifiedAt = new Date();

    await transcript.save();

    res.json({
      message: 'Transcript verified successfully',
      transcript
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Issue transcript
router.patch('/transcripts/:id/issue', async (req, res) => {
  try {
    const { id } = req.params;
    const { digitalSignature, qrCode } = req.body;

    const transcript = await Transcript.findById(id);
    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    transcript.status = 'Issued';
    transcript.issueDate = new Date();
    transcript.digitalSignature = digitalSignature;
    transcript.qrCode = qrCode;

    await transcript.save();

    res.json({
      message: 'Transcript issued successfully',
      transcript
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update transcript
router.put('/transcripts/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);
    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    Object.assign(transcript, req.body);
    await transcript.save();

    res.json(transcript);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transcript
router.delete('/transcripts/:id', async (req, res) => {
  try {
    const transcript = await Transcript.findById(req.params.id);
    if (!transcript) {
      return res.status(404).json({ message: 'Transcript not found' });
    }

    await Transcript.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transcript deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get graduation list
router.get('/graduation-list', async (req, res) => {
  try {
    const { course, academicYear, semester } = req.query;
    
    let filter = { status: 'Issued' };
    if (course) filter.course = course;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = parseInt(semester);

    const graduates = await Transcript.find(filter)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ cgpa: -1 });

    res.json(graduates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate graduation certificate
router.post('/certificates/generate', async (req, res) => {
  try {
    const { studentId, certificateType, issuedDate } = req.body;

    // This would typically generate a certificate
    // For now, we'll return a success message
    const certificate = {
      certificateNumber: `CERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      certificateType,
      issuedDate: issuedDate || new Date(),
      issuedBy: req.user.name,
      status: 'Generated'
    };

    res.status(201).json({
      message: 'Certificate generated successfully',
      certificate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get academic records for a student
router.get('/student/:studentId/records', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student information
    const student = await User.findOne({ prn: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get admission details
    const admission = await Admission.findOne({ email: student.email });

    // Get exam results
    const examResults = await ExamResult.find({ studentId })
      .populate('examId', 'examName examType subject course branch semester examDate')
      .sort({ semester: 1, createdAt: 1 });

    // Get transcript
    const transcript = await Transcript.findOne({ studentId });

    res.json({
      student: {
        name: student.name,
        email: student.email,
        prn: student.prn,
        course: student.course,
        branch: student.branch,
        semester: student.semester,
        academicYear: student.academicYear
      },
      admission,
      examResults,
      transcript
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export transcript data
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', status, course, academicYear } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (course) filter.course = course;
    if (academicYear) filter.academicYear = academicYear;

    const transcripts = await Transcript.find(filter)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = transcripts.map(transcript => ({
        'Transcript Number': transcript.transcriptNumber,
        'Student ID': transcript.studentId,
        'Course': transcript.course,
        'Branch': transcript.branch,
        'Academic Year': transcript.academicYear,
        'CGPA': transcript.cgpa,
        'Overall Grade': transcript.overallGrade,
        'Status': transcript.status,
        'Issue Date': transcript.issueDate,
        'Verified': transcript.isVerified ? 'Yes' : 'No'
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transcripts.csv');
      
      const csv = Object.keys(csvData[0] || {}).join(',') + '\n' +
        csvData.map(row => Object.values(row).join(',')).join('\n');
      
      res.send(csv);
    } else {
      res.json(transcripts);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get academic statistics
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get transcript statistics by course
    const transcriptByCourse = await Transcript.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 },
          averageCGPA: { $avg: '$cgpa' }
        }
      }
    ]);

    // Get grade distribution
    const gradeDistribution = await Transcript.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$overallGrade',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly transcript issuance
    const monthlyIssuance = await Transcript.aggregate([
      { $match: { ...dateFilter, status: 'Issued' } },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      transcriptByCourse,
      gradeDistribution,
      monthlyIssuance,
      totalTranscripts: await Transcript.countDocuments(dateFilter),
      issuedTranscripts: await Transcript.countDocuments({ ...dateFilter, status: 'Issued' })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
