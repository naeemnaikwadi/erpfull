const mongoose = require('mongoose');

const studentGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Admission officer or admin who owns/manages this group
  ownerRole: {
    type: String,
    enum: ['admission_officer', 'admin'],
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // Optional department admin assignment
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAdminName: String,
  // Optional classroom assignments
  assignedClassrooms: [{
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
    classroomName: String,
    assignedAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

studentGroupSchema.index({ name: 1, createdBy: 1 }, { unique: false });

module.exports = mongoose.model('StudentGroup', studentGroupSchema);


