'use strict';

/**
 * Notification Templates for Safar Mitra
 * 
 * Each template returns:
 * - title: Notification title (no emojis for better compatibility)
 * - body: Notification body text
 * - data: Additional data for the app to handle
 */

const NOTIFICATION_TYPES = {
  // Booking Request Events
  BOOKING_REQUEST_CREATED: 'BOOKING_REQUEST_CREATED',
  BOOKING_INVITATION_CREATED: 'BOOKING_INVITATION_CREATED',
  BOOKING_REQUEST_ACCEPTED: 'BOOKING_REQUEST_ACCEPTED',
  BOOKING_REQUEST_ACCEPTED_CONFIRMATION: 'BOOKING_REQUEST_ACCEPTED_CONFIRMATION',
  BOOKING_REQUEST_REJECTED: 'BOOKING_REQUEST_REJECTED',
  BOOKING_INVITATION_ACCEPTED: 'BOOKING_INVITATION_ACCEPTED',
  BOOKING_INVITATION_ACCEPTED_CONFIRMATION: 'BOOKING_INVITATION_ACCEPTED_CONFIRMATION',
  BOOKING_INVITATION_REJECTED: 'BOOKING_INVITATION_REJECTED',
  BOOKING_REQUEST_CANCELLED: 'BOOKING_REQUEST_CANCELLED',
  BOOKING_INVITATION_CANCELLED: 'BOOKING_INVITATION_CANCELLED',

  // Expiry Events
  BOOKING_REQUEST_EXPIRED: 'BOOKING_REQUEST_EXPIRED',
  BOOKING_INVITATION_EXPIRED: 'BOOKING_INVITATION_EXPIRED',
  REQUEST_EXPIRED_CAR_UNAVAILABLE: 'REQUEST_EXPIRED_CAR_UNAVAILABLE',
  CAR_AUTO_DEACTIVATED: 'CAR_AUTO_DEACTIVATED',

  // Limit Events
  DAILY_LIMIT_REACHED: 'DAILY_LIMIT_REACHED',

  // KYC Events
  KYC_APPROVED: 'KYC_APPROVED',
  KYC_REJECTED: 'KYC_REJECTED',
  DOCUMENT_APPROVED: 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED: 'DOCUMENT_REJECTED',

  // Account Events
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED',
};

const CLICK_ACTIONS = {
  OPEN_RECEIVED_REQUESTS: 'OPEN_RECEIVED_REQUESTS',
  OPEN_SENT_REQUESTS: 'OPEN_SENT_REQUESTS',
  OPEN_DASHBOARD: 'OPEN_DASHBOARD',
  OPEN_KYC: 'OPEN_KYC',
  OPEN_MY_CARS: 'OPEN_MY_CARS',
  LOGOUT: 'LOGOUT',
};

/**
 * Booking Request Templates
 */

// Driver requests a car -> Notify Operator
const bookingRequestCreated = (driverName, carName, requestId, carId) => ({
  title: 'New Booking Request',
  body: `${driverName} requested your ${carName}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_REQUEST_CREATED,
    request_id: String(requestId),
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_RECEIVED_REQUESTS,
  },
});

// Operator invites a driver -> Notify Driver
const bookingInvitationCreated = (operatorName, carName, requestId, carId) => ({
  title: 'New Car Invitation',
  body: `${operatorName} invited you for ${carName}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_INVITATION_CREATED,
    request_id: String(requestId),
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_RECEIVED_REQUESTS,
  },
});

// Operator accepts driver's request -> Notify Driver (with operator's phone)
const bookingRequestAccepted = (operatorName, carName, requestId, carId, operatorPhone) => ({
  title: 'Request Accepted!',
  body: `${operatorName} accepted your request for ${carName}. Contact: ${operatorPhone}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_REQUEST_ACCEPTED,
    request_id: String(requestId),
    car_id: String(carId),
    phone_number: operatorPhone,
    click_action: CLICK_ACTIONS.OPEN_SENT_REQUESTS,
  },
});

// Operator accepts driver's request -> Notify Operator (confirmation with driver's phone)
const bookingRequestAcceptedConfirmation = (driverName, carName, requestId, carId, driverPhone) => ({
  title: 'Request Accepted',
  body: `You accepted ${driverName}'s request for ${carName}. Driver contact: ${driverPhone}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_REQUEST_ACCEPTED_CONFIRMATION,
    request_id: String(requestId),
    car_id: String(carId),
    phone_number: driverPhone,
    click_action: CLICK_ACTIONS.OPEN_RECEIVED_REQUESTS,
  },
});

