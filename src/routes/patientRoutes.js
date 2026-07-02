const express = require('express');
const router = express.Router();
const {
  getPatientById,
  getPdmpByPatientId,
  getDoctorPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getCareTeam,
} = require('../controllers/patientController');
const authorizeRoles = require('../middlewares/authorizeRoles');

router.get('/patients/:id', getPatientById);
router.get('/patients/:id/pdmp', getPdmpByPatientId);
router.get('/prescribers/:prescriberId/patients', getDoctorPatients);
router.post('/patients', createPatient);
router.put('/patients/:id', updatePatient);
router.delete('/patients/:id', authorizeRoles('doctor'), deletePatient);
router.get('/patients/:patientId/care-team', getCareTeam);
module.exports = router;