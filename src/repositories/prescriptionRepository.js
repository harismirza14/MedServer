const { Prescription, Medication, Pharmacy, Prescriber, Patient } = require('../models');

const PRESCRIPTION_INCLUDE = [
  { model: Medication, attributes: ["name"] },
  { model: Pharmacy, attributes: ["name", "zipcode"] },
  { model: Prescriber, attributes: ["name", "role"] },
  { model: Patient, attributes: ["patient_id", "name", "dob"] },
];

async function findAllByPatient(patientId, prescriberId = null) {
  const where = { patient_id: patientId };
  if (prescriberId) where.prescriber_id = prescriberId;
  return await Prescription.findAll({
    where,
    include: PRESCRIPTION_INCLUDE,
    order: [["prescription_id", "DESC"]],
  });
}

async function findById(id) {
  return await Prescription.findByPk(id, { include: PRESCRIPTION_INCLUDE });
}

async function createPrescription(data) {
  const prescription = await Prescription.create(data);
  return await findById(prescription.prescription_id);
}

async function updatePrescription(id, updates) {
  await Prescription.update(updates, { where: { prescription_id: id } });
  return await findById(id);
}

module.exports = {
  findAllByPatient,
  findById,
  createPrescription,
  updatePrescription,
};