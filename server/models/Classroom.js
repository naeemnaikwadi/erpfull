const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  // Primary instructor (for backward compatibility)
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  // Multiple instructors support
  instructors: [{
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    instructorName: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['Primary', 'Secondary', 'Assistant', 'Guest'],
      default: 'Secondary'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  entryCode: {
    type: String,
    required: true,
    unique: true
  },
  students: [{
     type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Classroom', classroomSchema); 