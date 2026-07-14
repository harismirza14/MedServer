'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('appointments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      patient_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: { model: 'patients', key: 'patient_id' },
        onDelete: 'CASCADE',
      },
      prescriber_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'prescribers', key: 'prescriber_id' },
        onDelete: 'CASCADE',
      },
      appointment_date: { type: Sequelize.DATEONLY, allowNull: false },
      start_time: { type: Sequelize.TIME, allowNull: false },
      end_time: { type: Sequelize.TIME, allowNull: false },
      status: {
        type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('appointments');
  },
};