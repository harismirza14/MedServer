'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('prescriptions', {
      prescription_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patient_id: {
        type: Sequelize.STRING(20),
        references: { model: 'patients', key: 'patient_id' }
      },
      med_id: {
        type: Sequelize.INTEGER,
        references: { model: 'medications', key: 'med_id' }
      },
      prescriber_id: {
        type: Sequelize.INTEGER,
        references: { model: 'prescribers', key: 'prescriber_id' }
      },
      pharmacy_id: {
        type: Sequelize.INTEGER,
        references: { model: 'pharmacies', key: 'pharmacy_id' }
      },
      dosage: { type: Sequelize.STRING(50) },
      form: { type: Sequelize.STRING(50) },
      instructions: { type: Sequelize.TEXT },
      status: { type: Sequelize.STRING(20) },
      status_label: { type: Sequelize.TEXT },
      patient_note: { type: Sequelize.TEXT },
      discontinued_on: { type: Sequelize.DATEONLY }, 
      discontinue_reason: { type: Sequelize.TEXT },
      external_prescriber: { type: Sequelize.STRING(256) },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('prescriptions');
  }
};