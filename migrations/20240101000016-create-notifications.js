'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable('notifications', {
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
        type: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        body: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        data: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        is_read: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        fcm_sent: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        fcm_response: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    }

    // Add indexes safely
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'notifications'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('notifications_user_id')) {
      await queryInterface.addIndex('notifications', ['user_id']);
    }
    if (!existingIndexes.includes('notifications_user_id_is_read')) {
      await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
    }
    if (!existingIndexes.includes('notifications_user_id_created_at')) {
      await queryInterface.addIndex('notifications', ['user_id', 'created_at']);
    }
    if (!existingIndexes.includes('notifications_type')) {
      await queryInterface.addIndex('notifications', ['type']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
