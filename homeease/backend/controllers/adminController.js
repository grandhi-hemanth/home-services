const User = require('../models/User');
const Professional = require('../models/Professional');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Category = require('../models/Category');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      totalProfessionals,
      totalServices,
      totalBookings,
      completedBookings,
      pendingBookings,
      totalCategories,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'professional' }),
      Service.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'completed' }),
      Booking.countDocuments({ bookingStatus: 'pending' }),
      Category.countDocuments({ isActive: true }),
    ]);

    // Revenue from completed bookings
    const revenueResult = await Booking.aggregate([
      { $match: { bookingStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult.length ? revenueResult[0].total : 0;

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('customerId', 'name email')
      .populate('serviceId', 'serviceName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Bookings by status for chart
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    ]);

    // Monthly revenue for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Booking.aggregate([
      { $match: { bookingStatus: 'completed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalCustomers,
        totalProfessionals,
        totalServices,
        totalBookings,
        completedBookings,
        pendingBookings,
        totalCategories,
        totalRevenue,
      },
      recentBookings,
      bookingsByStatus,
      monthlyRevenue,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, count: users.length, total, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/admin/bookings
// @access  Admin
const getAllBookings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.bookingStatus = status;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'serviceName')
      .populate({ path: 'professionalId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, count: bookings.length, total, totalPages: Math.ceil(total / Number(limit)), bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify professional
// @route   PUT /api/admin/professionals/:id/verify
// @access  Admin
const verifyProfessional = async (req, res, next) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'
    const professional = await Professional.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).populate('userId', 'name email');

    if (!professional) return res.status(404).json({ success: false, message: 'Professional not found' });
    res.json({ success: true, message: `Professional ${status}`, professional });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all professionals (admin)
// @route   GET /api/admin/professionals
// @access  Admin
const getAllProfessionals = async (req, res, next) => {
  try {
    const { verificationStatus, page = 1, limit = 20 } = req.query;
    const query = {};
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const total = await Professional.countDocuments(query);
    const professionals = await Professional.find(query)
      .populate('userId', 'name email phone profileImage isActive')
      .populate('serviceCategories', 'categoryName')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, count: professionals.length, total, professionals });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue stats
// @route   GET /api/admin/revenue
// @access  Admin
const getRevenueStats = async (req, res, next) => {
  try {
    const result = await Booking.aggregate([
      { $match: { bookingStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    const topServices = await Booking.aggregate([
      { $match: { bookingStatus: 'completed' } },
      { $group: { _id: '$serviceId', revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
    ]);

    res.json({
      success: true,
      totalRevenue: result.length ? result[0].total : 0,
      totalCompletedBookings: result.length ? result[0].count : 0,
      topServices,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllBookings,
  toggleUserStatus,
  verifyProfessional,
  getAllProfessionals,
  getRevenueStats,
};
