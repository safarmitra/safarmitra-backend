'use strict';

const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Import models
const Role = require('./Role')(sequelize);
const User = require('./User')(sequelize);
const UserIdentity = require('./UserIdentity')(sequelize);
const Car = require('./Car')(sequelize);
const CarImage = require('./CarImage')(sequelize);
const BookingRequest = require('./BookingRequest')(sequelize);

// Define associations
// Role - User
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User - UserIdentity
User.hasMany(UserIdentity, { foreignKey: 'user_id', as: 'documents' });
UserIdentity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User (Operator) - Car
User.hasMany(Car, { foreignKey: 'operator_id', as: 'cars' });
Car.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

// Car - CarImage
Car.hasMany(CarImage, { foreignKey: 'car_id', as: 'images' });
CarImage.belongsTo(Car, { foreignKey: 'car_id', as: 'car' });

// BookingRequest associations
Car.hasMany(BookingRequest, { foreignKey: 'car_id', as: 'bookingRequests' });
BookingRequest.belongsTo(Car, { foreignKey: 'car_id', as: 'car' });

User.hasMany(BookingRequest, { foreignKey: 'driver_id', as: 'driverRequests' });
BookingRequest.belongsTo(User, { foreignKey: 'driver_id', as: 'driver' });

User.hasMany(BookingRequest, { foreignKey: 'operator_id', as: 'operatorRequests' });
BookingRequest.belongsTo(User, { foreignKey: 'operator_id', as: 'requestOperator' });

module.exports = {
  sequelize,
  Sequelize,
  Role,
  User,
  UserIdentity,
  Car,
  CarImage,
  BookingRequest,
};
