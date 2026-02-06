# Safar Mitra - Push Notification Documentation

**Version:** 2.1.0  
**Last Updated:** January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Notification Events](#notification-events)
4. [Notification Payload Structure](#notification-payload-structure)
5. [Click Actions](#click-actions)
6. [Notification History](#notification-history)
7. [Flutter Integration](#flutter-integration)
8. [Testing](#testing)

---

## Overview

Safar Mitra uses **Firebase Cloud Messaging (FCM)** to send push notifications to users.

### Key Features

- Real-time notifications for booking requests
- Phone numbers included in ACCEPTED notifications
- Both parties notified on acceptance
- Expiry notifications for requests and cars
- 7-day notification retention
- No emojis in titles for better compatibility
- KYC status updates
- Account status changes
- Supports both Android and iOS

---

## Setup

### Backend Configuration

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NOTIFICATION_RETENTION_DAYS=7
```

### FCM Token Storage

The token is sent during login:

```json
POST /auth/login
{
  "firebase_token": "...",
  "fcm_token": "device_fcm_token_here"
}
```

---

## Notification Events

### Summary Table (21 Events)

| Event | Trigger | Recipient |
|-------|---------|-----------|
| `BOOKING_REQUEST_CREATED` | Driver requests car | Operator |
| `BOOKING_INVITATION_CREATED` | Operator invites driver | Driver |
| `BOOKING_REQUEST_ACCEPTED` | Operator accepts request | Driver |
| `BOOKING_REQUEST_ACCEPTED_CONFIRMATION` | Operator accepts request | Operator |
| `BOOKING_REQUEST_REJECTED` | Operator rejects request | Driver |
| `BOOKING_INVITATION_ACCEPTED` | Driver accepts invitation | Operator |
| `BOOKING_INVITATION_ACCEPTED_CONFIRMATION` | Driver accepts invitation | Driver |
| `BOOKING_INVITATION_REJECTED` | Driver rejects invitation | Operator |
| `BOOKING_REQUEST_CANCELLED` | Driver cancels request | Operator |
| `BOOKING_INVITATION_CANCELLED` | Operator cancels invitation | Driver |
| `BOOKING_REQUEST_EXPIRED` | Request expires (3 days) | Driver |
| `BOOKING_INVITATION_EXPIRED` | Invitation expires (3 days) | Operator |
| `REQUEST_EXPIRED_CAR_UNAVAILABLE` | Car deactivated | Initiator |
| `CAR_AUTO_DEACTIVATED` | Car inactive 7 days | Operator |
| `DAILY_LIMIT_REACHED` | Daily limit reached | User |
| `KYC_APPROVED` | Admin approves KYC | User |
| `KYC_REJECTED` | Admin rejects KYC | User |
| `DOCUMENT_APPROVED` | Admin approves document | User |
| `DOCUMENT_REJECTED` | Admin rejects document | User |
| `ACCOUNT_SUSPENDED` | Admin suspends user | User |
| `ACCOUNT_ACTIVATED` | Admin activates user | User |

---

## Notification Examples

### Booking Notifications

**BOOKING_REQUEST_CREATED:**
```json
{
  "title": "New Booking Request",
  "body": "John Doe requested your Swift Dzire"
}
```

**BOOKING_REQUEST_ACCEPTED:**
```json
{
  "title": "Request Accepted!",
  "body": "XYZ Rentals accepted your request for Swift Dzire. Contact: +919876543210"
}
```

**BOOKING_REQUEST_REJECTED:**
```json
{
  "title": "Request Rejected",
  "body": "XYZ Rentals rejected your request for Swift Dzire"
}
```

### Expiry Notifications

**BOOKING_REQUEST_EXPIRED:**
```json
{
  "title": "Request Expired",
  "body": "Your request for Swift Dzire has expired"
}
```

**CAR_AUTO_DEACTIVATED:**
```json
{
  "title": "Car Deactivated",
  "body": "Your Swift Dzire was deactivated due to 7 days of inactivity. Edit to reactivate."
}
```

### KYC Notifications

**KYC_APPROVED:**
```json
{
  "title": "KYC Approved",
  "body": "Your KYC has been verified. You can now use all features."
}
```

**KYC_REJECTED:**
```json
{
  "title": "KYC Rejected",
  "body": "Your KYC was rejected. Reason: Documents are not clear"
}
```

### Account Notifications

**ACCOUNT_SUSPENDED:**
```json
{
  "title": "Account Suspended",
  "body": "Your account has been suspended. Please contact support for assistance."
}
```

---

## Notification Payload Structure

```json
{
  "token": "user_fcm_token",
  "notification": {
    "title": "Notification Title",
    "body": "Notification body text"
  },
  "data": {
    "type": "NOTIFICATION_TYPE",
    "request_id": "123",
    "car_id": "1",
    "phone_number": "+919876543210",
    "click_action": "OPEN_SCREEN"
  }
}
```

### Data Fields

| Field | Description |
|-------|-------------|
| `type` | Notification event type |
| `request_id` | Booking request ID |
| `car_id` | Car ID |
| `phone_number` | Contact phone (ACCEPTED only) |
| `click_action` | Action when tapped |

---

## Click Actions

| Action | Screen |
|--------|--------|
| `OPEN_RECEIVED_REQUESTS` | Received Requests |
| `OPEN_SENT_REQUESTS` | Sent Requests |
| `OPEN_DASHBOARD` | Dashboard |
| `OPEN_KYC` | KYC Screen |
| `OPEN_MY_CARS` | My Cars |
| `LOGOUT` | Login Screen |

---

## Notification History

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications (7 days) |
| GET | `/notifications/unread-count` | Get unread count |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |

---

## Phone Number Visibility

| Notification | Recipient | Phone Included |
|--------------|-----------|----------------|
| `BOOKING_REQUEST_ACCEPTED` | Driver | Operator's phone |
| `BOOKING_REQUEST_ACCEPTED_CONFIRMATION` | Operator | Driver's phone |
| `BOOKING_INVITATION_ACCEPTED` | Operator | Driver's phone |
| `BOOKING_INVITATION_ACCEPTED_CONFIRMATION` | Driver | Operator's phone |

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NOTIFICATION_RETENTION_DAYS` | 7 | Days to retain notifications |
| `DRIVER_DAILY_REQUEST_LIMIT` | 5 | Daily request limit |
| `OPERATOR_DAILY_INVITATION_LIMIT` | 5 | Daily invitation limit |
| `BOOKING_REQUEST_EXPIRY_DAYS` | 3 | Days until request expires |
| `CAR_INACTIVITY_DAYS` | 7 | Days until car auto-deactivates |

---

## Contact

For questions or issues, contact the development team.
