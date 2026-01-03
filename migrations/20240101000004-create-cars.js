'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cars', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
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
      car_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      transmission: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      fuel_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      rate_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      rate_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      deposit_amount: {
        type: Sequelize.DECIMAL(10, 2),
      },
      purposes: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
      },
      instructions: {
        type: Sequelize.TEXT,
      },
      rc_front_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rc_back_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.addIndex('cars', ['operator_id']);
    await queryInterface.addIndex('cars', ['is_active']);
    await queryInterface.addIndex('cars', ['category']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cars');
  },
};
