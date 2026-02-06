#!/usr/bin/env node

/**
 * Database Reset Script
 * 
 * This script will:
 * 1. Truncate all tables (delete all data)
 * 2. Re-seed essential data (roles, admin user)
 * 
 * Usage:
 *   Development: node scripts/reset-database.js
 *   Production:  node scripts/reset-database.js --force
 * 
 * WARNING: This will DELETE ALL DATA from the database!
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const readline = require('readline');

// Configuration
const CONFIG = {
  // Tables to truncate (order matters for foreign keys, but we use CASCADE)
  tables: [
    'booking_requests',
    'car_images',
    'cars',
    'notifications',
    'user_identity',
    'users',
    'roles',
  ],
  // Tables to preserve (won't be truncated)
  preserveTables: ['SequelizeMeta'],
  // Default admin credentials
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@safarmitra.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    phone: '+910000000000',
    fullName: 'System Administrator',
  },
  // Roles to seed
  roles: [
    { id: 1, code: 'DRIVER', name: 'Driver' },
    { id: 2, code: 'OPERATOR', name: 'Operator' },
    { id: 3, code: 'ADMIN', name: 'Admin' },
  ],
};

// Get environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const forceFlag = process.argv.includes('--force');

// Create database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  }
);

/**
 * Prompt user for confirmation
 */
const confirmAction = (message) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
};

/**
 * Truncate all tables
 */
const truncateTables = async () => {
  console.log('\n📋 Truncating tables...\n');

  // Get all tables from database
  const [tables] = await sequelize.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN (${CONFIG.preserveTables.map(t => `'${t}'`).join(', ')})
    ORDER BY tablename
  `);

  if (tables.length === 0) {
    console.log('   No tables found to truncate.');
    return;
  }

  // Show tables to be truncated
  console.log(`   Found ${tables.length} tables:`);
  tables.forEach((t, i) => console.log(`   ${i + 1}. ${t.tablename}`));
  console.log('');

  // Build truncate command for all tables at once (handles foreign keys)
  const tableNames = tables.map(t => `"${t.tablename}"`).join(', ');
  await sequelize.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);

  console.log('   ✅ All tables truncated successfully!\n');

  // Verify
  console.log('   Verifying (all should be 0):');
  for (const table of tables) {
    const [[{ count }]] = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${table.tablename}"`
    );
    const status = count === '0' || count === 0 ? '✅' : '❌';
    console.log(`   ${status} ${table.tablename}: ${count} rows`);
  }
};

/**
 * Seed roles
 */
const seedRoles = async () => {
  console.log('\n📋 Seeding roles...\n');

  for (const role of CONFIG.roles) {
    // Check if role exists
    const [existing] = await sequelize.query(
      `SELECT id FROM roles WHERE code = '${role.code}'`
    );

    if (existing.length > 0) {
      console.log(`   ⏭️  Role ${role.code} already exists, skipping`);
      continue;
    }

    await sequelize.query(`
      INSERT INTO roles (id, code, name, created_at)
      VALUES (${role.id}, '${role.code}', '${role.name}', NOW())
    `);
    console.log(`   ✅ Created role: ${role.code}`);
  }
};

/**
 * Seed admin user
 */
const seedAdmin = async () => {
  console.log('\n📋 Seeding admin user...\n');

  // Get admin role ID
  const [roles] = await sequelize.query(
    `SELECT id FROM roles WHERE code = 'ADMIN'`
  );

  if (roles.length === 0) {
    console.log('   ❌ ADMIN role not found. Please seed roles first.');
    return;
  }

  const adminRoleId = roles[0].id;

  // Check if admin exists
  const [existing] = await sequelize.query(
    `SELECT id FROM users WHERE email = '${CONFIG.admin.email}'`
  );

  if (existing.length > 0) {
    console.log(`   ⏭️  Admin user already exists, skipping`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(CONFIG.admin.password, 10);

  // Create admin user
  await sequelize.query(`
    INSERT INTO users (role_id, phone_number, email, password_hash, full_name, kyc_status, is_active, created_at, updated_at)
    VALUES (${adminRoleId}, '${CONFIG.admin.phone}', '${CONFIG.admin.email}', '${passwordHash}', '${CONFIG.admin.fullName}', 'APPROVED', true, NOW(), NOW())
  `);

  console.log(`   ✅ Created admin user: ${CONFIG.admin.email}`);
  console.log(`   📧 Email: ${CONFIG.admin.email}`);
  console.log(`   🔑 Password: ${CONFIG.admin.password}`);
  console.log('');
  console.log('   ⚠️  IMPORTANT: Change the default password in production!');
};

/**
 * Main function
 */
const main = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('           DATABASE RESET SCRIPT');
  console.log('='.repeat(60));
  console.log(`\n📍 Environment: ${NODE_ENV.toUpperCase()}`);
  console.log(`📍 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log('\n⚠️  WARNING: This will DELETE ALL DATA from the database!\n');

  // Production safety check
  if (isProduction && !forceFlag) {
    console.log('🛑 PRODUCTION ENVIRONMENT DETECTED!\n');
    console.log('   This script will DELETE ALL DATA including:');
    console.log('   - All users (drivers, operators)');
    console.log('   - All KYC documents');
    console.log('   - All cars');
    console.log('   - All booking requests');
    console.log('   - All notifications\n');
    console.log('   To run in production, use: node scripts/reset-database.js --force\n');
    
    const confirmed = await confirmAction('   Are you ABSOLUTELY SURE you want to continue? (yes/no): ');
    
    if (!confirmed) {
      console.log('\n   ❌ Operation cancelled.\n');
      process.exit(0);
    }

    // Double confirmation for production
    const doubleConfirmed = await confirmAction('   Type "yes" again to confirm PRODUCTION database reset: ');
    
    if (!doubleConfirmed) {
      console.log('\n   ❌ Operation cancelled.\n');
      process.exit(0);
    }
  } else if (!isProduction) {
    // Development - single confirmation
    const confirmed = await confirmAction('   Continue with database reset? (yes/no): ');
    
    if (!confirmed) {
      console.log('\n   ❌ Operation cancelled.\n');
      process.exit(0);
    }
  }

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('\n✅ Database connection established\n');

    // Step 1: Truncate tables
    console.log('─'.repeat(60));
    console.log('STEP 1: TRUNCATE TABLES');
    console.log('─'.repeat(60));
    await truncateTables();

    // Step 2: Seed roles
    console.log('─'.repeat(60));
    console.log('STEP 2: SEED ROLES');
    console.log('─'.repeat(60));
    await seedRoles();

    // Step 3: Seed admin
    console.log('─'.repeat(60));
    console.log('STEP 3: SEED ADMIN USER');
    console.log('─'.repeat(60));
    await seedAdmin();

    // Done
    console.log('\n' + '='.repeat(60));
    console.log('           ✅ DATABASE RESET COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   - All tables truncated');
    console.log('   - 3 roles seeded (DRIVER, OPERATOR, ADMIN)');
    console.log('   - 1 admin user created');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Run the script
main();
