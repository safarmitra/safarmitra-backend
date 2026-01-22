'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add onboarding_token column
    await queryInterface.addColumn('users', 'onboarding_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // Add onboarding_token_expires_at column
    await queryInterface.addColumn('users', 'onboarding_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add index for faster token lookup
    await queryInterface.addIndex('users', ['onboarding_token'], {
      name: 'idx_users_onboarding_token',
      where: {
        onboarding_token: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'idx_users_onboarding_token');
    await queryInterface.removeColumn('users', 'onboarding_token_expires_at');
    await queryInterface.removeColumn('users', 'onboarding_token');
  },
};
