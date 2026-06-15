const express = require('express');
const {
  getPrescriptionsByPatient,
  createPrescription,
  updatePrescription,
  discontinuePrescription,
  recontinuePrescription,
} = require('../controllers/prescriptionController');

const router = express.Router();

router.get('/patients/:patientId/prescriptions', getPrescriptionsByPatient);
router.post('/prescriptions', createPrescription);
router.put('/prescriptions/:id', updatePrescription);
router.patch('/prescriptions/:id/discontinue', discontinuePrescription);
router.patch('/prescriptions/:id/recontinue', recontinuePrescription);

module.exports = router;