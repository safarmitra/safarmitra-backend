'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist
    const columns = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'cars' AND column_name IN ('city', 'area')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingColumns = columns.map(c => c.column_name);

    if (!existingColumns.includes('city')) {
      // Add city column (required)
      await queryInterface.addColumn('cars', 'city', {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Ahmedabad', // Default for existing cars
      });
    }

    if (!existingColumns.includes('area')) {
      // Add area column (optional)
      await queryInterface.addColumn('cars', 'area', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: 'Iscon', // Default for existing cars
      });
    }

    // Add indexes safely
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'cars'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('cars_city_idx')) {
      await queryInterface.addIndex('cars', ['city'], {
        name: 'cars_city_idx',
      });
    }

    if (!existingIndexes.includes('cars_city_area_idx')) {
      await queryInterface.addIndex('cars', ['city', 'area'], {
        name: 'cars_city_area_idx',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('cars', 'cars_city_area_idx');
    await queryInterface.removeIndex('cars', 'cars_city_idx');
    await queryInterface.removeColumn('cars', 'area');
    await queryInterface.removeColumn('cars', 'city');
  },
};
