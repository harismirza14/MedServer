'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'admin';`
    );
  },
  down: async () => {
    // Postgres doesn't support removing ENUM values without recreating the type.
    // Not implemented — treat this migration as one-directional.
  },
};