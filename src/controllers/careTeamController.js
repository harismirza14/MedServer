const careTeamRepo = require("../repositories/careTeamRepository");
const patientRepo = require("../repositories/patientRepository");

async function getCareTeamByPatientId(req, res) {
  try {
    const { patientId } = req.params;
    const { role, userId } = req.user;

    if (role === "patient") {
      const patient = await patientRepo.findById(patientId);
      if (!patient || patient.user_id !== userId) {
        return res.status(403).json({ error: "You can only view your own care team." });
      }
    }

    const careTeam = await careTeamRepo.findByPatientId(patientId);
    if (!careTeam) {
      return res.status(404).json({ error: "Care team not found." });
    }

    res.json(careTeam);
  } catch (err) {
    console.error("Error in getCareTeamByPatientId:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCareTeamByPatientId };