const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  // Examination Information
  examId: {
    type: String,
    unique: true,
    required: true
  },
  examName: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    enum: ['ISE1', 'MSE', 'ISE2', 'ESE', 'Midterm', 'Final', 'Quiz', 'Assignment', 'Practical', 'Viva', 'Project'],
    required: true
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
  
  // Subject Information
  subject: {
    type: String,
    required: true
  },
  subjectCode: String,
  credits: {
    type: Number,
    default: 0
  },
  
  // Schedule Information
  examDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  
  // Venue Information
  venue: {
    type: String,
    required: true
  },
  roomNumber: String,
  seatingCapacity: Number,
  
  // Examination Details
  totalMarks: {
    type: Number,
    required: true
  },
  passingMarks: {
    type: Number,
    required: true
  },
  questionPaper: {
    fileName: String,
    filePath: String,
    uploadedAt: Date
  },
  answerKey: {
    fileName: String,
    filePath: String,
    uploadedAt: Date
  },
  
  // Status and Control
  examStatus: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invigilators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.models.Examination || mongoose.model('Examination', examinationSchema);
