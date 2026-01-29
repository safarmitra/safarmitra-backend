'use strict';

module.exports = {
  async up(queryInterface) {
    const roles = [
      { code: 'DRIVER', name: 'Driver' },
      { code: 'OPERATOR', name: 'Operator' },
    ];

    for (const role of roles) {
      // Check if role already exists
      const [existingRoles] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE code = '${role.code}'`
      );

      if (existingRoles.length === 0) {
        await queryInterface.bulkInsert('roles', [
          {
            code: role.code,
            name: role.name,
            created_at: new Date(),
          },
        ]);
        console.log(`✅ Role '${role.code}' created`);
      } else {
        console.log(`⏭️ Role '${role.code}' already exists, skipping`);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', {
      code: ['DRIVER', 'OPERATOR'],
    });
  },
};
