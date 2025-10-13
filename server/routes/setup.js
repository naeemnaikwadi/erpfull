const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Create ERP users endpoint
router.post('/create-erp-users', async (req, res) => {
  try {
    // Clear existing ERP users
    await User.deleteMany({ 
      email: { 
        $in: [
          'admin@college.edu',
          'admission@college.edu',
          'fees@college.edu',
          'hostel@college.edu',
          'exam@college.edu',
          'accountant@college.edu',
          'registrar@college.edu',
          'instructor@college.edu',
          'student@college.edu'
        ]
      }
    });

    // Create users
    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@college.edu',
        password: 'admin123',
        role: 'admin',
        isActive: true
      },
      {
        firstName: 'Admission',
        lastName: 'Officer',
        email: 'admission@college.edu',
        password: 'admission123',
        role: 'admission_officer',
        department: 'Admissions',
        designation: 'Admission Officer',
        employeeId: 'ADM001',
        isActive: true
      },
      {
        firstName: 'Fee',
        lastName: 'Manager',
        email: 'fees@college.edu',
        password: 'fees123',
        role: 'fee_manager',
        department: 'Finance',
        designation: 'Fee Manager',
        employeeId: 'FEE001',
        isActive: true
      },
      {
        firstName: 'Hostel',
        lastName: 'Manager',
        email: 'hostel@college.edu',
        password: 'hostel123',
        role: 'hostel_manager',
        department: 'Hostel',
        designation: 'Hostel Manager',
        employeeId: 'HOS001',
        isActive: true
      },
      {
        firstName: 'Exam',
        lastName: 'Controller',
        email: 'exam@college.edu',
        password: 'exam123',
        role: 'exam_controller',
        department: 'Examinations',
        designation: 'Exam Controller',
        employeeId: 'EXM001',
        isActive: true
      },
      {
        firstName: 'College',
        lastName: 'Accountant',
        email: 'accountant@college.edu',
        password: 'account123',
        role: 'accountant',
        department: 'Finance',
        designation: 'Accountant',
        employeeId: 'ACC001',
        isActive: true
      },
      {
        firstName: 'College',
        lastName: 'Registrar',
        email: 'registrar@college.edu',
        password: 'registrar123',
        role: 'registrar',
        department: 'Administration',
        designation: 'Registrar',
        employeeId: 'REG001',
        isActive: true
      },
      {
        firstName: 'Test',
        lastName: 'Instructor',
        email: 'instructor@college.edu',
        password: 'instructor123',
        role: 'instructor',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        employeeId: 'INS001',
        isActive: true
      },
      {
        firstName: 'Test',
        lastName: 'Student',
        email: 'student@college.edu',
        password: 'student123',
        role: 'student',
        department: 'Computer Science',
        designation: 'Student',
        employeeId: 'STU001',
        isActive: true
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
        createdAt: new Date()
      });
      
      await user.save();
      createdUsers.push({
        email: userData.email,
        role: userData.role,
        password: userData.password
      });
    }

    res.json({
      message: 'ERP users created successfully',
      users: createdUsers,
      count: createdUsers.length
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating users: ' + error.message 
    });
  }
});

// Check if ERP users exist
router.get('/check-erp-users', async (req, res) => {
  try {
    const erpEmails = [
      'admin@college.edu',
      'admission@college.edu',
      'fees@college.edu',
      'hostel@college.edu',
      'exam@college.edu',
      'accountant@college.edu',
      'registrar@college.edu',
      'instructor@college.edu',
      'student@college.edu'
    ];

    const existingUsers = await User.find({ 
      email: { $in: erpEmails } 
    }).select('email role');

    res.json({
      message: 'ERP users check completed',
      existing: existingUsers,
      missing: erpEmails.filter(email => 
        !existingUsers.find(user => user.email === email)
      ),
      total: erpEmails.length,
      found: existingUsers.length
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error checking users: ' + error.message 
    });
  }
});

module.exports = router;
