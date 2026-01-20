'use strict';

const { User, Role, UserIdentity, Car, CarImage, BookingRequest } = require('../models');
const { Op } = require('sequelize');
const uploadService = require('./uploadService');
const notificationService = require('./notificationService');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  // Get role IDs
  const driverRole = await Role.findOne({ where: { code: 'DRIVER' } });
  const operatorRole = await Role.findOne({ where: { code: 'OPERATOR' } });

  // User stats
  const [totalUsers, totalDrivers, totalOperators, newToday, newThisWeek] = await Promise.all([
    User.count({ where: { role_id: { [Op.in]: [driverRole?.id, operatorRole?.id].filter(Boolean) } } }),
    User.count({ where: { role_id: driverRole?.id } }),
    User.count({ where: { role_id: operatorRole?.id } }),
    User.count({
      where: {
        role_id: { [Op.in]: [driverRole?.id, operatorRole?.id].filter(Boolean) },
        created_at: { [Op.gte]: today },
      },
    }),
    User.count({
      where: {
        role_id: { [Op.in]: [driverRole?.id, operatorRole?.id].filter(Boolean) },
        created_at: { [Op.gte]: weekAgo },
      },
    }),
  ]);

  // KYC stats
  const [kycPending, kycApproved, kycRejected] = await Promise.all([
    User.count({
      where: {
        role_id: { [Op.in]: [driverRole?.id, operatorRole?.id].filter(Boolean) },
        kyc_status: 'PENDING',
      },
    }),
    User.count({
      where: {
        role_id: { [Op.in]: [driverRole?.id, operatorRole?.id].filter(Boolean) },
        kyc_status: 'APPROVED',
      },
    }),
    User.count({
      where: {
        role_id: { [Op.in]: [driverRole?.id, operatorRole?.id].filter(Boolean) },
        kyc_status: 'REJECTED',
      },
    }),
  ]);

  // Car stats
  const [totalCars, activeCars, inactiveCars] = await Promise.all([
    Car.count(),
    Car.count({ where: { is_active: true } }),
    Car.count({ where: { is_active: false } }),
  ]);

  // Booking request stats
  const [totalRequests, pendingRequests, acceptedRequests, rejectedRequests, requestsToday] =
    await Promise.all([
      BookingRequest.count(),
      BookingRequest.count({ where: { status: 'PENDING' } }),
      BookingRequest.count({ where: { status: 'ACCEPTED' } }),
      BookingRequest.count({ where: { status: 'REJECTED' } }),
      BookingRequest.count({ where: { created_at: { [Op.gte]: today } } }),
    ]);

  return {
    users: {
      total: totalUsers,
      drivers: totalDrivers,
      operators: totalOperators,
      new_today: newToday,
      new_this_week: newThisWeek,
    },
    kyc: {
      pending: kycPending,
      approved: kycApproved,
      rejected: kycRejected,
    },
    cars: {
      total: totalCars,
      active: activeCars,
      inactive: inactiveCars,
    },
    booking_requests: {
      total: totalRequests,
      pending: pendingRequests,
      accepted: acceptedRequests,
      rejected: rejectedRequests,
      today: requestsToday,
    },
  };
};

/**
 * List users with filters
 */
