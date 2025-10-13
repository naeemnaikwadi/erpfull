const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
  // Student Information
  studentId: {
    type: String,
    required: true
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission',
    required: true
  },
  
  // Examination Information
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examination',
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
  subject: {
    type: String,
    required: true
  },
  subjectCode: String,
  
  // Result Details
  marksObtained: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail', 'Absent', 'Detained', 'Reappear'],
    required: true
  },
  
  // Additional Information
  attendance: {
    type: Number,
    min: 0,
    max: 100
  },
  internalMarks: {
    type: Number,
    default: 0
  },
  externalMarks: {
    type: Number,
    default: 0
  },
  practicalMarks: {
    type: Number,
    default: 0
  },
  
  // Answer Sheet Information
  answerSheet: {
    fileName: String,
    filePath: String,
    uploadedAt: Date
  },
  
  // Remarks and Notes
  remarks: String,
  examinerNotes: String,
  
  // Status and Control
  resultStatus: {
    type: String,
    enum: ['Draft', 'Published', 'Under Review', 'Rejected'],
    default: 'Draft'
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
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: Date
}, { timestamps: true });

// Calculate percentage and grade before saving
examResultSchema.pre('save', function(next) {
  this.percentage = (this.marksObtained / this.totalMarks) * 100;
  
  // Grade calculation based on percentage
  if (this.percentage >= 90) this.grade = 'A+';
  else if (this.percentage >= 80) this.grade = 'A';
  else if (this.percentage >= 70) this.grade = 'B+';
  else if (this.percentage >= 60) this.grade = 'B';
  else if (this.percentage >= 50) this.grade = 'C+';
  else if (this.percentage >= 40) this.grade = 'C';
  else if (this.percentage >= 30) this.grade = 'D';
  else this.grade = 'F';
  
  // Status calculation
  if (this.marksObtained === 0) this.status = 'Absent';
  else if (this.percentage >= 40) this.status = 'Pass';
  else this.status = 'Fail';
  
  next();
});

module.exports = mongoose.models.ExamResult || mongoose.model('ExamResult', examResultSchema);
