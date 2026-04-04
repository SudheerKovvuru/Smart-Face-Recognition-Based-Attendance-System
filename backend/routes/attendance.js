const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Timetable = require('../models/Timetable');
const { auth, isAdminOrFaculty } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/attendance/mark-detection
// @desc    Mark a detection for a student (called by Flask)
// @access  Private
router.post('/mark-detection', auth, async (req, res) => {
  try {
    const { 
      studentName, 
      cameraId, 
      confidence, 
      checkNumber,
      date,
      periodNumber
    } = req.body;

    // Find student
    const student = await User.findOne({ firstName: studentName });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get current day
    const currentDate = date ? new Date(date) : new Date();
    const currentDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][currentDate.getDay()];

    // Find timetable for student's class
    const timetable = await Timetable.findOne({
      branch: student.branch,
      year: student.year,
      section: student.section,
      day: currentDay
    });

    if (!timetable) {
      return res.status(404).json({ message: 'No timetable found for this class' });
    }

    // Find current period
    const period = timetable.periods.find(p => p.periodNumber === periodNumber);
    if (!period) {
      return res.status(404).json({ message: 'Period not found in timetable' });
    }

    // Verify camera matches the period's room
    if (period.cameraId !== cameraId) {
      return res.status(400).json({ 
        message: 'Student detected in wrong classroom',
        expected: period.cameraId,
        detected: cameraId
      });
    }

    // Find or create attendance record
    let attendance = await Attendance.findOne({
      student: student._id,
      date: {
        $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(currentDate.setHours(23, 59, 59, 999))
      },
      periodNumber
    });

    if (!attendance) {
      // Create new attendance record
      attendance = new Attendance({
        student: student._id,
        studentRollNo: student.rollNo,
        studentName: `${student.firstName} ${student.lastName}`,
        branch: student.branch,
        year: student.year,
        section: student.section,
        subject: period.subject,
        subjectCode: period.subjectCode,
        faculty: period.faculty,
        facultyName: period.facultyName,
        date: currentDate,
        day: currentDay,
        periodNumber,
        startTime: period.startTime,
        endTime: period.endTime,
        cameraId: period.cameraId,
        room: period.room,
        detections: [],
        totalDetections: 0,
        status: 'pending'
      });
    }

    // Check if this check number already exists
    const existingCheck = attendance.detections.find(d => d.checkNumber === checkNumber);
    if (existingCheck) {
      return res.json({ 
        message: 'Detection already recorded for this check',
        attendance 
      });
    }

    // Add detection
    attendance.detections.push({
      checkNumber,
      detected: true,
      time: new Date(),
      confidence
    });

    attendance.totalDetections = attendance.detections.length;

    // Update status if all 5 checks are done
    if (attendance.totalDetections === 5) {
      attendance.status = attendance.totalDetections >= 3 ? 'present' : 'absent';
    }

    await attendance.save();

    res.json({ 
      message: 'Detection marked successfully', 
      attendance,
      status: attendance.status
    });

  } catch (error) {
    console.error('Mark detection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/faculty/today
// @desc    Get today's attendance for faculty's classes
// @access  Private (Faculty/Admin)
router.get('/faculty/today', auth, isAdminOrFaculty, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      faculty: req.user.userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ periodNumber: 1, studentRollNo: 1 });

    // Group by period
    const groupedByPeriod = {};
    attendance.forEach(record => {
      const key = `Period ${record.periodNumber} - ${record.subject}`;
      if (!groupedByPeriod[key]) {
        groupedByPeriod[key] = {
          periodNumber: record.periodNumber,
          subject: record.subject,
          subjectCode: record.subjectCode,
          startTime: record.startTime,
          endTime: record.endTime,
          students: []
        };
      }
      groupedByPeriod[key].students.push(record);
    });

    res.json({ date: today, classes: Object.values(groupedByPeriod) });

  } catch (error) {
    console.error('Get faculty attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/period/:date/:periodNumber/:branch/:year/:section
// @desc    Get attendance for specific period
// @access  Private (Faculty/Admin)
router.get('/period/:date/:periodNumber/:branch/:year/:section', auth, isAdminOrFaculty, async (req, res) => {
  try {
    const { date, periodNumber, branch, year, section } = req.params;
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      },
      periodNumber: parseInt(periodNumber),
      branch,
      year: parseInt(year),
      section
    }).sort({ studentRollNo: 1 });

    // Get all students in this class
    const allStudents = await User.find({
      role: 'student',
      branch,
      year: parseInt(year),
      section
    }).select('rollNo firstName lastName');

    // Create complete attendance list
    const attendanceMap = {};
    attendance.forEach(record => {
      attendanceMap[record.studentRollNo] = record;
    });

    const completeAttendance = allStudents.map(student => {
      const record = attendanceMap[student.rollNo];
      return {
        rollNo: student.rollNo,
        name: `${student.firstName} ${student.lastName}`,
        status: record ? record.status : 'absent',
        detections: record ? record.totalDetections : 0,
        detectionDetails: record ? record.detections : []
      };
    });

    res.json({ 
      date: targetDate,
      periodNumber: parseInt(periodNumber),
      branch,
      year: parseInt(year),
      section,
      totalStudents: allStudents.length,
      present: completeAttendance.filter(s => s.status === 'present').length,
      absent: completeAttendance.filter(s => s.status === 'absent').length,
      students: completeAttendance
    });

  } catch (error) {
    console.error('Get period attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/download/:date/:periodNumber/:branch/:year/:section
// @desc    Download attendance Excel for specific period
// @access  Private (Faculty/Admin)
router.get('/download/:date/:periodNumber/:branch/:year/:section', auth, isAdminOrFaculty, async (req, res) => {
  try {
    const { date, periodNumber, branch, year, section } = req.params;
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      },
      periodNumber: parseInt(periodNumber),
      branch,
      year: parseInt(year),
      section
    }).sort({ studentRollNo: 1 });

    // Get all students
    const allStudents = await User.find({
      role: 'student',
      branch,
      year: parseInt(year),
      section
    }).select('rollNo firstName lastName').sort({ rollNo: 1 });

    // Get period details
    const currentDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][targetDate.getDay()];
    const timetable = await Timetable.findOne({
      branch, 
      year: parseInt(year), 
      section, 
      day: currentDay 
    });

    const period = timetable ? timetable.periods.find(p => p.periodNumber === parseInt(periodNumber)) : null;

    // Create CSV data
    const attendanceMap = {};
    attendance.forEach(record => {
      attendanceMap[record.studentRollNo] = record;
    });

    let csvData = 'Roll No,Name,Status,Total Detections\n';
    allStudents.forEach(student => {
      const record = attendanceMap[student.rollNo];
      const status = record ? record.status : 'absent';
      const detections = record ? record.totalDetections : 0;
      csvData += `${student.rollNo},"${student.firstName} ${student.lastName}",${status.toUpperCase()},${detections}/5\n`;
    });

    // Add metadata header
    const metadata = `Attendance Report\n` +
      `Date: ${targetDate.toDateString()}\n` +
      `Class: ${branch.toUpperCase()}-${year}-${section}\n` +
      `Period: ${periodNumber} (${period ? period.startTime : ''} - ${period ? period.endTime : ''})\n` +
      `Subject: ${period ? period.subject : 'N/A'}\n` +
      `Faculty: ${period ? period.facultyName : 'N/A'}\n\n`;

    const finalCsv = metadata + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${branch}_${year}_${section}_P${periodNumber}_${date}.csv`);
    res.send(finalCsv);

  } catch (error) {
    console.error('Download attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;