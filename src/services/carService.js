'use strict';

const { Op } = require('sequelize');
const { Car, CarImage, User, Role, sequelize } = require('../models');
const uploadService = require('./uploadService');
const notificationService = require('./notificationService');
const { compareIds } = require('../utils/helpers');
const { isCarInactive, getCarInactivityThreshold } = require('../utils/expiryHelper');

// Import expireRequestsForCar - will be set after bookingRequestService is loaded
let expireRequestsForCar = null;

/**
 * Set the expireRequestsForCar function (to avoid circular dependency)
 */
const setExpireRequestsForCar = (fn) => {
  expireRequestsForCar = fn;
};

/**
 * Deactivate a car and expire all its pending requests
 * @param {Object} car - Car instance
 * @returns {Promise<number>} Number of expired requests
 */
const deactivateCarAndExpireRequests = async (car) => {
  // Deactivate the car
  car.is_active = false;
  await car.save();

  // Notify operator
  notificationService.notifyCarAutoDeactivated(
    car.operator_id,
    car.car_name,
    car.id
  ).catch((err) => console.error('Notification error:', err));

  // Expire all pending requests for this car
  if (expireRequestsForCar) {
    return expireRequestsForCar(car.id, car.car_name);
  }
  return 0;
};

/**
 * Check and deactivate inactive cars in a list
 * @param {Array} cars - Array of car instances
 * @returns {Promise<Array>} Array of active cars
 */
const checkAndDeactivateInactiveCars = async (cars) => {
  const activeCars = [];

  for (const car of cars) {
    if (car.is_active && isCarInactive(car)) {
      await deactivateCarAndExpireRequests(car);
      // Don't include this car in results (it's now inactive)
    } else if (car.is_active) {
      activeCars.push(car);
    }
  }

  return activeCars;
};

/**
 * List cars with filters and pagination
 * 
 * Logic:
 * 1. Check user role (DRIVER or OPERATOR)
 * 2. For DRIVER: Show only active cars from all operators (check for inactive cars)
 * 3. For OPERATOR: Show only their own cars (active + inactive)
 * 4. Apply filters (search, category, fuel_type, etc.)
 * 5. Apply pagination
 * 6. Return cars with FULL details (all images, operator info)
 */
const listCars = async (userId, roleCode, filters) => {
  const {
    search,
    city,
    area,
    category,
    fuel_type,
    transmission,
    rate_type,
    min_price,
    max_price,
    purposes,
    is_active,
    page = 1,
    limit = 10,
  } = filters;

  const where = {};
  const offset = (page - 1) * limit;

  // Role-based filtering
  if (roleCode === 'DRIVER') {
    // Drivers see only active cars from all operators
    where.is_active = true;
    
    // Also filter out cars that should be auto-deactivated
    // (last_active_at within the last 7 days)
    where.last_active_at = { [Op.gte]: getCarInactivityThreshold() };
  } else if (roleCode === 'OPERATOR') {
    // Operators see only their own cars
    where.operator_id = userId;
    
    // Optional filter by active status for operators
    if (is_active !== undefined && is_active !== '') {
      where.is_active = is_active === 'true' || is_active === true;
    }
  }

  // Search by car name
  if (search) {
    where.car_name = { [Op.iLike]: `%${search}%` };
  }

  // Category filter
  if (category) {
    where.category = category;
  }

  // Fuel type filter
  if (fuel_type) {
    where.fuel_type = fuel_type;
  }

  // Transmission filter
  if (transmission) {
    where.transmission = transmission;
  }

  // Rate type filter
  if (rate_type) {
    where.rate_type = rate_type;
  }

  // Price range filter
  if (min_price) {
    where.rate_amount = { ...where.rate_amount, [Op.gte]: parseFloat(min_price) };
  }
  if (max_price) {
    where.rate_amount = { ...where.rate_amount, [Op.lte]: parseFloat(max_price) };
  }

  // Purposes filter (array overlap)
  if (purposes) {
    const purposeArray = purposes.split(',').map((p) => p.trim());
    where.purposes = { [Op.overlap]: purposeArray };
  }

  // City filter (case-insensitive)
  if (city) {
    where.city = { [Op.iLike]: city };
  }

  // Area filter (case-insensitive)
  if (area) {
    where.area = { [Op.iLike]: area };
  }

  // Get cars with count
  const { count, rows: cars } = await Car.findAndCountAll({
    where,
    include: [
      {
        model: CarImage,
        as: 'images',
        attributes: ['id', 'image_url', 'is_primary'],
      },
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'full_name', 'agency_name', 'profile_image_url', 'phone_number', 'kyc_status'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset,
    distinct: true,
  });

  // For drivers, check and deactivate any inactive cars that slipped through
  let filteredCars = cars;
  if (roleCode === 'DRIVER') {
    filteredCars = await checkAndDeactivateInactiveCars(cars);
  }

  // Format response with FULL details
  const formattedCars = filteredCars.map((car) => formatCarDetail(car, roleCode));

  return {
    cars: formattedCars,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: roleCode === 'DRIVER' ? filteredCars.length : count,
      total_pages: Math.ceil((roleCode === 'DRIVER' ? filteredCars.length : count) / limit),
    },
  };
};

