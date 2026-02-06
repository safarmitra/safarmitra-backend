'use strict';

/**
 * Migration: Add document_number_encrypted column to user_identity table
 * 
 * This column stores AES-256-GCM encrypted document numbers that can be
 * decrypted by admins for KYC verification purposes.
 * 
 * The existing document_number_hash column is kept for duplicate detection.
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

    console.log('\n🔐 Adding document_number_encrypted column...\n');

    // Check if column already exists
    if (await columnExists('user_identity', 'document_number_encrypted')) {
      console.log('  ⏭️  Column document_number_encrypted already exists, skipping');
      return;
    }

    // Add the new column
    await queryInterface.addColumn('user_identity', 'document_number_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true, // Nullable for existing records
      comment: 'AES-256-GCM encrypted document number for admin verification',
    });

    console.log('  ✅ Added column user_identity.document_number_encrypted');
    console.log('\n✅ Migration completed\n');
  },

  async down(queryInterface, Sequelize) {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' AND column_name = '${columnName}'
      `);
      return results.length > 0;
    };

    console.log('\n🔄 Removing document_number_encrypted column...\n');

    // Check if column exists before removing
    if (!(await columnExists('user_identity', 'document_number_encrypted'))) {
      console.log('  ⏭️  Column document_number_encrypted does not exist, skipping');
      return;
    }

    await queryInterface.removeColumn('user_identity', 'document_number_encrypted');

    console.log('  ✅ Removed column user_identity.document_number_encrypted');
    console.log('\n✅ Migration reverted\n');
  },
};
