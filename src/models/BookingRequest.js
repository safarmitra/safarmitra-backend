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
      initiated_by: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'DRIVER',
        comment: 'DRIVER or OPERATOR - who initiated the request',
      },
      message: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
        comment: 'PENDING, ACCEPTED, REJECTED, or EXPIRED',
      },
      reject_reason: {
        type: DataTypes.TEXT,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the request expires (created_at + 3 days)',
      },
    },
    {
      tableName: 'booking_requests',
      timestamps: true,
    }
  );

  return BookingRequest;
};
