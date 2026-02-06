'use strict';

/**
 * Migration: Add expiry columns and performance indexes
 * 
 * Changes:
 * 1. Add expires_at to booking_requests (for 3-day expiry)
 * 2. Add last_active_at to cars (for 7-day auto-deactivation)
 * 3. Add performance indexes for frequently queried columns
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' AND column_name = '${columnName}'
      `);
      return results.length > 0;
    };

    // Helper function to check if index exists
    const indexExists = async (indexName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname = '${indexName}'
      `);
      return results.length > 0;
    };

    // Helper function to check if table exists
    const tableExists = async (tableName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '${tableName}'
      `);
      return results.length > 0;
    };

    // Helper function to safely add column
    const safeAddColumn = async (tableName, columnName, columnDef) => {
      if (!(await tableExists(tableName))) {
        console.log(`  ⏭️  Table ${tableName} doesn't exist, skipping column ${columnName}`);
        return false;
      }
      if (await columnExists(tableName, columnName)) {
        console.log(`  ⏭️  Column ${tableName}.${columnName} already exists, skipping`);
        return false;
      }
      await queryInterface.addColumn(tableName, columnName, columnDef);
      console.log(`  ✅ Added column ${tableName}.${columnName}`);
      return true;
    };

    // Helper function to safely add index
    const safeAddIndex = async (tableName, columns, options) => {
      if (!(await tableExists(tableName))) {
        console.log(`  ⏭️  Table ${tableName} doesn't exist, skipping index ${options.name}`);
        return false;
      }
      if (await indexExists(options.name)) {
        console.log(`  ⏭️  Index ${options.name} already exists, skipping`);
        return false;
      }
      await queryInterface.addIndex(tableName, columns, options);
      console.log(`  ✅ Added index ${options.name}`);
      return true;
    };

    console.log('\n🚀 Starting migration: Add expiry columns and performance indexes\n');

    // ==================== ADD COLUMNS ====================
    console.log('📦 Adding columns...');

    // Add expires_at to booking_requests
    await safeAddColumn('booking_requests', 'expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the request expires (created_at + 3 days)',
    });

    // Add last_active_at to cars
    await safeAddColumn('cars', 'last_active_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      comment: 'Last activity timestamp for auto-deactivation',
    });

    // ==================== UPDATE EXISTING DATA ====================
    console.log('\n📝 Updating existing data...');

    // Set expires_at for existing pending requests (created_at + 3 days)
    if (await tableExists('booking_requests')) {
      const [, expiryMeta] = await queryInterface.sequelize.query(`
        UPDATE booking_requests 
        SET expires_at = created_at + INTERVAL '3 days'
        WHERE status = 'PENDING' AND expires_at IS NULL
      `);
      console.log(`  ✅ Updated ${expiryMeta?.rowCount || 0} booking requests with expires_at`);
    }

    // Set last_active_at for existing cars
    if (await tableExists('cars')) {
      const [, carsMeta] = await queryInterface.sequelize.query(`
        UPDATE cars 
        SET last_active_at = COALESCE(updated_at, created_at)
        WHERE last_active_at IS NULL
      `);
      console.log(`  ✅ Updated ${carsMeta?.rowCount || 0} cars with last_active_at`);
    }

    // ==================== ADD INDEXES ====================
    console.log('\n🔍 Adding indexes...');

    // Cars indexes
    await safeAddIndex('cars', ['city'], { name: 'idx_cars_city' });
    await safeAddIndex('cars', ['category'], { name: 'idx_cars_category' });
    await safeAddIndex('cars', ['is_active'], { name: 'idx_cars_is_active' });
    await safeAddIndex('cars', ['operator_id'], { name: 'idx_cars_operator_id' });
    await safeAddIndex('cars', ['last_active_at'], { name: 'idx_cars_last_active_at' });

    // Booking requests indexes
    await safeAddIndex('booking_requests', ['status'], { name: 'idx_booking_requests_status' });
    await safeAddIndex('booking_requests', ['driver_id'], { name: 'idx_booking_requests_driver_id' });
    await safeAddIndex('booking_requests', ['operator_id'], { name: 'idx_booking_requests_operator_id' });
    await safeAddIndex('booking_requests', ['car_id'], { name: 'idx_booking_requests_car_id' });
    await safeAddIndex('booking_requests', ['expires_at'], { name: 'idx_booking_requests_expires_at' });
    await safeAddIndex('booking_requests', ['initiated_by'], { name: 'idx_booking_requests_initiated_by' });

    // Notifications indexes
    await safeAddIndex('notifications', ['user_id', 'is_read'], { name: 'idx_notifications_user_id_is_read' });
    await safeAddIndex('notifications', ['user_id', 'created_at'], { name: 'idx_notifications_user_id_created_at' });

    // Users indexes
    await safeAddIndex('users', ['kyc_status'], { name: 'idx_users_kyc_status' });
    await safeAddIndex('users', ['role_id'], { name: 'idx_users_role_id' });
    await safeAddIndex('users', ['is_active'], { name: 'idx_users_is_active' });

    // User identity indexes (table name is 'user_identity' not 'user_identities')
    await safeAddIndex('user_identity', ['user_id'], { name: 'idx_user_identity_user_id' });
    await safeAddIndex('user_identity', ['status'], { name: 'idx_user_identity_status' });

    console.log('\n✅ Migration completed: Added expiry columns and performance indexes\n');
  },

  async down(queryInterface, Sequelize) {
    // Helper function to check if index exists
    const indexExists = async (indexName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname = '${indexName}'
      `);
      return results.length > 0;
    };

    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' AND column_name = '${columnName}'
      `);
      return results.length > 0;
    };

    // Helper function to check if table exists
    const tableExists = async (tableName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '${tableName}'
      `);
      return results.length > 0;
    };

    // Helper function to safely remove index
    const safeRemoveIndex = async (tableName, indexName) => {
      if (!(await tableExists(tableName))) {
        console.log(`  ⏭️  Table ${tableName} doesn't exist, skipping index ${indexName}`);
        return false;
      }
      if (!(await indexExists(indexName))) {
        console.log(`  ⏭️  Index ${indexName} doesn't exist, skipping`);
        return false;
      }
      await queryInterface.removeIndex(tableName, indexName);
      console.log(`  ✅ Removed index ${indexName}`);
      return true;
    };

    // Helper function to safely remove column
    const safeRemoveColumn = async (tableName, columnName) => {
      if (!(await tableExists(tableName))) {
        console.log(`  ⏭️  Table ${tableName} doesn't exist, skipping column ${columnName}`);
        return false;
      }
      if (!(await columnExists(tableName, columnName))) {
        console.log(`  ⏭️  Column ${tableName}.${columnName} doesn't exist, skipping`);
        return false;
      }
      await queryInterface.removeColumn(tableName, columnName);
      console.log(`  ✅ Removed column ${tableName}.${columnName}`);
      return true;
    };

    console.log('\n🔄 Reverting migration: Remove expiry columns and performance indexes\n');

    // ==================== REMOVE INDEXES ====================
    console.log('🔍 Removing indexes...');

    // Cars indexes
    await safeRemoveIndex('cars', 'idx_cars_city');
    await safeRemoveIndex('cars', 'idx_cars_category');
    await safeRemoveIndex('cars', 'idx_cars_is_active');
    await safeRemoveIndex('cars', 'idx_cars_operator_id');
    await safeRemoveIndex('cars', 'idx_cars_last_active_at');

    // Booking requests indexes
    await safeRemoveIndex('booking_requests', 'idx_booking_requests_status');
    await safeRemoveIndex('booking_requests', 'idx_booking_requests_driver_id');
    await safeRemoveIndex('booking_requests', 'idx_booking_requests_operator_id');
    await safeRemoveIndex('booking_requests', 'idx_booking_requests_car_id');
    await safeRemoveIndex('booking_requests', 'idx_booking_requests_expires_at');
    await safeRemoveIndex('booking_requests', 'idx_booking_requests_initiated_by');

    // Notifications indexes
    await safeRemoveIndex('notifications', 'idx_notifications_user_id_is_read');
    await safeRemoveIndex('notifications', 'idx_notifications_user_id_created_at');

    // Users indexes
    await safeRemoveIndex('users', 'idx_users_kyc_status');
    await safeRemoveIndex('users', 'idx_users_role_id');
    await safeRemoveIndex('users', 'idx_users_is_active');

    // User identity indexes
    await safeRemoveIndex('user_identity', 'idx_user_identity_user_id');
    await safeRemoveIndex('user_identity', 'idx_user_identity_status');

    // ==================== REMOVE COLUMNS ====================
    console.log('\n📦 Removing columns...');

    await safeRemoveColumn('booking_requests', 'expires_at');
    await safeRemoveColumn('cars', 'last_active_at');

    console.log('\n✅ Migration reverted: Removed expiry columns and indexes\n');
  },
};
