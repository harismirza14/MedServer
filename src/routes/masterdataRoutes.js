const express = require('express');
const { getMedications, getPharmaciesByZip } = require('../controllers/masterDataController');
const router = express.Router();

router.get('/medications', getMedications);
router.get('/pharmacies', getPharmaciesByZip);

module.exports = router;