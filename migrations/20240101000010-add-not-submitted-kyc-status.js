'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update existing users who have kyc_status = 'PENDING' but no documents
    // to have kyc_status = 'NOT_SUBMITTED'
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET kyc_status = 'NOT_SUBMITTED' 
      WHERE kyc_status = 'PENDING' 
      AND id NOT IN (
        SELECT DISTINCT user_id FROM user_identity
      )
    `);

    // Change the default value for new users
    await queryInterface.changeColumn('users', 'kyc_status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'NOT_SUBMITTED',
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert users with NOT_SUBMITTED back to PENDING
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET kyc_status = 'PENDING' 
      WHERE kyc_status = 'NOT_SUBMITTED'
    `);

    // Change the default value back to PENDING
    await queryInterface.changeColumn('users', 'kyc_status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'PENDING',
    });
  },
};