const listUsers = async (filters) => {
  const { search, role, kyc_status, is_active, page, limit } = filters;
  const offset = (page - 1) * limit;

  // Get role IDs
  const driverRole = await Role.findOne({ where: { code: 'DRIVER' } });
  const operatorRole = await Role.findOne({ where: { code: 'OPERATOR' } });

  const where = {
    role_id: { [Op.in]: [driverRole?.id, operatorRole?.id].filter(Boolean) },
  };

  // Role filter
  if (role && role !== 'ALL') {
    const targetRole = await Role.findOne({ where: { code: role } });
    if (targetRole) {
      where.role_id = targetRole.id;
    }
  }

  // KYC status filter
  if (kyc_status && kyc_status !== 'ALL') {
    where.kyc_status = kyc_status;
  }

  // Active status filter
  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  // Search filter
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { phone_number: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['code', 'name'],
      },
      {
        model: UserIdentity,
        as: 'documents',
        attributes: ['id'],
      },
    ],
    attributes: [
      'id',
      'phone_number',
      'full_name',
      'profile_image_url',
      'kyc_status',
      'is_active',
      'created_at',
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  const users = rows.map((user) => ({
    id: user.id.toString(),
    phone_number: user.phone_number,
    full_name: user.full_name,
    role: user.role?.code || null,
    kyc_status: user.kyc_status,
    is_active: user.is_active,
    profile_image_url: user.profile_image_url,
    documents_count: user.documents?.length || 0,
    created_at: user.created_at,
  }));

  return {
    data: users,
    meta: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Get user details by ID
 */
const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['code', 'name'],
      },
      {
        model: UserIdentity,
        as: 'documents',
        attributes: ['id', 'document_type', 'front_doc_url', 'back_doc_url', 'status', 'reject_reason', 'created_at'],
      },
    ],
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Get user stats
  const [carsCount, requestsSent, requestsReceived] = await Promise.all([
    Car.count({ where: { operator_id: userId } }),
    BookingRequest.count({ where: { driver_id: userId, initiated_by: 'DRIVER' } }),
    BookingRequest.count({
      where: {
        [Op.or]: [
          { driver_id: userId, initiated_by: 'OPERATOR' },
          { operator_id: userId, initiated_by: 'DRIVER' },
        ],
      },
    }),
  ]);

  return {
    id: user.id.toString(),
    phone_number: user.phone_number,
    full_name: user.full_name,
    address: user.address,
    agency_name: user.agency_name,
    profile_image_url: user.profile_image_url,
    dob: user.dob,
    role: user.role?.code || null,
    kyc_status: user.kyc_status,
    kyc_reject_reason: user.kyc_reject_reason,
    is_active: user.is_active,
    created_at: user.created_at,
    documents: user.documents.map((doc) => ({
      id: doc.id,
      document_type: doc.document_type,
      front_doc_url: doc.front_doc_url,
      back_doc_url: doc.back_doc_url,
      status: doc.status,
      reject_reason: doc.reject_reason,
      created_at: doc.created_at,
    })),
    stats: {
      cars_count: carsCount,
      booking_requests_sent: requestsSent,
      booking_requests_received: requestsReceived,
    },
  };
};

/**
 * Update user status (suspend/activate)
 */
const updateUserStatus = async (userId, data) => {
  const { is_active } = data;

  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Don't allow suspending admin users
  const adminRole = await Role.findOne({ where: { code: 'ADMIN' } });
  if (user.role_id === adminRole?.id) {
    const error = new Error('Cannot modify admin user status');
    error.statusCode = 403;
    throw error;
  }

  const previousStatus = user.is_active;
  user.is_active = is_active;
  await user.save();

  // Send notification if status changed
  if (previousStatus !== is_active) {
    if (is_active) {
      notificationService.notifyAccountActivated(userId)
        .catch((err) => console.error('Notification error:', err));
    } else {
      notificationService.notifyAccountSuspended(userId)
        .catch((err) => console.error('Notification error:', err));
    }
  }

  return {
    id: user.id.toString(),
    is_active: user.is_active,
  };
};

/**
 * List users with pending KYC
 */
