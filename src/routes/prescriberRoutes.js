const express = require('express');
const { getAllPrescribers, createPrescriber, getPrescriberById } = require('../controllers/prescriberController');
const authorizeRoles = require('../middlewares/authorizeRoles');
const router = express.Router();

router.get('/prescribers/:id', getPrescriberById);
router.get('/prescribers', authorizeRoles('admin'), getAllPrescribers); 
router.post('/prescribers', authorizeRoles('admin'), createPrescriber);

module.exports = router;