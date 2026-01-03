'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      {
        id: 1,
        code: 'DRIVER',
        name: 'Driver',
        created_at: new Date(),
      },
      {
        id: 2,
        code: 'OPERATOR',
        name: 'Operator',
        created_at: new Date(),
      },
      {
        id: 3,
        code: 'ADMIN',
        name: 'Admin',
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
