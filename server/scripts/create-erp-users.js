const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const createERPUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-learning-dashboard');
    console.log('Connected to MongoDB');

    // ERP Staff credentials
    const erpUsers = [
      {
        firstName: 'Admission',
        lastName: 'Officer',
        email: 'admission@college.edu',
        password: 'admission123',
        role: 'admission_officer',
        department: 'Admissions',
        designation: 'Admission Officer',
        employeeId: 'ADM001',
        accessLevel: 'admissions'
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
        accessLevel: 'fees'
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
        accessLevel: 'hostels'
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
        accessLevel: 'examinations'
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
        accessLevel: 'finance'
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
        accessLevel: 'administration'
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
        accessLevel: 'teaching'
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
        accessLevel: 'student'
      }
    ];

    // Create users
    for (const userData of erpUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating...`);
        // Update existing user
        existingUser.role = userData.role;
        existingUser.department = userData.department;
        existingUser.designation = userData.designation;
        existingUser.employeeId = userData.employeeId;
        existingUser.accessLevel = userData.accessLevel;
        await existingUser.save();
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          ...userData,
          password: hashedPassword,
          isActive: true,
          createdAt: new Date()
        });
        
        await user.save();
        console.log(`Created user: ${userData.email} (${userData.role})`);
      }
    }

    console.log('\n✅ ERP Users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('=====================================');
    erpUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error creating ERP users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createERPUsers();
