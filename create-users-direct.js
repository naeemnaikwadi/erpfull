// Direct user creation script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple user schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  department: String,
  designation: String,
  employeeId: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Try different connection strings
    const connectionStrings = [
      'mongodb://localhost:27017/smart-learning-dashboard',
      'mongodb://127.0.0.1:27017/smart-learning-dashboard',
      'mongodb://localhost:27017/smart-learning-dashboard?retryWrites=true&w=majority',
      'mongodb://localhost:27017/smart-learning-dashboard?authSource=admin'
    ];
    
    let connected = false;
    for (const connectionString of connectionStrings) {
      try {
        await mongoose.connect(connectionString);
        console.log('✅ Connected to MongoDB');
        connected = true;
        break;
      } catch (err) {
        console.log(`❌ Failed to connect with: ${connectionString}`);
      }
    }
    
    if (!connected) {
      throw new Error('Could not connect to MongoDB with any connection string');
    }

    // Clear existing ERP users
    console.log('🧹 Clearing existing ERP users...');
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
    console.log('✅ Cleared existing users');

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

    console.log('👥 Creating ERP users...');
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`✅ Created: ${userData.email} (${userData.role})`);
    }

    console.log('\n🎉 SUCCESS! All ERP users created!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('=====================================');
    users.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });

    // Verify users were created
    const userCount = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${userCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

createUsers();
