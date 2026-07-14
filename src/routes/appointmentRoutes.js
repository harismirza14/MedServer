const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getPatientAppointments,
  getPrescriberAppointments,
  cancelAppointment,
} = require('../controllers/appointmentController');

router.post('/appointments', createAppointment);
router.get('/patients/:patientId/appointments', getPatientAppointments);
router.get('/prescribers/:prescriberId/appointments', getPrescriberAppointments);
router.patch('/appointments/:appointmentId/cancel', cancelAppointment);

module.exports = router;