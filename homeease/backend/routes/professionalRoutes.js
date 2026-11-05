const express = require('express');
const router = express.Router();
const {
  getProfessionals,
  getProfessionalById,
  getProfessionalsByService,
  updateProfessionalProfile,
  updateAvailability,
  getMyProfessionalProfile,
} = require('../controllers/professionalController');
const { protect, professionalOnly } = require('../middleware/authMiddleware');

router.get('/', getProfessionals);
router.get('/my-profile', protect, professionalOnly, getMyProfessionalProfile);
router.get('/by-service/:serviceId', getProfessionalsByService);
router.get('/:id', getProfessionalById);
router.put('/profile', protect, professionalOnly, updateProfessionalProfile);
router.put('/availability', protect, professionalOnly, updateAvailability);

module.exports = router;
