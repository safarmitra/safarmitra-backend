const { Op } = require('sequelize');
const { Car, CarImage, User, Role } = require('../models');
const uploadService = require('./uploadService');

/**
 * List cars with filters and pagination
 * 
 * Logic:
 * 1. Check user role (DRIVER or OPERATOR)
 * 2. For DRIVER: Show only active cars from all operators
 * 3. For OPERATOR: Show only their own cars (active + inactive)
 * 4. Apply filters (search, category, fuel_type, etc.)
 * 5. Apply pagination
 * 6. Return cars with FULL details (all images, operator info)
 */
const listCars = async (userId, roleCode, filters) => {
  const {
    search,
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

  // Format response with FULL details
  const formattedCars = cars.map((car) => formatCarDetail(car));

  return {
    cars: formattedCars,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Get car by ID
 * 
 * Logic:
 * 1. Find car by ID with images and operator info
 * 2. For DRIVER: Only allow viewing active cars
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
    // Drivers can only view active cars
    if (!car.is_active) {
      throw new Error('Car not found');
    }
  } else if (roleCode === 'OPERATOR') {
    // Operators can only view their own cars
    if (car.operator_id !== parseInt(userId)) {
      throw new Error('You do not have permission to view this car');
    }
  }

  return formatCarDetail(car);
};

/**
 * Create new car
 * 
 * Logic:
 * 1. Upload RC front and back images to S3
 * 2. Upload car images to S3 (if provided)
 * 3. Parse purposes from comma-separated string to array
 * 4. Create car record
 * 5. Create car image records
 * 6. Set primary image
 * 7. Return created car
 */
const createCar = async (operatorId, data, files) => {
  // Upload RC documents
  const rcFrontFile = files['rc_front'][0];
  const rcBackFile = files['rc_back'][0];

  const rcFrontUpload = await uploadService.uploadToS3(rcFrontFile, 'cars/rc');
  const rcBackUpload = await uploadService.uploadToS3(rcBackFile, 'cars/rc');

  // Parse purposes
  let purposes = null;
  if (data.purposes) {
    purposes = data.purposes.split(',').map((p) => p.trim());
  }

  // Create car
  const car = await Car.create({
    operator_id: operatorId,
    car_name: data.car_name,
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
  });

  // Upload and create car images
  const imageFiles = files['images'] || [];
  const primaryIndex = data.primary_image_index ? parseInt(data.primary_image_index) : 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const imageUpload = await uploadService.uploadToS3(imageFiles[i], 'cars/images');
    await CarImage.create({
      car_id: car.id,
      image_url: imageUpload.url,
      is_primary: i === primaryIndex,
    });
  }

  // Return created car
  return getCarById(car.id, operatorId, 'OPERATOR');
};

/**
 * Update car
 * 
 * Logic:
 * 1. Find car and verify ownership
 * 2. Update RC documents if provided
 * 3. Update car fields
 * 4. Handle image removal (remove_images)
 * 5. Upload new images if provided
 * 6. Update primary image
 * 7. Return updated car
 */
const updateCar = async (carId, operatorId, data, files) => {
  const car = await Car.findByPk(carId);

  if (!car) {
    throw new Error('Car not found');
  }

  if (car.operator_id !== parseInt(operatorId)) {
    throw new Error('You do not have permission to update this car');
  }

  const updateData = {};

  // Update basic fields
  const allowedFields = [
    'car_name', 'category', 'transmission', 'fuel_type',
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

  // Return updated car
  return getCarById(carId, operatorId, 'OPERATOR');
};

/**
 * Delete car
 * 
 * Logic:
 * 1. Find car and verify ownership
 * 2. Delete all car images from S3
 * 3. Delete RC documents from S3
 * 4. Delete car images records
 * 5. Delete car record
 */
const deleteCar = async (carId, operatorId) => {
  const car = await Car.findByPk(carId, {
    include: [{ model: CarImage, as: 'images' }],
  });

  if (!car) {
    throw new Error('Car not found');
  }

  if (car.operator_id !== parseInt(operatorId)) {
    throw new Error('You do not have permission to delete this car');
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
 */
const formatCarDetail = (car) => {
  // Sort images: primary first, then by created_at
  const sortedImages = car.images?.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return 0;
  }) || [];

  return {
    id: car.id,
    car_name: car.car_name,
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
};

module.exports = {
  listCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
};
