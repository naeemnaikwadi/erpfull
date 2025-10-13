const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
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
  
  // Academic Information
  course: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  
  // Transcript Details
  transcriptNumber: {
    type: String,
    unique: true,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Draft', 'Issued', 'Verified', 'Rejected'],
    default: 'Draft'
  },
  
  // Academic Performance
  totalCredits: {
    type: Number,
    default: 0
  },
  earnedCredits: {
    type: Number,
    default: 0
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  sgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  
  // Subject-wise Results
  subjects: [{
    subjectCode: String,
    subjectName: String,
    credits: Number,
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'S', 'U', 'I', 'W']
    },
    marks: Number,
    maxMarks: Number,
    semester: Number,
    academicYear: String,
    status: {
      type: String,
      enum: ['Pass', 'Fail', 'Absent', 'Detained', 'Reappear'],
      default: 'Pass'
    }
  }],
  
  // Overall Performance
  overallGrade: {
    type: String,
    enum: ['Distinction', 'First Class', 'Second Class', 'Pass', 'Fail']
  },
  rank: Number,
  totalStudents: Number,
  
  // Additional Information
  achievements: [{
    title: String,
    description: String,
    date: Date,
    issuedBy: String
  }],
  extracurricularActivities: [{
    activity: String,
    position: String,
    duration: String,
    description: String
  }],
  
  // Verification Information
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // Digital Signature and Security
  digitalSignature: String,
  qrCode: String,
  isVerified: {
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

// Calculate CGPA before saving
transcriptSchema.pre('save', function(next) {
  if (this.subjects.length > 0) {
    const totalCredits = this.subjects.reduce((sum, subject) => sum + (subject.credits || 0), 0);
    const earnedCredits = this.subjects.reduce((sum, subject) => {
      if (subject.grade && !['F', 'U', 'I', 'W'].includes(subject.grade)) {
        return sum + (subject.credits || 0);
      }
      return sum;
    }, 0);
    
    this.totalCredits = totalCredits;
    this.earnedCredits = earnedCredits;
    
    // Calculate CGPA (simplified calculation)
    if (totalCredits > 0) {
      const gradePoints = this.subjects.reduce((sum, subject) => {
        const gradePointMap = {
          'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0, 'U': 0, 'I': 0, 'W': 0
        };
        return sum + ((gradePointMap[subject.grade] || 0) * (subject.credits || 0));
      }, 0);
      
      this.cgpa = Math.round((gradePoints / totalCredits) * 100) / 100;
    }
  }
  next();
});

// Index for efficient queries
transcriptSchema.index({ studentId: 1 });
transcriptSchema.index({ transcriptNumber: 1 });
transcriptSchema.index({ status: 1 });

module.exports = mongoose.models.Transcript || mongoose.model('Transcript', transcriptSchema);
