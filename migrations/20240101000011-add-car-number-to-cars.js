'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add car_number column with unique constraint
    await queryInterface.addColumn('cars', 'car_number', {
      type: Sequelize.STRING(20),
      allowNull: true, // Initially allow null for existing records
      unique: true,
    });

    // Add index for faster lookups
    await queryInterface.addIndex('cars', ['car_number'], {
      name: 'cars_car_number_unique',
      unique: true,
      where: {
        car_number: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('cars', 'cars_car_number_unique');
    await queryInterface.removeColumn('cars', 'car_number');
  },
};
