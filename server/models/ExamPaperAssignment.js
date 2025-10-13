const mongoose = require('mongoose');

const examPaperAssignmentSchema = new mongoose.Schema({
  // Examination Information
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examination',
    required: true
  },
  
  // Assignment Details
  assignmentId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Paper Information
  questionPaper: {
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedAt: Date,
    cloudinaryId: String,
    cloudinaryUrl: String
  },
  answerKey: {
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedAt: Date,
    cloudinaryId: String,
    cloudinaryUrl: String
  },
  
  // Assignment Flow
  status: {
    type: String,
    enum: ['Uploaded', 'Assigned', 'In Progress', 'Completed', 'Returned', 'Published'],
    default: 'Uploaded'
  },
  
  // Assignment Timeline
  assignedDate: Date,
  dueDate: Date,
  completedDate: Date,
  returnedDate: Date,
  
  // Assignment Details
  instructions: String,
  specialNotes: String,
  
  // Evaluator Information
  assignedTo: [{
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    instructorName: String,
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Assigned', 'In Progress', 'Completed', 'Returned'],
      default: 'Assigned'
    },
    completedAt: Date,
    notes: String
  }],
  
  // Evaluation Results
  evaluationResults: [{
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    evaluatedPapers: [{
      studentId: String,
      studentName: String,
      marksObtained: Number,
      totalMarks: Number,
      grade: String,
      evaluatedPaper: {
        fileName: String,
        filePath: String,
        cloudinaryId: String,
        cloudinaryUrl: String
      },
      evaluatedAt: Date,
      remarks: String
    }],
    submittedAt: Date,
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
      default: 'Draft'
    }
  }],
  
  // Quality Control
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  isApproved: {
    type: Boolean,
    default: false
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for efficient queries
examPaperAssignmentSchema.index({ examId: 1 });
examPaperAssignmentSchema.index({ status: 1 });
examPaperAssignmentSchema.index({ 'assignedTo.instructorId': 1 });

module.exports = mongoose.models.ExamPaperAssignment || mongoose.model('ExamPaperAssignment', examPaperAssignmentSchema);
