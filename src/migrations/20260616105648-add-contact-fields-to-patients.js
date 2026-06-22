module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('patients', 'gender', { type: Sequelize.STRING(10), allowNull: true });
    await queryInterface.addColumn('patients', 'phone_number', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('patients', 'email', { type: Sequelize.STRING(100), allowNull: true });
    // Remove visit_frequency and next_appointment (they move to CareTaker)
    await queryInterface.removeColumn('patients', 'visit_frequency');
    await queryInterface.removeColumn('patients', 'next_appointment');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('patients', 'gender');
    await queryInterface.removeColumn('patients', 'phone_number');
    await queryInterface.removeColumn('patients', 'email');
    await queryInterface.addColumn('patients', 'visit_frequency', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('patients', 'next_appointment', { type: Sequelize.DATE, allowNull: true });
  },
};