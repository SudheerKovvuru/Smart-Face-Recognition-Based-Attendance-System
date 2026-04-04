const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  checkNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  detected: {
    type: Boolean,
    required: true
  },
  time: {
    type: Date,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  }
});

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentRollNo: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  
  // Class details
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
  
  // Period details
  date: {
    type: Date,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  periodNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  
  // Detection details
  detections: [detectionSchema],
  totalDetections: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Attendance status
  status: {
    type: String,
    enum: ['present', 'absent', 'pending'],
    default: 'pending'
  },
  
  // Camera and room
  cameraId: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for faster queries
attendanceSchema.index({ student: 1, date: 1, periodNumber: 1 }, { unique: true });
attendanceSchema.index({ faculty: 1, date: 1 });
attendanceSchema.index({ branch: 1, year: 1, section: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);