const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const StudentGroup = require('../models/StudentGroup');
const User = require('../models/User');
const Classroom = require('../models/Classroom');

// All routes require auth; admission_officer or admin can create/manage
router.use(auth);

const canManageGroups = (role) => ['admission_officer', 'admin'].includes(role);

// Create a student group
router.post('/', async (req, res) => {
  try {
    if (!canManageGroups(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create groups' });
    }

    const { name, description, studentIds = [], tags = [] } = req.body;

    // Validate students
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Provide at least one student' });
    }
    const students = await User.find({ _id: { $in: studentIds }, role: 'student' });
    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: 'Some student IDs are invalid' });
    }

    const group = await StudentGroup.create({
      name,
      description,
      createdBy: req.user.id,
      ownerRole: req.user.role,
      students: studentIds,
      tags
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List groups (owned or all for admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const filter = {};
    if (req.user.role !== 'admin') {
      filter.createdBy = req.user.id;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const groups = await StudentGroup.find(filter)
      .populate('assignedAdmin', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StudentGroup.countDocuments(filter);

    res.json({ groups, total, currentPage: page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign group to a department admin
router.post('/:groupId/assign-admin', async (req, res) => {
  try {
    if (!canManageGroups(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { groupId } = req.params;
    const { adminId } = req.body;

    const admin = await User.findOne({ _id: adminId, role: 'admin' });
    if (!admin) return res.status(400).json({ message: 'Invalid admin ID' });

    const group = await StudentGroup.findByIdAndUpdate(
      groupId,
      { assignedAdmin: adminId, assignedAdminName: admin.name },
      { new: true }
    ).populate('assignedAdmin', 'name email');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    res.json({ message: 'Group assigned to admin', group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign group of students to a classroom
router.post('/:groupId/assign-classroom', async (req, res) => {
  try {
    if (!canManageGroups(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { groupId } = req.params;
    const { classroomId } = req.body;

    const group = await StudentGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    // Add students to classroom (avoid duplicates)
    const existingIds = new Set((classroom.students || []).map(id => id.toString()));
    const toAdd = group.students.filter(id => !existingIds.has(id.toString()));
    classroom.students = [...(classroom.students || []), ...toAdd];
    await classroom.save();

    // Track assignment on group
    group.assignedClassrooms = group.assignedClassrooms || [];
    group.assignedClassrooms.push({ classroomId, classroomName: classroom.name });
    await group.save();

    const updatedClassroom = await Classroom.findById(classroomId)
      .populate('instructor', 'name email')
      .populate('students', 'name email');

    res.json({ message: 'Group assigned to classroom', classroom: updatedClassroom, group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


