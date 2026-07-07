'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addConstraint('patients', {
      fields: ['user_id'],
      type: 'unique',
      name: 'patients_user_id_unique',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeConstraint('patients', 'patients_user_id_unique');
  },
};