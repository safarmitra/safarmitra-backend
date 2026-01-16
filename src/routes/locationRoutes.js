'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateListLocations } = require('../validators/adminValidator');

/**
 * @route   GET /locations
 * @desc    List active locations (public for authenticated users)
 * @access  Authenticated users
 */
router.get('/', authenticate, validateListLocations, adminController.listLocationsPublic);

module.exports = router;
