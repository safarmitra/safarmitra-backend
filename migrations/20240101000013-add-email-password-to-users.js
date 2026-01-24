'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add email column
    await queryInterface.addColumn('users', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    // Add password_hash column
    await queryInterface.addColumn('users', 'password_hash', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add index on email for faster lookups
    await queryInterface.addIndex('users', ['email'], {
      name: 'users_email_idx',
      unique: true,
      where: {
        email: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_email_idx');
    await queryInterface.removeColumn('users', 'password_hash');
    await queryInterface.removeColumn('users', 'email');
  },
};
