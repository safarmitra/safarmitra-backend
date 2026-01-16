'use strict';

module.exports = {
  async up(queryInterface) {
    // Check if ADMIN role already exists
    const [existingRoles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE code = 'ADMIN'`
    );

    if (existingRoles.length === 0) {
      await queryInterface.bulkInsert('roles', [
        {
          code: 'ADMIN',
          name: 'Administrator',
          created_at: new Date(),
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', { code: 'ADMIN' });
  },
};
