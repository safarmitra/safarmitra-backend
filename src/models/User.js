'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      role_id: {
        type: DataTypes.SMALLINT,
        references: {
          model: 'roles',
          key: 'id',
        },
      },
      phone_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      password_hash: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      full_name: {
        type: DataTypes.STRING(100),
      },
      dob: {
        type: DataTypes.STRING(15),
      },
      city: {
        type: DataTypes.STRING(100),
      },
      area: {
        type: DataTypes.STRING(100),
      },
      address: {
        type: DataTypes.TEXT,
      },
      agency_name: {
        type: DataTypes.STRING(150),
      },
      profile_image_url: {
        type: DataTypes.TEXT,
      },
      fcm_token: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      kyc_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'NOT_SUBMITTED',
      },
      kyc_reject_reason: {
        type: DataTypes.TEXT,
      },
      onboarding_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      onboarding_token_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  return User;
};