const listPendingKyc = async (filters) => {
  const { role, page, limit } = filters;
  const offset = (page - 1) * limit;

  // Get role IDs
  const driverRole = await Role.findOne({ where: { code: 'DRIVER' } });
  const operatorRole = await Role.findOne({ where: { code: 'OPERATOR' } });

  const where = {
    kyc_status: 'PENDING',
    role_id: { [Op.in]: [driverRole?.id, operatorRole?.id].filter(Boolean) },
  };

  // Role filter
  if (role && role !== 'ALL') {
    const targetRole = await Role.findOne({ where: { code: role } });
    if (targetRole) {
      where.role_id = targetRole.id;
    }
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['code', 'name'],
      },
      {
        model: UserIdentity,
        as: 'documents',
        attributes: ['id', 'document_type', 'status'],
      },
    ],
    attributes: [
      'id',
      'phone_number',
      'full_name',
      'profile_image_url',
      'kyc_status',
      'created_at',
    ],
    order: [['created_at', 'ASC']], // Oldest first
    limit,
    offset,
  });

  const users = rows.map((user) => ({
    id: user.id.toString(),
    phone_number: user.phone_number,
    full_name: user.full_name,
    role: user.role?.code || null,
    kyc_status: user.kyc_status,
    profile_image_url: user.profile_image_url,
    documents: user.documents.map((doc) => ({
      id: doc.id,
      document_type: doc.document_type,
      status: doc.status,
    })),
    submitted_at: user.created_at,
  }));

  return {
    data: users,
    meta: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Update user KYC status
 */
const updateUserKycStatus = async (userId, data) => {
  const { status, reject_reason } = data;

  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.kyc_status = status;
  user.kyc_reject_reason = status === 'REJECTED' ? reject_reason || null : null;
  await user.save();

  // If approved, also approve all pending documents
  if (status === 'APPROVED') {
    await UserIdentity.update(
      { status: 'APPROVED', reject_reason: null },
      { where: { user_id: userId, status: 'PENDING' } }
    );
  }

  // Send notification
  if (status === 'APPROVED') {
    notificationService.notifyKycApproved(userId)
      .catch((err) => console.error('Notification error:', err));
  } else {
    notificationService.notifyKycRejected(userId, reject_reason)
      .catch((err) => console.error('Notification error:', err));
  }

  return {
    id: user.id.toString(),
    kyc_status: user.kyc_status,
    kyc_reject_reason: user.kyc_reject_reason,
  };
};

/**
 * Update document status
 */
const updateDocumentStatus = async (documentId, data) => {
  const { status, reject_reason } = data;

  const document = await UserIdentity.findByPk(documentId);

  if (!document) {
    const error = new Error('Document not found');
    error.statusCode = 404;
    throw error;
  }

  document.status = status;
  document.reject_reason = status === 'REJECTED' ? reject_reason || null : null;
  await document.save();

  // Send notification
  if (status === 'APPROVED') {
    notificationService.notifyDocumentApproved(document.user_id, document.document_type)
      .catch((err) => console.error('Notification error:', err));
  } else {
    notificationService.notifyDocumentRejected(document.user_id, document.document_type, reject_reason)
      .catch((err) => console.error('Notification error:', err));
  }

  return {
    id: document.id,
    document_type: document.document_type,
    status: document.status,
    reject_reason: document.reject_reason,
  };
};

/**
 * List all cars (admin)
 */
const listCars = async (filters) => {
  const { search, operator_id, category, is_active, page, limit } = filters;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where.car_name = { [Op.iLike]: `%${search}%` };
  }

  if (operator_id) {
    where.operator_id = operator_id;
  }

  if (category) {
    where.category = category;
  }

  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  const { count, rows } = await Car.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'full_name', 'agency_name', 'phone_number', 'profile_image_url'],
      },
      {
        model: CarImage,
        as: 'images',
        attributes: ['id', 'image_url', 'is_primary'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  const cars = rows.map((car) => formatCar(car));

  return {
    data: cars,
    meta: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

/**
 * Get car by ID (admin)
 */
const getCarById = async (carId) => {
  const car = await Car.findByPk(carId, {
    include: [
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'full_name', 'agency_name', 'phone_number', 'profile_image_url', 'kyc_status'],
      },
      {
        model: CarImage,
        as: 'images',
        attributes: ['id', 'image_url', 'is_primary'],
      },
    ],
  });

  if (!car) {
    const error = new Error('Car not found');
    error.statusCode = 404;
    throw error;
  }

  return formatCar(car);
};

/**
 * Delete car (admin)
 */
const deleteCar = async (carId) => {
  const car = await Car.findByPk(carId, {
    include: [
      {
        model: CarImage,
        as: 'images',
      },
    ],
  });

  if (!car) {
    const error = new Error('Car not found');
    error.statusCode = 404;
    throw error;
  }

  // Delete images from S3
  const deletePromises = [];

  if (car.rc_front_url) {
    deletePromises.push(uploadService.deleteFile(car.rc_front_url));
  }
  if (car.rc_back_url) {
    deletePromises.push(uploadService.deleteFile(car.rc_back_url));
  }

  for (const image of car.images) {
    if (image.image_url) {
      deletePromises.push(uploadService.deleteFile(image.image_url));
    }
  }

  await Promise.all(deletePromises);

  // Delete car (cascade deletes images)
  await car.destroy();
};

/**
 * List all booking requests (admin)
 */
const listBookingRequests = async (filters) => {
  const { status, initiated_by, car_id, driver_id, operator_id, page, limit } = filters;
  const offset = (page - 1) * limit;

  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (initiated_by && initiated_by !== 'ALL') {
    where.initiated_by = initiated_by;
  }

  if (car_id) {
    where.car_id = car_id;
  }

  if (driver_id) {
    where.driver_id = driver_id;
  }

  if (operator_id) {
    where.operator_id = operator_id;
  }

  const { count, rows } = await BookingRequest.findAndCountAll({
    where,
    include: [
      {
        model: Car,
        as: 'car',
        attributes: ['id', 'car_name', 'category'],
      },
      {
        model: User,
        as: 'driver',
        attributes: ['id', 'full_name', 'phone_number', 'profile_image_url'],
      },
      {
        model: User,
        as: 'requestOperator',
        attributes: ['id', 'full_name', 'agency_name', 'phone_number', 'profile_image_url'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  const requests = rows.map((request) => ({
    id: request.id.toString(),
    initiated_by: request.initiated_by,
    message: request.message,
    status: request.status,
    reject_reason: request.reject_reason,
    created_at: request.created_at,
    updated_at: request.updated_at,
    car: {
      id: request.car.id.toString(),
      car_name: request.car.car_name,
      category: request.car.category,
    },
    driver: {
      id: request.driver.id.toString(),
      full_name: request.driver.full_name,
      phone_number: request.driver.phone_number,
      profile_image_url: request.driver.profile_image_url,
    },
    operator: {
      id: request.requestOperator.id.toString(),
      full_name: request.requestOperator.full_name,
      agency_name: request.requestOperator.agency_name,
      phone_number: request.requestOperator.phone_number,
      profile_image_url: request.requestOperator.profile_image_url,
    },
  }));

  return {
    data: requests,
    meta: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

// Helper functions
const formatCar = (car) => {
  const sortedImages = car.images
    ? [...car.images].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    : [];

  return {
    id: car.id.toString(),
    car_name: car.car_name,
    category: car.category,
    transmission: car.transmission,
    fuel_type: car.fuel_type,
    rate_type: car.rate_type,
    rate_amount: parseFloat(car.rate_amount),
    deposit_amount: car.deposit_amount ? parseFloat(car.deposit_amount) : null,
    purposes: car.purposes || [],
    instructions: car.instructions,
    rc_front_url: car.rc_front_url,
    rc_back_url: car.rc_back_url,
    is_active: car.is_active,
    images: sortedImages.map((img) => ({
      id: img.id,
      image_url: img.image_url,
      is_primary: img.is_primary,
    })),
    operator: car.operator
      ? {
          id: car.operator.id.toString(),
          full_name: car.operator.full_name,
          agency_name: car.operator.agency_name,
          phone_number: car.operator.phone_number,
          profile_image_url: car.operator.profile_image_url,
          kyc_verified: car.operator.kyc_status === 'APPROVED',
        }
      : null,
    created_at: car.created_at,
    updated_at: car.updated_at,
  };
};

module.exports = {
  getDashboardStats,
  listUsers,
  getUserById,
  updateUserStatus,
  listPendingKyc,
  updateUserKycStatus,
  updateDocumentStatus,
  listCars,
  getCarById,
  deleteCar,
  listBookingRequests,
};
