const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Professional = require('../models/Professional');

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Customer
const createBooking = async (req, res, next) => {
  try {
    const { professionalId, serviceId, appointmentDate, timeSlot, address, instructions, paymentMethod } = req.body;

    // Validate service and professional
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found or unavailable' });
    }

    const professional = await Professional.findById(professionalId);
    if (!professional || !professional.isActive) {
      return res.status(404).json({ success: false, message: 'Professional not found or unavailable' });
    }

    // Check for duplicate booking (same professional, same date, same time slot)
    const dateStart = new Date(appointmentDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(appointmentDate);
    dateEnd.setHours(23, 59, 59, 999);

    const existingBooking = await Booking.findOne({
      professionalId,
      appointmentDate: { $gte: dateStart, $lte: dateEnd },
      timeSlot,
      bookingStatus: { $nin: ['cancelled'] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked for the selected professional',
      });
    }

    // Prevent future date booking in the past
    if (new Date(appointmentDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book an appointment in the past' });
    }

    const totalAmount = service.price;

    const booking = await Booking.create({
      customerId: req.user._id,
      professionalId,
      serviceId,
      appointmentDate,
      timeSlot,
      address,
      instructions,
      servicePrice: service.price,
      totalAmount,
      paymentMethod: paymentMethod || 'demo',
      paymentStatus: paymentMethod === 'demo' ? 'paid' : 'pending',
      statusHistory: [{ status: 'pending', changedBy: req.user.name, note: 'Booking created' }],
    });

    await booking.populate([
      { path: 'serviceId', select: 'serviceName price duration' },
      { path: 'professionalId', populate: { path: 'userId', select: 'name profileImage' } },
    ]);

    // Increment service booking count
    await Service.findByIdAndUpdate(serviceId, { $inc: { totalBookings: 1 } });

    res.status(201).json({ success: true, message: 'Booking created successfully', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's bookings
// @route   GET /api/bookings/my-bookings
// @access  Customer
const getMyBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { customerId: req.user._id };
    if (status) query.bookingStatus = status;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('serviceId', 'serviceName image category')
      .populate({
        path: 'professionalId',
        populate: { path: 'userId', select: 'name profileImage phone' },
      })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('serviceId', 'serviceName image price duration description')
      .populate('customerId', 'name email phone profileImage')
      .populate({
        path: 'professionalId',
        populate: { path: 'userId', select: 'name profileImage phone email' },
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ensure only the customer, professional, or admin can view
    const isCustomer = booking.customerId._id.toString() === req.user._id.toString();
    const isProfessional = req.user.role === 'professional';
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isProfessional && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (professional/admin)
// @route   PUT /api/bookings/:id/status
// @access  Professional, Admin
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'professional_assigned', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.bookingStatus = status;
    if (status === 'completed') {
      booking.completedAt = new Date();
      await Professional.findByIdAndUpdate(booking.professionalId, { $inc: { completedJobs: 1 } });
    }

    booking.statusHistory.push({ status, changedBy: req.user.name, note: note || '' });
    await booking.save();

    res.json({ success: true, message: `Booking status updated to ${status}`, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Customer
const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status: ${booking.bookingStatus}`,
      });
    }

    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by customer';
    booking.cancelledBy = req.user.role === 'admin' ? 'admin' : 'customer';
    booking.statusHistory.push({ status: 'cancelled', changedBy: req.user.name, note: reason || 'Cancelled by customer' });
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get professional's bookings
// @route   GET /api/bookings/professional-bookings
// @access  Professional
const getProfessionalBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const professional = await Professional.findOne({ userId: req.user._id });

    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional profile not found' });
    }

    const query = { professionalId: professional._id };
    if (status) query.bookingStatus = status;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('serviceId', 'serviceName image')
      .populate('customerId', 'name email phone profileImage')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available time slots for a professional on a date
// @route   GET /api/bookings/available-slots
// @access  Public
const getAvailableSlots = async (req, res, next) => {
  try {
    const { professionalId, date } = req.query;

    if (!professionalId || !date) {
      return res.status(400).json({ success: false, message: 'Professional ID and date are required' });
    }

    const allSlots = [
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
      '04:00 PM', '05:00 PM', '06:00 PM',
    ];

    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const bookedSlots = await Booking.find({
      professionalId,
      appointmentDate: { $gte: dateStart, $lte: dateEnd },
      bookingStatus: { $nin: ['cancelled'] },
    }).select('timeSlot');

    const bookedTimes = bookedSlots.map((b) => b.timeSlot);
    const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

    res.json({ success: true, availableSlots, bookedSlots: bookedTimes });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getProfessionalBookings,
  getAvailableSlots,
};
