const { User } = require('../models');

async function findByEmail(email) {
  return await User.findOne({ where: { email } });
}

async function findById(userId) {
  return await User.findByPk(userId, {
    attributes: { exclude: ['password_hash'] },
  });
}

async function createUser(data, options = {}) {
  return await User.create(data, options);
}

async function deleteUser(userId, options = {}) {
  return await User.destroy({ where: { user_id: userId }, ...options });
}

module.exports = { findByEmail, findById, createUser, deleteUser };