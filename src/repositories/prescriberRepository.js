const { Prescriber } = require('../models');

/**
 * Find a prescriber by primary key
 * @param {number|string} id - Prescriber ID
 * @returns {Promise<Model|null>}
 */
async function findById(id) {
  return await Prescriber.findByPk(id);
}

/**
 * Find all prescribers (select fields)
 * @returns {Promise<Array>}
 */
async function findAll() {
  return await Prescriber.findAll({
    attributes: ['prescriber_id', 'name', 'role'],
  });
}

/**
 * Create a new prescriber
 * @param {Object} data
 * @returns {Promise<Model>}
 */
async function createPrescriber(data) {
  return await Prescriber.create(data);
}

/**
 * Update a prescriber
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Array>}
 */
async function updatePrescriber(id, updates) {
  return await Prescriber.update(updates, { where: { prescriber_id: id } });
}

module.exports = {
  findById,
  findAll,
  createPrescriber,
  updatePrescriber,
};