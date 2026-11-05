const express = require('express');
const router = express.Router();
const { getServices, getServiceById, createService, updateService, deleteService, getFeaturedServices } = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/featured', getFeaturedServices);
router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', protect, adminOnly, createService);
router.put('/:id', protect, adminOnly, updateService);
router.delete('/:id', protect, adminOnly, deleteService);

module.exports = router;
