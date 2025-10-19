const mongoose = require('mongoose');

const studentLibrarySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Library',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Issued', 'Returned', 'Overdue', 'Lost'],
    default: 'Issued'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Fine calculation
  fineAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  finePaidDate: {
    type: Date
  },
  // Renewal tracking
  renewalCount: {
    type: Number,
    default: 0,
    max: 3 // Maximum 3 renewals
  },
  lastRenewalDate: {
    type: Date
  },
  // Notes and comments
  notes: {
    type: String,
    trim: true
  },
  // Book condition
  bookCondition: {
    type: String,
    enum: ['Good', 'Fair', 'Poor', 'Damaged'],
    default: 'Good'
  },
  returnCondition: {
    type: String,
    enum: ['Good', 'Fair', 'Poor', 'Damaged'],
    default: 'Good'
  }
}, { 
  timestamps: true 
});

// Compound indexes for efficient queries
studentLibrarySchema.index({ student: 1, status: 1 });
studentLibrarySchema.index({ book: 1, status: 1 });
studentLibrarySchema.index({ dueDate: 1, status: 1 });
studentLibrarySchema.index({ issueDate: 1 });

// Pre-save middleware to calculate due date and fine
studentLibrarySchema.pre('save', function(next) {
  // Set due date to 14 days from issue date if not already set
  if (this.isNew && !this.dueDate) {
    this.dueDate = new Date(this.issueDate.getTime() + (14 * 24 * 60 * 60 * 1000));
  }
  
  // Calculate fine if book is overdue
  if (this.status === 'Overdue' || (this.status === 'Issued' && new Date() > this.dueDate)) {
    const daysOverdue = Math.ceil((new Date() - this.dueDate) / (24 * 60 * 60 * 1000));
    if (daysOverdue > 0) {
      this.fineAmount = daysOverdue * 5; // ₹5 per day fine
      this.status = 'Overdue';
    }
  }
  
  // Update return date if book is returned
  if (this.status === 'Returned' && !this.returnDate) {
    this.returnDate = new Date();
  }
  
  next();
});

// Virtual for days overdue
studentLibrarySchema.virtual('daysOverdue').get(function() {
  if (this.status === 'Issued' && new Date() > this.dueDate) {
    return Math.ceil((new Date() - this.dueDate) / (24 * 60 * 60 * 1000));
  }
  return 0;
});

// Virtual for can renew
studentLibrarySchema.virtual('canRenew').get(function() {
  return this.status === 'Issued' && this.renewalCount < 3 && new Date() <= this.dueDate;
});

// Method to renew book
studentLibrarySchema.methods.renewBook = function() {
  if (this.canRenew) {
    this.renewalCount += 1;
    this.lastRenewalDate = new Date();
    this.dueDate = new Date(this.dueDate.getTime() + (14 * 24 * 60 * 60 * 1000));
    return true;
  }
  return false;
};

// Method to return book
studentLibrarySchema.methods.returnBook = function(returnedBy, condition = 'Good') {
  if (this.status === 'Issued' || this.status === 'Overdue') {
    this.status = 'Returned';
    this.returnDate = new Date();
    this.returnedBy = returnedBy;
    this.returnCondition = condition;
    
    // Calculate final fine if any
    if (new Date() > this.dueDate) {
      const daysOverdue = Math.ceil((new Date() - this.dueDate) / (24 * 60 * 60 * 1000));
      this.fineAmount = daysOverdue * 5;
    }
    
    return true;
  }
  return false;
};

// Static method to get overdue books
studentLibrarySchema.statics.getOverdueBooks = function() {
  return this.find({
    status: 'Issued',
    dueDate: { $lt: new Date() }
  }).populate('student book issuedBy');
};

// Static method to get student's current books
studentLibrarySchema.statics.getStudentBooks = function(studentId) {
  return this.find({
    student: studentId,
    status: { $in: ['Issued', 'Overdue'] }
  }).populate('book issuedBy');
};

// Static method to get book issue history
studentLibrarySchema.statics.getBookHistory = function(bookId) {
  return this.find({ book: bookId })
    .populate('student issuedBy returnedBy')
    .sort({ issueDate: -1 });
};

module.exports = mongoose.models.StudentLibrary || mongoose.model('StudentLibrary', studentLibrarySchema);
