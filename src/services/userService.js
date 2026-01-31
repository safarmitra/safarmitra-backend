const { User, Role, UserIdentity } = require('../models');
const { Op } = require('sequelize');
const uploadService = require('./uploadService');

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
    throw new Error('User not found');
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
 * Update user profile (info + image)
 * 
 * Logic:
 * 1. Find user by ID
 * 2. Throw error if user not found
 * 3. Build update data from allowed fields
 * 4. If profile image provided:
 *    a. Delete old image from S3 (if exists)
 *    b. Upload new image to S3
 *    c. Add new image URL to update data
 * 5. Update user record
 * 6. Return updated profile
 */
const updateProfile = async (userId, data, profileImage = null) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Build update data from allowed fields
  const allowedFields = ['full_name', 'dob', 'city', 'area', 'agency_name'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  // Handle profile image upload
  if (profileImage) {
    // Delete old image if exists
    if (user.profile_image_url) {
      const oldKey = uploadService.getKeyFromUrl(user.profile_image_url);
      if (oldKey) {
        try {
          await uploadService.deleteFromS3(oldKey);
        } catch (error) {
          console.error('Error deleting old profile image:', error.message);
        }
      }
    }

    // Upload new image
    const { url } = await uploadService.uploadToS3(profileImage, 'profiles');
    updateData.profile_image_url = url;
  }

  // Update user
  await user.update(updateData);

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
    throw new Error('User not found');
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
 * 3. Apply search filter if provided
 * 4. Return paginated list
 */
const listDrivers = async (filters) => {
  const { search, page = 1, limit = 10 } = filters;
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

  // Search filter
  if (search) {
    where[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { phone_number: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'full_name', 'phone_number', 'profile_image_url', 'kyc_status'],
    order: [['full_name', 'ASC']],
    limit,
    offset,
  });

  const drivers = rows.map((user) => ({
    id: user.id.toString(),
    full_name: user.full_name,
    phone_number: user.phone_number,
    profile_image_url: user.profile_image_url,
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
