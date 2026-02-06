'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist
    const columns = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('email', 'password_hash')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingColumns = columns.map(c => c.column_name);

    if (!existingColumns.includes('email')) {
      // Add email column
      await queryInterface.addColumn('users', 'email', {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      });
    }

    if (!existingColumns.includes('password_hash')) {
      // Add password_hash column
      await queryInterface.addColumn('users', 'password_hash', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // Add index safely
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'users'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('users_email_idx')) {
      await queryInterface.addIndex('users', ['email'], {
        name: 'users_email_idx',
        unique: true,
        where: {
          email: {
            [Sequelize.Op.ne]: null,
          },
        },
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_email_idx');
    await queryInterface.removeColumn('users', 'password_hash');
    await queryInterface.removeColumn('users', 'email');
  },
};
