'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('car_images', {
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
      image_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add index
    await queryInterface.addIndex('car_images', ['car_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('car_images');
  },
};
