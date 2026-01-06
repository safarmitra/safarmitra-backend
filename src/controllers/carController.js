const carService = require('../services/carService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * GET /cars
 * List cars with filters and pagination
 * 
 * For DRIVER: Shows active cars from all operators
 * For OPERATOR: Shows their own cars (active + inactive)
 */
const listCars = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const roleCode = req.user.roleCode;

    const result = await carService.listCars(userId, roleCode, req.query);

    return sendSuccess(res, result.cars, 'Cars fetched successfully', result.meta);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /cars/:id
 * Get car details by ID
 * 
 * For DRIVER: Can view active cars only
 * For OPERATOR: Can view their own cars only
 */
const getCarById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const roleCode = req.user.roleCode;

    const car = await carService.getCarById(id, userId, roleCode);

    return sendSuccess(res, car, 'Car fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /cars
 * Create new car (OPERATOR only)
 */
const createCar = async (req, res, next) => {
  try {
    const operatorId = req.user.userId;
    const files = req.files || {};

    const car = await carService.createCar(operatorId, req.body, files);

    return sendSuccess(res, car, 'Car created successfully', null, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /cars/:id
 * Update car (OPERATOR only, own cars)
 */
const updateCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const operatorId = req.user.userId;
    const files = req.files || {};

    const car = await carService.updateCar(id, operatorId, req.body, files);

    return sendSuccess(res, car, 'Car updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /cars/:id
 * Delete car (OPERATOR only, own cars)
 */
const deleteCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const operatorId = req.user.userId;

    const result = await carService.deleteCar(id, operatorId);

    return sendSuccess(res, null, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
};
