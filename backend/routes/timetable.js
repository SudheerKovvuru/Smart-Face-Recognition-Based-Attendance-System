const express = require('express');
const Timetable = require('../models/Timetable');
const { auth, isAdmin, isAdminOrFaculty } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/timetable
// @desc    Create timetable entry (Admin only)
// @access  Private (Admin)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { branch, year, section, day, periods, academicYear, semester } = req.body;

    // Check if timetable already exists
    const existing = await Timetable.findOne({ branch, year, section, day, academicYear, semester });
    if (existing) {
      return res.status(400).json({ message: 'Timetable for this class and day already exists' });
    }

    const timetable = new Timetable({
      branch,
      year,
      section,
      day,
      periods,
      academicYear,
      semester
    });

    await timetable.save();
    res.status(201).json({ message: 'Timetable created successfully', timetable });

  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timetable/current
// @desc    Get current period based on time
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const now = new Date();
    const currentDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // Format: "HH:MM"

    // Get user's timetable
    const { branch, year, section } = req.user;
    
    if (!branch || !year || !section) {
      return res.status(400).json({ message: 'User class information not found' });
    }

    const timetable = await Timetable.findOne({ 
      branch, 
      year, 
      section, 
      day: currentDay 
    }).populate('periods.faculty', 'firstName lastName rollNo');

    if (!timetable) {
      return res.json({ message: 'No classes today', currentPeriod: null });
    }

    // Find current period
    const currentPeriod = timetable.periods.find(period => {
      return currentTime >= period.startTime && currentTime <= period.endTime;
    });

    res.json({
      day: currentDay,
      currentTime,
      currentPeriod: currentPeriod || null,
      allPeriods: timetable.periods
    });

  } catch (error) {
    console.error('Get current period error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timetable/class/:branch/:year/:section
// @desc    Get full week timetable for a class
// @access  Private (Admin/Faculty)
router.get('/class/:branch/:year/:section', auth, isAdminOrFaculty, async (req, res) => {
  try {
    const { branch, year, section } = req.params;

    const timetables = await Timetable.find({ 
      branch, 
      year: parseInt(year), 
      section 
    }).populate('periods.faculty', 'firstName lastName rollNo').sort({ day: 1 });

    res.json(timetables);

  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/timetable/faculty/today
// @desc    Get today's classes for logged-in faculty
// @access  Private (Faculty/Admin)
router.get('/faculty/today', auth, isAdminOrFaculty, async (req, res) => {
  try {
    const now = new Date();
    const currentDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];

    const timetables = await Timetable.find({ 
      day: currentDay,
      'periods.faculty': req.user.userId 
    });

    // Filter periods for this faculty
    const facultyClasses = [];
    timetables.forEach(tt => {
      tt.periods.forEach(period => {
        if (period.faculty.toString() === req.user.userId) {
          facultyClasses.push({
            branch: tt.branch,
            year: tt.year,
            section: tt.section,
            ...period.toObject()
          });
        }
      });
    });

    // Sort by start time
    facultyClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

    res.json({ day: currentDay, classes: facultyClasses });

  } catch (error) {
    console.error('Get faculty classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/timetable/:id
// @desc    Delete timetable entry
// @access  Private (Admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;