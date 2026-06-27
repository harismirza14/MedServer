const { Prescriber, User, sequelize } = require("../models");

async function findById(prescriberId) {
  return await Prescriber.findByPk(prescriberId, {
    include: [{ model: User, attributes: { exclude: ["password_hash"] } }],
  });
}
async function findAll() {
  const prescribers = await Prescriber.findAll({
    include: [{ model: User, attributes: { exclude: ['password_hash'] } }],
    attributes: ['prescriber_id', 'specialty', 'pmdc_number', 'education'],
    order: [['prescriber_id', 'ASC']],
  });

  const seen = new Map();
  return prescribers.filter(p => {
    const email = p.User.email.toLowerCase();
    if (seen.has(email)) return false;
    seen.set(email, true);
    return true;
  }).map(p => {
    const { User, ...prescriberData } = p.toJSON();
    return { ...User, ...prescriberData };
  });
}

async function createPrescriber(data, options) {
  return await Prescriber.create(data, options);
}

async function updatePrescriber(id, updates) {
  return await Prescriber.update(updates, { where: { prescriber_id: id } });
}

async function findByUserId(userId) {
  return await Prescriber.findOne({ where: { user_id: userId } });
}

module.exports = {
  findById,
  findByUserId,
  findAll,
  createPrescriber,
  updatePrescriber,
};