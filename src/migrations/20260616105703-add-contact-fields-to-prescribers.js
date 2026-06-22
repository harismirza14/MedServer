module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('prescribers', 'dob', { type: Sequelize.DATEONLY, allowNull: true });
    await queryInterface.addColumn('prescribers', 'address', { type: Sequelize.TEXT, allowNull: true });
    await queryInterface.addColumn('prescribers', 'gender', { type: Sequelize.STRING(10), allowNull: true });
    await queryInterface.addColumn('prescribers', 'phone_number', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('prescribers', 'email', { type: Sequelize.STRING(100), allowNull: true });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('prescribers', 'dob');
    await queryInterface.removeColumn('prescribers', 'address');
    await queryInterface.removeColumn('prescribers', 'gender');
    await queryInterface.removeColumn('prescribers', 'phone_number');
    await queryInterface.removeColumn('prescribers', 'email');
  },
};