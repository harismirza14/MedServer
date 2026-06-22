const express = require('express');
const { getPatientById, getPdmpByPatientId, getDoctorPatients, createPatient } = require('../controllers/patientController');
const router = express.Router();

router.get('/patients/:id', getPatientById);
router.get('/patients/:id/pdmp', getPdmpByPatientId);
router.get('/prescribers/:prescriberId/patients', getDoctorPatients);
router.post('/patients', createPatient);

module.exports = router;