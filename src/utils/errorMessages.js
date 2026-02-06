/**
 * Centralized Error Messages
 * 
 * This file contains all user-facing error messages.
 * Messages are designed to be:
 * 1. User-friendly and understandable
 * 2. Secure (don't reveal sensitive information)
 * 3. Actionable (tell user what to do)
 * 
 * Categories:
 * - INFORMATIVE: User needs to know specific details
 * - GENERIC: Hide details for security reasons
 */

const ERROR_MESSAGES = {
  // ============================================
  // GENERIC ERRORS (Hide details for security)
  // ============================================
  
  // Default fallback
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again later.',
  
  // Authentication - Don't reveal if account exists
  INVALID_CREDENTIALS: 'Invalid credentials. Please check and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  UNAUTHORIZED: 'Please login to continue.',
  
  // Authorization - Don't confirm resource exists
  ACCESS_DENIED: 'You don\'t have access to this resource.',
  
  // Resource not found - Generic message
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  
  // Validation - Generic
  INVALID_INPUT: 'Please check your input and try again.',
  
  // Server errors - Hide technical details
  SERVER_ERROR: 'We\'re experiencing technical difficulties. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  
  // ============================================
  // INFORMATIVE ERRORS (User needs to know)
  // ============================================
  
  // Account status
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',
  ACCOUNT_NOT_ACTIVE: 'Your account is not active. Please contact support.',
  
  // KYC related
  KYC_NOT_APPROVED: 'Your KYC verification is pending. Please complete KYC to continue.',
  KYC_REJECTED: 'Your KYC was rejected. Please resubmit with correct documents.',
  SELECT_ROLE_FIRST: 'Please select your role before submitting KYC.',
  
  // Document related - User needs to know to use different document
  DOCUMENT_ALREADY_REGISTERED: 'This document is already registered. Please use a different document.',
  DOCUMENT_INVALID: 'The document provided is invalid. Please check and try again.',
  
  // Car related - User needs to know
  CAR_ALREADY_REGISTERED: 'A car with this registration number is already registered.',
  CAR_NOT_AVAILABLE: 'This car is currently not available.',
  CAR_INACTIVE: 'This car listing is not active.',
  
  // Booking related - User needs to know status
  REQUEST_ALREADY_EXISTS: 'You already have a pending request for this.',
  REQUEST_EXPIRED: 'This request has expired.',
  REQUEST_ALREADY_PROCESSED: 'This request has already been processed.',
  CANNOT_BOOK_OWN_CAR: 'You cannot book your own car.',
  CANNOT_INVITE_SELF: 'You cannot send an invitation to yourself.',
  
  // Limits - User needs to know
  DAILY_LIMIT_REACHED: 'You\'ve reached your daily limit. Please try again tomorrow.',
  
  // File upload
  FILE_TOO_LARGE: 'The file is too large. Please upload a smaller file (max 5MB).',
  INVALID_FILE_TYPE: 'Invalid file type. Only JPEG, JPG and PNG images are allowed.',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  
  // Validation specific
  REQUIRED_FIELD: 'This field is required.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  
  // Route not found
  ROUTE_NOT_FOUND: 'The requested endpoint does not exist.',
};

/**
 * Error codes for internal logging/debugging
 * These are NOT shown to users
 */
const ERROR_CODES = {
  // Auth
  AUTH_FIREBASE_ERROR: 'AUTH_001',
  AUTH_TOKEN_INVALID: 'AUTH_002',
  AUTH_TOKEN_EXPIRED: 'AUTH_003',
  AUTH_USER_NOT_FOUND: 'AUTH_004',
  AUTH_WRONG_PASSWORD: 'AUTH_005',
  AUTH_ACCOUNT_SUSPENDED: 'AUTH_006',
  
  // KYC
  KYC_NOT_APPROVED: 'KYC_001',
  KYC_DOCUMENT_DUPLICATE: 'KYC_002',
  KYC_ROLE_NOT_SELECTED: 'KYC_003',
  
  // Car
  CAR_NOT_FOUND: 'CAR_001',
  CAR_DUPLICATE: 'CAR_002',
  CAR_PERMISSION_DENIED: 'CAR_003',
  CAR_NOT_ACTIVE: 'CAR_004',
  
  // Booking
  BOOKING_NOT_FOUND: 'BOOK_001',
  BOOKING_PERMISSION_DENIED: 'BOOK_002',
  BOOKING_DUPLICATE: 'BOOK_003',
  BOOKING_EXPIRED: 'BOOK_004',
  BOOKING_INVALID_STATUS: 'BOOK_005',
  BOOKING_LIMIT_REACHED: 'BOOK_006',
  
  // User
  USER_NOT_FOUND: 'USER_001',
  USER_PERMISSION_DENIED: 'USER_002',
  USER_SUSPENDED: 'USER_003',
  
  // Validation
  VALIDATION_ERROR: 'VAL_001',
  
  // Server
  DATABASE_ERROR: 'DB_001',
  INTERNAL_ERROR: 'INT_001',
  SERVICE_ERROR: 'SVC_001',
};

module.exports = {
  ERROR_MESSAGES,
  ERROR_CODES,
};
