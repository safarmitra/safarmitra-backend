# Safar Mitra - Push Notification Documentation

**Version:** 2.3.0  
**Last Updated:** January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Notification Events](#notification-events)
4. [Notification Payload Structure](#notification-payload-structure)
5. [Click Actions](#click-actions)
6. [Notification History](#notification-history)
7. [Phone Number Visibility](#phone-number-visibility)
8. [Flutter Integration](#flutter-integration)
9. [Testing](#testing)

---

## Overview

Safar Mitra uses **Firebase Cloud Messaging (FCM)** to send push notifications to users.

### Key Features

- Real-time notifications for booking requests
- Phone numbers included in ACCEPTED notifications (both parties)
- Both parties notified on acceptance with each other's contact
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

| Event | Trigger | Recipient | Phone Included |
|-------|---------|-----------|----------------|
| **Booking Events** |
| `BOOKING_REQUEST_CREATED` | Driver requests car | Operator | No |
| `BOOKING_INVITATION_CREATED` | Operator invites driver | Driver | No |
| `BOOKING_REQUEST_ACCEPTED` | Operator accepts request | Driver | ✅ Operator's phone |
| `BOOKING_REQUEST_ACCEPTED_CONFIRMATION` | Operator accepts request | Operator | ✅ Driver's phone |
| `BOOKING_REQUEST_REJECTED` | Operator rejects request | Driver | No |
| `BOOKING_INVITATION_ACCEPTED` | Driver accepts invitation | Operator | ✅ Driver's phone |
| `BOOKING_INVITATION_ACCEPTED_CONFIRMATION` | Driver accepts invitation | Driver | ✅ Operator's phone |
| `BOOKING_INVITATION_REJECTED` | Driver rejects invitation | Operator | No |
| `BOOKING_REQUEST_CANCELLED` | Driver cancels request | Operator | No |
| `BOOKING_INVITATION_CANCELLED` | Operator cancels invitation | Driver | No |
| **Expiry Events** |
| `BOOKING_REQUEST_EXPIRED` | Request expires (3 days) | Driver | No |
| `BOOKING_INVITATION_EXPIRED` | Invitation expires (3 days) | Operator | No |
| `REQUEST_EXPIRED_CAR_UNAVAILABLE` | Car deactivated | Initiator | No |
| `CAR_AUTO_DEACTIVATED` | Car inactive 7 days | Operator | No |
| **Limit Events** |
| `DAILY_LIMIT_REACHED` | Daily limit reached | User | No |
| **KYC Events** |
| `KYC_APPROVED` | Admin approves KYC | User | No |
| `KYC_REJECTED` | Admin rejects KYC | User | No |
| `DOCUMENT_APPROVED` | Admin approves document | User | No |
| `DOCUMENT_REJECTED` | Admin rejects document | User | No |
| **Account Events** |
| `ACCOUNT_SUSPENDED` | Admin suspends user | User | No |
| `ACCOUNT_ACTIVATED` | Admin activates user | User | No |

---

## Notification Examples

### Booking Notifications

**BOOKING_REQUEST_CREATED** (to Operator):
```json
{
  "title": "New Booking Request",
  "body": "John Doe requested your Swift Dzire",
  "data": {
    "type": "BOOKING_REQUEST_CREATED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

**BOOKING_INVITATION_CREATED** (to Driver):
```json
{
  "title": "New Car Invitation",
  "body": "ABC Travels invited you for Swift Dzire",
  "data": {
    "type": "BOOKING_INVITATION_CREATED",
    "request_id": "124",
    "car_id": "1",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

**BOOKING_REQUEST_ACCEPTED** (to Driver):
```json
{
  "title": "Request Accepted!",
  "body": "ABC Travels accepted your request for Swift Dzire. Contact: +919876543210",
  "data": {
    "type": "BOOKING_REQUEST_ACCEPTED",
    "request_id": "123",
    "car_id": "1",
    "phone_number": "+919876543210",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

**BOOKING_REQUEST_ACCEPTED_CONFIRMATION** (to Operator):
```json
{
  "title": "Request Accepted",
  "body": "You accepted John Doe's request for Swift Dzire. Driver contact: +919876543211",
  "data": {
    "type": "BOOKING_REQUEST_ACCEPTED_CONFIRMATION",
    "request_id": "123",
    "car_id": "1",
    "phone_number": "+919876543211",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

**BOOKING_REQUEST_REJECTED** (to Driver):
```json
{
  "title": "Request Rejected",
  "body": "ABC Travels rejected your request for Swift Dzire",
  "data": {
    "type": "BOOKING_REQUEST_REJECTED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

**BOOKING_REQUEST_REJECTED with reason** (to Driver):
```json
{
  "title": "Request Rejected",
  "body": "ABC Travels rejected your request for Swift Dzire. Reason: Car already booked",
  "data": {
    "type": "BOOKING_REQUEST_REJECTED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

**BOOKING_INVITATION_ACCEPTED** (to Operator):
```json
{
  "title": "Invitation Accepted!",
  "body": "John Doe accepted your invitation for Swift Dzire. Contact: +919876543211",
  "data": {
    "type": "BOOKING_INVITATION_ACCEPTED",
    "request_id": "124",
    "car_id": "1",
    "phone_number": "+919876543211",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

**BOOKING_INVITATION_ACCEPTED_CONFIRMATION** (to Driver):
```json
{
  "title": "Invitation Accepted",
  "body": "You accepted ABC Travels's invitation for Swift Dzire. Operator contact: +919876543210",
  "data": {
    "type": "BOOKING_INVITATION_ACCEPTED_CONFIRMATION",
    "request_id": "124",
    "car_id": "1",
    "phone_number": "+919876543210",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

**BOOKING_INVITATION_REJECTED** (to Operator):
```json
{
  "title": "Invitation Rejected",
  "body": "John Doe rejected your invitation for Swift Dzire",
  "data": {
    "type": "BOOKING_INVITATION_REJECTED",
    "request_id": "124",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

**BOOKING_REQUEST_CANCELLED** (to Operator):
```json
{
  "title": "Request Cancelled",
  "body": "John Doe cancelled their request for Swift Dzire",
  "data": {
    "type": "BOOKING_REQUEST_CANCELLED",
    "car_id": "1",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

**BOOKING_INVITATION_CANCELLED** (to Driver):
```json
{
  "title": "Invitation Cancelled",
  "body": "ABC Travels cancelled the invitation for Swift Dzire",
  "data": {
    "type": "BOOKING_INVITATION_CANCELLED",
    "car_id": "1",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

### Expiry Notifications

**BOOKING_REQUEST_EXPIRED** (to Driver):
```json
{
  "title": "Request Expired",
  "body": "Your request for Swift Dzire has expired",
  "data": {
    "type": "BOOKING_REQUEST_EXPIRED",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

**BOOKING_INVITATION_EXPIRED** (to Operator):
```json
{
  "title": "Invitation Expired",
  "body": "Your invitation to John Doe for Swift Dzire has expired",
  "data": {
    "type": "BOOKING_INVITATION_EXPIRED",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

**REQUEST_EXPIRED_CAR_UNAVAILABLE** (to Initiator):
```json
{
  "title": "Request Expired",
  "body": "Request for Swift Dzire expired - car is no longer available",
  "data": {
    "type": "REQUEST_EXPIRED_CAR_UNAVAILABLE",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

**CAR_AUTO_DEACTIVATED** (to Operator):
```json
{
  "title": "Car Deactivated",
  "body": "Your Swift Dzire was deactivated due to 7 days of inactivity. Edit to reactivate.",
  "data": {
    "type": "CAR_AUTO_DEACTIVATED",
    "car_id": "1",
    "click_action": "OPEN_MY_CARS"
  }
}
```

### Limit Notifications

**DAILY_LIMIT_REACHED** (to Driver):
```json
{
  "title": "Daily Limit Reached",
  "body": "You've reached your daily limit of 5 requests. Try again tomorrow.",
  "data": {
    "type": "DAILY_LIMIT_REACHED",
    "limit": "5",
    "click_action": "OPEN_DASHBOARD"
  }
}
```

**DAILY_LIMIT_REACHED** (to Operator):
```json
{
  "title": "Daily Limit Reached",
  "body": "You've reached your daily limit of 5 invitations. Try again tomorrow.",
  "data": {
    "type": "DAILY_LIMIT_REACHED",
    "limit": "5",
    "click_action": "OPEN_DASHBOARD"
  }
}
```

### KYC Notifications

**KYC_APPROVED**:
```json
{
  "title": "KYC Approved",
  "body": "Your KYC has been verified. You can now use all features.",
  "data": {
    "type": "KYC_APPROVED",
    "click_action": "OPEN_DASHBOARD"
  }
}
```

**KYC_REJECTED**:
```json
{
  "title": "KYC Rejected",
  "body": "Your KYC was rejected. Reason: Documents are not clear",
  "data": {
    "type": "KYC_REJECTED",
    "click_action": "OPEN_KYC"
  }
}
```

**KYC_REJECTED without reason**:
```json
{
  "title": "KYC Rejected",
  "body": "Your KYC was rejected. Please check and resubmit.",
  "data": {
    "type": "KYC_REJECTED",
    "click_action": "OPEN_KYC"
  }
}
```

**DOCUMENT_APPROVED**:
```json
{
  "title": "Document Approved",
  "body": "Your Aadhaar Card has been verified.",
  "data": {
    "type": "DOCUMENT_APPROVED",
    "document_type": "AADHAAR",
    "click_action": "OPEN_KYC"
  }
}
```

**DOCUMENT_REJECTED**:
```json
{
  "title": "Document Rejected",
  "body": "Your Driving License was rejected. Reason: Document is expired",
  "data": {
    "type": "DOCUMENT_REJECTED",
    "document_type": "DRIVING_LICENSE",
    "click_action": "OPEN_KYC"
  }
}
```

### Account Notifications

**ACCOUNT_SUSPENDED**:
```json
{
  "title": "Account Suspended",
  "body": "Your account has been suspended. Please contact support for assistance.",
  "data": {
    "type": "ACCOUNT_SUSPENDED",
    "click_action": "LOGOUT"
  }
}
```

**ACCOUNT_ACTIVATED**:
```json
{
  "title": "Account Activated",
  "body": "Your account has been reactivated. Welcome back!",
  "data": {
    "type": "ACCOUNT_ACTIVATED",
    "click_action": "OPEN_DASHBOARD"
  }
}
```

---

## Notification Payload Structure

### FCM Message Format

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
  },
  "android": {
    "priority": "high",
    "notification": {
      "sound": "default",
      "channelId": "safarmitra_notifications"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

### Data Fields

| Field | Type | Description | Present In |
|-------|------|-------------|------------|
| `type` | string | Notification event type | All |
| `request_id` | string | Booking request ID | Booking events (except cancelled) |
| `car_id` | string | Car ID | Booking & car events |
| `phone_number` | string | Contact phone number | ACCEPTED notifications only |
| `document_type` | string | Document type | Document events |
| `limit` | string | Limit value | DAILY_LIMIT_REACHED |
| `click_action` | string | Action when tapped | All |

---

## Click Actions

| Action | Screen | Used By |
|--------|--------|---------|
| `OPEN_RECEIVED_REQUESTS` | Received Requests | Request created, invitation created, cancelled, accepted confirmation |
| `OPEN_SENT_REQUESTS` | Sent Requests | Request accepted, rejected, expired |
| `OPEN_DASHBOARD` | Dashboard | KYC approved, account activated, daily limit |
| `OPEN_KYC` | KYC Screen | KYC rejected, document approved/rejected |
| `OPEN_MY_CARS` | My Cars | Car auto-deactivated |
| `LOGOUT` | Login Screen | Account suspended |

---

## Notification History

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications (last 7 days) |
| GET | `/notifications/unread-count` | Get unread count |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |

### Database Storage

All notifications are stored in the `notifications` table with:

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `user_id` | BIGINT | Recipient user ID |
| `type` | VARCHAR(50) | Notification type |
| `title` | VARCHAR(255) | Notification title |
| `body` | TEXT | Notification body |
| `data` | JSONB | Additional data payload |
| `is_read` | BOOLEAN | Read status |
| `fcm_sent` | BOOLEAN | Whether FCM was sent |
| `fcm_response` | TEXT | FCM response/error |
| `created_at` | TIMESTAMP | Creation time |

### Retention Policy

- Notifications are retained for **7 days** only
- Older notifications are filtered out when fetching
- Cleanup runs automatically when user has >50 old notifications
- Configurable via `NOTIFICATION_RETENTION_DAYS` env variable

---

## Phone Number Visibility

### When Phone Numbers Are Shared

Phone numbers are **only** included in ACCEPTED notifications:

| Notification | Recipient | Phone Included |
|--------------|-----------|----------------|
| `BOOKING_REQUEST_ACCEPTED` | Driver | ✅ Operator's phone |
| `BOOKING_REQUEST_ACCEPTED_CONFIRMATION` | Operator | ✅ Driver's phone |
| `BOOKING_INVITATION_ACCEPTED` | Operator | ✅ Driver's phone |
| `BOOKING_INVITATION_ACCEPTED_CONFIRMATION` | Driver | ✅ Operator's phone |

### Phone Number Flow

```
┌─────────────────────────────────────────────────────────────┐
│              PHONE NUMBER SHARING FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Driver Request Flow:                                       │
│  1. Driver sends request → Operator gets notification       │
│     (NO phone numbers)                                      │
│  2. Operator ACCEPTS → Driver gets operator's phone         │
│  3. Operator ACCEPTS → Operator gets driver's phone         │
│                                                             │
│  Operator Invitation Flow:                                  │
│  1. Operator sends invitation → Driver gets notification    │
│     (NO phone numbers)                                      │
│  2. Driver ACCEPTS → Operator gets driver's phone           │
│  3. Driver ACCEPTS → Driver gets operator's phone           │
│                                                             │
│  REJECTED/CANCELLED/EXPIRED → NO phone numbers shared       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Flutter Integration

### Setup FCM in Flutter

```dart
// pubspec.yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10

// Initialize Firebase
await Firebase.initializeApp();

// Get FCM token
final fcmToken = await FirebaseMessaging.instance.getToken();

// Send token during login
final response = await api.login(
  firebaseToken: firebaseIdToken,
  fcmToken: fcmToken,
);
```

### Handle Notifications

```dart
// Foreground notifications
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  final data = message.data;
  final type = data['type'];
  final clickAction = data['click_action'];
  
  // Show local notification or handle in-app
  showLocalNotification(message.notification);
});

// Background/Terminated notifications
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  handleNotificationClick(message.data);
});

// Handle click action
void handleNotificationClick(Map<String, dynamic> data) {
  final clickAction = data['click_action'];
  
  switch (clickAction) {
    case 'OPEN_RECEIVED_REQUESTS':
      Navigator.pushNamed(context, '/received-requests');
      break;
    case 'OPEN_SENT_REQUESTS':
      Navigator.pushNamed(context, '/sent-requests');
      break;
    case 'OPEN_DASHBOARD':
      Navigator.pushNamed(context, '/dashboard');
      break;
    case 'OPEN_KYC':
      Navigator.pushNamed(context, '/kyc');
      break;
    case 'OPEN_MY_CARS':
      Navigator.pushNamed(context, '/my-cars');
      break;
    case 'LOGOUT':
      authService.logout();
      Navigator.pushReplacementNamed(context, '/login');
      break;
  }
}
```

### Android Channel Setup

```dart
// Create notification channel for Android
const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'safarmitra_notifications',
  'Safar Mitra Notifications',
  description: 'Notifications from Safar Mitra app',
  importance: Importance.high,
);

await flutterLocalNotificationsPlugin
    .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()
    ?.createNotificationChannel(channel);
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NOTIFICATION_RETENTION_DAYS` | 7 | Days to retain notifications |
| `DRIVER_DAILY_REQUEST_LIMIT` | 5 | Daily request limit for drivers |
| `OPERATOR_DAILY_INVITATION_LIMIT` | 5 | Daily invitation limit for operators |
| `BOOKING_REQUEST_EXPIRY_DAYS` | 3 | Days until request expires |
| `CAR_INACTIVITY_DAYS` | 7 | Days until car auto-deactivates |

---

## Testing

### Test FCM Token

```bash
# Get user's FCM token from database
psql -c "SELECT fcm_token FROM users WHERE id = 1;"
```

### Send Test Notification (Firebase Console)

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter title and body
4. Target: Single device → Paste FCM token
5. Add custom data (type, click_action, etc.)
6. Send

### Test via API

```bash
# Create a booking request (triggers notification to operator)
curl -X POST http://localhost:3000/api/v1/booking-requests \
  -H "Authorization: Bearer DRIVER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"car_id": 1, "message": "Test request"}'

# Accept request (triggers notification to driver with phone)
curl -X PUT http://localhost:3000/api/v1/booking-requests/1/status \
  -H "Authorization: Bearer OPERATOR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACCEPTED"}'
```

### Check Notification History

```bash
# List notifications
curl -X GET http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer JWT_TOKEN"

# Get unread count
curl -X GET http://localhost:3000/api/v1/notifications/unread-count \
  -H "Authorization: Bearer JWT_TOKEN"
```

---

## Document Type Formatting

Document types are formatted for display in notifications:

| Code | Display Name |
|------|--------------|
| `AADHAAR` | Aadhaar Card |
| `DRIVING_LICENSE` | Driving License |
| `PAN_CARD` | PAN Card |

---

## Contact

For questions or issues, contact the development team.
