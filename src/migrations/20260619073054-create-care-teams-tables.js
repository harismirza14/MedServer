'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('care_teams', {
      care_team_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      patient_id: { type: Sequelize.STRING(20), allowNull: false },
      next_appointment: { type: Sequelize.DATE, allowNull: true },
      visit_frequency: { type: Sequelize.STRING(50), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('care_teams', {
      fields: ['patient_id'],
      type: 'foreign key',
      name: 'care_teams_patient_id_fk',
      references: { table: 'patients', field: 'patient_id' },
      onDelete: 'CASCADE',
    });

    // One care team per patient — remove this if you decide you want historical/multiple teams
    await queryInterface.addConstraint('care_teams', {
      fields: ['patient_id'],
      type: 'unique',
      name: 'care_teams_patient_id_unique',
    });

    await queryInterface.createTable('care_team_members', {
      member_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      care_team_id: { type: Sequelize.INTEGER, allowNull: false },
      prescriber_id: { type: Sequelize.INTEGER, allowNull: false },
      role: { type: Sequelize.STRING(50), allowNull: true },
    });

    await queryInterface.addConstraint('care_team_members', {
      fields: ['care_team_id'],
      type: 'foreign key',
      name: 'care_team_members_care_team_id_fk',
      references: { table: 'care_teams', field: 'care_team_id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('care_team_members', {
      fields: ['prescriber_id'],
      type: 'foreign key',
      name: 'care_team_members_prescriber_id_fk',
      references: { table: 'prescribers', field: 'prescriber_id' },
      onDelete: 'CASCADE',
    });

    // Prevent the same prescriber being added twice to the same care team
    await queryInterface.addConstraint('care_team_members', {
      fields: ['care_team_id', 'prescriber_id'],
      type: 'unique',
      name: 'care_team_members_unique_pair',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('care_team_members');
    await queryInterface.dropTable('care_teams');
  },
};