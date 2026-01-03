'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
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

    // Add indexes
    await queryInterface.addIndex('booking_requests', ['driver_id']);
    await queryInterface.addIndex('booking_requests', ['operator_id']);
    await queryInterface.addIndex('booking_requests', ['car_id']);
    await queryInterface.addIndex('booking_requests', ['status']);
    await queryInterface.addIndex('booking_requests', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('booking_requests');
  },
};
