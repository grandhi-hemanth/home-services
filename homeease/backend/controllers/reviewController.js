const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Customer
const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only review your own bookings' });
    }

    if (booking.bookingStatus !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed bookings' });
    }

    if (booking.hasReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this booking' });
    }

    const review = await Review.create({
      customerId: req.user._id,
      professionalId: booking.professionalId,
      bookingId,
      serviceId: booking.serviceId,
      rating,
      comment,
    });

    // Mark booking as reviewed
    await Booking.findByIdAndUpdate(bookingId, { hasReview: true });

    // Update service avg rating
    const serviceReviews = await Review.find({ serviceId: booking.serviceId });
    if (serviceReviews.length > 0) {
      const avgRating = serviceReviews.reduce((acc, r) => acc + r.rating, 0) / serviceReviews.length;
      await Service.findByIdAndUpdate(booking.serviceId, {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: serviceReviews.length,
      });
    }

    await review.populate('customerId', 'name profileImage');
    res.status(201).json({ success: true, message: 'Review submitted successfully', review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a professional
// @route   GET /api/reviews/:professionalId
// @access  Public
const getReviewsByProfessional = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await Review.countDocuments({ professionalId: req.params.professionalId, isVisible: true });
    const reviews = await Review.find({ professionalId: req.params.professionalId, isVisible: true })
      .populate('customerId', 'name profileImage')
      .populate('serviceId', 'serviceName')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
// @access  Admin
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Review.countDocuments();
    const reviews = await Review.find()
      .populate('customerId', 'name email')
      .populate('professionalId', 'userId')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, count: reviews.length, total, reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getReviewsByProfessional, getAllReviews };
