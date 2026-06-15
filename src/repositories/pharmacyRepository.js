const { Pharmacy } = require('../models');

/**
 * Find pharmacies by zip code, returning selected fields and adding an 'id' alias
 * @param {string} zip - Zip code
 * @returns {Promise<Array>}
 */
async function findByZip(zip) {
  const pharmacies = await Pharmacy.findAll({
    attributes: ['pharmacy_id', 'name', 'address', 'zipcode', 'phone', 'hours'],
    where: { zipcode: zip },
  });
  // Map to add 'id' field (alias for pharmacy_id) as used in frontend
  return pharmacies.map(p => ({ ...p.toJSON(), id: p.pharmacy_id }));
}

/**
 * Find pharmacy by ID
 * @param {number} id
 * @returns {Promise<Model|null>}
 */
async function findById(id) {
  return await Pharmacy.findByPk(id);
}

/**
 * Create a new pharmacy
 * @param {Object} data
 * @returns {Promise<Model>}
 */
async function createPharmacy(data) {
  return await Pharmacy.create(data);
}

/**
 * Update a pharmacy
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Array>}
 */
async function updatePharmacy(id, updates) {
  return await Pharmacy.update(updates, { where: { pharmacy_id: id } });
}

module.exports = {
  findByZip,
  findById,
  createPharmacy,
  updatePharmacy,
};