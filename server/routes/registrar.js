const express = require('express');
const router = express.Router();
const Transcript = require('../models/Transcript');
const ExamResult = require('../models/ExamResult');
const User = require('../models/User');
const Admission = require('../models/Admission');
const { auth } = require('../middleware/auth');
const StudentGroup = require('../models/StudentGroup');
let PDFDocument;
try { PDFDocument = require('pdfkit'); } catch (_) {}
let ExcelJS;
try { ExcelJS = require('exceljs'); } catch (_) {}

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

// Consolidated Registrar Report (CSV or PDF)
router.get('/reports/consolidated', async (req, res) => {
  try {
    const axios = require('axios');
    const headers = { Authorization: req.headers.authorization || '' };

    const origin = `${req.protocol}://${req.get('host')}`;
    const [admissions, fees, hostels, examinations] = await Promise.all([
      axios.get(`${origin}/api/erp/admissions/stats/overview`, { headers }).then(r=>r.data).catch(()=>null),
      axios.get(`${origin}/api/erp/fees/stats/overview`, { headers }).then(r=>r.data).catch(()=>null),
      axios.get(`${origin}/api/erp/hostels/dashboard/stats`, { headers }).then(r=>r.data).catch(()=>null),
      axios.get(`${origin}/api/erp/examinations/stats/overview`, { headers }).then(r=>r.data).catch(()=>null)
    ]);

    const { format = 'csv' } = req.query;

    if (format === 'xlsx') {
      if (!ExcelJS) {
        return res.status(503).json({ message: 'Excel generation not available on this server' });
      }
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Registrar';
      wb.created = new Date();

      // Admissions sheet
      const wsA = wb.addWorksheet('Admissions');
      wsA.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
      ];
      wsA.addRow({ metric: 'Total Admissions', value: admissions?.totalAdmissions || 0 });
      wsA.addRow({ metric: 'Current Year Admissions', value: admissions?.currentYearAdmissions || 0 });
      (admissions?.statusBreakdown || []).forEach(s => wsA.addRow({ metric: `Status: ${s._id}`, value: s.count }));

      // Fees sheet
      const wsF = wb.addWorksheet('Fees');
      wsF.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
      ];
      if (fees?.totalFees) {
        wsF.addRow({ metric: 'Total Amount', value: fees.totalFees.totalAmount || 0 });
        wsF.addRow({ metric: 'Paid Amount', value: fees.totalFees.paidAmount || 0 });
        wsF.addRow({ metric: 'Pending Amount', value: fees.totalFees.pendingAmount || 0 });
      }
      (fees?.statusBreakdown || []).forEach(s => wsF.addRow({ metric: `Status: ${s._id}`, value: s.count }));

      // Hostels sheet
      const wsH = wb.addWorksheet('Hostels');
      wsH.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
      ];
      if (hostels && !hostels.message) {
        const hs = hostels.hostelStats || {};
        wsH.addRow({ metric: 'Total Hostels', value: hs.totalHostels || 0 });
        wsH.addRow({ metric: 'Total Capacity', value: hs.totalCapacity || 0 });
        wsH.addRow({ metric: 'Current Occupancy', value: hs.currentOccupancy || 0 });
      } else {
        wsH.addRow({ metric: 'Access', value: hostels?.message || 'Not authorized' });
      }

      // Examinations sheet
      const wsE = wb.addWorksheet('Examinations');
      wsE.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
      ];
      wsE.addRow({ metric: 'Total Examinations', value: examinations?.totalExaminations || 0 });
      wsE.addRow({ metric: 'Upcoming Examinations', value: examinations?.upcomingExams || 0 });
      (examinations?.statusBreakdown || []).forEach(s => wsE.addRow({ metric: `Status: ${s._id}`, value: s.count }));

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=registrar_report.xlsx');
      await wb.xlsx.write(res);
      res.end();
      return;
    }

    if (format === 'pdf') {
      if (!PDFDocument) {
        return res.status(503).json({ message: 'PDF generation not available on this server' });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=registrar_report.pdf');
      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);
      doc.fontSize(18).text('Registrar Consolidated Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text('Admissions', { underline: true });
      doc.moveDown(0.5);
      doc.text(`Total Admissions: ${admissions?.totalAdmissions || 0}`);
      doc.text(`Current Year Admissions: ${admissions?.currentYearAdmissions || 0}`);
      (admissions?.statusBreakdown || []).forEach(s => doc.text(`Status ${s._id}: ${s.count}`));
      doc.moveDown();
      doc.text('Fees', { underline: true });
      doc.moveDown(0.5);
      if (fees?.totalFees) {
        doc.text(`Total Amount: ${fees.totalFees.totalAmount || 0}`);
        doc.text(`Paid Amount: ${fees.totalFees.paidAmount || 0}`);
        doc.text(`Pending Amount: ${fees.totalFees.pendingAmount || 0}`);
      }
      (fees?.statusBreakdown || []).forEach(s => doc.text(`Status ${s._id}: ${s.count}`));
      doc.moveDown();
      doc.text('Hostels', { underline: true });
      doc.moveDown(0.5);
      if (hostels && !hostels.message) {
        const hs = hostels.hostelStats || {};
        doc.text(`Total Hostels: ${hs.totalHostels || 0}`);
        doc.text(`Total Capacity: ${hs.totalCapacity || 0}`);
        doc.text(`Current Occupancy: ${hs.currentOccupancy || 0}`);
      } else {
        doc.text(`Access: ${hostels?.message || 'Not authorized'}`);
      }
      doc.moveDown();
      doc.text('Examinations', { underline: true });
      doc.moveDown(0.5);
      doc.text(`Total Examinations: ${examinations?.totalExaminations || 0}`);
      doc.text(`Upcoming Examinations: ${examinations?.upcomingExams || 0}`);
      (examinations?.statusBreakdown || []).forEach(s => doc.text(`Status ${s._id}: ${s.count}`));
      doc.end();
      return;
    }

    // Default CSV: flatten sections into simple rows
    const rows = [];
    rows.push({ section: 'admissions_total', value: (admissions && admissions.totalAdmissions) || 0 });
    rows.push({ section: 'admissions_currentYear', value: (admissions && admissions.currentYearAdmissions) || 0 });
    (admissions?.statusBreakdown || []).forEach(s => rows.push({ section: `admissions_status_${s._id}`, value: s.count }));

    if (fees?.totalFees) {
      rows.push({ section: 'fees_totalAmount', value: fees.totalFees.totalAmount || 0 });
      rows.push({ section: 'fees_paidAmount', value: fees.totalFees.paidAmount || 0 });
      rows.push({ section: 'fees_pendingAmount', value: fees.totalFees.pendingAmount || 0 });
    }
    (fees?.statusBreakdown || []).forEach(s => rows.push({ section: `fees_status_${s._id}`, value: s.count }));

    if (hostels && !hostels.message) {
      const hs = hostels.hostelStats || {};
      rows.push({ section: 'hostels_totalHostels', value: hs.totalHostels || 0 });
      rows.push({ section: 'hostels_totalCapacity', value: hs.totalCapacity || 0 });
      rows.push({ section: 'hostels_currentOccupancy', value: hs.currentOccupancy || 0 });
    } else {
      rows.push({ section: 'hostels_access', value: 'Not authorized' });
    }

    rows.push({ section: 'exams_total', value: examinations?.totalExaminations || 0 });
    rows.push({ section: 'exams_upcoming', value: examinations?.upcomingExams || 0 });
    (examinations?.statusBreakdown || []).forEach(s => rows.push({ section: `exams_status_${s._id}`, value: s.count }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=registrar_report.csv');
    const header = 'section,value';
    const csv = header + '\n' + rows.map(r => `${r.section},${r.value}`).join('\n');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

// Higher roles listing and update (Registrar-only)
router.get('/higher-roles', async (req, res) => {
  try {
    if (req.user.role !== 'registrar') {
      return res.status(403).json({ message: 'Registrar only' });
    }
    const roles = ['admin','admission_officer','fee_manager','hostel_manager','exam_controller','accountant','registrar','instructor'];
    const { search, role, page = 1, limit = 20 } = req.query;
    const q = { role: { $in: roles } }; // Only higher roles, exclude students
    if (role && roles.includes(role)) q.role = role;
    if (search) q.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(q).select('-password').limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(q);
    res.json({ users, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/higher-roles/:userId', async (req, res) => {
  try {
    if (req.user.role !== 'registrar') {
      return res.status(403).json({ message: 'Registrar only' });
    }
    const allowed = ['admin','admission_officer','fee_manager','hostel_manager','exam_controller','accountant','registrar','instructor'];
    const user = await User.findById(req.params.userId);
    if (!user || !allowed.includes(user.role)) return res.status(404).json({ message: 'User not found' });
    const update = req.body || {};
    delete update.password;
    Object.assign(user, update);
    await user.save();
    res.json({ 
      message: 'Updated successfully', 
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        department: user.department, 
        designation: user.designation, 
        employeeId: user.employeeId,
        joiningDate: user.joiningDate,
        mobileNo: user.mobileNo,
        dateOfBirth: user.dateOfBirth,
        address: user.address
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Groups management for registrar
router.get('/groups', async (req, res) => {
  try {
    if (req.user.role !== 'registrar') {
      return res.status(403).json({ message: 'Registrar only' });
    }
    const groups = await StudentGroup.find({})
      .populate('students', 'name email prn course branch semester')
      .populate('assignedAdmin', 'name email department designation')
      .sort({ createdAt: -1 });
    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});