'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('doctor_availability', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      prescriber_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'prescribers', key: 'prescriber_id' },
        onDelete: 'CASCADE',
      },
      day_of_week: { type: Sequelize.STRING(10), allowNull: false },
      start_time: { type: Sequelize.TIME, allowNull: false },
      end_time: { type: Sequelize.TIME, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('doctor_availability');
  },
};