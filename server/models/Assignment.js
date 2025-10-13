const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  cloudinaryId: {
    type: String
  },
  cloudinaryUrl: {
    type: String
  },
  isGraded: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    min: 0,
    max: 10
  },
  maxScore: {
    type: Number,
    default: 10
  },
  feedback: {
    type: String
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late'],
    default: 'submitted'
  }
});

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Admin upload assignment pattern
  assignmentPattern: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    cloudinaryId: String,
    cloudinaryUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxScore: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  instructions: {
    type: String,
    trim: true
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  submissions: [AssignmentSubmissionSchema],
  totalSubmissions: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update timestamps and calculate stats
AssignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total submissions and average score
  if (this.submissions && this.submissions.length > 0) {
    this.totalSubmissions = this.submissions.length;
    const gradedSubmissions = this.submissions.filter(sub => sub.isGraded);
    if (gradedSubmissions.length > 0) {
      const totalScore = gradedSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      this.averageScore = Math.round((totalScore / gradedSubmissions.length) * 100) / 100;
    }
  }
  
  next();
});

// Index for efficient querying
AssignmentSchema.index({ courseId: 1, isActive: 1 });
AssignmentSchema.index({ classroomId: 1, isActive: 1 });
AssignmentSchema.index({ instructorId: 1, isActive: 1 });
AssignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);


