const mongoose = require('mongoose');

const hostelAllocationSchema = new mongoose.Schema({
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
  
  // Hostel Information
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  floorNumber: {
    type: Number,
    required: true
  },
  
  // Allocation Details
  allocationDate: {
    type: Date,
    default: Date.now
  },
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: Date,
  allocationStatus: {
    type: String,
    enum: ['Allocated', 'Active', 'Vacated', 'Suspended', 'Cancelled'],
    default: 'Allocated'
  },
  
  // Roommate Information
  roommates: [{
    studentId: String,
    name: String,
    phone: String
  }],
  
  // Fee Information
  monthlyRent: {
    type: Number,
    required: true
  },
  securityDeposit: {
    type: Number,
    required: true
  },
  maintenanceFee: {
    type: Number,
    default: 0
  },
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
  
  // Payment History
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
  
  // Special Requirements
  specialRequirements: [{
    type: String,
    description: String,
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Rejected', 'Fulfilled'],
      default: 'Requested'
    }
  }],
  
  // Violations and Disciplinary Actions
  violations: [{
    date: Date,
    type: String,
    description: String,
    action: String,
    status: {
      type: String,
      enum: ['Reported', 'Under Review', 'Resolved', 'Escalated'],
      default: 'Reported'
    }
  }],
  
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
hostelAllocationSchema.pre('save', function(next) {
  this.pendingAmount = this.totalAmount - this.paidAmount;
  next();
});

module.exports = mongoose.models.HostelAllocation || mongoose.model('HostelAllocation', hostelAllocationSchema);