// Operator rejects driver's request -> Notify Driver
const bookingRequestRejected = (operatorName, carName, requestId, carId, reason = null) => ({
  title: 'Request Rejected',
  body: reason
    ? `${operatorName} rejected your request for ${carName}. Reason: ${reason}`
    : `${operatorName} rejected your request for ${carName}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_REQUEST_REJECTED,
    request_id: String(requestId),
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_SENT_REQUESTS,
  },
});

// Driver accepts operator's invitation -> Notify Operator (with driver's phone)
const bookingInvitationAccepted = (driverName, carName, requestId, carId, driverPhone) => ({
  title: 'Invitation Accepted!',
  body: `${driverName} accepted your invitation for ${carName}. Contact: ${driverPhone}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_INVITATION_ACCEPTED,
    request_id: String(requestId),
    car_id: String(carId),
    phone_number: driverPhone,
    click_action: CLICK_ACTIONS.OPEN_SENT_REQUESTS,
  },
});

// Driver accepts operator's invitation -> Notify Driver (confirmation with operator's phone)
const bookingInvitationAcceptedConfirmation = (operatorName, carName, requestId, carId, operatorPhone) => ({
  title: 'Invitation Accepted',
  body: `You accepted ${operatorName}'s invitation for ${carName}. Operator contact: ${operatorPhone}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_INVITATION_ACCEPTED_CONFIRMATION,
    request_id: String(requestId),
    car_id: String(carId),
    phone_number: operatorPhone,
    click_action: CLICK_ACTIONS.OPEN_RECEIVED_REQUESTS,
  },
});

// Driver rejects operator's invitation -> Notify Operator
const bookingInvitationRejected = (driverName, carName, requestId, carId, reason = null) => ({
  title: 'Invitation Rejected',
  body: reason
    ? `${driverName} rejected your invitation for ${carName}. Reason: ${reason}`
    : `${driverName} rejected your invitation for ${carName}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_INVITATION_REJECTED,
    request_id: String(requestId),
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_SENT_REQUESTS,
  },
});

