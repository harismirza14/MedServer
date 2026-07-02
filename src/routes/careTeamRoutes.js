const express = require('express');
const router = express.Router();
const {
  getCareTeamByPatientId,
  addCareTeamMember,
  removeCareTeamMember,
} = require('../controllers/careTeamController');
const authorizeRoles = require('../middlewares/authorizeRoles');

router.get('/patients/:patientId/care-team', getCareTeamByPatientId);
router.post('/patients/:patientId/care-team', authorizeRoles('doctor'), addCareTeamMember);
router.delete('/patients/:patientId/care-team/:memberId', authorizeRoles('doctor'), removeCareTeamMember);

module.exports = router;