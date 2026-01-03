'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Car = sequelize.define(
    'Car',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      operator_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      car_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      transmission: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      fuel_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      rate_type: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      rate_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      deposit_amount: {
        type: DataTypes.DECIMAL(10, 2),
      },
      purposes: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
      },
      instructions: {
        type: DataTypes.TEXT,
      },
      rc_front_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      rc_back_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'cars',
      timestamps: true,
    }
  );

  return Car;
};
