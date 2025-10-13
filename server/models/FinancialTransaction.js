const mongoose = require('mongoose');

const financialTransactionSchema = new mongoose.Schema({
  // Transaction Information
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['Income', 'Expense', 'Transfer', 'Refund', 'Adjustment'],
    required: true
  },
  category: {
    type: String,
    enum: [
      // Income Categories
      'Student Fees', 'Government Grant', 'Donation', 'Investment Return', 'Other Income',
      // Expense Categories
      'Salaries', 'Utilities', 'Maintenance', 'Equipment', 'Marketing', 'Travel', 'Office Supplies', 'Other Expense'
    ],
    required: true
  },
  subCategory: String,
  
  // Amount Information
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Description and Details
  description: {
    type: String,
    required: true
  },
  reference: String, // Reference to related document (receipt, invoice, etc.)
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Cheque', 'Online', 'Bank Transfer', 'UPI', 'Card', 'Other'],
    required: true
  },
  bankAccount: String,
  chequeNumber: String,
  transactionReference: String,
  
  // Date Information
  transactionDate: {
    type: Date,
    required: true
  },
  dueDate: Date,
  
  // Status Information
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled', 'Reversed'],
    default: 'Pending'
  },
  
  // Related Entities
  studentId: String, // If related to student
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admission'
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examination'
  },
  
  // Approval Information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalNotes: String,
  
  // Attachments
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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
financialTransactionSchema.index({ transactionDate: -1 });
financialTransactionSchema.index({ transactionType: 1, category: 1 });
financialTransactionSchema.index({ studentId: 1 });
financialTransactionSchema.index({ status: 1 });

module.exports = mongoose.models.FinancialTransaction || mongoose.model('FinancialTransaction', financialTransactionSchema);
