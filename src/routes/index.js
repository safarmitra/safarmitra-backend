const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const kycRoutes = require('./kycRoutes');
const carRoutes = require('./carRoutes');
const bookingRequestRoutes = require('./bookingRequestRoutes');
const adminRoutes = require('./adminRoutes');

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// KYC routes
router.use('/kyc', kycRoutes);

// Car routes
router.use('/cars', carRoutes);

// Booking request routes
router.use('/booking-requests', bookingRequestRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Note: Location data is now served as static JSON files at /data/locations/
// See: GET /data/locations/cities.json and GET /data/locations/{city_slug}.json

module.exports = router;
