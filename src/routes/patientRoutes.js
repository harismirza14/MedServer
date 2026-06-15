const express = require('express');
const { getPatientById, getPdmpByPatientId, getDoctorPatients } = require('../controllers/patientController');
const router = express.Router();

router.get('/patients/:id', getPatientById);
router.get('/patients/:id/pdmp', getPdmpByPatientId);
router.get('/prescribers/:prescriberId/patients', getDoctorPatients);

module.exports = router;