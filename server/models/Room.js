const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // Room Information
  roomNumber: {
    type: String,
    required: true
  },
  floorNumber: {
    type: Number,
    required: true
  },
  
  // Hostel Reference
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  
  // Room Details
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  availableSpots: {
    type: Number,
    default: 0
  },
  
  // Room Type and Features
  roomType: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Quad', 'Dormitory'],
    required: true
  },
  amenities: [{
    name: String,
    description: String,
    available: {
      type: Boolean,
      default: true
    }
  }],
  
  // Pricing
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
  
  // Room Status
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Under Maintenance', 'Reserved', 'Out of Service'],
    default: 'Available'
  },
  
  // Maintenance Information
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceNotes: String,
  
  // Room Condition
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair'],
    default: 'Good'
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Calculate available spots before saving
roomSchema.pre('save', function(next) {
  this.availableSpots = this.capacity - this.currentOccupancy;
  next();
});

// Index for efficient queries
roomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ status: 1, availableSpots: 1 });

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);
