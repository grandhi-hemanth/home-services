const express = require('express');
const router = express.Router();
const { createReview, getReviewsByProfessional, getAllReviews } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/all', protect, adminOnly, getAllReviews);
router.get('/:professionalId', getReviewsByProfessional);

module.exports = router;
