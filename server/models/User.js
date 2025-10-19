const mongoose = require('mongoose');

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
  // Student specific fields
  prn: {
    type: String,
    unique: true,
    sparse: true
  },
  dateOfBirth: Date,
  mobileNo: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  admissionYear: String,
  class: String,
  division: String,
  course: String,
  branch: String,
  semester: Number,
  academicYear: String,
  // Profile photo for students
  profilePhoto: {
    fileName: String,
    filePath: String,
    cloudinaryId: String,
    cloudinaryUrl: String
  },
  avatarUrl: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
  collegeName: {
    type: String,
    default: ''
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
    default: ''
  },
  designation: {
    type: String,
    default: ''
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  accessLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'super_admin'],
    default: 'basic'
  }
}, { timestamps: true });

// Compound index for fast student queries by branch and academicYear
userSchema.index({ role: 1, branch: 1, academicYear: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
