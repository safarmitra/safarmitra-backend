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
      car_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
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
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      area: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_active_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
        comment: 'Last activity timestamp for auto-deactivation after 7 days',
      },
    },
    {
      tableName: 'cars',
      timestamps: true,
    }
  );

  return Car;
};
