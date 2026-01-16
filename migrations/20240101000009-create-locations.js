'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('locations', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      area_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      city_name: {
        type: Sequelize.STRING(100),
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
    await queryInterface.addIndex('locations', ['city_name']);
    await queryInterface.addIndex('locations', ['is_active']);
    await queryInterface.addIndex('locations', ['area_name', 'city_name'], {
      unique: true,
      name: 'locations_area_city_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('locations');
  },
};
