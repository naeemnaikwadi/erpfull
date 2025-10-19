const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Course = require('../models/Course');
const LiveSession = require('../models/LiveSession');
const LearningPath = require('../models/LearningPath');
const Admission = require('../models/Admission');
const Fee = require('../models/Fee');
const Hostel = require('../models/Hostel');
const HostelAllocation = require('../models/HostelAllocation');
const Room = require('../models/Room');
const Examination = require('../models/Examination');
const ExamResult = require('../models/ExamResult');
const ExamPaperAssignment = require('../models/ExamPaperAssignment');
const FinancialTransaction = require('../models/FinancialTransaction');
const Transcript = require('../models/Transcript');
const { auth, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Apply admin middleware to all routes
router.use(auth);
router.use(adminOnly);

// ==================== CLASSROOM & COURSE ASSIGNMENT ====================

// Assign instructor to classroom
router.post('/assign-instructor-to-classroom', async (req, res) => {
  try {
    const { classroomId, instructorId } = req.body;

    // Verify classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Verify instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(400).json({ message: 'Invalid instructor' });
    }

    // Check if instructor is already assigned to this classroom
    const existingAssignment = classroom.instructors.find(
      inst => inst.instructorId.toString() === instructorId
    );

    if (existingAssignment) {
      return res.status(400).json({ message: 'Instructor already assigned to this classroom' });
    }

    // Add instructor to classroom
    classroom.instructors.push({
      instructorId: instructorId,
      instructorName: instructor.name,
      role: 'Primary',
      assignedAt: new Date(),
      isActive: true
    });

    // Update primary instructor if this is the first assignment
    if (!classroom.instructor) {
      classroom.instructor = instructorId;
      classroom.instructorName = instructor.name;
    }

    await classroom.save();

    res.json({ 
      message: 'Instructor assigned successfully',
      classroom: await Classroom.findById(classroomId).populate('instructors.instructorId', 'name email')
    });
  } catch (error) {
    console.error('Error assigning instructor:', error);
    res.status(500).json({ message: 'Error assigning instructor', error: error.message });
  }
});

// Remove instructor from classroom
router.delete('/classrooms/:classroomId/remove-instructor', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { instructorId } = req.body;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Remove instructor from instructors array
    classroom.instructors = classroom.instructors.filter(
      inst => inst.instructorId.toString() !== instructorId
    );

    // If this was the primary instructor, set a new one or clear it
    if (classroom.instructor.toString() === instructorId) {
      if (classroom.instructors.length > 0) {
        classroom.instructor = classroom.instructors[0].instructorId;
        classroom.instructorName = classroom.instructors[0].instructorName;
      } else {
        classroom.instructor = null;
        classroom.instructorName = null;
      }
    }

    await classroom.save();

    res.json({ message: 'Instructor removed successfully' });
  } catch (error) {
    console.error('Error removing instructor:', error);
    res.status(500).json({ message: 'Error removing instructor', error: error.message });
  }
});

// Add student to classroom
router.post('/classrooms/:classroomId/add-student', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { studentId } = req.body;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student' });
    }

    // Check if student is already in classroom
    if (classroom.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student already in this classroom' });
    }

    classroom.students.push(studentId);
    await classroom.save();

    res.json({ 
      message: 'Student added successfully',
      classroom: await Classroom.findById(classroomId).populate('students', 'name email prn')
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
});

// Remove student from classroom
router.delete('/classrooms/:classroomId/remove-student/:studentId', async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    classroom.students = classroom.students.filter(
      id => id.toString() !== studentId
    );

    await classroom.save();

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error removing student:', error);
    res.status(500).json({ message: 'Error removing student', error: error.message });
  }
});

// Create course and assign to classroom
router.post('/courses', async (req, res) => {
  try {
    const { title, description, classroomId, instructorId, date } = req.body;

    // Verify classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Verify instructor exists and is assigned to classroom
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(400).json({ message: 'Invalid instructor' });
    }

    // Check if instructor is assigned to this classroom
    const isInstructorAssigned = classroom.instructors.some(
      inst => inst.instructorId.toString() === instructorId && inst.isActive
    );

    if (!isInstructorAssigned) {
      return res.status(400).json({ message: 'Instructor not assigned to this classroom' });
    }

    // Create course
    const course = new Course({
      name: title,
      description,
      date: new Date(date),
      classroom: classroomId,
      instructor: instructorId
    });

    await course.save();

    // Populate the course with related data
    const populatedCourse = await Course.findById(course._id)
      .populate('classroom', 'name')
      .populate('instructor', 'name email');

    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
});

