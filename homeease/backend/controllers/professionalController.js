const Professional = require('../models/Professional');
const User = require('../models/User');

// @desc    Get all professionals
// @route   GET /api/professionals
// @access  Public
const getProfessionals = async (req, res, next) => {
  try {
    const { category, minRating, page = 1, limit = 12, sort } = req.query;

    const query = { isActive: true, verificationStatus: 'verified' };
    if (category) query.serviceCategories = category;
    if (minRating) query.rating = { $gte: Number(minRating) };

    let sortOption = { rating: -1 };
    if (sort === 'jobs') sortOption = { completedJobs: -1 };
    else if (sort === 'experience') sortOption = { experience: -1 };

    const total = await Professional.countDocuments(query);
    const professionals = await Professional.find(query)
      .populate('userId', 'name email phone profileImage')
      .populate('serviceCategories', 'categoryName')
      .sort(sortOption)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      count: professionals.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      professionals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get professional by ID
// @route   GET /api/professionals/:id
// @access  Public
const getProfessionalById = async (req, res, next) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('userId', 'name email phone profileImage')
      .populate('serviceCategories', 'categoryName image');
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }
    res.json({ success: true, professional });
  } catch (error) {
    next(error);
  }
};

// @desc    Get professionals by service category
// @route   GET /api/professionals/by-service/:serviceId
// @access  Public
const getProfessionalsByService = async (req, res, next) => {
  try {
    const Service = require('../models/Service');
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    const professionals = await Professional.find({
      serviceCategories: service.category,
      isActive: true,
      verificationStatus: 'verified',
    })
      .populate('userId', 'name email phone profileImage')
      .populate('serviceCategories', 'categoryName')
      .sort({ rating: -1 });
    res.json({ success: true, professionals });
  } catch (error) {
    next(error);
  }
};

// @desc    Update professional profile
// @route   PUT /api/professionals/profile
// @access  Professional
const updateProfessionalProfile = async (req, res, next) => {
  try {
    const { experience, description, skills, hourlyRate, location, serviceCategories } = req.body;

    let professional = await Professional.findOne({ userId: req.user._id });

    if (!professional) {
      professional = await Professional.create({
        userId: req.user._id,
        experience: experience || 0,
        description,
        skills,
        hourlyRate,
        location,
        serviceCategories,
      });
    } else {
      professional = await Professional.findOneAndUpdate(
        { userId: req.user._id },
        { experience, description, skills, hourlyRate, location, serviceCategories },
        { new: true, runValidators: true }
      );
    }

    await professional.populate('serviceCategories', 'categoryName');
    res.json({ success: true, message: 'Profile updated', professional });
  } catch (error) {
    next(error);
  }
};

// @desc    Update availability
// @route   PUT /api/professionals/availability
// @access  Professional
const updateAvailability = async (req, res, next) => {
  try {
    const { availability, isAvailableToday } = req.body;
    const professional = await Professional.findOneAndUpdate(
      { userId: req.user._id },
      { availability, isAvailableToday },
      { new: true }
    );
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional profile not found' });
    }
    res.json({ success: true, message: 'Availability updated', professional });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my professional profile (for professional user)
// @route   GET /api/professionals/my-profile
// @access  Professional
const getMyProfessionalProfile = async (req, res, next) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone profileImage')
      .populate('serviceCategories', 'categoryName');
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional profile not found. Please complete your profile.' });
    }
    res.json({ success: true, professional });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfessionals,
  getProfessionalById,
  getProfessionalsByService,
  updateProfessionalProfile,
  updateAvailability,
  getMyProfessionalProfile,
};
