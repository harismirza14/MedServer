'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addConstraint('prescribers', {
      fields: ['user_id'],
      type: 'unique',
      name: 'prescribers_user_id_unique',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeConstraint('prescribers', 'prescribers_user_id_unique');
  },
};