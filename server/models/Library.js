const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  shelfNo: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  coverImage: {
    fileName: String,
    filePath: String,
    cloudinaryId: String,
    cloudinaryUrl: String
  },
  edition: {
    type: String,
    trim: true
  },
  publisher: {
    type: String,
    trim: true
  },
  publicationYear: {
    type: Number
  },
  language: {
    type: String,
    default: 'English'
  },
  pages: {
    type: Number
  },
  price: {
    type: Number,
    min: 0
  },
  // Research paper specific fields
  isResearchPaper: {
    type: Boolean,
    default: false
  },
  researchPaperType: {
    type: String,
    enum: ['Journal', 'Conference', 'Thesis', 'Report', 'Other'],
    default: 'Journal'
  },
  doi: {
    type: String,
    trim: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  abstract: {
    type: String,
    trim: true
  },
  // Status and metadata
  status: {
    type: String,
    enum: ['Available', 'Maintenance', 'Lost', 'Withdrawn'],
    default: 'Available'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Search optimization
  searchKeywords: [{
    type: String,
    trim: true
  }]
}, { 
  timestamps: true 
});

// Create text index for search functionality
librarySchema.index({
  title: 'text',
  author: 'text',
  genre: 'text',
  description: 'text',
  keywords: 'text',
  searchKeywords: 'text'
});

// Compound index for efficient queries
librarySchema.index({ genre: 1, status: 1 });
librarySchema.index({ isbn: 1 });
librarySchema.index({ addedBy: 1 });

// Pre-save middleware to update search keywords
librarySchema.pre('save', function(next) {
  if (this.isModified('title') || this.isModified('author') || this.isModified('genre')) {
    this.searchKeywords = [
      ...(this.title ? this.title.toLowerCase().split(' ') : []),
      ...(this.author ? this.author.toLowerCase().split(' ') : []),
      ...(this.genre ? this.genre.toLowerCase().split(' ') : []),
      ...(this.keywords || [])
    ].filter(keyword => keyword.length > 2);
  }
  next();
});

// Virtual for availability status
librarySchema.virtual('isAvailable').get(function() {
  return this.availableQuantity > 0 && this.status === 'Available';
});

// Method to check if book can be issued
librarySchema.methods.canBeIssued = function() {
  return this.availableQuantity > 0 && this.status === 'Available';
};

// Method to issue book
librarySchema.methods.issueBook = function() {
  if (this.canBeIssued()) {
    this.availableQuantity -= 1;
    return true;
  }
  return false;
};

// Method to return book
librarySchema.methods.returnBook = function() {
  if (this.availableQuantity < this.quantity) {
    this.availableQuantity += 1;
    return true;
  }
  return false;
};

module.exports = mongoose.models.Library || mongoose.model('Library', librarySchema);
