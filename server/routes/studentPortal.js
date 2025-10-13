const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Fee = require('../models/Fee');
const HostelAllocation = require('../models/HostelAllocation');
const ExamResult = require('../models/ExamResult');
const Examination = require('../models/Examination');
const Admission = require('../models/Admission');
const Transcript = require('../models/Transcript');
const { auth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Middleware to ensure only students can access these routes
router.use((req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Student portal only.' });
  }
  next();
});

// Helper to resolve studentId (PRN) and admission by logged in user
async function resolveStudentContext(req) {
  const context = { studentId: req.user.prn, admission: null };
  try {
    if (!context.studentId) {
      // Fallback: derive PRN from admission by email
      const adm = await Admission.findOne({ email: req.user.email });
      if (adm) {
        context.studentId = adm.studentId;
        context.admission = adm;
      }
    } else {
      // Optionally fetch admission too
      const adm = await Admission.findOne({ studentId: context.studentId });
      if (adm) context.admission = adm;
    }
  } catch (_) {}
  return context;
}

// Get student dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const { studentId } = await resolveStudentContext(req);
    
    // Get student profile
    const profile = await User.findById(req.user.id)
      .select('-password');

    // Get fee summary
    const feeSummary = await Fee.aggregate([
      { $match: { studentId } },
      {
        $group: {
          _id: null,
          totalFees: { $sum: '$totalAmount' },
          paidFees: { $sum: '$paidAmount' },
          pendingFees: { $sum: '$pendingAmount' },
          overdueFees: {
            $sum: {
              $cond: [
                { $and: [{ $lt: ['$dueDate', new Date()] }, { $gt: ['$pendingAmount', 0] }] },
                '$pendingAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get recent fee records
    const recentFees = await Fee.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get hostel allocation
    const hostelAllocation = await HostelAllocation.findOne({ studentId })
      .populate('hostelId', 'name type address');

    // Get recent exam results
    const recentResults = await ExamResult.find({ studentId })
      .populate('examId', 'examName examType subject examDate')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming exams
    const upcomingExams = await Examination.find({
      course: req.user.course,
      branch: req.user.branch,
      semester: req.user.semester,
      examDate: { $gte: new Date() },
      examStatus: 'Scheduled'
    })
      .sort({ examDate: 1 })
      .limit(5);

    // Get academic performance summary
    const performanceSummary = await ExamResult.aggregate([
      { $match: { studentId } },
      {
        $group: {
          _id: '$examType',
          averageMarks: { $avg: '$marksObtained' },
          totalMarks: { $avg: '$totalMarks' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      profile,
      feeSummary: feeSummary[0] || { totalFees: 0, paidFees: 0, pendingFees: 0, overdueFees: 0 },
      recentFees,
      hostelAllocation,
      recentResults,
      upcomingExams,
      performanceSummary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await User.findById(req.user.id)
      .select('-password')
      .populate('createdBy', 'name email');

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student profile (Restricted: only profile image allowed here)
router.put('/profile', async (req, res) => {
  try {
    const { profilePhoto } = req.body || {};

    // Enforce restriction: students can edit only password and profile image
    // Password changes are handled at /api/users/profile, and image at /api/users/profile-photo
    const forbiddenKeys = Object.keys(req.body || {}).filter(
      (k) => k !== 'profilePhoto'
    );
    if (forbiddenKeys.length > 0) {
      return res.status(403).json({
        message: 'You can only update profile photo. Use password change endpoint to update password.'
      });
    }

    if (!profilePhoto) {
      return res.status(400).json({ message: 'No changes provided' });
    }

    const profile = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto },
      { new: true, runValidators: true }
    ).select('-password');

    return res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get student's fee records
router.get('/fees', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { studentId } = await resolveStudentContext(req);
    
    let filter = { studentId };
    if (status) filter.feeStatus = status;

    const fees = await Fee.find(filter)
      .populate('admissionId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Fee.countDocuments(filter);

    res.json({
      fees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pay fees online
router.post('/fees/:feeId/pay', async (req, res) => {
  try {
    const { feeId } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;
    const studentId = req.user.prn;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (fee.studentId !== studentId) {
      return res.status(403).json({ message: 'Not authorized to pay this fee' });
    }

    if (amount > fee.pendingAmount) {
      return res.status(400).json({ message: 'Payment amount exceeds pending amount' });
    }

    const payment = {
      paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      paymentMethod,
      transactionId,
      notes,
      status: 'Completed'
    };

    fee.payments.push(payment);
    fee.paidAmount += amount;
    fee.pendingAmount = fee.totalAmount - fee.paidAmount;
    
    // Update fee status
    if (fee.pendingAmount <= 0) {
      fee.feeStatus = 'Paid';
    } else if (fee.paidAmount > 0) {
      fee.feeStatus = 'Partial';
    }

    await fee.save();

    res.json({
      message: 'Payment successful',
      fee,
      receipt: {
        receiptNumber: payment.paymentId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        paidAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate fee receipt
router.get('/fees/:feeId/receipt', async (req, res) => {
  try {
    const { feeId } = req.params;
    const { studentId } = await resolveStudentContext(req);

    const fee = await Fee.findById(feeId)
      .populate('admissionId', 'firstName lastName email phone');

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (fee.studentId !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view this receipt' });
    }

    const receipt = {
      receiptNumber: `REC_${Date.now()}`,
      studentName: `${fee.admissionId.firstName} ${fee.admissionId.lastName}`,
      studentId: fee.studentId,
      course: fee.course,
      branch: fee.branch,
      semester: fee.semester,
      academicYear: fee.academicYear,
      totalAmount: fee.totalAmount,
      paidAmount: fee.paidAmount,
      pendingAmount: fee.pendingAmount,
      generatedAt: new Date(),
      generatedBy: req.user.name
    };

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get hostel allocation details
router.get('/hostel', async (req, res) => {
  try {
    const { studentId } = await resolveStudentContext(req);

    const allocation = await HostelAllocation.findOne({ studentId })
      .populate('hostelId', 'name type address contactNumber wardenName wardenPhone')
      .populate('admissionId', 'firstName lastName email phone');

    if (!allocation) {
      return res.status(404).json({ message: 'No hostel allocation found' });
    }

    res.json(allocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get exam results
router.get('/results', async (req, res) => {
  try {
    const { page = 1, limit = 10, examType, semester } = req.query;
    const { studentId } = await resolveStudentContext(req);
    
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

// Get academic performance summary
router.get('/performance', async (req, res) => {
  try {
    const { studentId } = await resolveStudentContext(req);

    // Get performance by exam type
    const performanceByType = await ExamResult.aggregate([
      { $match: { studentId } },
      {
        $group: {
          _id: '$examType',
          averageMarks: { $avg: '$marksObtained' },
          totalMarks: { $avg: '$totalMarks' },
          averagePercentage: { $avg: '$percentage' },
          count: { $sum: 1 },
          highestMarks: { $max: '$marksObtained' },
          lowestMarks: { $min: '$marksObtained' }
        }
      }
    ]);

    // Get performance by subject
    const performanceBySubject = await ExamResult.aggregate([
      { $match: { studentId } },
      {
        $group: {
          _id: '$subject',
          averageMarks: { $avg: '$marksObtained' },
          totalMarks: { $avg: '$totalMarks' },
          averagePercentage: { $avg: '$percentage' },
          count: { $sum: 1 },
          grade: { $first: '$grade' }
        }
      }
    ]);

    // Get overall statistics
    const overallStats = await ExamResult.aggregate([
      { $match: { studentId } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          averageMarks: { $avg: '$marksObtained' },
          averagePercentage: { $avg: '$percentage' },
          highestMarks: { $max: '$marksObtained' },
          lowestMarks: { $min: '$marksObtained' },
          passCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Pass'] }, 1, 0] }
          },
          failCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Fail'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      performanceByType,
      performanceBySubject,
      overallStats: overallStats[0] || {
        totalExams: 0,
        averageMarks: 0,
        averagePercentage: 0,
        highestMarks: 0,
        lowestMarks: 0,
        passCount: 0,
        failCount: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming exams
router.get('/exams/upcoming', async (req, res) => {
  try {
    const upcomingExams = await Examination.find({
      course: req.user.course,
      branch: req.user.branch,
      semester: req.user.semester,
      examDate: { $gte: new Date() },
      examStatus: 'Scheduled'
    })
      .populate('createdBy', 'name email')
      .sort({ examDate: 1 });

    res.json(upcomingExams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download exam paper (if available)
router.get('/exams/:examId/paper', async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Examination.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    // Check if student is enrolled in this exam
    if (exam.course !== req.user.course || 
        exam.branch !== req.user.branch || 
        exam.semester !== req.user.semester) {
      return res.status(403).json({ message: 'Not authorized to access this exam paper' });
    }

    if (!exam.questionPaper || !exam.questionPaper.filePath) {
      return res.status(404).json({ message: 'Exam paper not available' });
    }

    res.json({
      examName: exam.examName,
      examType: exam.examType,
      subject: exam.subject,
      examDate: exam.examDate,
      questionPaper: exam.questionPaper
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request transcript
router.post('/transcript/request', async (req, res) => {
  try {
    const { purpose, deliveryMethod } = req.body;
    const studentId = req.user.prn;

    // Check if transcript already exists
    const existingTranscript = await Transcript.findOne({ studentId });
    if (existingTranscript) {
      return res.status(400).json({ message: 'Transcript already exists for this student' });
    }

    // Create transcript request
    const transcript = await Transcript.create({
      studentId,
      admissionId: req.user.id,
      course: req.user.course,
      branch: req.user.branch,
      academicYear: req.user.academicYear,
      semester: req.user.semester,
      transcriptNumber: `TRANS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'Draft',
      purpose,
      deliveryMethod,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Transcript request submitted successfully',
      transcript: {
        transcriptNumber: transcript.transcriptNumber,
        status: transcript.status,
        createdAt: transcript.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transcript status
router.get('/transcript/status', async (req, res) => {
  try {
    const studentId = req.user.prn;

    const transcript = await Transcript.findOne({ studentId })
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email');

    if (!transcript) {
      return res.status(404).json({ message: 'No transcript found for this student' });
    }

    res.json(transcript);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download transcript (if issued)
router.get('/transcript/download', async (req, res) => {
  try {
    const { studentId } = await resolveStudentContext(req);

    const transcript = await Transcript.findOne({ studentId });
    if (!transcript) {
      return res.status(404).json({ message: 'No transcript found for this student' });
    }

    if (transcript.status !== 'Issued') {
      return res.status(400).json({ message: 'Transcript not yet issued' });
    }

    res.json({
      transcriptNumber: transcript.transcriptNumber,
      issueDate: transcript.issueDate,
      status: transcript.status,
      isVerified: transcript.isVerified,
      qrCode: transcript.qrCode,
      digitalSignature: transcript.digitalSignature
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admission details (prefer PRN, fallback to email)
router.get('/admission', async (req, res) => {
  try {
    let admission = null;
    // Prefer PRN if available on JWT
    if (req.user && req.user.prn) {
      admission = await Admission.findOne({ studentId: req.user.prn })
        .populate('createdBy', 'name email')
        .populate('reviewedBy', 'name email');
    }

    // Fallback to email if PRN lookup failed
    if (!admission && req.user && req.user.email) {
      admission = await Admission.findOne({ email: req.user.email })
        .populate('createdBy', 'name email')
        .populate('reviewedBy', 'name email');
    }

    if (!admission) {
      return res.status(404).json({ message: 'Admission record not found' });
    }

    res.json(admission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    // This would typically come from a notifications system
    // For now, we'll return a placeholder
    const notifications = [
      {
        id: 1,
        title: 'Fee Payment Reminder',
        message: 'Your semester fee is due on 15th of this month.',
        type: 'fee',
        date: new Date(),
        isRead: false
      },
      {
        id: 2,
        title: 'Exam Schedule Updated',
        message: 'ISE1 examination schedule has been updated.',
        type: 'exam',
        date: new Date(),
        isRead: false
      }
    ];

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
