const express = require('express');
const router = express.Router();
const Admission = require('../models/Admission');
const User = require('../models/User');
const StudentGroup = require('../models/StudentGroup');
const { auth } = require('../middleware/auth');
let PDFDocument;
try { PDFDocument = require('pdfkit'); } catch (_) {}
let ExcelJS;
try { ExcelJS = require('exceljs'); } catch (_) {}

// Get all admissions with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, course, branch, academicYear, studentId, email, q } = req.query;
    const filter = {};
    
    if (status) filter.admissionStatus = status;
    if (course) filter.course = course;
    if (branch) filter.branch = branch;
    if (academicYear) filter.academicYear = academicYear;
    if (studentId) filter.studentId = studentId;
    if (email) filter.email = email;

    // Text search by name/email/PRN
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      Object.assign(filter, {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { studentId: regex }
        ]
      });
    }

    // If admin, restrict visibility to admissions belonging to students in groups assigned to this admin
    if (req.user.role === 'admin') {
      const groups = await StudentGroup.find({ assignedAdmin: req.user.id }).select('students');
      const studentIds = [...new Set(groups.flatMap(g => (g.students || []).map(id => id.toString())) )];
      if (studentIds.length === 0) {
        // No assigned groups => admin sees none
        return res.json({ admissions: [], totalPages: 0, currentPage: page, total: 0 });
      }
      const students = await User.find({ _id: { $in: studentIds } }).select('email prn');
      const allowedEmails = students.map(s => s.email).filter(Boolean);
      const allowedPrns = students.map(s => s.prn).filter(Boolean);
      Object.assign(filter, { $or: [ { email: { $in: allowedEmails } }, { studentId: { $in: allowedPrns } } ] });
    }

    const admissions = await Admission.find(filter)
      .populate('createdBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Admission.countDocuments(filter);

    res.json({
      admissions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admission by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('reviewedBy', 'name email');
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    res.json(admission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new admission
router.post('/', auth, async (req, res) => {
  try {
    const admissionData = {
      ...req.body,
      createdBy: req.user.id
    };

    const admission = new Admission(admissionData);
    await admission.save();

    // Optional: auto-create student user for registrar/admission_officer
    if (['admin', 'admission_officer', 'registrar'].includes(req.user.role) && req.body.autoCreateStudent) {
      req.params.id = admission._id.toString();
      // Set approved to allow creation
      admission.admissionStatus = 'Approved';
      await admission.save();
      // Call create-student handler logic
      // Note: reuse route below would require refactor; do it inline here
      const User = require('../models/User');
      const bcrypt = require('bcryptjs');
      const existingStudent = await User.findOne({ $or: [{ email: admission.email }, { prn: admission.studentId }] });
      if (!existingStudent) {
        const hashed = await bcrypt.hash('temp123', 10);
        await User.create({
          name: `${admission.firstName} ${admission.lastName}`,
          email: admission.email,
          password: hashed,
          role: 'student',
          prn: admission.studentId,
          dateOfBirth: admission.dateOfBirth,
          mobileNo: admission.phone,
          address: admission.address,
          admissionYear: admission.academicYear,
          course: admission.course,
          branch: admission.branch,
          semester: admission.semester,
          academicYear: admission.academicYear,
          createdBy: req.user.id
        });
      }
    }

    res.status(201).json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update admission
router.put('/:id', auth, async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'admission_officer' && 
        admission.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(admission, req.body);
    await admission.save();

    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Review admission
router.patch('/:id/review', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['admin', 'admission_officer', 'registrar'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to review admissions' });
    }

    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    admission.admissionStatus = status;
    admission.reviewedBy = req.user.id;
    admission.reviewNotes = notes;
    await admission.save();

    res.json(admission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete admission
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'admission_officer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    await Admission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admission statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    // Build restriction filter for admin
    let match = {};
    if (req.user.role === 'admin') {
      const groups = await StudentGroup.find({ assignedAdmin: req.user.id }).select('students');
      const studentIds = [...new Set(groups.flatMap(g => (g.students || []).map(id => id.toString())) )];
      if (studentIds.length === 0) {
        return res.json({ statusBreakdown: [], totalAdmissions: 0, currentYearAdmissions: 0 });
      }
      const students = await User.find({ _id: { $in: studentIds } }).select('email prn');
      const allowedEmails = students.map(s => s.email).filter(Boolean);
      const allowedPrns = students.map(s => s.prn).filter(Boolean);
      match = { $or: [ { email: { $in: allowedEmails } }, { studentId: { $in: allowedPrns } } ] };
    }

    const stats = await Admission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$admissionStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAdmissions = await Admission.countDocuments(match);
    const currentYear = new Date().getFullYear();
    const currentYearAdmissions = await Admission.countDocuments({
      academicYear: currentYear.toString(),
      ...match
    });

    res.json({
      statusBreakdown: stats,
      totalAdmissions,
      currentYearAdmissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create student user from approved admission
router.post('/:id/create-student', auth, async (req, res) => {
  try {
    if (!['admin', 'admission_officer', 'registrar'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create student accounts' });
    }

    const admission = await Admission.findById(req.params.id);
    if (!admission) {
      return res.status(404).json({ message: 'Admission not found' });
    }

    if (admission.admissionStatus !== 'Approved') {
      return res.status(400).json({ message: 'Admission must be approved before creating student account' });
    }

    // Check if student already exists
    const existingStudent = await User.findOne({ 
      $or: [
        { email: admission.email },
        { prn: admission.studentId }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({ message: 'Student account already exists with this email or PRN' });
    }

    // Create student user
    const studentData = {
      name: `${admission.firstName} ${admission.lastName}`,
      email: admission.email,
      password: 'temp123', // Temporary password, student should change on first login
      role: 'student',
      prn: admission.studentId,
      dateOfBirth: admission.dateOfBirth,
      mobileNo: admission.phone,
      address: admission.address,
      admissionYear: admission.academicYear,
      course: admission.course,
      branch: admission.branch,
      semester: admission.semester,
      academicYear: admission.academicYear,
      createdBy: req.user.id
    };

    const student = await User.create(studentData);

    // Update admission with student reference
    admission.studentUserId = student._id;
    await admission.save();

    res.status(201).json({
      message: 'Student account created successfully',
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        prn: student.prn,
        course: student.course,
        branch: student.branch
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get admission dashboard for admission officer
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    if (!['admin', 'admission_officer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const currentYear = new Date().getFullYear().toString();
    // Restrict for admin
    let match = {};
    if (req.user.role === 'admin') {
      const groups = await StudentGroup.find({ assignedAdmin: req.user.id }).select('students');
      const studentIds = [...new Set(groups.flatMap(g => (g.students || []).map(id => id.toString())) )];
      if (studentIds.length === 0) {
        return res.json({ admissionStats: [], courseStats: [], recentAdmissions: [], monthlyTrends: [], totalAdmissions: 0, currentYearAdmissions: 0 });
      }
      const students = await User.find({ _id: { $in: studentIds } }).select('email prn');
      const allowedEmails = students.map(s => s.email).filter(Boolean);
      const allowedPrns = students.map(s => s.prn).filter(Boolean);
      match = { $or: [ { email: { $in: allowedEmails } }, { studentId: { $in: allowedPrns } } ] };
    }
    
    // Get admission statistics
    const admissionStats = await Admission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$admissionStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get course-wise statistics
    const courseStats = await Admission.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent admissions
    const recentAdmissions = await Admission.find(match)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get monthly admission trends
    const monthlyTrends = await Admission.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      admissionStats,
      courseStats,
      recentAdmissions,
      monthlyTrends,
      totalAdmissions: await Admission.countDocuments(match),
      currentYearAdmissions: await Admission.countDocuments({ academicYear: currentYear, ...match })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk approve admissions
router.post('/bulk-approve', auth, async (req, res) => {
  try {
    if (!['admin', 'admission_officer'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { admissionIds, notes } = req.body;

    if (!Array.isArray(admissionIds) || admissionIds.length === 0) {
      return res.status(400).json({ message: 'Admission IDs are required' });
    }

    const result = await Admission.updateMany(
      { _id: { $in: admissionIds } },
      {
        admissionStatus: 'Approved',
        reviewedBy: req.user.id,
        reviewNotes: notes
      }
    );

    res.json({
      message: `${result.modifiedCount} admissions approved successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export admissions data
router.get('/export', auth, async (req, res) => {
  try {
    if (!['admin', 'admission_officer', 'registrar'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { format = 'json', status, course, academicYear } = req.query;
    
    let filter = {};
    if (status) filter.admissionStatus = status;
    if (course) filter.course = course;
    if (academicYear) filter.academicYear = academicYear;

    // Restrict for admin to assigned groups
    if (req.user.role === 'admin') {
      const groups = await StudentGroup.find({ assignedAdmin: req.user.id }).select('students');
      const studentIds = [...new Set(groups.flatMap(g => (g.students || []).map(id => id.toString())) )];
      if (studentIds.length === 0) {
        return res.json([]);
      }
      const students = await User.find({ _id: { $in: studentIds } }).select('email prn');
      const allowedEmails = students.map(s => s.email).filter(Boolean);
      const allowedPrns = students.map(s => s.prn).filter(Boolean);
      Object.assign(filter, { $or: [ { email: { $in: allowedEmails } }, { studentId: { $in: allowedPrns } } ] });
    }

    const admissions = await Admission.find(filter)
      .populate('createdBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = admissions.map(admission => ({
        'Student ID': admission.studentId,
        'Name': `${admission.firstName} ${admission.lastName}`,
        'Email': admission.email,
        'Phone': admission.phone,
        'Course': admission.course,
        'Branch': admission.branch,
        'Semester': admission.semester,
        'Academic Year': admission.academicYear,
        'Status': admission.admissionStatus,
        'Admission Date': admission.admissionDate,
        'Created By': admission.createdBy?.name || 'N/A'
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=admissions.csv');
      
      // Simple CSV conversion
      const csv = Object.keys(csvData[0] || {}).join(',') + '\n' +
        csvData.map(row => Object.values(row).join(',')).join('\n');
      
      res.send(csv);
    } else {
      res.json(admissions);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Consolidated export for admissions (xlsx/csv/pdf)
router.get('/reports/consolidated', auth, async (req, res) => {
  try {
    if (!['admin', 'admission_officer', 'registrar'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { format = 'xlsx' } = req.query;

    if (format === 'xlsx') {
      if (!ExcelJS) return res.status(503).json({ message: 'Excel not available' });
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Admissions');
      ws.columns = [
        { header: 'Student ID', key: 'studentId', width: 16 },
        { header: 'Name', key: 'name', width: 24 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Course', key: 'course', width: 16 },
        { header: 'Branch', key: 'branch', width: 16 },
        { header: 'Semester', key: 'semester', width: 10 },
        { header: 'Year', key: 'year', width: 10 },
        { header: 'Status', key: 'status', width: 14 }
      ];
      const list = await Admission.find({}).sort({ createdAt: -1 });
      list.forEach(a => ws.addRow({
        studentId: a.studentId,
        name: `${a.firstName} ${a.lastName}`,
        email: a.email,
        course: a.course,
        branch: a.branch,
        semester: a.semester,
        year: a.academicYear,
        status: a.admissionStatus
      }));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=admissions_report.xlsx');
      await wb.xlsx.write(res);
      res.end();
      return;
    }

    if (format === 'pdf') {
      if (!PDFDocument) return res.status(503).json({ message: 'PDF not available' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=admissions_report.pdf');
      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);
      doc.fontSize(18).text('Admissions Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      const total = await Admission.countDocuments();
      doc.text(`Total Admissions: ${total}`);
      doc.moveDown();
      const list = await Admission.find({}).sort({ createdAt: -1 }).limit(100);
      list.forEach(a => doc.text(`${a.studentId} | ${a.firstName} ${a.lastName} | ${a.email} | ${a.course} | ${a.branch} | ${a.semester} | ${a.academicYear} | ${a.admissionStatus}`));
      doc.end();
      return;
    }

    // CSV fallback
    const list = await Admission.find({}).sort({ createdAt: -1 });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=admissions_report.csv');
    const header = 'Student ID,Name,Email,Course,Branch,Semester,Year,Status';
    const csv = header + '\n' + list.map(a => [
      a.studentId, `${a.firstName} ${a.lastName}`, a.email, a.course, a.branch, a.semester, a.academicYear, a.admissionStatus
    ].join(',')).join('\n');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
