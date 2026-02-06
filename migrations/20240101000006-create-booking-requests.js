'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'booking_requests')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      await queryInterface.createTable('booking_requests', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        car_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'cars',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        driver_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        operator_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        message: {
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
      `SELECT indexname FROM pg_indexes WHERE tablename = 'booking_requests'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('booking_requests_driver_id')) {
      await queryInterface.addIndex('booking_requests', ['driver_id']);
    }
    if (!existingIndexes.includes('booking_requests_operator_id')) {
      await queryInterface.addIndex('booking_requests', ['operator_id']);
    }
    if (!existingIndexes.includes('booking_requests_car_id')) {
      await queryInterface.addIndex('booking_requests', ['car_id']);
    }
    if (!existingIndexes.includes('booking_requests_status')) {
      await queryInterface.addIndex('booking_requests', ['status']);
    }
    if (!existingIndexes.includes('booking_requests_created_at')) {
      await queryInterface.addIndex('booking_requests', ['created_at']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('booking_requests');
  },
};
