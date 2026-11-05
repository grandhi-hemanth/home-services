const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllBookings,
  toggleUserStatus,
  verifyProfessional,
  getAllProfessionals,
  getRevenueStats,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/bookings', getAllBookings);
router.get('/professionals', getAllProfessionals);
router.get('/revenue', getRevenueStats);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.put('/professionals/:id/verify', verifyProfessional);

module.exports = router;
