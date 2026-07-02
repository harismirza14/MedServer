const careTeamRepo = require("../repositories/careTeamRepository");
const patientRepo = require("../repositories/patientRepository");
const prescriberRepo = require("../repositories/prescriberRepository");

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

async function addCareTeamMember(req, res) {
  try {
    const { patientId } = req.params;
    const { prescriber_id, role } = req.body;
    const { roleSpecificId } = req.user;

    if (!prescriber_id) {
      return res.status(400).json({ error: "prescriber_id is required." });
    }

    const authorized = await patientRepo.isPatientOfPrescriber(roleSpecificId, patientId);
    if (!authorized) {
      return res.status(403).json({ error: "You do not have a care relationship with this patient." });
    }

    const prescriber = await prescriberRepo.findById(prescriber_id);
    if (!prescriber) {
      return res.status(404).json({ error: "Prescriber not found." });
    }

    const { alreadyMember, member } = await careTeamRepo.addMember(patientId, prescriber_id, role);
    if (alreadyMember) {
      return res.status(409).json({ error: "This prescriber is already on the patient's care team." });
    }

    res.status(201).json(member);
  } catch (err) {
    console.error("Error in addCareTeamMember:", err);
    res.status(500).json({ error: err.message });
  }
}

async function removeCareTeamMember(req, res) {
  try {
    const { patientId, memberId } = req.params;
    const { roleSpecificId } = req.user;

    const authorized = await patientRepo.isPatientOfPrescriber(roleSpecificId, patientId);
    if (!authorized) {
      return res.status(403).json({ error: "You do not have a care relationship with this patient." });
    }

    const removed = await careTeamRepo.removeMember(patientId, memberId);
    if (!removed) {
      return res.status(404).json({ error: "Care team member not found." });
    }

    res.json({ message: "Care team member removed." });
  } catch (err) {
    console.error("Error in removeCareTeamMember:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getCareTeamByPatientId, addCareTeamMember, removeCareTeamMember };