/**
 * Get car by ID
 * 
 * Logic:
 * 1. Find car by ID with images and operator info
 * 2. For DRIVER: Only allow viewing active cars (check for inactivity)
 * 3. For OPERATOR: Only allow viewing their own cars
 * 4. Return full car details
 */
const getCarById = async (carId, userId, roleCode) => {
  const car = await Car.findByPk(carId, {
    include: [
      {
        model: CarImage,
        as: 'images',
        attributes: ['id', 'image_url', 'is_primary'],
      },
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'full_name', 'agency_name', 'profile_image_url', 'phone_number', 'kyc_status'],
      },
    ],
  });

  if (!car) {
    throw new Error('Car not found');
  }

  // Access control
  if (roleCode === 'DRIVER') {
    // Check if car should be auto-deactivated
    if (car.is_active && isCarInactive(car)) {
      await deactivateCarAndExpireRequests(car);
    }

    // Drivers can only view active cars
    if (!car.is_active) {
      throw new Error('Car not found');
    }
  } else if (roleCode === 'OPERATOR') {
    // Operators can only view their own cars
    if (!compareIds(car.operator_id, userId)) {
      throw new Error('You do not have permission to view this car');
    }
  }

  return formatCarDetail(car, roleCode);
};

/**
 * Create new car with transaction support
 * 
 * Logic:
 * 1. Check if car_number already exists
 *    - If exists for SAME operator with no images (incomplete), delete and retry
 *    - If exists for DIFFERENT operator, throw error
 * 2. Upload all files to S3 FIRST (before transaction)
 * 3. Start database transaction
 * 4. Create car record with last_active_at = NOW()
 * 5. Create car image records
 * 6. Commit transaction
 * 7. If DB fails, rollback and cleanup S3 files
 * 8. Return created car
 */
