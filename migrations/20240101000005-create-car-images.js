'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'car_images')`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
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
    }

    // Add index safely
    const indexes = await queryInterface.sequelize.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'car_images'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingIndexes = indexes.map(i => i.indexname);

    if (!existingIndexes.includes('car_images_car_id')) {
      await queryInterface.addIndex('car_images', ['car_id']);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('car_images');
  },
};
