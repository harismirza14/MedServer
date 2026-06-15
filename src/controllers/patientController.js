const patientRepo = require('../repositories/patientRepository');
const pdmpRepo = require('../repositories/pdmpRepository');

async function getPatientById(req, res) {
  try {
    const patient = await patientRepo.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPdmpByPatientId(req, res) {
  try {
    const record = await pdmpRepo.findLatestByPatientId(req.params.id);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get all patients that a doctor has prescribed to
async function getDoctorPatients(req, res) {
  const { prescriberId } = req.params;
  try {
    const patients = await patientRepo.findByPrescriberId(prescriberId);
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getPatientById, getPdmpByPatientId, getDoctorPatients };