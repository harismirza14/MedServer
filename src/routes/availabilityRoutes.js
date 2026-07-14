const express = require('express');
const router = express.Router();
const {
  getAvailability,
  addAvailability,
  deleteAvailability,
  getFreeSlots,
} = require('../controllers/availabilityController');

router.get('/prescribers/:prescriberId/availability', getAvailability);
router.post('/prescribers/:prescriberId/availability', addAvailability);
router.delete('/prescribers/:prescriberId/availability/:slotId', deleteAvailability);
router.get('/prescribers/:prescriberId/available-slots', getFreeSlots);

module.exports = router;