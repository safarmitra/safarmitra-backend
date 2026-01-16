'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add initiated_by column to track who created the request
    await queryInterface.addColumn('booking_requests', 'initiated_by', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'DRIVER', // Default for existing records
      comment: 'DRIVER or OPERATOR - who initiated the request',
    });

    // Add index for initiated_by
    await queryInterface.addIndex('booking_requests', ['initiated_by']);

    // Add composite index for efficient queries
    await queryInterface.addIndex('booking_requests', ['driver_id', 'initiated_by', 'status']);
    await queryInterface.addIndex('booking_requests', ['operator_id', 'initiated_by', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('booking_requests', ['operator_id', 'initiated_by', 'status']);
    await queryInterface.removeIndex('booking_requests', ['driver_id', 'initiated_by', 'status']);
    await queryInterface.removeIndex('booking_requests', ['initiated_by']);
    await queryInterface.removeColumn('booking_requests', 'initiated_by');
  },
};
