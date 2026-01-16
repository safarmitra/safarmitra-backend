'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Location = sequelize.define(
    'Location',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      area_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      city_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'locations',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['area_name', 'city_name'],
        },
      ],
    }
  );

  return Location;
};