const createCar = async (operatorId, data, files) => {
  // Normalize car number (uppercase, remove spaces)
  const carNumber = data.car_number.toUpperCase().replace(/\s/g, '');

  // Check if car_number already exists
  const existingCar = await Car.findOne({
    where: { car_number: carNumber },
  });

  if (existingCar) {
    // Check if same operator owns it (possible retry scenario)
    if (compareIds(existingCar.operator_id, operatorId)) {
      // Check if car has no images (incomplete creation from failed attempt)
      const imageCount = await CarImage.count({ where: { car_id: existingCar.id } });
      if (imageCount === 0) {
        // Delete incomplete car record to allow fresh creation
        console.log(`Cleaning up incomplete car record: ${existingCar.id} for retry`);
        
        // Clean up S3 files from incomplete car if they exist
        if (existingCar.rc_front_url) {
          const rcFrontKey = uploadService.getKeyFromUrl(existingCar.rc_front_url);
          if (rcFrontKey) {
            try {
              await uploadService.deleteFromS3(rcFrontKey);
            } catch (err) {
              console.error('Error cleaning up RC front:', err.message);
            }
          }
        }
        if (existingCar.rc_back_url) {
          const rcBackKey = uploadService.getKeyFromUrl(existingCar.rc_back_url);
          if (rcBackKey) {
            try {
              await uploadService.deleteFromS3(rcBackKey);
            } catch (err) {
              console.error('Error cleaning up RC back:', err.message);
            }
          }
        }
        
        await existingCar.destroy();
      } else {
        // Car exists with images - it's a complete car
        const error = new Error('You have already registered this car');
        error.statusCode = 409;
        throw error;
      }
    } else {
      // Different operator owns this car number
      const error = new Error('A car with this registration number already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  // Track uploaded files for cleanup on failure
  const uploadedFiles = [];

  try {
    // Step 1: Upload all files to S3 FIRST (before any DB operations)
    const rcFrontFile = files['rc_front'][0];
    const rcBackFile = files['rc_back'][0];

    const rcFrontUpload = await uploadService.uploadToS3(rcFrontFile, 'cars/rc');
    uploadedFiles.push(rcFrontUpload.url);

    const rcBackUpload = await uploadService.uploadToS3(rcBackFile, 'cars/rc');
    uploadedFiles.push(rcBackUpload.url);

    // Upload car images
    const imageFiles = files['images'] || [];
    const uploadedImages = [];
    
    for (const imageFile of imageFiles) {
      const imageUpload = await uploadService.uploadToS3(imageFile, 'cars/images');
      uploadedFiles.push(imageUpload.url);
      uploadedImages.push(imageUpload);
    }

    // Parse purposes
    let purposes = null;
    if (data.purposes) {
      purposes = data.purposes.split(',').map((p) => p.trim());
    }

    // Step 2: Start database transaction
    const transaction = await sequelize.transaction();

    try {
      // Create car record with last_active_at
      const car = await Car.create({
        operator_id: operatorId,
        car_number: carNumber,
        car_name: data.car_name,
        city: data.city,
        area: data.area || null,
        category: data.category,
        transmission: data.transmission,
        fuel_type: data.fuel_type,
        rate_type: data.rate_type,
        rate_amount: parseFloat(data.rate_amount),
        deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : null,
        purposes,
        instructions: data.instructions || null,
        rc_front_url: rcFrontUpload.url,
        rc_back_url: rcBackUpload.url,
        is_active: data.is_active !== undefined ? data.is_active === 'true' || data.is_active === true : true,
        last_active_at: new Date(), // Set initial activity timestamp
      }, { transaction });

      // Create car image records
      const primaryIndex = data.primary_image_index ? parseInt(data.primary_image_index) : 0;

      for (let i = 0; i < uploadedImages.length; i++) {
        await CarImage.create({
          car_id: car.id,
          image_url: uploadedImages[i].url,
          is_primary: i === primaryIndex,
        }, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      // Return created car
      return getCarById(car.id, operatorId, 'OPERATOR');

    } catch (dbError) {
      // Rollback transaction on DB error
      await transaction.rollback();
      console.error('Database error during car creation, rolling back:', dbError.message);
      
      // Re-throw to trigger S3 cleanup
      throw dbError;
    }

  } catch (error) {
    // Clean up uploaded S3 files on any failure
    console.error('Car creation failed, cleaning up uploaded files...');
    
    for (const fileUrl of uploadedFiles) {
      const fileKey = uploadService.getKeyFromUrl(fileUrl);
      if (fileKey) {
        try {
          await uploadService.deleteFromS3(fileKey);
          console.log(`Cleaned up S3 file: ${fileKey}`);
        } catch (cleanupError) {
          console.error(`Failed to cleanup S3 file ${fileKey}:`, cleanupError.message);
        }
      }
    }

    throw error;
  }
};

/**
 * Update car
 * 
 * Logic:
 * 1. Find car and verify ownership
 * 2. Update RC documents if provided
 * 3. Update car fields + last_active_at
 * 4. Handle image removal (remove_images)
 * 5. Upload new images if provided
 * 6. Update primary image
 * 7. If deactivating, expire all pending requests
 * 8. Return updated car
 */
const updateCar = async (carId, operatorId, data, files) => {
  const car = await Car.findByPk(carId);

  if (!car) {
    throw new Error('Car not found');
  }

  if (!compareIds(car.operator_id, operatorId)) {
    throw new Error('You do not have permission to update this car');
  }

  const wasActive = car.is_active;
  const updateData = {
    last_active_at: new Date(), // Always update activity timestamp on any update
  };

  // Update basic fields
  const allowedFields = [
    'car_name', 'city', 'area', 'category', 'transmission', 'fuel_type',
    'rate_type', 'rate_amount', 'deposit_amount', 'instructions', 'is_active'
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== '') {
      if (field === 'rate_amount' || field === 'deposit_amount') {
        updateData[field] = parseFloat(data[field]);
      } else if (field === 'is_active') {
        updateData[field] = data[field] === 'true' || data[field] === true;
      } else {
        updateData[field] = data[field];
      }
    }
  });

  // Update purposes
  if (data.purposes !== undefined) {
    if (data.purposes === '' || data.purposes === null) {
      updateData.purposes = null;
    } else {
      updateData.purposes = data.purposes.split(',').map((p) => p.trim());
    }
  }

  // Update RC front if provided
  if (files['rc_front'] && files['rc_front'][0]) {
    // Delete old RC front
    if (car.rc_front_url) {
      const oldKey = uploadService.getKeyFromUrl(car.rc_front_url);
      if (oldKey) {
        try {
          await uploadService.deleteFromS3(oldKey);
        } catch (error) {
          console.error('Error deleting old RC front:', error.message);
        }
      }
    }
    const rcFrontUpload = await uploadService.uploadToS3(files['rc_front'][0], 'cars/rc');
    updateData.rc_front_url = rcFrontUpload.url;
  }

  // Update RC back if provided
  if (files['rc_back'] && files['rc_back'][0]) {
    // Delete old RC back
    if (car.rc_back_url) {
      const oldKey = uploadService.getKeyFromUrl(car.rc_back_url);
      if (oldKey) {
        try {
          await uploadService.deleteFromS3(oldKey);
        } catch (error) {
          console.error('Error deleting old RC back:', error.message);
        }
      }
    }
    const rcBackUpload = await uploadService.uploadToS3(files['rc_back'][0], 'cars/rc');
    updateData.rc_back_url = rcBackUpload.url;
  }

  // Update car record
  await car.update(updateData);

  // Handle image removal
  if (data.remove_images) {
    const imageIdsToRemove = data.remove_images.split(',').map((id) => parseInt(id.trim()));
    
    for (const imageId of imageIdsToRemove) {
      const image = await CarImage.findOne({
        where: { id: imageId, car_id: carId },
      });
      
      if (image) {
        // Delete from S3
        const imageKey = uploadService.getKeyFromUrl(image.image_url);
        if (imageKey) {
          try {
            await uploadService.deleteFromS3(imageKey);
          } catch (error) {
            console.error('Error deleting car image:', error.message);
          }
        }
        await image.destroy();
      }
    }
  }

  // Upload new images
  const imageFiles = files['images'] || [];
  for (const imageFile of imageFiles) {
    const imageUpload = await uploadService.uploadToS3(imageFile, 'cars/images');
    await CarImage.create({
      car_id: carId,
      image_url: imageUpload.url,
      is_primary: false,
    });
  }

  // Update primary image
  if (data.primary_image_index !== undefined && data.primary_image_index !== '') {
    const primaryIndex = parseInt(data.primary_image_index);
    const allImages = await CarImage.findAll({
      where: { car_id: carId },
      order: [['created_at', 'ASC']],
    });

    for (let i = 0; i < allImages.length; i++) {
      await allImages[i].update({ is_primary: i === primaryIndex });
    }
  }

  // If car was deactivated (was active, now inactive), expire all pending requests
  const isNowActive = updateData.is_active !== undefined ? updateData.is_active : car.is_active;
  if (wasActive && !isNowActive && expireRequestsForCar) {
    await expireRequestsForCar(carId, car.car_name);
  }

  // Return updated car
  return getCarById(carId, operatorId, 'OPERATOR');
};

/**
 * Delete car
 * 
 * Logic:
 * 1. Find car and verify ownership
 * 2. Expire all pending requests for this car
 * 3. Delete all car images from S3
 * 4. Delete RC documents from S3
 * 5. Delete car images records
 * 6. Delete car record
 */
const deleteCar = async (carId, operatorId) => {
  const car = await Car.findByPk(carId, {
    include: [{ model: CarImage, as: 'images' }],
  });

  if (!car) {
    throw new Error('Car not found');
  }

  if (!compareIds(car.operator_id, operatorId)) {
    throw new Error('You do not have permission to delete this car');
  }

  // Expire all pending requests for this car before deleting
  if (expireRequestsForCar) {
    await expireRequestsForCar(carId, car.car_name);
  }

  // Delete car images from S3
  for (const image of car.images) {
    const imageKey = uploadService.getKeyFromUrl(image.image_url);
    if (imageKey) {
      try {
        await uploadService.deleteFromS3(imageKey);
      } catch (error) {
        console.error('Error deleting car image:', error.message);
      }
    }
  }

  // Delete RC documents from S3
  if (car.rc_front_url) {
    const rcFrontKey = uploadService.getKeyFromUrl(car.rc_front_url);
    if (rcFrontKey) {
      try {
        await uploadService.deleteFromS3(rcFrontKey);
      } catch (error) {
        console.error('Error deleting RC front:', error.message);
      }
    }
  }

  if (car.rc_back_url) {
    const rcBackKey = uploadService.getKeyFromUrl(car.rc_back_url);
    if (rcBackKey) {
      try {
        await uploadService.deleteFromS3(rcBackKey);
      } catch (error) {
        console.error('Error deleting RC back:', error.message);
      }
    }
  }

  // Delete car (cascade will delete images)
  await car.destroy();

  return { message: 'Car deleted successfully' };
};

/**
 * Format car with FULL details
 * Used for both listing and detail view
 * @param {Object} car - Car instance
 * @param {string} roleCode - User's role code (for showing last_active_at to operators)
 */
const formatCarDetail = (car, roleCode = null) => {
  // Sort images: primary first, then by created_at
  const sortedImages = car.images?.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  }) || [];

  const result = {
    id: car.id,
    car_number: car.car_number,
    car_name: car.car_name,
    city: car.city,
    area: car.area,
    category: car.category,
    transmission: car.transmission,
    fuel_type: car.fuel_type,
    rate_type: car.rate_type,
    rate_amount: car.rate_amount,
    deposit_amount: car.deposit_amount,
    purposes: car.purposes,
    instructions: car.instructions,
    rc_front_url: car.rc_front_url,
    rc_back_url: car.rc_back_url,
    is_active: car.is_active,
    images: sortedImages.map((img) => ({
      id: img.id,
      image_url: img.image_url,
      is_primary: img.is_primary,
    })),
    operator: car.operator ? {
      id: car.operator.id,
      full_name: car.operator.full_name,
      agency_name: car.operator.agency_name,
      profile_image_url: car.operator.profile_image_url,
      phone_number: car.operator.phone_number,
      kyc_verified: car.operator.kyc_status === 'APPROVED',
    } : null,
    created_at: car.created_at,
    updated_at: car.updated_at,
  };

  // Include last_active_at only for operators viewing their own cars
  if (roleCode === 'OPERATOR') {
    result.last_active_at = car.last_active_at;
  }

  return result;
};

module.exports = {
  listCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  setExpireRequestsForCar,
  deactivateCarAndExpireRequests,
  expireRequestsForCar: async (carId, carName) => {
    if (expireRequestsForCar) {
      return expireRequestsForCar(carId, carName);
    }
    return 0;
  },
};
