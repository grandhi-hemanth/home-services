const User = require('../models/User');
const Professional = require('../models/Professional');
const { generateToken } = require('../middleware/authMiddleware');
const { validationResult } = require('express-validator');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, phone, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const allowedRoles = ['customer', 'professional'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    const user = await User.create({ name, email, phone, password, role: userRole });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let professionalProfile = null;
    if (user.role === 'professional') {
      professionalProfile = await Professional.findOne({ userId: user._id })
        .populate('serviceCategories', 'categoryName');
    }
    res.json({ success: true, user, professionalProfile });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, profileImage },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add/update address
// @route   POST /api/auth/address
// @access  Private
const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const { label, street, city, state, zipCode, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    user.addresses.push({ label, street, city, state, zipCode, isDefault });
    await user.save();
    res.json({ success: true, message: 'Address added successfully', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json({ success: true, message: 'Address removed', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, addAddress, deleteAddress };
