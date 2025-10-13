const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
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
  
  // Fee Structure
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  
  // Fee Components
  tuitionFee: {
    type: Number,
    required: true,
    default: 0
  },
  libraryFee: {
    type: Number,
    default: 0
  },
  laboratoryFee: {
    type: Number,
    default: 0
  },
  examinationFee: {
    type: Number,
    default: 0
  },
  hostelFee: {
    type: Number,
    default: 0
  },
  transportFee: {
    type: Number,
    default: 0
  },
  otherFees: [{
    name: String,
    amount: Number
  }],
  
  // Total and Payment
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  
  // Payment Details
  payments: [{
    paymentId: String,
    amount: Number,
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Cheque', 'Online', 'Bank Transfer', 'UPI', 'Card']
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    transactionId: String,
    receiptNumber: String,
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    notes: String
  }],
  
  // Due Dates and Status
  dueDate: {
    type: Date,
    required: true
  },
  lateFeeAmount: {
    type: Number,
    default: 0
  },
  feeStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue', 'Waived'],
    default: 'Pending'
  },
  
  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Calculate pending amount before saving
feeSchema.pre('save', function(next) {
  this.pendingAmount = this.totalAmount - this.paidAmount;
  next();
});

module.exports = mongoose.models.Fee || mongoose.model('Fee', feeSchema);
