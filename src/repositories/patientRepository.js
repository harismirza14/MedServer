const { Patient, Prescription } = require('../models');

/**
 * Find a patient by primary key (patient_id)
 * @param {string} patientId - The patient ID (e.g., 'P001')
 * @returns {Promise<Model|null>} - Patient instance or null
 */
async function findById(patientId) {
  return await Patient.findByPk(patientId);
}

/**
 * Find all patients that a given prescriber has prescribed to
 * (distinct patients with at least one prescription from that prescriber)
 * @param {number|string} prescriberId - The prescriber ID
 * @returns {Promise<Array>} - Array of Patient instances (selected fields)
 */
async function findByPrescriberId(prescriberId) {
  return await Patient.findAll({
    include: [{
      model: Prescription,
      where: { prescriber_id: prescriberId },
      required: true,
      attributes: [],
    }],
    attributes: ['patient_id', 'name', 'dob', 'insurance'],
    group: ['Patient.patient_id', 'Patient.name', 'Patient.dob', 'Patient.insurance'],
    subQuery: false,
    order: [['patient_id', 'ASC']],
  });
}

/**
 * Create a new patient (if needed in future)
 * @param {Object} data - Patient data
 * @returns {Promise<Model>}
 */
async function createPatient(data) {
  return await Patient.create(data);
}

/**
 * Update a patient (if needed)
 * @param {string} patientId - Patient ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Array>} - Number of affected rows
 */
async function updatePatient(patientId, updates) {
  return await Patient.update(updates, { where: { patient_id: patientId } });
}

/**
 * Delete a patient (use with caution)
 * @param {string} patientId - Patient ID
 * @returns {Promise<number>} - Number of deleted rows
 */
async function deletePatient(patientId) {
  return await Patient.destroy({ where: { patient_id: patientId } });
}

module.exports = {
  findById,
  findByPrescriberId,
  createPatient,
  updatePatient,
  deletePatient,
};