const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const kycRoutes = require('./kycRoutes');

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// KYC routes
router.use('/kyc', kycRoutes);

module.exports = router;
