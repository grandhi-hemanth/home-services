const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getProfessionalBookings,
  getAvailableSlots,
} = require('../controllers/bookingController');
const { protect, professionalOnly, customerOnly } = require('../middleware/authMiddleware');

router.get('/available-slots', getAvailableSlots);
router.post('/', protect, customerOnly, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/professional-bookings', protect, professionalOnly, getProfessionalBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, professionalOnly, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
