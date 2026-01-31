'use strict';

/**
 * Migration to convert combined fuel types (like "PETROL + CNG", "Petrol+CNG", etc.)
 * to single "CNG" value.
 * 
 * This ensures all fuel_type values are one of: PETROL, DIESEL, CNG, ELECTRIC
 */
module.exports = {
  async up(queryInterface) {
    // Update any combined fuel types containing CNG to just 'CNG'
    // This handles various formats: "PETROL + CNG", "Petrol+CNG", "PETROL+CNG", "petrol + cng", etc.
    await queryInterface.sequelize.query(`
      UPDATE cars 
      SET fuel_type = 'CNG',
          updated_at = NOW()
      WHERE LOWER(fuel_type) LIKE '%petrol%' 
        AND LOWER(fuel_type) LIKE '%cng%'
    `);

    // Also handle any other potential combined formats
    await queryInterface.sequelize.query(`
      UPDATE cars 
      SET fuel_type = 'CNG',
          updated_at = NOW()
      WHERE fuel_type ILIKE '%+%cng%'
         OR fuel_type ILIKE '%cng%+%'
    `);

    console.log('✅ Migrated combined fuel types to CNG');
  },

  async down(queryInterface) {
    // Note: This migration cannot be fully reversed as we don't know
    // which records were originally "PETROL + CNG"
    // If needed, restore from backup
    console.log('⚠️  This migration cannot be automatically reversed.');
    console.log('   If you need to restore combined fuel types, please restore from database backup.');
  },
};