// Get instructor's assigned classrooms and courses
router.get('/instructor/:instructorId/assignments', async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Get classrooms where instructor is assigned
    const classrooms = await Classroom.find({
      'instructors.instructorId': instructorId,
      'instructors.isActive': true
    }).populate('students', 'name email prn course branch semester');

    // Get courses created by this instructor
    const courses = await Course.find({ instructor: instructorId })
      .populate('classroom', 'name')
      .populate('studentsEnrolled', 'name email prn');

    res.json({
      classrooms,
      courses,
      totalClassrooms: classrooms.length,
      totalCourses: courses.length
    });
  } catch (error) {
    console.error('Error fetching instructor assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

// Get comprehensive ERP dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Basic user statistics
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalAdmissionOfficers = await User.countDocuments({ role: 'admission_officer' });
    const totalFeeManagers = await User.countDocuments({ role: 'fee_manager' });
    const totalHostelManagers = await User.countDocuments({ role: 'hostel_manager' });
    const totalExamControllers = await User.countDocuments({ role: 'exam_controller' });
    const totalAccountants = await User.countDocuments({ role: 'accountant' });
    const totalRegistrars = await User.countDocuments({ role: 'registrar' });
    
    // Academic statistics
    const totalClassrooms = await Classroom.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalLearningPaths = await LearningPath.countDocuments();
    
    // Admission statistics
    const totalAdmissions = await Admission.countDocuments();
    const pendingAdmissions = await Admission.countDocuments({ admissionStatus: 'Pending' });
    const approvedAdmissions = await Admission.countDocuments({ admissionStatus: 'Approved' });
    const rejectedAdmissions = await Admission.countDocuments({ admissionStatus: 'Rejected' });
    
    // Fee statistics
    const totalFees = await Fee.countDocuments();
    const paidFees = await Fee.countDocuments({ feeStatus: 'Paid' });
    const pendingFees = await Fee.countDocuments({ feeStatus: 'Pending' });
    const overdueFees = await Fee.countDocuments({ feeStatus: 'Overdue' });
    
    // Calculate total fee amounts
    const feeStats = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$pendingAmount' }
        }
      }
    ]);
    
    // Hostel statistics
    const totalHostels = await Hostel.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalHostelAllocations = await HostelAllocation.countDocuments();
    const activeHostelAllocations = await HostelAllocation.countDocuments({ allocationStatus: 'Active' });
    
    // Calculate hostel occupancy
    const hostelStats = await Hostel.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$totalCapacity' },
          currentOccupancy: { $sum: '$currentOccupancy' }
        }
      }
    ]);
    
    // Examination statistics
    const totalExaminations = await Examination.countDocuments();
    const totalExamResults = await ExamResult.countDocuments();
    const publishedResults = await ExamResult.countDocuments({ resultStatus: 'Published' });
    const draftResults = await ExamResult.countDocuments({ resultStatus: 'Draft' });
    
    // Financial statistics
    const totalTransactions = await FinancialTransaction.countDocuments();
    const incomeTransactions = await FinancialTransaction.countDocuments({ transactionType: 'Income' });
    const expenseTransactions = await FinancialTransaction.countDocuments({ transactionType: 'Expense' });
    
    // Calculate financial totals
    const financialStats = await FinancialTransaction.aggregate([
      {
        $group: {
          _id: '$transactionType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Transcript statistics
    const totalTranscripts = await Transcript.countDocuments();
    const issuedTranscripts = await Transcript.countDocuments({ status: 'Issued' });
    const draftTranscripts = await Transcript.countDocuments({ status: 'Draft' });
    
    // Count live sessions from courses
    const courses = await Course.find({});
    let totalLiveSessions = 0;
    courses.forEach(course => {
      if (course.liveSessions && course.liveSessions.length > 0) {
        totalLiveSessions += course.liveSessions.length;
      }
    });

    res.json({
      // User statistics
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalAdmissionOfficers,
      totalFeeManagers,
      totalHostelManagers,
      totalExamControllers,
      totalAccountants,
      totalRegistrars,
      
      // Academic statistics
      totalClassrooms,
      totalCourses,
      totalLearningPaths,
      totalLiveSessions,
      
      // Admission statistics
      totalAdmissions,
      pendingAdmissions,
      approvedAdmissions,
      rejectedAdmissions,
      
      // Fee statistics
      totalFees,
      paidFees,
      pendingFees,
      overdueFees,
      feeAmounts: feeStats[0] || { totalAmount: 0, paidAmount: 0, pendingAmount: 0 },
      
      // Hostel statistics
      totalHostels,
      totalRooms,
      totalHostelAllocations,
      activeHostelAllocations,
      hostelOccupancy: hostelStats[0] || { totalCapacity: 0, currentOccupancy: 0 },
      
      // Examination statistics
      totalExaminations,
      totalExamResults,
      publishedResults,
      draftResults,
      
      // Financial statistics
      totalTransactions,
      incomeTransactions,
      expenseTransactions,
      financialBreakdown: financialStats,
      
      // Transcript statistics
      totalTranscripts,
      issuedTranscripts,
      draftTranscripts
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Restrict higher roles visibility for admin by default
    const higherRoles = ['admin', 'admission_officer', 'fee_manager', 'hostel_manager', 'exam_controller', 'accountant', 'registrar'];
    if (req.user.role === 'admin') {
      if (!role) {
        // When no explicit role filter, exclude higher roles
        query.role = { $nin: higherRoles };
      } else if (higherRoles.includes(role)) {
        // If admin tries to request a higher role explicitly, deny
        return res.status(403).json({ error: 'Not authorized to view requested role' });
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email');

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new instructor
router.post('/create-instructor', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create instructor
    const instructor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'instructor',
      createdBy: req.user.id,
      permissions: ['create_course', 'manage_classroom', 'view_students']
    });

    res.status(201).json({
      message: 'Instructor created successfully',
      instructor: {
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role,
        createdAt: instructor.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new admin
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      createdBy: req.user.id,
      permissions: ['all']
    });

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new student
router.post('/create-student', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      createdBy: req.user.id,
      permissions: ['view_courses', 'join_classroom', 'participate_sessions']
    });

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, isActive, permissions } = req.body;

    const updateData = { name, email, role, isActive, permissions };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (Restricted to admins and registrars)
router.delete('/users/:userId', require('../middleware/auth').auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'registrar', 'admission_officer', 'fee_manager', 'hostel_manager', 'exam_controller', 'accountant'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to delete users' });
    }
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all classrooms with instructor details
router.get('/classrooms', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, instructor, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (instructor) {
      query.instructor = instructor;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const classrooms = await Classroom.find(query)
      .populate('instructor', 'name email')
      .populate('students', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Classroom.countDocuments(query);

    res.json({
      classrooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new classroom
router.post('/classrooms', async (req, res) => {
  try {
    const { name, description, capacity, instructor } = req.body;
    
    const classroomData = {
      name,
      description,
      capacity: capacity || 30
    };
    
    if (instructor) {
      classroomData.instructor = instructor;
    }

    const classroom = await Classroom.create(classroomData);

    res.status(201).json({
      message: 'Classroom created successfully',
      classroom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update classroom
router.put('/classrooms/:classroomId', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { name, description, capacity } = req.body;

    const updateData = { name, description, capacity };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const classroom = await Classroom.findByIdAndUpdate(
      classroomId,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'name email');

    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    res.json({
      message: 'Classroom updated successfully',
      classroom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete classroom
router.delete('/classrooms/:classroomId', async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    const classroom = await Classroom.findByIdAndDelete(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    res.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign instructor to classroom
router.put('/classrooms/:classroomId/assign-instructor', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { instructorId } = req.body;

    // Verify instructor exists and has instructor role
    const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
    if (!instructor) {
      return res.status(400).json({ error: 'Invalid instructor ID' });
    }

    const classroom = await Classroom.findByIdAndUpdate(
      classroomId,
      { instructor: instructorId },
      { new: true }
    ).populate('instructor', 'name email');

    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    res.json({
      message: 'Instructor assigned successfully',
      classroom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add student to classroom
router.post('/classrooms/:classroomId/add-student', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { studentId } = req.body;

    // Verify student exists and has student role
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Check if student is already in the classroom
    if (classroom.students && classroom.students.includes(studentId)) {
      return res.status(400).json({ error: 'Student is already in this classroom' });
    }

    // Add student to classroom
    if (!classroom.students) {
      classroom.students = [];
    }
    classroom.students.push(studentId);
    await classroom.save();

    const updatedClassroom = await Classroom.findById(classroomId)
      .populate('instructor', 'name email')
      .populate('students', 'name email');

    res.json({
      message: 'Student added to classroom successfully',
      classroom: updatedClassroom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove student from classroom
router.delete('/classrooms/:classroomId/remove-student/:studentId', async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Remove student from classroom
    if (classroom.students) {
      classroom.students = classroom.students.filter(id => id.toString() !== studentId);
      await classroom.save();
    }

    const updatedClassroom = await Classroom.findById(classroomId)
      .populate('instructor', 'name email')
      .populate('students', 'name email');

    res.json({
      message: 'Student removed from classroom successfully',
      classroom: updatedClassroom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get classroom details with students and instructor
router.get('/classrooms/:classroomId', async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId)
      .populate('instructor', 'name email')
      .populate('students', 'name email');

    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    res.json({ classroom });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove instructor from classroom
router.delete('/classrooms/:classroomId/remove-instructor', async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findByIdAndUpdate(
      classroomId,
      { $unset: { instructor: 1 } },
      { new: true }
    ).populate('instructor', 'name email')
     .populate('students', 'name email');

    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    res.json({
      message: 'Instructor removed from classroom successfully',
      classroom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .populate('classroom', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new course
router.post('/courses', async (req, res) => {
  try {
    const { title, description, instructor, classroom, duration, difficulty } = req.body;
    
    const courseData = {
      title,
      description,
      duration: duration || 60,
      difficulty: difficulty || 'beginner'
    };
    
    if (instructor) {
      courseData.instructor = instructor;
    }
    
    if (classroom) {
      courseData.classroom = classroom;
    }

    const course = await Course.create(courseData);

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name email')
      .populate('classroom', 'name');

    res.status(201).json({
      message: 'Course created successfully',
      course: populatedCourse
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course
router.put('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, instructor, classroom, duration, difficulty } = req.body;

    const updateData = { title, description, instructor, classroom, duration, difficulty };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const course = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'name email')
     .populate('classroom', 'name');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete course
router.delete('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all live sessions from courses
router.get('/live-sessions', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Get all courses with live sessions
    const courses = await Course.find({})
      .populate('instructor', 'name email')
      .populate('classroom', 'name');
    
    let allSessions = [];
    
    courses.forEach(course => {
      if (course.liveSessions && course.liveSessions.length > 0) {
        course.liveSessions.forEach(session => {
          const sessionData = {
            ...session.toObject(),
            courseId: { _id: course._id, name: course.name },
            classroom: course.classroom,
            instructor: course.instructor
          };
          
          // Apply search filter if provided
          if (search) {
            const searchRegex = new RegExp(search, 'i');
            if (sessionData.title && searchRegex.test(sessionData.title)) {
              allSessions.push(sessionData);
            } else if (sessionData.description && searchRegex.test(sessionData.description)) {
              allSessions.push(sessionData);
            }
          } else {
            allSessions.push(sessionData);
          }
        });
      }
    });
    
    // Sort sessions
    allSessions.sort((a, b) => {
      const aValue = a[sortBy] || a.createdAt;
      const bValue = b[sortBy] || b.createdAt;
      return sortOrder === 'desc' ? new Date(bValue) - new Date(aValue) : new Date(aValue) - new Date(bValue);
    });
    
    // Apply pagination
    const total = allSessions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = allSessions.slice(startIndex, endIndex);

    res.json({
      liveSessions: paginatedSessions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new live session
router.post('/live-sessions', async (req, res) => {
  try {
    const { title, description, instructor, classroom, scheduledDate, duration, maxParticipants } = req.body;
    
    const sessionData = {
      title,
      description,
      scheduledDate: scheduledDate || new Date(),
      duration: duration || 60,
      maxParticipants: maxParticipants || 50
    };
    
    if (instructor) {
      sessionData.instructor = instructor;
    }
    
    if (classroom) {
      sessionData.classroom = classroom;
    }

    const liveSession = await LiveSession.create(sessionData);

    const populatedSession = await LiveSession.findById(liveSession._id)
      .populate('instructor', 'name email')
      .populate('classroom', 'name');

    res.status(201).json({
      message: 'Live session created successfully',
      liveSession: populatedSession
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update live session
router.put('/live-sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, description, instructor, classroom, scheduledDate, duration, maxParticipants } = req.body;

    const updateData = { title, description, instructor, classroom, scheduledDate, duration, maxParticipants };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const liveSession = await LiveSession.findByIdAndUpdate(
      sessionId,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'name email')
     .populate('classroom', 'name');

    if (!liveSession) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    res.json({
      message: 'Live session updated successfully',
      liveSession
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete live session
router.delete('/live-sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const liveSession = await LiveSession.findByIdAndDelete(sessionId);
    if (!liveSession) {
      return res.status(404).json({ error: 'Live session not found' });
    }

    res.json({ message: 'Live session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all learning paths
router.get('/learning-paths', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const learningPaths = await LearningPath.find(query)
      .populate('instructor', 'name email')
      .populate('classroom', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LearningPath.countDocuments(query);

    res.json({
      learningPaths,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new learning path
router.post('/learning-paths', async (req, res) => {
  try {
    const { title, description, instructor, classroom, steps, estimatedDuration } = req.body;
    
    const pathData = {
      title,
      description,
      steps: steps || [],
      estimatedDuration: estimatedDuration || 120
    };
    
    if (instructor) {
      pathData.instructor = instructor;
    }
    
    if (classroom) {
      pathData.classroom = classroom;
    }

    const learningPath = await LearningPath.create(pathData);

    const populatedPath = await LearningPath.findById(learningPath._id)
      .populate('instructor', 'name email')
      .populate('classroom', 'name');

    res.status(201).json({
      message: 'Learning path created successfully',
      learningPath: populatedPath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update learning path
router.put('/learning-paths/:pathId', async (req, res) => {
  try {
    const { pathId } = req.params;
    const { title, description, instructor, classroom, steps, estimatedDuration } = req.body;

    const updateData = { title, description, instructor, classroom, steps, estimatedDuration };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const learningPath = await LearningPath.findByIdAndUpdate(
      pathId,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'name email')
     .populate('classroom', 'name');

    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    res.json({
      message: 'Learning path updated successfully',
      learningPath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete learning path
router.delete('/learning-paths/:pathId', async (req, res) => {
  try {
    const { pathId } = req.params;
    
    const learningPath = await LearningPath.findByIdAndDelete(pathId);
    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    res.json({ message: 'Learning path deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERP MANAGEMENT ROUTES ====================

// Create ERP staff (Admission Officer, Fee Manager, etc.)
router.post('/create-erp-staff', async (req, res) => {
  try {
    const { name, email, password, role, department, designation, employeeId } = req.body;
    
    // Validate role
    const validRoles = ['admission_officer', 'fee_manager', 'hostel_manager', 'exam_controller', 'accountant', 'registrar'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role for ERP staff' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create ERP staff
    const erpStaff = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      designation,
      employeeId,
      createdBy: req.user.id,
      accessLevel: 'intermediate',
      permissions: getRolePermissions(role)
    });

    res.status(201).json({
      message: 'ERP staff created successfully',
      staff: {
        _id: erpStaff._id,
        name: erpStaff.name,
        email: erpStaff.email,
        role: erpStaff.role,
        department: erpStaff.department,
        designation: erpStaff.designation,
        employeeId: erpStaff.employeeId,
        createdAt: erpStaff.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign multiple instructors to classroom
router.post('/classrooms/:classroomId/assign-instructors', async (req, res) => {
  try {
    const { classroomId } = req.params;
    const { instructors } = req.body; // Array of { instructorId, instructorName, role }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    // Validate instructors
    for (const instructor of instructors) {
      const user = await User.findOne({ _id: instructor.instructorId, role: 'instructor' });
      if (!user) {
        return res.status(400).json({ error: `Invalid instructor ID: ${instructor.instructorId}` });
      }
    }

    // Update classroom with multiple instructors
    classroom.instructors = instructors.map(instructor => ({
      instructorId: instructor.instructorId,
      instructorName: instructor.instructorName,
      role: instructor.role || 'Secondary',
      assignedAt: new Date(),
      isActive: true
    }));

    await classroom.save();

    const updatedClassroom = await Classroom.findById(classroomId)
      .populate('instructor', 'name email')
      .populate('instructors.instructorId', 'name email')
      .populate('students', 'name email');

    res.json({
      message: 'Instructors assigned successfully',
      classroom: updatedClassroom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get exam paper assignments for admin review
router.get('/exam-paper-assignments', async (req, res) => {
  try {
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
    res.status(500).json({ error: error.message });
  }
});

// Assign exam papers to instructors
router.post('/exam-paper-assignments/:assignmentId/assign', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { instructorIds, dueDate, instructions } = req.body;

    const assignment = await ExamPaperAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Validate instructors
    for (const instructorId of instructorIds) {
      const instructor = await User.findOne({ _id: instructorId, role: 'instructor' });
      if (!instructor) {
        return res.status(400).json({ error: `Invalid instructor ID: ${instructorId}` });
      }
    }

    // Update assignment
    assignment.assignedTo = instructorIds.map(instructorId => {
      const instructor = instructorIds.find(id => id === instructorId);
      return {
        instructorId,
        instructorName: instructor.name || 'Unknown',
        assignedAt: new Date(),
        status: 'Assigned'
      };
    });

    assignment.dueDate = dueDate;
    assignment.instructions = instructions;
    assignment.status = 'Assigned';
    assignment.assignedDate = new Date();

    await assignment.save();

    res.json({
      message: 'Exam papers assigned successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Collect evaluated papers from instructors
router.post('/exam-paper-assignments/:assignmentId/collect', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { notes } = req.body;

    const assignment = await ExamPaperAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Update assignment status
    assignment.status = 'Completed';
    assignment.completedDate = new Date();
    assignment.reviewNotes = notes;

    await assignment.save();

    res.json({
      message: 'Evaluated papers collected successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forward papers to exam controller
router.post('/exam-paper-assignments/:assignmentId/forward', async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { notes } = req.body;

    const assignment = await ExamPaperAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Update assignment status
    assignment.status = 'Returned';
    assignment.returnedDate = new Date();
    assignment.reviewNotes = notes;

    await assignment.save();

    res.json({
      message: 'Papers forwarded to exam controller successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get financial overview
router.get('/financial-overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get financial summary
    const financialSummary = await FinancialTransaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$transactionType',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent transactions
    const recentTransactions = await FinancialTransaction.find(dateFilter)
      .populate('createdBy', 'name email')
      .sort({ transactionDate: -1 })
      .limit(10);

    // Get fee collection summary
    const feeSummary = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalFees: { $sum: '$totalAmount' },
          collectedFees: { $sum: '$paidAmount' },
          pendingFees: { $sum: '$pendingAmount' }
        }
      }
    ]);

    res.json({
      financialSummary,
      recentTransactions,
      feeSummary: feeSummary[0] || { totalFees: 0, collectedFees: 0, pendingFees: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admission overview
router.get('/admission-overview', async (req, res) => {
  try {
    const { academicYear, course, status } = req.query;
    
    let query = {};
    if (academicYear) query.academicYear = academicYear;
    if (course) query.course = course;
    if (status) query.admissionStatus = status;

    // Get admission statistics
    const admissionStats = await Admission.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$admissionStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent admissions
    const recentAdmissions = await Admission.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get course-wise statistics
    const courseStats = await Admission.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      admissionStats,
      recentAdmissions,
      courseStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hostel overview
router.get('/hostel-overview', async (req, res) => {
  try {
    // Get hostel statistics
    const hostelStats = await Hostel.aggregate([
      {
        $group: {
          _id: null,
          totalHostels: { $sum: 1 },
          totalCapacity: { $sum: '$totalCapacity' },
          currentOccupancy: { $sum: '$currentOccupancy' }
        }
      }
    ]);

    // Get room statistics
    const roomStats = await Room.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get allocation statistics
    const allocationStats = await HostelAllocation.aggregate([
      {
        $group: {
          _id: '$allocationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent allocations
    const recentAllocations = await HostelAllocation.find()
      .populate('hostelId', 'name type')
      .populate('admissionId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      hostelStats: hostelStats[0] || { totalHostels: 0, totalCapacity: 0, currentOccupancy: 0 },
      roomStats,
      allocationStats,
      recentAllocations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System health check
router.get('/system-health', async (req, res) => {
  try {
    const dbStatus = 'connected'; // You can add actual DB connection check here
    const serverUptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'healthy',
      database: dbStatus,
      serverUptime: Math.floor(serverUptime),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get role permissions
function getRolePermissions(role) {
  const permissions = {
    admission_officer: ['view_admissions', 'create_admissions', 'update_admissions', 'approve_admissions'],
    fee_manager: ['view_fees', 'create_fees', 'update_fees', 'process_payments', 'generate_receipts'],
    hostel_manager: ['view_hostels', 'manage_hostels', 'allocate_rooms', 'manage_allocations'],
    exam_controller: ['view_exams', 'create_exams', 'manage_papers', 'publish_results'],
    accountant: ['view_financials', 'create_transactions', 'generate_reports', 'manage_accounts'],
    registrar: ['view_transcripts', 'create_transcripts', 'issue_certificates', 'manage_records']
  };
  
  return permissions[role] || [];
}

// ==================== INSTRUCTOR ASSIGNMENT ====================

// Assign instructor to classroom
router.post('/assign-instructor-to-classroom', async (req, res) => {
  try {
    const { classroomId, instructorId, role = 'Secondary' } = req.body;

    // Validate inputs
    if (!classroomId || !instructorId) {
      return res.status(400).json({ message: 'Classroom ID and Instructor ID are required' });
    }

    // Check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if instructor exists and has instructor role
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({ message: 'Instructor not found or invalid role' });
    }

    // Check if instructor is already assigned to this classroom
    const existingAssignment = classroom.instructors.find(
      inst => inst.instructorId.toString() === instructorId
    );

    if (existingAssignment) {
      return res.status(400).json({ message: 'Instructor is already assigned to this classroom' });
    }

    // Add instructor to classroom
    classroom.instructors.push({
      instructorId,
      instructorName: instructor.name,
      role,
      assignedAt: new Date(),
      isActive: true
    });

    await classroom.save();

    res.json({
      message: 'Instructor assigned to classroom successfully',
      classroom: {
        id: classroom._id,
        name: classroom.name,
        instructor: {
          id: instructor._id,
          name: instructor.name,
          role
        }
      }
    });
  } catch (error) {
    console.error('Error assigning instructor to classroom:', error);
    res.status(500).json({ message: 'Error assigning instructor to classroom', error: error.message });
  }
});

// Remove instructor from classroom
router.delete('/remove-instructor-from-classroom', async (req, res) => {
  try {
    const { classroomId, instructorId } = req.body;

    if (!classroomId || !instructorId) {
      return res.status(400).json({ message: 'Classroom ID and Instructor ID are required' });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Remove instructor from classroom
    classroom.instructors = classroom.instructors.filter(
      inst => inst.instructorId.toString() !== instructorId
    );

    await classroom.save();

    res.json({ message: 'Instructor removed from classroom successfully' });
  } catch (error) {
    console.error('Error removing instructor from classroom:', error);
    res.status(500).json({ message: 'Error removing instructor from classroom', error: error.message });
  }
});

// Get classrooms with assigned instructors
router.get('/classrooms-with-instructors', async (req, res) => {
  try {
    const classrooms = await Classroom.find()
      .populate('instructors.instructorId', 'name email')
      .select('name description course instructors')
      .sort({ name: 1 });

    res.json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms with instructors:', error);
    res.status(500).json({ message: 'Error fetching classrooms with instructors', error: error.message });
  }
});

// Get instructors not assigned to a specific classroom
router.get('/available-instructors/:classroomId', async (req, res) => {
  try {
    const { classroomId } = req.params;

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Get all instructors
    const allInstructors = await User.find({ role: 'instructor' }).select('name email');

    // Get assigned instructor IDs
    const assignedInstructorIds = classroom.instructors.map(inst => inst.instructorId.toString());

    // Filter out already assigned instructors
    const availableInstructors = allInstructors.filter(
      instructor => !assignedInstructorIds.includes(instructor._id.toString())
    );

    res.json(availableInstructors);
  } catch (error) {
    console.error('Error fetching available instructors:', error);
    res.status(500).json({ message: 'Error fetching available instructors', error: error.message });
  }
});

module.exports = router;
