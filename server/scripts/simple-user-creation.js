const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const createUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-learning-dashboard');
    console.log('Connected to MongoDB');

    // Clear existing users first
    await User.deleteMany({ email: { $in: [
      'admin@college.edu',
      'admission@college.edu',
      'fees@college.edu',
      'hostel@college.edu',
      'exam@college.edu',
      'accountant@college.edu',
      'registrar@college.edu',
      'instructor@college.edu',
      'student@college.edu'
    ]}});
    console.log('Cleared existing ERP users');

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

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword,
        createdAt: new Date()
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n🎉 All ERP users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('=====================================');
    users.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

createUsers();
