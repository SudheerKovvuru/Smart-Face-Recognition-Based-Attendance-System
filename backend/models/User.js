const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Common fields
  rollNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    required: true
  },
  
  // Student-specific fields
  branch: {
    type: String,
    enum: ['cse', 'it', 'csm', 'csd', 'csc', 'ece', 'eee', 'civil', 'mech', ''],
    default: ''
  },
  course: {
    type: String,
    enum: ['btech', 'diploma', 'mba', 'mca', ''],
    default: ''
  },
  year: {
    type: Number,
    min: 1,
    max: 4,
    default: null
  },
  section: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', ''],
    default: ''
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);