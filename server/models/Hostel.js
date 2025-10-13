const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  // Hostel Information
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Boys', 'Girls', 'Co-ed'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  contactNumber: String,
  wardenName: String,
  wardenPhone: String,
  
  // Room Information
  totalRooms: {
    type: Number,
    required: true
  },
  roomsPerFloor: Number,
  totalFloors: Number,
  
  // Capacity and Occupancy
  totalCapacity: {
    type: Number,
    required: true
  },
  currentOccupancy: {
    type: Number,
    default: 0
  },
  availableSpots: {
    type: Number,
    default: 0
  },
  
  // Amenities
  amenities: [{
    name: String,
    description: String,
    available: {
      type: Boolean,
      default: true
    }
  }],
  
  // Fee Structure
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
hostelSchema.pre('save', function(next) {
  this.availableSpots = this.totalCapacity - this.currentOccupancy;
  next();
});

module.exports = mongoose.models.Hostel || mongoose.model('Hostel', hostelSchema);
