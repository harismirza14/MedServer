const express = require('express');
const router = express.Router();
const { getCareTeamByPatientId } = require('../controllers/careTeamController');

router.get('/patients/:patientId/care-team', getCareTeamByPatientId);

module.exports = router;