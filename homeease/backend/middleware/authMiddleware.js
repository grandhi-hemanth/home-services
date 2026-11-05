const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized. Invalid token.' });
  }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
};

// Professional only middleware
const professionalOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'professional' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Professionals only.' });
};

// Customer only middleware
const customerOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied. Customers only.' });
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

module.exports = { protect, adminOnly, professionalOnly, customerOnly, generateToken };
