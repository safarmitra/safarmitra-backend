const { User, Role, UserIdentity } = require('../models');
const { Op } = require('sequelize');
const uploadService = require('./uploadService');
const AppError = require('../utils/AppError');

/**
 * Get user profile by ID (current user)
 * 
 * Logic:
 * 1. Find user by ID with role association
 * 2. Throw error if user not found
 * 3. Build onboarding status for Flutter navigation
 * 4. Format and return user profile with onboarding
 */
const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Role, as: 'role' }],
  });

  if (!user) {
    throw AppError.userNotFound(`User ${userId} not found in getProfile`);
  }

  // Build onboarding status
  // KYC status values:
  // - NOT_SUBMITTED: User hasn't submitted KYC documents yet
  // - PENDING: User submitted KYC, waiting for admin review
  // - APPROVED: Admin approved KYC
  // - REJECTED: Admin rejected KYC
  const kycSubmitted = user.kyc_status !== 'NOT_SUBMITTED';

  const onboarding = {
    role_selected: !!user.role_id,
    kyc_submitted: kycSubmitted,
    kyc_status: user.kyc_status,
  };

  return {
    ...formatUserProfile(user),
    onboarding,
  };
};

/**
 * Update user profile (only city and area)
 * 
 * Logic:
 * 1. Find user by ID
 * 2. Throw error if user not found
 * 3. Build update data from allowed fields (city, area only)
 * 4. Update user record
 * 5. Return updated profile
 * 
 * Note: Only city and area can be edited. All other fields including
 * profile image are silently ignored.
 */
const updateProfile = async (userId, data) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw AppError.userNotFound(`User ${userId} not found in updateProfile`);
  }

  // Build update data from allowed fields (only city and area)
  const allowedFields = ['city', 'area'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  // Update user only if there are allowed fields to update
  if (Object.keys(updateData).length > 0) {
    await user.update(updateData);
  }

  return getProfile(userId);
};

/**
 * Get public user info by ID
 * 
 * Logic:
 * 1. Find user by ID with limited fields
 * 2. Throw error if user not found
 * 3. Return public profile data
 */
const getPublicProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'full_name', 'agency_name', 'profile_image_url', 'phone_number', 'kyc_status'],
  });

  if (!user) {
    throw AppError.userNotFound(`User ${userId} not found in getPublicProfile`);
  }

  return {
    id: user.id,
    full_name: user.full_name,
    agency_name: user.agency_name,
    profile_image_url: user.profile_image_url,
    phone_number: user.phone_number,
    kyc_verified: user.kyc_status === 'APPROVED',
  };
};

/**
 * Format user profile response
 */
const formatUserProfile = (user) => {
  return {
    id: user.id,
    phone_number: user.phone_number,
    full_name: user.full_name,
    dob: user.dob,
    city: user.city,
    area: user.area,
    agency_name: user.agency_name,
    profile_image_url: user.profile_image_url,
    role: user.role?.code || null,
    kyc_status: user.kyc_status,
    is_active: user.is_active,
    created_at: user.created_at,
  };
};

/**
 * List verified drivers (for operators to invite)
 * 
 * Logic:
 * 1. Find all users with DRIVER role
 * 2. Filter by KYC approved and active
 * 3. Apply search, city, area filters if provided
 * 4. Return paginated list with city/area info
 */
const listDrivers = async (filters) => {
  const { search, city, area, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  // Get driver role
  const driverRole = await Role.findOne({ where: { code: 'DRIVER' } });

  if (!driverRole) {
    return {
      data: [],
      meta: { page, limit, total: 0, total_pages: 0 },
    };
  }

  const where = {
    role_id: driverRole.id,
    kyc_status: 'APPROVED',
    is_active: true,
  };

  // City filter (case-insensitive)
  if (city) {
    where.city = { [Op.iLike]: city };
  }

  // Area filter (case-insensitive)
  if (area) {
    where.area = { [Op.iLike]: area };
  }

  // Search filter (name or phone)
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { phone_number: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'full_name', 'phone_number', 'profile_image_url', 'city', 'area', 'kyc_status'],
    order: [['full_name', 'ASC']],
    limit,
    offset,
  });

  const drivers = rows.map((user) => ({
    id: user.id.toString(),
    full_name: user.full_name,
    phone_number: user.phone_number,
    profile_image_url: user.profile_image_url,
    city: user.city,
    area: user.area,
    kyc_verified: user.kyc_status === 'APPROVED',
  }));

  return {
    data: drivers,
    meta: {
      page,
      limit,
      total: count,
      total_pages: Math.ceil(count / limit),
    },
  };
};

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
  formatUserProfile,
  listDrivers,
};
