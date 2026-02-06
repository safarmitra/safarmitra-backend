#!/usr/bin/env node

/**
 * Script to truncate all tables in the database
 * This will delete all data but preserve the schema and migrations
 * 
 * Usage: node scripts/truncate-all-tables.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

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

async function truncateAllTables() {
  console.log('\n🗑️  TRUNCATE ALL TABLES\n');
  console.log('⚠️  WARNING: This will delete ALL data from the database!\n');

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Get all table names (excluding SequelizeMeta to preserve migrations)
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'SequelizeMeta'
      ORDER BY tablename
    `);

    if (tables.length === 0) {
      console.log('No tables found to truncate.');
      return;
    }

    console.log(`📋 Found ${tables.length} tables to truncate:\n`);
    tables.forEach((t, i) => console.log(`   ${i + 1}. ${t.tablename}`));
    console.log('');

    // Disable foreign key checks and truncate all tables
    console.log('🔄 Truncating tables...\n');

    // Build truncate command for all tables at once (handles foreign keys)
    const tableNames = tables.map(t => `"${t.tablename}"`).join(', ');
    
    await sequelize.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);

    console.log('✅ All tables truncated successfully!\n');

    // Show table counts to verify
    console.log('📊 Verifying (all should be 0):\n');
    for (const table of tables) {
      const [[{ count }]] = await sequelize.query(
        `SELECT COUNT(*) as count FROM "${table.tablename}"`
      );
      const status = count === '0' || count === 0 ? '✅' : '❌';
      console.log(`   ${status} ${table.tablename}: ${count} rows`);
    }

    console.log('\n✅ Database cleanup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
truncateAllTables();
