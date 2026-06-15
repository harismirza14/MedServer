const { Medication } = require('../models');

/**
 * Find all medications (select med_id and name, ordered by name)
 * @returns {Promise<Array>}
 */
async function findAll() {
  return await Medication.findAll({
    attributes: ['med_id', 'name'],
    order: [['name', 'ASC']],
  });
}

/**
 * Find or create a medication by name
 * @param {string} name - Medication name
 * @returns {Promise<Model>} - The found or created instance
 */
async function findOrCreateByName(name) {
  const [medication] = await Medication.findOrCreate({
    where: { name },
    defaults: { name },
  });
  return medication;
}

/**
 * Find a medication by ID
 * @param {number} id
 * @returns {Promise<Model|null>}
 */
async function findById(id) {
  return await Medication.findByPk(id);
}

/**
 * Create a new medication
 * @param {Object} data
 * @returns {Promise<Model>}
 */
async function createMedication(data) {
  return await Medication.create(data);
}

module.exports = {
  findAll,
  findOrCreateByName,
  findById,
  createMedication,
};