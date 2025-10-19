const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  classTime: {
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  },
  attendanceRecords: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: true
    },
    remarks: {
      type: String,
      trim: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalStudents: {
    type: Number,
    required: true
  },
  presentCount: {
    type: Number,
    default: 0
  },
  absentCount: {
    type: Number,
    default: 0
  },
  lateCount: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    default: 0
  },
  // Additional metadata
  semester: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: {
    type: Date
  }
}, { 
  timestamps: true 
});

// Compound indexes for efficient queries
attendanceSchema.index({ course: 1, date: 1 });
attendanceSchema.index({ instructor: 1, date: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ 'attendanceRecords.student': 1, course: 1 });

// Pre-save middleware to calculate statistics
attendanceSchema.pre('save', function(next) {
  if (this.attendanceRecords && this.attendanceRecords.length > 0) {
    this.presentCount = this.attendanceRecords.filter(record => record.status === 'Present').length;
    this.absentCount = this.attendanceRecords.filter(record => record.status === 'Absent').length;
    this.lateCount = this.attendanceRecords.filter(record => record.status === 'Late').length;
    
    if (this.totalStudents > 0) {
      this.attendancePercentage = Math.round(((this.presentCount + this.lateCount) / this.totalStudents) * 100);
    }
  }
  next();
});

// Virtual for attendance rate
attendanceSchema.virtual('attendanceRate').get(function() {
  if (this.totalStudents === 0) return 0;
  return Math.round(((this.presentCount + this.lateCount) / this.totalStudents) * 100);
});

// Method to get student attendance for a specific date
attendanceSchema.methods.getStudentAttendance = function(studentId) {
  const record = this.attendanceRecords.find(record => record.student.toString() === studentId.toString());
  return record ? record.status : 'Absent';
};

// Method to update student attendance
attendanceSchema.methods.updateStudentAttendance = function(studentId, status, remarks = '') {
  const recordIndex = this.attendanceRecords.findIndex(record => record.student.toString() === studentId.toString());
  
  if (recordIndex !== -1) {
    this.attendanceRecords[recordIndex].status = status;
    this.attendanceRecords[recordIndex].remarks = remarks;
    this.attendanceRecords[recordIndex].markedAt = new Date();
  } else {
    this.attendanceRecords.push({
      student: studentId,
      status: status,
      remarks: remarks,
      markedAt: new Date()
    });
  }
  
  return this.save();
};

// Static method to get attendance for a student in a course
attendanceSchema.statics.getStudentCourseAttendance = function(studentId, courseId, startDate, endDate) {
  const query = {
    course: courseId,
    'attendanceRecords.student': studentId
  };
  
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query)
    .populate('course', 'title code')
    .populate('instructor', 'name email')
    .sort({ date: -1 });
};

// Static method to get course attendance statistics
attendanceSchema.statics.getCourseAttendanceStats = function(courseId, startDate, endDate) {
  const query = { course: courseId };
  
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        averageAttendance: { $avg: '$attendancePercentage' },
        totalPresent: { $sum: '$presentCount' },
        totalAbsent: { $sum: '$absentCount' },
        totalLate: { $sum: '$lateCount' }
      }
    }
  ]);
};

// Static method to get student attendance summary
attendanceSchema.statics.getStudentAttendanceSummary = function(studentId, courseId) {
  return this.aggregate([
    {
      $match: {
        course: mongoose.Types.ObjectId(courseId),
        'attendanceRecords.student': mongoose.Types.ObjectId(studentId)
      }
    },
    { $unwind: '$attendanceRecords' },
    {
      $match: {
        'attendanceRecords.student': mongoose.Types.ObjectId(studentId)
      }
    },
    {
      $group: {
        _id: '$attendanceRecords.status',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
