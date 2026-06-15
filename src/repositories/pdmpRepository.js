const { PdmpCheck } = require('../models');

/**
 * Find the latest PDMP check for a given patient
 * @param {string} patientId - Patient ID
 * @returns {Promise<Model|null>}
 */
async function findLatestByPatientId(patientId) {
  return await PdmpCheck.findOne({
    where: { patient_id: patientId },
    order: [['last_checked', 'DESC']],
  });
}

/**
 * Create a new PDMP check record
 * @param {Object} data
 * @returns {Promise<Model>}
 */
async function createPdmpCheck(data) {
  return await PdmpCheck.create(data);
}

module.exports = {
  findLatestByPatientId,
  createPdmpCheck,
};