'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const patientsCols = await queryInterface.describeTable('patients');
    const prescribersCols = await queryInterface.describeTable('prescribers');

    // 0. Pre-flight: report any users.patient_id / users.prescriber_id values
    //    that don't correspond to a real row in patients / prescribers.
    //    These would silently fail to backfill, then trip the NOT NULL check later.
    const [orphanPatientUsers] = await queryInterface.sequelize.query(`
      SELECT u.user_id, u.patient_id
      FROM users u
      LEFT JOIN patients p ON p.patient_id = u.patient_id
      WHERE u.role = 'patient' AND p.patient_id IS NULL
    `);
    const [orphanPrescriberUsers] = await queryInterface.sequelize.query(`
      SELECT u.user_id, u.prescriber_id
      FROM users u
      LEFT JOIN prescribers pr ON pr.prescriber_id = u.prescriber_id
      WHERE u.role = 'doctor' AND pr.prescriber_id IS NULL
    `);

    if (orphanPatientUsers.length > 0 || orphanPrescriberUsers.length > 0) {
      console.warn(
        `[create-users-table] Found ${orphanPatientUsers.length} patient-role users ` +
        `with no matching patients row, and ${orphanPrescriberUsers.length} doctor-role users ` +
        `with no matching prescribers row. These users will exist with no linked record.`
      );
    }

    // 1. Add user_id columns only if they don't already exist
    if (!patientsCols.user_id) {
      await queryInterface.addColumn('patients', 'user_id', { type: Sequelize.INTEGER, allowNull: true });
    }
    if (!prescribersCols.user_id) {
      await queryInterface.addColumn('prescribers', 'user_id', { type: Sequelize.INTEGER, allowNull: true });
    }

    // 2. Backfill user_id by matching against users.patient_id / users.prescriber_id
    await queryInterface.sequelize.query(`
      UPDATE patients p
      SET user_id = u.user_id
      FROM users u
      WHERE p.patient_id = u.patient_id
        AND u.role = 'patient'
        AND p.user_id IS NULL
    `);

    await queryInterface.sequelize.query(`
      UPDATE prescribers pr
      SET user_id = u.user_id
      FROM users u
      WHERE pr.prescriber_id = u.prescriber_id
        AND u.role = 'doctor'
        AND pr.user_id IS NULL
    `);

    // 3. Safety check before enforcing NOT NULL — fail loudly instead of silently truncating data
    const [[{ count: patientNulls }]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) FROM patients WHERE user_id IS NULL`
    );
    const [[{ count: prescriberNulls }]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) FROM prescribers WHERE user_id IS NULL`
    );

    if (Number(patientNulls) > 0 || Number(prescriberNulls) > 0) {
      throw new Error(
        `Cannot enforce NOT NULL: ${patientNulls} patients and ${prescriberNulls} prescribers ` +
        `have no matching user. Check for orphaned rows before re-running.`
      );
    }

    // 4. Lock down NOT NULL
    await queryInterface.changeColumn('patients', 'user_id', { type: Sequelize.INTEGER, allowNull: false });
    await queryInterface.changeColumn('prescribers', 'user_id', { type: Sequelize.INTEGER, allowNull: false });

    // 5. Add FK constraints only if missing
    const [patientsFk] = await queryInterface.sequelize.query(
      `SELECT conname FROM pg_constraint WHERE conname = 'patients_user_id_fk'`
    );
    if (patientsFk.length === 0) {
      await queryInterface.addConstraint('patients', {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'patients_user_id_fk',
        references: { table: 'users', field: 'user_id' },
        onDelete: 'CASCADE',
      });
    }

    const [prescribersFk] = await queryInterface.sequelize.query(
      `SELECT conname FROM pg_constraint WHERE conname = 'prescribers_user_id_fk'`
    );
    if (prescribersFk.length === 0) {
      await queryInterface.addConstraint('prescribers', {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'prescribers_user_id_fk',
        references: { table: 'users', field: 'user_id' },
        onDelete: 'CASCADE',
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeConstraint('patients', 'patients_user_id_fk').catch(() => {});
    await queryInterface.removeConstraint('prescribers', 'prescribers_user_id_fk').catch(() => {});
    await queryInterface.removeColumn('patients', 'user_id').catch(() => {});
    await queryInterface.removeColumn('prescribers', 'user_id').catch(() => {});
  },
};