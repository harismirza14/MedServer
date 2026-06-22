module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('prescribers', 'specialty', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('prescribers', 'pmdc_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('prescribers', 'education', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('prescribers', 'specialty');
    await queryInterface.removeColumn('prescribers', 'pmdc_number');
    await queryInterface.removeColumn('prescribers', 'education');
  },
};