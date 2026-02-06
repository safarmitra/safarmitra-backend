'use strict';

/**
 * Service Setup
 * 
 * This file resolves circular dependencies between services.
 * It should be called once during application startup.
 */

const carService = require('./carService');
const bookingRequestService = require('./bookingRequestService');

/**
 * Initialize service dependencies
 * Call this function after all services are loaded
 */
const initializeServices = () => {
  // Set the expireRequestsForCar function in carService
  // This resolves the circular dependency between carService and bookingRequestService
  carService.setExpireRequestsForCar(bookingRequestService.expireRequestsForCar);
  
  console.log('✅ Service dependencies initialized');
};

module.exports = {
  initializeServices,
};
