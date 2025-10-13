const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role, collegeName } = req.body;
  
  try {
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashed, 
      role,
      collegeName: collegeName || ''
    });
    
    res.json({ 
      message: 'User registered successfully', 
      user: { 
        _id: user._id,
        name: user.name, 
        email: user.email, 
        role: user.role,
        collegeName: user.collegeName
      } 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ message: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: 'Invalid credentials' });

  // Enrich JWT so student self-service routes can resolve PRN and academic context
  const token = jwt.sign({
    id: user._id,
    role: user.role,
    // Include these for student portal lookups
    prn: user.prn || undefined,
    email: user.email,
    course: user.course || undefined,
    branch: user.branch || undefined,
    semester: user.semester || undefined,
    academicYear: user.academicYear || undefined
  }, process.env.JWT_SECRET);

  // ✅ FIX: Add `_id` to the response
  res.json({
    token,
    user: {
      _id: user._id,            // <-- this line is required
      name: user.name,
      email: user.email,
      role: user.role,
      prn: user.prn,
      course: user.course,
      branch: user.branch,
      semester: user.semester,
      academicYear: user.academicYear,
      avatarUrl: user.avatarUrl,
      collegeName: user.collegeName
    }
  });
});

// Verify token endpoint
router.get('/verify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user, valid: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', valid: false });
  }
});

module.exports = router;