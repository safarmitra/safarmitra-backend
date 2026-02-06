'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        role_id: {
          type: Sequelize.SMALLINT,
          references: {
            model: 'roles',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        phone_number: {
          type: Sequelize.STRING(15),
          allowNull: false,
          unique: true,
        },
        full_name: {
          type: Sequelize.STRING(100),
        },
        address: {
          type: Sequelize.TEXT,
        },
        agency_name: {
          type: Sequelize.STRING(150),
        },
        profile_image_url: {
          type: Sequelize.TEXT,
        },
        dob: {
          type: Sequelize.STRING(15),
        },
        fcm_token: {
          type: Sequelize.TEXT,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        kyc_status: {
          type: Sequelize.STRING(20),
          defaultValue: 'PENDING',
        },
        kyc_reject_reason: {
          type: Sequelize.TEXT,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        deleted_at: {
          type: Sequelize.DATE,
        },
      });
    }

    // Add indexes safely (only if they don't exist)
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'users'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('users_phone_number')) {
      await queryInterface.addIndex('users', ['phone_number']);
    }
    if (!existingIndexes.includes('users_role_id')) {
      await queryInterface.addIndex('users', ['role_id']);
    }
    if (!existingIndexes.includes('users_kyc_status')) {
      await queryInterface.addIndex('users', ['kyc_status']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
