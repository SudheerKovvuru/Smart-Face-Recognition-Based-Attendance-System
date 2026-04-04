const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  periodNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  startTime: {
    type: String,
    required: true // Format: "09:15"
  },
  endTime: {
    type: String,
    required: true // Format: "10:05"
  },
  subject: {
    type: String,
    required: true
  },
  subjectCode: {
    type: String,
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facultyName: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true // e.g., "Room 101"
  },
  cameraId: {
    type: String,
    required: true // e.g., "cam1_trim"
  }
});

const timetableSchema = new mongoose.Schema({
  branch: {
    type: String,
    required: true,
    enum: ['cse', 'it', 'csm', 'csd', 'csc', 'ece', 'eee', 'civil', 'mech']
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  section: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'F']
  },
  day: {
    type: String,
    required: true,
    enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  },
  periods: [periodSchema],
  academicYear: {
    type: String,
    required: true // e.g., "2024-2025"
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  }
}, {
  timestamps: true
});

// Compound index for faster queries
timetableSchema.index({ branch: 1, year: 1, section: 1, day: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);