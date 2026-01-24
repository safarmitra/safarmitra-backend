'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Get admin email and password from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safarmitra.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Get ADMIN role ID
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE code = 'ADMIN'`
    );

    if (roles.length === 0) {
      console.log('ADMIN role not found. Please run the seed-admin-role migration first.');
      return;
    }

    const adminRoleId = roles[0].id;

    // Check if admin user already exists
    const [existingAdmin] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = '${adminEmail}'`
    );

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists. Skipping...');
      return;
    }

    // Create admin user
    await queryInterface.bulkInsert('users', [
      {
        role_id: adminRoleId,
        phone_number: '+910000000000', // Placeholder phone for admin
        email: adminEmail,
        password_hash: passwordHash,
        full_name: 'System Administrator',
        kyc_status: 'APPROVED', // Admin doesn't need KYC
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log(`Admin user created with email: ${adminEmail}`);
    console.log('IMPORTANT: Change the default password in production!');
  },

  async down(queryInterface) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@safarmitra.com';
    await queryInterface.bulkDelete('users', { email: adminEmail });
  },
};
