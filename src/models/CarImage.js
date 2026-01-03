'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CarImage = sequelize.define(
    'CarImage',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      car_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'cars',
          key: 'id',
        },
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'car_images',
      timestamps: true,
      updatedAt: false,
    }
  );

  return CarImage;
};
