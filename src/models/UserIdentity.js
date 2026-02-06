'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserIdentity = sequelize.define(
    'UserIdentity',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      document_type: {
        type: DataTypes.STRING(30),
        allowNull: false,
        comment: 'AADHAAR, DRIVING_LICENSE, PAN_CARD',
      },
      document_number_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
        comment: 'SHA-256 hash for duplicate detection',
      },
      document_number_encrypted: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'AES-256-GCM encrypted document number for admin verification',
      },
      front_doc_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      back_doc_url: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
        comment: 'PENDING, APPROVED, REJECTED',
      },
      reject_reason: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'user_identity',
      timestamps: true,
    }
  );

  return UserIdentity;
};
