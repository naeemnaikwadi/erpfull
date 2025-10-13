// backend/routes/liveSession.js
const express = require('express');
const router = express.Router();
const LiveSession = require('../models/LiveSession');
const { auth, instructorOnly, studentOnly } = require('../middleware/auth');
const Classroom = require('../models/Classroom');
const mongoose = require('mongoose');

// Get all live sessions for the user (based on role)
router.get('/', auth, async (req, res) => {
  try {
    let sessions = [];
    
    if (req.user.role === 'instructor') {
      // Instructors see all sessions from courses they created
      const Course = require('../models/Course');
      const instructorCourses = await Course.find({ instructor: req.user.id })
        .populate('instructor', 'name email')
        .populate('classroom', 'name');
      
      console.log(`Instructor ${req.user.id} found ${instructorCourses.length} courses`);
      
      // Extract live sessions from all instructor's courses
      instructorCourses.forEach(course => {
        if (course.liveSessions && course.liveSessions.length > 0) {
          course.liveSessions.forEach(session => {
            sessions.push({
              ...session.toObject(),
              courseId: { _id: course._id, name: course.name },
              classroom: course.classroom,
              instructor: course.instructor
            });
          });
        }
      });
      
      console.log(`Instructor ${req.user.id} found ${sessions.length} live sessions`);
    } else {
      // Students see sessions from courses in classrooms they're enrolled in
      const Course = require('../models/Course');
      const Classroom = require('../models/Classroom');
      
      // Get classrooms where student is enrolled
      const enrolledClassrooms = await Classroom.find({
        $or: [
          { students: req.user.id },
          { students: req.user._id }
        ]
      });
      
      console.log(`Student ${req.user.id} enrolled in ${enrolledClassrooms.length} classrooms`);
      
      const classroomIds = enrolledClassrooms.map(c => c._id);
      
      // Get courses from enrolled classrooms
      const enrolledCourses = await Course.find({
        classroom: { $in: classroomIds }
      }).populate('instructor', 'name email')
        .populate('classroom', 'name');
      
      console.log(`Student ${req.user.id} has access to ${enrolledCourses.length} courses`);
      
      // Extract live sessions from enrolled courses
      enrolledCourses.forEach(course => {
        if (course.liveSessions && course.liveSessions.length > 0) {
          course.liveSessions.forEach(session => {
            sessions.push({
              ...session.toObject(),
              courseId: { _id: course._id, name: course.name },
              classroom: course.classroom,
              instructor: course.instructor
            });
          });
        }
      });
      
      console.log(`Student ${req.user.id} can access ${sessions.length} live sessions`);
    }
    
    // Sort sessions by scheduledAt
    sessions.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    
    console.log(`Fetched ${sessions.length} sessions for user ${req.user.id} (${req.user.role})`);
    console.log('Sessions data:', JSON.stringify(sessions, null, 2));
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching live sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get live sessions for an instructor explicitly (for UI that calls this path)
router.get('/instructor/:instructorId', auth, instructorOnly, async (req, res) => {
  try {
    const { instructorId } = req.params;
    if (instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const Course = require('../models/Course');
    const instructorCourses = await Course.find({ instructor: instructorId })
      .populate('instructor', 'name email')
      .populate('classroom', 'name');
    
    let sessions = [];
    
    instructorCourses.forEach(course => {
      if (course.liveSessions && course.liveSessions.length > 0) {
        course.liveSessions.forEach(session => {
          sessions.push({
            ...session.toObject(),
            courseId: { _id: course._id, name: course.name },
            classroom: course.classroom,
            instructor: course.instructor
          });
        });
      }
    });
    
    sessions.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create session (Instructor)
router.post('/', auth, instructorOnly, async (req, res) => {
  try {
    const { title, description, scheduledAt, classroomId, courseId, duration = 60 } = req.body;
    if (!title || !scheduledAt || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const Course = require('../models/Course');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to add sessions to this course' });
    }

    // Generate room name for LiveKit
    const roomName = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const newSession = {
      title,
      description,
      scheduledAt,
      duration,
      roomName,
      status: 'scheduled',
      createdAt: new Date()
    };

    // Add session to course
    course.liveSessions.push(newSession);
    await course.save();

    // Return the created session with populated data
    const createdSession = course.liveSessions[course.liveSessions.length - 1];
    const responseSession = {
      ...createdSession.toObject(),
      courseId: { _id: course._id, name: course.name },
      classroom: course.classroom,
      instructor: course.instructor
    };

    res.status(201).json(responseSession);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get sessions for a specific classroom (for members of that classroom)
router.get('/classroom/:classroomId', auth, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if user is instructor or student in this classroom
    const isInstructor = classroom.instructor.toString() === req.user.id;
    const isStudent = classroom.students.some(studentId => studentId.toString() === req.user.id);

    if (!isInstructor && !isStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const Course = require('../models/Course');
    const classroomCourses = await Course.find({ classroom: classroomId })
      .populate('instructor', 'name email')
      .populate('classroom', 'name');
    
    let sessions = [];
    
    classroomCourses.forEach(course => {
      if (course.liveSessions && course.liveSessions.length > 0) {
        course.liveSessions.forEach(session => {
          sessions.push({
            ...session.toObject(),
            courseId: { _id: course._id, name: course.name },
            classroom: course.classroom,
            instructor: course.instructor
          });
        });
      }
    });
    
    sessions.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// I've added the following routes to complete the CRUD functionality for live sessions.

// @route   GET api/live-sessions/:id
// @desc    Get a single live session
// @access  Private (Classroom members only)
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate({
      path: 'classroom',
      select: 'instructor students'
    });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is instructor or student in this classroom
    const { classroom } = session;
    const isInstructor = classroom.instructor.toString() === req.user.id;
    const isStudent = classroom.students.some(studentId => studentId.toString() === req.user.id);

    if (!isInstructor && !isStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// @route   PUT api/live-sessions/:id
// @desc    Update a live session
// @access  Private (Instructor only)
router.put('/:id', auth, instructorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const Course = require('../models/Course');
    
    // Find the course that contains this session
    const course = await Course.findOne({
      'liveSessions._id': id
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized to update this session' });
    }

    // Update the specific session in the course
    const sessionIndex = course.liveSessions.findIndex(s => s._id.toString() === id);
    if (sessionIndex === -1) {
      return res.status(404).json({ error: 'Session not found in course' });
    }

    // Update session fields
    Object.assign(course.liveSessions[sessionIndex], req.body);
    await course.save();

    // Return updated session with populated data
    const updatedSession = {
      ...course.liveSessions[sessionIndex].toObject(),
      courseId: { _id: course._id, name: course.name },
      classroom: course.classroom,
      instructor: course.instructor
    };

    res.json(updatedSession);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/live-sessions/:id
// @desc    Delete a live session
// @access  Private (Instructor only)
router.delete('/:id', auth, instructorOnly, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized to delete this session' });
    }

    await LiveSession.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Test endpoint to check all live sessions (for debugging)
router.get('/debug/all', auth, async (req, res) => {
  try {
    const Course = require('../models/Course');
    const allCourses = await Course.find({})
      .populate('instructor', 'name email')
      .populate('classroom', 'name');
    
    let allSessions = [];
    
    allCourses.forEach(course => {
      if (course.liveSessions && course.liveSessions.length > 0) {
        course.liveSessions.forEach(session => {
          allSessions.push({
            ...session.toObject(),
            courseId: { _id: course._id, name: course.name },
            classroom: course.classroom,
            instructor: course.instructor
          });
        });
      }
    });
    
    console.log('All sessions in database:', allSessions.length);
    res.json({
      totalSessions: allSessions.length,
      sessions: allSessions,
      courses: allCourses.length,
      user: {
        id: req.user.id,
        role: req.user.role,
        name: req.user.name
      }
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: 'Debug failed' });
  }
});

module.exports = router;
