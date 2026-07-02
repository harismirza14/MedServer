const express = require('express');
const router = express.Router();
const {
  createPrescriber,
  getPrescriberById,
  getAllPrescribers,
  updatePrescriber,
  deletePrescriber,
} = require('../controllers/prescriberController');
const authorizeRoles = require('../middlewares/authorizeRoles');

router.get('/prescribers', authorizeRoles('admin'), getAllPrescribers);
router.get('/prescribers/:id', getPrescriberById);
router.post('/prescribers', authorizeRoles('admin'), createPrescriber);
router.put('/prescribers/:id', updatePrescriber);
router.delete('/prescribers/:id', authorizeRoles('admin'), deletePrescriber);

module.exports = router;