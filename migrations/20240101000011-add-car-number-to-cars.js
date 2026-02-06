'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column exists
    const columns = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'car_number'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (columns.length === 0) {
      // Add car_number column with unique constraint
      await queryInterface.addColumn('cars', 'car_number', {
        type: Sequelize.STRING(20),
        allowNull: true, // Initially allow null for existing records
        unique: true,
      });
    }

    // Add index safely
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'cars'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('cars_car_number_unique')) {
      await queryInterface.addIndex('cars', ['car_number'], {
        name: 'cars_car_number_unique',
        unique: true,
        where: {
          car_number: {
            [Sequelize.Op.ne]: null,
          },
        },
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('cars', 'cars_car_number_unique');
    await queryInterface.removeColumn('cars', 'car_number');
  },
};
