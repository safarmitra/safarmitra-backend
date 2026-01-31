'use strict';

/**
 * Migration to add city and area columns to users table
 * NOTE: address column is kept for backward compatibility (no data loss)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if city column already exists
    const tableInfo = await queryInterface.describeTable('users');
    
    // Add city column if not exists
    if (!tableInfo.city) {
      await queryInterface.addColumn('users', 'city', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    // Add area column if not exists
    if (!tableInfo.area) {
      await queryInterface.addColumn('users', 'area', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    // Add index on city for faster filtering (if not exists)
    try {
      await queryInterface.addIndex('users', ['city'], {
        name: 'users_city_idx',
      });
    } catch (error) {
      // Index might already exist
      console.log('Index users_city_idx might already exist, skipping...');
    }

    // NOTE: address column is NOT removed to preserve existing data
    // It can be removed later after data migration is complete
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    try {
      await queryInterface.removeIndex('users', 'users_city_idx');
    } catch (error) {
      console.log('Index users_city_idx might not exist, skipping...');
    }

    // Remove city and area columns
    const tableInfo = await queryInterface.describeTable('users');
    
    if (tableInfo.area) {
      await queryInterface.removeColumn('users', 'area');
    }
    
    if (tableInfo.city) {
      await queryInterface.removeColumn('users', 'city');
    }
  },
};
