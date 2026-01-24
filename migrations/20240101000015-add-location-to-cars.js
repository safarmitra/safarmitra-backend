'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add city column (required)
    await queryInterface.addColumn('cars', 'city', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Ahmedabad', // Default for existing cars
    });

    // Add area column (optional)
    await queryInterface.addColumn('cars', 'area', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: 'Iscon', // Default for existing cars
    });

    // Add index on city for faster filtering
    await queryInterface.addIndex('cars', ['city'], {
      name: 'cars_city_idx',
    });

    // Add composite index on city + area for combined filtering
    await queryInterface.addIndex('cars', ['city', 'area'], {
      name: 'cars_city_area_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('cars', 'cars_city_area_idx');
    await queryInterface.removeIndex('cars', 'cars_city_idx');
    await queryInterface.removeColumn('cars', 'area');
    await queryInterface.removeColumn('cars', 'city');
  },
};
