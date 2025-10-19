const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin', 'admission_officer', 'fee_manager', 'hostel_manager', 'exam_controller', 'accountant', 'registrar', 'librarian'],
    required: true
  },
  // Additional fields for admin management
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLogin: {
    type: Date
  },
  permissions: [{
    type: String
  }],
  // ERP specific fields
  department: {
    type: String,
    default: 'Library'
  },
  designation: {
    type: String,
    default: 'Librarian'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  accessLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'super_admin'],
    default: 'advanced'
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createLibrarianUser() {
  try {
    // Check if librarian already exists
    const existingLibrarian = await User.findOne({ email: 'librarian@college.edu' });
    if (existingLibrarian) {
      console.log('❌ Librarian user already exists');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('librarian123', saltRounds);

    // Create librarian user
    const librarian = new User({
      name: 'Library Manager',
      email: 'librarian@college.edu',
      password: hashedPassword,
      role: 'librarian',
      department: 'Library',
      designation: 'Librarian',
      employeeId: 'LIB001',
      accessLevel: 'advanced',
      isActive: true
    });

    await librarian.save();
    console.log('✅ Librarian user created successfully');
    console.log('📧 Email: librarian@college.edu');
    console.log('🔑 Password: librarian123');
    console.log('👤 Role: librarian');
    console.log('🏢 Department: Library');
    console.log('📋 Designation: Librarian');
    console.log('🆔 Employee ID: LIB001');

  } catch (error) {
    console.error('❌ Error creating librarian user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createLibrarianUser();
