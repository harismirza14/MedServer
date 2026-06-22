const flattenPrescription = require('../utils/flattenPrescription');
const prescriptionRepo = require('../repositories/prescriptionRepository');
const medicationRepo = require('../repositories/medicationRepository');


async function getPrescriptionsByPatient(req, res) {
  const { patientId } = req.params;
  const { prescriber_id } = req.query;
  try {
    const prescriptions = await prescriptionRepo.findAllByPatient(patientId, prescriber_id) || [];
    res.json(prescriptions.map(flattenPrescription));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createPrescription(req, res) {
  const {
    patient_id,
    med_name,
    prescriber_id = null,
    pharmacy_id = null,
    dosage,
    form,
    instructions,
    status,
    status_label,
    patient_note,
    external_prescriber = null,
  } = req.body;

  try {
    const medication = await medicationRepo.findOrCreateByName(med_name);
    const prescriptionData = {
      patient_id,
      med_id: medication.med_id,
      prescriber_id,
      pharmacy_id,
      dosage,
      form,
      instructions,
      status,
      status_label,
      patient_note,
      external_prescriber,
    };
    const newPrescription = await prescriptionRepo.createPrescription(prescriptionData);
    res.status(201).json(flattenPrescription(newPrescription));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function updatePrescription(req, res) {
  const { id } = req.params;
  const { userId, role, roleSpecificId } = req.user; 

  try {
    const existing = await prescriptionRepo.findById(id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    if (role === "patient") {
      return res.status(403).json({ error: "Patients cannot edit prescriptions" });
    }
    if (role === "doctor" && String(existing.prescriber_id) !== String(roleSpecificId)) {
      return res.status(403).json({ error: "You can only edit your own prescriptions" });
    }

    const data = req.body.updates || req.body;
    const allowedFields = [
      "dosage", "form", "instructions", "patient_note",
      "pharmacy_id", "med_id", "status", "external_prescriber",
    ];
    const updates = {};
    allowedFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(data, field)) updates[field] = data[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedPrescription = await prescriptionRepo.updatePrescription(id, updates);
    res.json(flattenPrescription(updatedPrescription));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function discontinuePrescription(req, res) {
  const { reason } = req.body;
  try {
    const updates = {
      status: "discontinued",
      discontinued_on: new Date(),
      discontinue_reason: reason,
    };
    const updated = await prescriptionRepo.updatePrescription(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(flattenPrescription(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function recontinuePrescription(req, res) {
  try {
    const updates = {
      status: "success",
      discontinued_on: null,
      discontinue_reason: null,
    };
    const updated = await prescriptionRepo.updatePrescription(req.params.id, updates);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(flattenPrescription(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getPrescriptionsByPatient,
  createPrescription,
  updatePrescription,
  discontinuePrescription,
  recontinuePrescription,
};