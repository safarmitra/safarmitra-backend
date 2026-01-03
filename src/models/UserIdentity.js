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
      },
      document_number_hash: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
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
