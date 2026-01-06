const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const kycRoutes = require('./kycRoutes');
const carRoutes = require('./carRoutes');
const bookingRequestRoutes = require('./bookingRequestRoutes');

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

module.exports = router;
