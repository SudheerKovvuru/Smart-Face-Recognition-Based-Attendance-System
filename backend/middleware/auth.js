const jwt = require('jsonwebtoken');

// Verify JWT token
const auth = (req, res, next) => {
  try {
    // Get token from header or query parameter (for video streaming)
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    // If no token in header, check query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is admin or faculty
const isAdminOrFaculty = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'faculty') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin or Faculty only.' });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = { auth, isAdminOrFaculty, isAdmin };