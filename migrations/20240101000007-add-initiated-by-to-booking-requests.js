'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column exists
    const columns = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'booking_requests' AND column_name = 'initiated_by'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (columns.length === 0) {
      // Add initiated_by column to track who created the request
      await queryInterface.addColumn('booking_requests', 'initiated_by', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'DRIVER', // Default for existing records
        comment: 'DRIVER or OPERATOR - who initiated the request',
      });
    }

    // Add indexes safely
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'booking_requests'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('booking_requests_initiated_by')) {
      await queryInterface.addIndex('booking_requests', ['initiated_by']);
    }
    if (!existingIndexes.includes('booking_requests_driver_id_initiated_by_status')) {
      await queryInterface.addIndex('booking_requests', ['driver_id', 'initiated_by', 'status']);
    }
    if (!existingIndexes.includes('booking_requests_operator_id_initiated_by_status')) {
      await queryInterface.addIndex('booking_requests', ['operator_id', 'initiated_by', 'status']);
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('booking_requests', ['operator_id', 'initiated_by', 'status']);
    await queryInterface.removeIndex('booking_requests', ['driver_id', 'initiated_by', 'status']);
    await queryInterface.removeIndex('booking_requests', ['initiated_by']);
    await queryInterface.removeColumn('booking_requests', 'initiated_by');
  },
};