// Driver cancels their request -> Notify Operator
const bookingRequestCancelled = (driverName, carName, carId) => ({
  title: 'Request Cancelled',
  body: `${driverName} cancelled their request for ${carName}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_REQUEST_CANCELLED,
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_RECEIVED_REQUESTS,
  },
});

// Operator cancels their invitation -> Notify Driver
const bookingInvitationCancelled = (operatorName, carName, carId) => ({
  title: 'Invitation Cancelled',
  body: `${operatorName} cancelled the invitation for ${carName}`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_INVITATION_CANCELLED,
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_RECEIVED_REQUESTS,
  },
});

/**
 * Expiry Templates
 */

// Driver's request expired (3 days) -> Notify Driver
const bookingRequestExpired = (carName, carId) => ({
  title: 'Request Expired',
  body: `Your request for ${carName} has expired`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_REQUEST_EXPIRED,
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_SENT_REQUESTS,
  },
});

// Operator's invitation expired (3 days) -> Notify Operator
const bookingInvitationExpired = (driverName, carName, carId) => ({
  title: 'Invitation Expired',
  body: `Your invitation to ${driverName} for ${carName} has expired`,
  data: {
    type: NOTIFICATION_TYPES.BOOKING_INVITATION_EXPIRED,
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_SENT_REQUESTS,
  },
});

// Request expired because car was deactivated -> Notify initiator
const requestExpiredCarUnavailable = (carName, carId) => ({
  title: 'Request Expired',
  body: `Request for ${carName} expired - car is no longer available`,
  data: {
    type: NOTIFICATION_TYPES.REQUEST_EXPIRED_CAR_UNAVAILABLE,
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_SENT_REQUESTS,
  },
});

// Car auto-deactivated due to inactivity -> Notify Operator
const carAutoDeactivated = (carName, carId) => ({
  title: 'Car Deactivated',
  body: `Your ${carName} was deactivated due to 7 days of inactivity. Edit to reactivate.`,
  data: {
    type: NOTIFICATION_TYPES.CAR_AUTO_DEACTIVATED,
    car_id: String(carId),
    click_action: CLICK_ACTIONS.OPEN_MY_CARS,
  },
});

/**
 * KYC Templates
 */

// Admin approves KYC -> Notify User
const kycApproved = () => ({
  title: 'KYC Approved',
  body: 'Your KYC has been verified. You can now use all features.',
  data: {
    type: NOTIFICATION_TYPES.KYC_APPROVED,
    click_action: CLICK_ACTIONS.OPEN_DASHBOARD,
  },
});

// Admin rejects KYC -> Notify User
const kycRejected = (reason = null) => ({
  title: 'KYC Rejected',
  body: reason
    ? `Your KYC was rejected. Reason: ${reason}`
    : 'Your KYC was rejected. Please check and resubmit.',
  data: {
    type: NOTIFICATION_TYPES.KYC_REJECTED,
    click_action: CLICK_ACTIONS.OPEN_KYC,
  },
});

// Admin approves document -> Notify User
const documentApproved = (documentType) => ({
  title: 'Document Approved',
  body: `Your ${formatDocumentType(documentType)} has been verified.`,
  data: {
    type: NOTIFICATION_TYPES.DOCUMENT_APPROVED,
    document_type: documentType,
    click_action: CLICK_ACTIONS.OPEN_KYC,
  },
});

// Admin rejects document -> Notify User
const documentRejected = (documentType, reason = null) => ({
  title: 'Document Rejected',
  body: reason
    ? `Your ${formatDocumentType(documentType)} was rejected. Reason: ${reason}`
    : `Your ${formatDocumentType(documentType)} was rejected. Please resubmit.`,
  data: {
    type: NOTIFICATION_TYPES.DOCUMENT_REJECTED,
    document_type: documentType,
    click_action: CLICK_ACTIONS.OPEN_KYC,
  },
});

/**
 * Account Templates
 */

// Admin suspends user -> Notify User
const accountSuspended = () => ({
  title: 'Account Suspended',
  body: 'Your account has been suspended. Please contact support for assistance.',
  data: {
    type: NOTIFICATION_TYPES.ACCOUNT_SUSPENDED,
    click_action: CLICK_ACTIONS.LOGOUT,
  },
});

// Admin activates user -> Notify User
const accountActivated = () => ({
  title: 'Account Activated',
  body: 'Your account has been reactivated. Welcome back!',
  data: {
    type: NOTIFICATION_TYPES.ACCOUNT_ACTIVATED,
    click_action: CLICK_ACTIONS.OPEN_DASHBOARD,
  },
});

/**
 * Limit Templates
 */

// Daily limit reached -> Notify User
const dailyLimitReached = (limit, roleCode) => ({
  title: 'Daily Limit Reached',
  body:
    roleCode === 'DRIVER'
      ? `You've reached your daily limit of ${limit} requests. Try again tomorrow.`
      : `You've reached your daily limit of ${limit} invitations. Try again tomorrow.`,
  data: {
    type: NOTIFICATION_TYPES.DAILY_LIMIT_REACHED,
    limit: String(limit),
    click_action: CLICK_ACTIONS.OPEN_DASHBOARD,
  },
});

/**
 * Helper function to format document type for display
 */
const formatDocumentType = (type) => {
  const types = {
    AADHAAR: 'Aadhaar Card',
    DRIVING_LICENSE: 'Driving License',
    PAN_CARD: 'PAN Card',
  };
  return types[type] || type;
};

module.exports = {
  NOTIFICATION_TYPES,
  CLICK_ACTIONS,
  
  // Booking templates
  bookingRequestCreated,
  bookingInvitationCreated,
  bookingRequestAccepted,
  bookingRequestAcceptedConfirmation,
  bookingRequestRejected,
  bookingInvitationAccepted,
  bookingInvitationAcceptedConfirmation,
  bookingInvitationRejected,
  bookingRequestCancelled,
  bookingInvitationCancelled,

  // Expiry templates
  bookingRequestExpired,
  bookingInvitationExpired,
  requestExpiredCarUnavailable,
  carAutoDeactivated,
  
  // KYC templates
  kycApproved,
  kycRejected,
  documentApproved,
  documentRejected,
  
  // Account templates
  accountSuspended,
  accountActivated,

  // Limit templates
  dailyLimitReached,
};
