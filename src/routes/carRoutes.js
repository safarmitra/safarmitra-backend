const express = require('express');
const router = express.Router();
const multer = require('multer');
const carController = require('../controllers/carController');
const { authMiddleware, requireRole, requireKyc } = require('../middlewares/authMiddleware');
const {
  validateCreateCar,
  validateUpdateCar,
  validateRcDocuments,
  validateUpdateFiles,
} = require('../validators/carValidator');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// File fields for car upload
const carUploadFields = upload.fields([
  { name: 'rc_front', maxCount: 1 },
  { name: 'rc_back', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

// All routes require authentication and KYC approval
router.use(authMiddleware);
router.use(requireKyc);

// GET /cars - List cars (both DRIVER and OPERATOR)
router.get('/', carController.listCars);

// GET /cars/:id - Get car by ID (both DRIVER and OPERATOR)
router.get('/:id', carController.getCarById);

// POST /cars - Create car (OPERATOR only)
router.post(
  '/',
  requireRole('OPERATOR'),
  carUploadFields,
  validateCreateCar,
  validateRcDocuments,
  carController.createCar
);

// PUT /cars/:id - Update car (OPERATOR only)
router.put(
  '/:id',
  requireRole('OPERATOR'),
  carUploadFields,
  validateUpdateCar,
  validateUpdateFiles,
  carController.updateCar
);

// DELETE /cars/:id - Delete car (OPERATOR only)
router.delete('/:id', requireRole('OPERATOR'), carController.deleteCar);

module.exports = router;
