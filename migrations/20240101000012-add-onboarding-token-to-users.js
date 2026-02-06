'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist
    const columns = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('onboarding_token', 'onboarding_token_expires_at')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingColumns = columns.map(c => c.column_name);

    if (!existingColumns.includes('onboarding_token')) {
      // Add onboarding_token column
      await queryInterface.addColumn('users', 'onboarding_token', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!existingColumns.includes('onboarding_token_expires_at')) {
      // Add onboarding_token_expires_at column
      await queryInterface.addColumn('users', 'onboarding_token_expires_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    // Add index safely
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'users'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('idx_users_onboarding_token')) {
      await queryInterface.addIndex('users', ['onboarding_token'], {
        name: 'idx_users_onboarding_token',
        where: {
          onboarding_token: {
            [Sequelize.Op.ne]: null,
          },
        },
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_onboarding_token');
    await queryInterface.removeColumn('users', 'onboarding_token_expires_at');
    await queryInterface.removeColumn('users', 'onboarding_token');
  },
};
