const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const User = require('../models/User');
const FinancialTransaction = require('../models/FinancialTransaction');
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  console.warn('PDFKit not available, PDF receipts disabled');
}
const { auth } = require('../middleware/auth');

// Get all fees with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, studentId, course, branch, status, academicYear, q, name } = req.query;
    const filter = {};
    
    if (studentId) filter.studentId = studentId;
    if (course) filter.course = course;
    if (branch) filter.branch = branch;
    if (status) filter.feeStatus = status;
    if (academicYear) filter.academicYear = academicYear;

    // Text search: name/PRN/email
    const text = q || name;
    let query = Fee.find(filter);
    if (text && text.trim()) {
      const regex = new RegExp(text.trim(), 'i');
      // We'll populate and filter by admission fields post-query if needed
      query = query.populate({ path: 'admissionId', select: 'firstName lastName email', match: { $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] } });
    } else {
      query = query.populate('admissionId', 'firstName lastName email');
    }

    const fees = await query
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // If we filtered via populate match, remove those without populated docs
    const filteredFees = (text && text.trim()) ? fees.filter(f => f.admissionId) : fees;

    const total = await Fee.countDocuments(filter);

    res.json({
      fees: filteredFees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get fee by ID (include student user fields)
router.get('/:id', auth, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('admissionId', 'firstName lastName email phone')
      .populate('createdBy', 'name email');
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Try to enrich with user profile photo via user table
    const studentUser = await User.findOne({ prn: fee.studentId }).select('avatarUrl email name');
    const enriched = fee.toObject();
    enriched.studentUser = studentUser || null;
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new fee record
router.post('/', auth, async (req, res) => {
  try {
    const feeData = {
      ...req.body,
      createdBy: req.user.id
    };

    const fee = new Fee(feeData);
    await fee.save();

    res.status(201).json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update fee record
router.put('/:id', auth, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Check permissions
    if (!['admin', 'fee_manager', 'accountant'].includes(req.user.role) && 
        fee.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(fee, req.body);
    await fee.save();

    res.json(fee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Record payment
router.post('/:id/payment', auth, async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, notes } = req.body;
    
    if (!['admin', 'fee_manager', 'accountant', 'student'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to record payments' });
    }

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Check if student is paying their own fee
    if (req.user.role === 'student' && fee.studentId !== req.user.prn) {
      return res.status(403).json({ message: 'Not authorized to pay this fee' });
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

    // Create financial transaction record
    const transaction = await FinancialTransaction.create({
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionType: 'Income',
      category: 'Student Fees',
      amount: amount,
      description: `Fee payment for ${fee.course} - ${fee.branch}`,
      paymentMethod: paymentMethod,
      transactionDate: new Date(),
      status: 'Completed',
      studentId: fee.studentId,
      admissionId: fee.admissionId,
      createdBy: req.user.id
    });

    res.json({
      fee,
      transaction: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Generate fee receipt
router.get('/:id/receipt', auth, async (req, res) => {
  try {
    let fee = await Fee.findById(req.params.id)
      .populate('admissionId', 'firstName lastName email phone');
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Fallback: if admissionId not populated or missing expected fields, try resolve via Admission by PRN/email
    let studentName = undefined;
    let studentEmail = undefined;
    try {
      if (fee.admissionId && (fee.admissionId.firstName || fee.admissionId.lastName)) {
        studentName = `${fee.admissionId.firstName || ''} ${fee.admissionId.lastName || ''}`.trim();
        studentEmail = fee.admissionId.email;
      } else {
        const Admission = require('../models/Admission');
        const adm = await Admission.findOne({ studentId: fee.studentId }) || await Admission.findOne({ email: fee.studentUser?.email });
        if (adm) {
          studentName = `${adm.firstName || ''} ${adm.lastName || ''}`.trim();
          studentEmail = adm.email;
        }
      }
    } catch (_) {}

    // Generate receipt data
    const receipt = {
      receiptNumber: `REC_${Date.now()}`,
      studentName: studentName || fee.studentUser?.name || 'Student',
      studentId: fee.studentId,
      email: studentEmail || fee.studentUser?.email || '',
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

// PDF receipt
router.get('/:id/receipt.pdf', auth, async (req, res) => {
  try {
    if (!PDFDocument) {
      return res.status(503).json({ message: 'PDF generation not available' });
    }
    let fee = await Fee.findById(req.params.id)
      .populate('admissionId', 'firstName lastName email phone');
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fee_receipt_${fee.studentId}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('Fee Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Receipt #: REC_${Date.now()}`);
    doc.text(`Student: ${(fee.admissionId?.firstName || '')} ${(fee.admissionId?.lastName || '')}`);
    doc.text(`PRN: ${fee.studentId}`);
    doc.text(`Email: ${fee.admissionId?.email || ''}`);
    doc.moveDown();
    doc.text(`Course: ${fee.course}  Branch: ${fee.branch}`);
    doc.text(`Semester: ${fee.semester}  Academic Year: ${fee.academicYear}`);
    doc.moveDown();
    doc.text(`Total: ₹${fee.totalAmount}`);
    doc.text(`Paid: ₹${fee.paidAmount}`);
    doc.text(`Pending: ₹${fee.pendingAmount}`);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get fee statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Fee.aggregate([
      {
        $group: {
          _id: '$feeStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$pendingAmount' }
        }
      }
    ]);

    const totalFees = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$pendingAmount' }
        }
      }
    ]);

    res.json({
      statusBreakdown: stats,
      totalFees: totalFees[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete fee record
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'fee_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    await Fee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Fee record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's fee records
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    // Check if student is accessing their own fees
    if (req.user.role === 'student' && req.user.prn !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view other student fees' });
    }

    let filter = { studentId };
    if (status) filter.feeStatus = status;

    const fees = await Fee.find(filter)
      .populate('admissionId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Fee.countDocuments(filter);

    // Enrich with student avatar/email when available
    const prns = fees.map(f => f.studentId);
    const users = await User.find({ prn: { $in: prns } }).select('prn avatarUrl email name');
    const prnToUser = new Map(users.map(u => [u.prn, u]));
    const enrichedFees = fees.map(f => {
      const obj = f.toObject();
      obj.studentUser = prnToUser.get(f.studentId) || null;
      return obj;
    });

    res.json({
      fees: enrichedFees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get fee dashboard for fee manager
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    if (!['admin', 'fee_manager', 'accountant'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get fee statistics
    const feeStats = await Fee.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$feeStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$pendingAmount' }
        }
      }
    ]);

    // Get course-wise fee collection
    const courseStats = await Fee.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' }
        }
      }
    ]);

    // Get recent payments
    const recentPayments = await Fee.find(dateFilter)
      .populate('admissionId', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Get overdue fees
    const overdueFees = await Fee.find({
      ...dateFilter,
      feeStatus: 'Overdue',
      dueDate: { $lt: new Date() }
    })
      .populate('admissionId', 'firstName lastName email')
      .sort({ dueDate: 1 });

    res.json({
      feeStats,
      courseStats,
      recentPayments,
      overdueFees,
      totalFees: await Fee.countDocuments(dateFilter),
      totalAmount: await Fee.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => result[0]?.total || 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate fee structure for a course
router.post('/generate-structure', auth, async (req, res) => {
  try {
    if (!['admin', 'fee_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { course, branch, semester, academicYear, feeStructure } = req.body;

    // Get all students for this course/branch/semester
    const students = await User.find({
      role: 'student',
      course,
      branch,
      semester,
      academicYear
    });

    const generatedFees = [];

    for (const student of students) {
      // Check if fee already exists
      const existingFee = await Fee.findOne({
        studentId: student.prn,
        course,
        branch,
        semester,
        academicYear
      });

      if (!existingFee) {
        const totalAmount = Object.values(feeStructure).reduce((sum, amount) => sum + amount, 0);
        
        const fee = await Fee.create({
          studentId: student.prn,
          admissionId: student._id, // Assuming admissionId is the same as user ID
          academicYear,
          semester,
          course,
          branch,
          ...feeStructure,
          totalAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          createdBy: req.user.id
        });

        generatedFees.push(fee);
      }
    }

    res.json({
      message: `Generated ${generatedFees.length} fee records`,
      generatedCount: generatedFees.length,
      totalStudents: students.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send fee reminder
router.post('/:id/reminder', auth, async (req, res) => {
  try {
    if (!['admin', 'fee_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const fee = await Fee.findById(req.params.id)
      .populate('admissionId', 'firstName lastName email phone');

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    // Here you would typically send an email/SMS reminder
    // For now, we'll just return a success message
    res.json({
      message: 'Fee reminder sent successfully',
      student: {
        name: `${fee.admissionId.firstName} ${fee.admissionId.lastName}`,
        email: fee.admissionId.email,
        phone: fee.admissionId.phone
      },
      fee: {
        totalAmount: fee.totalAmount,
        pendingAmount: fee.pendingAmount,
        dueDate: fee.dueDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export fee data
router.get('/export', auth, async (req, res) => {
  try {
    if (!['admin', 'fee_manager', 'accountant'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { format = 'json', status, course, academicYear } = req.query;
    
    let filter = {};
    if (status) filter.feeStatus = status;
    if (course) filter.course = course;
    if (academicYear) filter.academicYear = academicYear;

    const fees = await Fee.find(filter)
      .populate('admissionId', 'firstName lastName email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = fees.map(fee => ({
        'Student ID': fee.studentId,
        'Student Name': `${fee.admissionId.firstName} ${fee.admissionId.lastName}`,
        'Email': fee.admissionId.email,
        'Course': fee.course,
        'Branch': fee.branch,
        'Semester': fee.semester,
        'Academic Year': fee.academicYear,
        'Total Amount': fee.totalAmount,
        'Paid Amount': fee.paidAmount,
        'Pending Amount': fee.pendingAmount,
        'Status': fee.feeStatus,
        'Due Date': fee.dueDate
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=fees.csv');
      
      // Simple CSV conversion
      const csv = Object.keys(csvData[0] || {}).join(',') + '\n' +
        csvData.map(row => Object.values(row).join(',')).join('\n');
      
      res.send(csv);
    } else {
      res.json(fees);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
