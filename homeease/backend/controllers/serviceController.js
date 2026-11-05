const Service = require('../models/Service');
const Category = require('../models/Category');

// @desc    Get all services with filters
// @route   GET /api/services
// @access  Public
const getServices = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, minRating, sort, page = 1, limit = 12 } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minRating) query.avgRating = { $gte: Number(minRating) };

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { avgRating: -1 };
    else if (sort === 'popular') sortOption = { totalBookings: -1 };

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .populate('category', 'categoryName image icon')
      .sort(sortOption)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      count: services.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('category', 'categoryName image');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Admin
const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    await service.populate('category', 'categoryName');
    res.status(201).json({ success: true, message: 'Service created successfully', service });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Admin
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'categoryName');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service updated successfully', service });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Admin
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured services
// @route   GET /api/services/featured
// @access  Public
const getFeaturedServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true, isFeatured: true })
      .populate('category', 'categoryName image icon')
      .limit(8);
    res.json({ success: true, services });
  } catch (error) {
    next(error);
  }
};

module.exports = { getServices, getServiceById, createService, updateService, deleteService, getFeaturedServices };
