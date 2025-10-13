const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  // Personal Information
  studentId: {
    type: String,
    unique: true,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  
  // Academic Information
  course: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  previousQualification: {
    institution: String,
    qualification: String,
    percentage: Number,
    yearOfPassing: Number
  },
  
  // Admission Details
  admissionDate: {
    type: Date,
    default: Date.now
  },
  admissionStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Under Review'],
    default: 'Pending'
  },
  admissionType: {
    type: String,
    enum: ['Regular', 'Lateral', 'Direct'],
    default: 'Regular'
  },
  
  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Marksheet', 'Certificate', 'Photo', 'ID Proof', 'Address Proof', 'Other']
    },
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Guardian Information
  guardian: {
    name: String,
    relationship: String,
    phone: String,
    email: String,
    occupation: String
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Admission || mongoose.model('Admission', admissionSchema);
