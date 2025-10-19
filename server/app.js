const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

require('dotenv').config();
const app = express();

// Middleware
app.use(cors());

// Request logger middleware for debugging
app.use((req, res, next) => {
  console.log('🔍 Incoming request:', {
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });
  next();
});

// Serve static uploaded files (for backward compatibility with existing files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to handle multipart form data properly - MUST come BEFORE body parsing
app.use((req, res, next) => {
  // Skip JSON parsing for multipart requests
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    console.log('🔍 Skipping JSON parsing for multipart request:', req.url);
    return next();
  }
  next();
});

// Body parsing middleware - only for non-multipart requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Test Cloudinary Connection
const testCloudinary = async () => {
  try {
    const CloudinaryService = require('./services/cloudinaryService');
    const isConnected = await CloudinaryService.testConnection();
    if (isConnected) {
      console.log('✅ Cloudinary connected');
    } else {
      console.log('❌ Cloudinary connection failed');
    }
  } catch (error) {
    console.log('❌ Cloudinary connection failed:', error.message);
  }
};

// Test Cloudinary after a short delay to ensure MongoDB is connected first
setTimeout(testCloudinary, 1000);

// Test Gemini Connectivity
const testGemini = async () => {
  try {
    const axios = require('axios');
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.log('❌ Gemini not configured (GEMINI_API_KEY missing)');
      return;
    }
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent';
    const payload = { contents: [{ role: 'user', parts: [{ text: 'ping' }] }] };
    const res = await axios.post(`${url}?key=${key}`, payload, { timeout: 30000 });
    if (res.status === 200) {
      console.log('✅ Gemini connected');
    } else {
      console.log('❌ Gemini connection failed:', res.status);
    }
  } catch (e) {
    console.log('❌ Gemini connection failed:', e?.response?.data || e.message);
  }
};

setTimeout(testGemini, 1500);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skill'));
app.use('/api/excel', require('./routes/excel'));
app.use('/api/learning-paths', require('./routes/learningPathRoutes')); // Learning Path route
app.use('/api/instructor', require('./routes/instructorRoutes'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/student', require('./routes/student')); // Student routes
app.use('/api/upload', require('./routes/fileUpload')); // File upload routes (Cloudinary)
app.use('/api/cloudinary',require('./routes/fileUpload'));
app.use('/api/doubts', require('./routes/doubts')); // Doubt routes
app.use('/api/notifications', require('./routes/notifications')); // Notification routes
app.use('/api/progress', require('./routes/progress')); // Progress routes
app.use('/api/live-sessions', require('./routes/liveSession')); // Live session routes
app.use('/api/quizzes', require('./routes/quizRoutes')); // Quiz routes
app.use('/api/course-quizzes', require('./routes/courseQuizzes')); // Course Quiz routes
app.use('/api/assignments', require('./routes/assignments')); // Assignment routes
app.use('/api/downloads', require('./routes/downloads')); // Downloads routes
app.use('/api/livekit', require('./routes/livekit')); // LiveKit routes
app.use('/api/admin', require('./routes/admin')); // Admin routes
app.use('/api/admin/communication', require('./routes/adminCommunication')); // Admin communication with students
app.use('/api/chat', require('./routes/chat')); // Chatbot routes
app.use('/api/library', require('./routes/library')); // Library routes
app.use('/api/attendance', require('./routes/attendance')); // Attendance routes

// ERP Routes
app.use('/api/erp/admissions', require('./routes/admissions')); // Admissions routes
app.use('/api/erp/fees', require('./routes/fees')); // Fee management routes
app.use('/api/erp/hostels', require('./routes/hostels')); // Hostel management routes
app.use('/api/erp/examinations', require('./routes/examinations')); // Examination routes
app.use('/api/erp/groups', require('./routes/groups')); // Student groups routes
app.use('/api/erp/import', require('./routes/import')); // Import routes
app.use('/api/setup', require('./routes/setup')); // Setup routes
app.use('/api', require('./routes/quick-setup')); // Quick setup routes

// Student Portal Routes
app.use('/api/student', require('./routes/studentPortal')); // Student self-service portal

// Accountant Routes
app.use('/api/accountant', require('./routes/accountant')); // Accountant financial management
app.use('/api/erp', require('./routes/accountant')); // ERP compatibility for accountant routes

// Registrar Routes
app.use('/api/registrar', require('./routes/registrar')); // Registrar transcript and certificate management
app.use('/api/profile', require('./routes/profile')); // Unified profile management
app.use('/api/forgot-password', require('./routes/forgotPassword')); // Forgot password functionality

// Library Routes
app.use('/api/library', require('./routes/library')); // Library management system

// Attendance Routes
app.use('/api/attendance', require('./routes/attendance')); // Attendance management system

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() });
});

// Global error handler for large payloads
app.use((err, req, res, next) => {
  // Ensure all error responses are JSON
  res.setHeader('Content-Type', 'application/json');
  
  console.log('🔍 Global error handler:', {
    errorType: err.constructor.name,
    errorMessage: err.message,
    status: err.status,
    type: err.type,
    url: req.url,
    method: req.method,
    contentType: req.headers['content-type']
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      error: 'File too large', 
      message: 'The uploaded file exceeds the maximum allowed size. Please use files under 10MB for Cloudinary free tier.',
      maxSize: '10MB'
    });
  }
  
  if (err.status === 413) {
    return res.status(413).json({ 
      error: 'Payload too large', 
      message: 'The uploaded file exceeds the maximum allowed size. Please use files under 10MB for Cloudinary free tier.',
      maxSize: '10MB'
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      error: 'Invalid JSON', 
      message: 'The request body contains invalid JSON or is not properly formatted.',
      details: err.message
    });
  }
  
  // Generic error response
  res.status(err.status || 500).json({ 
    error: 'Server error',
    message: err.message || 'An unexpected error occurred',
    type: err.constructor.name
  });
});

module.exports = app;
