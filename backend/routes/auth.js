const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper function to determine role from roll number
const determineRole = (rollNo) => {
  if (rollNo === 'admin') return 'admin';
  if (rollNo.length === 10 && rollNo[0] === 'A') return 'faculty';
  if (rollNo.length === 10 && !isNaN(rollNo[0])) return 'student';
  return null;
};

// Helper function to generate email for students
const generateStudentEmail = (rollNo) => {
  return `${rollNo}@adityatekkali.edu.in`;
};

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('rollNo').trim().notEmpty().withMessage('Roll number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, rollNo, password, email, branch, course, year, section } = req.body;

    // Determine role
    const role = determineRole(rollNo);
    if (!role) {
      return res.status(400).json({ message: 'Invalid roll number format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ rollNo }, { email: email || generateStudentEmail(rollNo) }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this roll number or email already exists' });
    }

    // Generate email for students
    let userEmail = email;
    if (role === 'student') {
      userEmail = generateStudentEmail(rollNo);
    } else if (role === 'admin') {
      userEmail = 'admin@gmail.com';
    }

    // Validate student-specific fields
    if (role === 'student') {
      if (!branch || !course || !year || !section) {
        return res.status(400).json({ message: 'Branch, course, year, and section are required for students' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      firstName,
      lastName,
      rollNo,
      email: userEmail,
      password: hashedPassword,
      role,
      branch: role === 'student' ? branch : '',
      course: role === 'student' ? course : '',
      year: role === 'student' ? year : null,
      section: role === 'student' ? section : ''
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        rollNo: user.rollNo 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        rollNo: user.rollNo,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('rollNo').trim().notEmpty().withMessage('Roll number is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rollNo, password, rememberMe } = req.body;

    // Find user
    const user = await User.findOne({ rollNo });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const expiresIn = rememberMe ? '7d' : process.env.JWT_EXPIRY;
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        rollNo: user.rollNo 
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        rollNo: user.rollNo,
        email: user.email,
        role: user.role,
        branch: user.branch,
        course: user.course,
        year: user.year,
        section: user.section
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  // JWT tokens are stateless, so logout is handled client-side
  res.json({ message: 'Logout successful' });
});

module.exports = router;