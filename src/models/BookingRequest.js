'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BookingRequest = sequelize.define(
    'BookingRequest',
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
      driver_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      operator_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      message: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      reject_reason: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'booking_requests',
      timestamps: true,
    }
  );

  return BookingRequest;
};
