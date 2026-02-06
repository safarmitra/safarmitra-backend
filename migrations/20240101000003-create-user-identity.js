'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_identity')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable('user_identity', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        document_type: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        document_number_hash: {
          type: Sequelize.TEXT,
          allowNull: false,
          unique: true,
        },
        front_doc_url: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        back_doc_url: {
          type: Sequelize.TEXT,
        },
        status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        reject_reason: {
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
      });
    }

    // Add indexes safely
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'user_identity'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('user_identity_user_id')) {
      await queryInterface.addIndex('user_identity', ['user_id']);
    }
    if (!existingIndexes.includes('user_identity_status')) {
      await queryInterface.addIndex('user_identity', ['status']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_identity');
  },
};
