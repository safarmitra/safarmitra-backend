# Safar Mitra - Push Notification Documentation

**Version:** 1.0.0  
**Last Updated:** January 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Notification Events](#notification-events)
4. [Notification Payload Structure](#notification-payload-structure)
5. [Click Actions](#click-actions)
6. [Flutter Integration](#flutter-integration)
7. [Testing](#testing)

---

## Overview

Safar Mitra uses **Firebase Cloud Messaging (FCM)** to send push notifications to users. Notifications are triggered by various events in the application.

### Key Features

- Real-time notifications for booking requests
- KYC status updates
- Account status changes
- Supports both Android and iOS

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Backend API   │────▶│   Firebase FCM  │────▶│   Flutter App   │
│                 │     │                 │     │                 │
│ notificationSvc │     │  Cloud Message  │     │  FCM Handler    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Setup

### Backend Configuration

Add these environment variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### FCM Token Storage

The FCM token is stored in the `users` table:

```sql
fcm_token VARCHAR(500)
```

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

### Summary Table

| # | Event | Trigger | Recipient | Category |
|---|-------|---------|-----------|----------|
| 1 | `BOOKING_REQUEST_CREATED` | Driver requests car | Operator | Booking |
| 2 | `BOOKING_INVITATION_CREATED` | Operator invites driver | Driver | Booking |
| 3 | `BOOKING_REQUEST_ACCEPTED` | Operator accepts request | Driver | Booking |
| 4 | `BOOKING_REQUEST_REJECTED` | Operator rejects request | Driver | Booking |
| 5 | `BOOKING_INVITATION_ACCEPTED` | Driver accepts invitation | Operator | Booking |
| 6 | `BOOKING_INVITATION_REJECTED` | Driver rejects invitation | Operator | Booking |
| 7 | `BOOKING_REQUEST_CANCELLED` | Driver cancels request | Operator | Booking |
| 8 | `BOOKING_INVITATION_CANCELLED` | Operator cancels invitation | Driver | Booking |
| 9 | `KYC_APPROVED` | Admin approves KYC | User | KYC |
| 10 | `KYC_REJECTED` | Admin rejects KYC | User | KYC |
| 11 | `DOCUMENT_APPROVED` | Admin approves document | User | KYC |
| 12 | `DOCUMENT_REJECTED` | Admin rejects document | User | KYC |
| 13 | `ACCOUNT_SUSPENDED` | Admin suspends user | User | Account |
| 14 | `ACCOUNT_ACTIVATED` | Admin activates user | User | Account |

**Total: 14 notification events**

---

## Notification Details

### 1. Booking Request Notifications

#### BOOKING_REQUEST_CREATED

**Trigger:** Driver creates a booking request for a car  
**Recipient:** Operator (car owner)

```json
{
  "notification": {
    "title": "New Booking Request",
    "body": "John Doe requested your Swift Dzire"
  },
  "data": {
    "type": "BOOKING_REQUEST_CREATED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

---

#### BOOKING_INVITATION_CREATED

**Trigger:** Operator invites a driver for their car  
**Recipient:** Driver

```json
{
  "notification": {
    "title": "New Car Invitation",
    "body": "XYZ Rentals invited you for Swift Dzire"
  },
  "data": {
    "type": "BOOKING_INVITATION_CREATED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

---

#### BOOKING_REQUEST_ACCEPTED

**Trigger:** Operator accepts driver's booking request  
**Recipient:** Driver

```json
{
  "notification": {
    "title": "Request Accepted! 🎉",
    "body": "XYZ Rentals accepted your request for Swift Dzire"
  },
  "data": {
    "type": "BOOKING_REQUEST_ACCEPTED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

---

#### BOOKING_REQUEST_REJECTED

**Trigger:** Operator rejects driver's booking request  
**Recipient:** Driver

```json
{
  "notification": {
    "title": "Request Rejected",
    "body": "XYZ Rentals rejected your request for Swift Dzire"
  },
  "data": {
    "type": "BOOKING_REQUEST_REJECTED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

With reason:
```json
{
  "notification": {
    "title": "Request Rejected",
    "body": "XYZ Rentals rejected your request for Swift Dzire. Reason: Car already booked"
  }
}
```

---

#### BOOKING_INVITATION_ACCEPTED

**Trigger:** Driver accepts operator's invitation  
**Recipient:** Operator

```json
{
  "notification": {
    "title": "Invitation Accepted! 🎉",
    "body": "John Doe accepted your invitation for Swift Dzire"
  },
  "data": {
    "type": "BOOKING_INVITATION_ACCEPTED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

---

#### BOOKING_INVITATION_REJECTED

**Trigger:** Driver rejects operator's invitation  
**Recipient:** Operator

```json
{
  "notification": {
    "title": "Invitation Rejected",
    "body": "John Doe rejected your invitation for Swift Dzire"
  },
  "data": {
    "type": "BOOKING_INVITATION_REJECTED",
    "request_id": "123",
    "car_id": "1",
    "click_action": "OPEN_SENT_REQUESTS"
  }
}
```

---

#### BOOKING_REQUEST_CANCELLED

**Trigger:** Driver cancels their pending request  
**Recipient:** Operator

```json
{
  "notification": {
    "title": "Request Cancelled",
    "body": "John Doe cancelled their request for Swift Dzire"
  },
  "data": {
    "type": "BOOKING_REQUEST_CANCELLED",
    "car_id": "1",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

---

#### BOOKING_INVITATION_CANCELLED

**Trigger:** Operator cancels their pending invitation  
**Recipient:** Driver

```json
{
  "notification": {
    "title": "Invitation Cancelled",
    "body": "XYZ Rentals cancelled the invitation for Swift Dzire"
  },
  "data": {
    "type": "BOOKING_INVITATION_CANCELLED",
    "car_id": "1",
    "click_action": "OPEN_RECEIVED_REQUESTS"
  }
}
```

---

### 2. KYC Notifications

#### KYC_APPROVED

**Trigger:** Admin approves user's KYC  
**Recipient:** User

```json
{
  "notification": {
    "title": "KYC Approved! ✅",
    "body": "Your KYC has been verified. You can now use all features."
  },
  "data": {
    "type": "KYC_APPROVED",
    "click_action": "OPEN_DASHBOARD"
  }
}
```

---

#### KYC_REJECTED

**Trigger:** Admin rejects user's KYC  
**Recipient:** User

```json
{
  "notification": {
    "title": "KYC Rejected",
    "body": "Your KYC was rejected. Reason: Documents are not clear"
  },
  "data": {
    "type": "KYC_REJECTED",
    "click_action": "OPEN_KYC"
  }
}
```

---

#### DOCUMENT_APPROVED

**Trigger:** Admin approves individual document  
**Recipient:** User

```json
{
  "notification": {
    "title": "Document Approved",
    "body": "Your Aadhaar Card has been verified."
  },
  "data": {
    "type": "DOCUMENT_APPROVED",
    "document_type": "AADHAAR",
    "click_action": "OPEN_KYC"
  }
}
```

---

#### DOCUMENT_REJECTED

**Trigger:** Admin rejects individual document  
**Recipient:** User

```json
{
  "notification": {
    "title": "Document Rejected",
    "body": "Your Driving License was rejected. Reason: Image is blurry"
  },
  "data": {
    "type": "DOCUMENT_REJECTED",
    "document_type": "DRIVING_LICENSE",
    "click_action": "OPEN_KYC"
  }
}
```

---

### 3. Account Notifications

#### ACCOUNT_SUSPENDED

**Trigger:** Admin suspends user account  
**Recipient:** User

```json
{
  "notification": {
    "title": "Account Suspended",
    "body": "Your account has been suspended. Please contact support for assistance."
  },
  "data": {
    "type": "ACCOUNT_SUSPENDED",
    "click_action": "LOGOUT"
  }
}
```

---

#### ACCOUNT_ACTIVATED

**Trigger:** Admin reactivates user account  
**Recipient:** User

```json
{
  "notification": {
    "title": "Account Activated",
    "body": "Your account has been reactivated. Welcome back!"
  },
  "data": {
    "type": "ACCOUNT_ACTIVATED",
    "click_action": "OPEN_DASHBOARD"
  }
}
```

---

## Notification Payload Structure

### Full FCM Message Structure

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

### Data Payload Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Notification event type |
| `request_id` | string | Booking request ID (if applicable) |
| `car_id` | string | Car ID (if applicable) |
| `document_type` | string | Document type (for document notifications) |
| `click_action` | string | Action to perform when notification is tapped |

---

## Click Actions

| Action | Description | Screen to Open |
|--------|-------------|----------------|
| `OPEN_RECEIVED_REQUESTS` | Open received requests list | Received Requests Screen |
| `OPEN_SENT_REQUESTS` | Open sent requests list | Sent Requests Screen |
| `OPEN_DASHBOARD` | Open main dashboard | Dashboard/Home Screen |
| `OPEN_KYC` | Open KYC screen | KYC Submission Screen |
| `LOGOUT` | Log out user | Login Screen |

---

## Flutter Integration

### 1. Setup FCM in Flutter

```dart
// pubspec.yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
```

### 2. Initialize FCM

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  
  Future<void> initialize() async {
    // Request permission
    await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    // Get FCM token
    String? token = await _fcm.getToken();
    print('FCM Token: $token');
    
    // Listen for token refresh
    _fcm.onTokenRefresh.listen((newToken) {
      // Send new token to backend
      _updateTokenOnServer(newToken);
    });
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
    
    // Handle notification tap
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }
  
  void _handleForegroundMessage(RemoteMessage message) {
    // Show local notification
    _showLocalNotification(message);
  }
  
  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    final clickAction = data['click_action'];
    
    switch (clickAction) {
      case 'OPEN_RECEIVED_REQUESTS':
        // Navigate to received requests
        Navigator.pushNamed(context, '/booking-requests/received');
        break;
      case 'OPEN_SENT_REQUESTS':
        // Navigate to sent requests
        Navigator.pushNamed(context, '/booking-requests/sent');
        break;
      case 'OPEN_DASHBOARD':
        // Navigate to dashboard
        Navigator.pushNamed(context, '/dashboard');
        break;
      case 'OPEN_KYC':
        // Navigate to KYC screen
        Navigator.pushNamed(context, '/kyc');
        break;
      case 'LOGOUT':
        // Log out user
        _authService.logout();
        Navigator.pushReplacementNamed(context, '/login');
        break;
    }
  }
}
```

### 3. Send FCM Token to Backend

```dart
Future<void> login(String firebaseToken) async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  final response = await http.post(
    Uri.parse('$baseUrl/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'firebase_token': firebaseToken,
      'fcm_token': fcmToken,
    }),
  );
}
```

### 4. Android Notification Channel

```dart
// Create notification channel for Android
const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'safarmitra_notifications',
  'Safar Mitra Notifications',
  description: 'Notifications from Safar Mitra app',
  importance: Importance.high,
);

await flutterLocalNotificationsPlugin
    .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
    ?.createNotificationChannel(channel);
```

---

## Testing

### Test Notification via cURL

```bash
# Get a user's FCM token from database first
# Then use Firebase Admin SDK or this test endpoint

curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "USER_FCM_TOKEN",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test notification"
    },
    "data": {
      "type": "BOOKING_REQUEST_CREATED",
      "request_id": "123",
      "car_id": "1",
      "click_action": "OPEN_RECEIVED_REQUESTS"
    }
  }'
```

### Test via Backend

Trigger notifications by performing actions:

1. **Booking Request Created:** Create a booking request as a driver
2. **KYC Approved:** Approve KYC via admin panel
3. **Account Suspended:** Suspend user via admin panel

---

## Error Handling

### Invalid FCM Token

When a token is invalid, the notification service logs the error:

```
Invalid FCM token, should be cleared from database
```

Consider implementing token cleanup:

```javascript
// In notificationService.js
if (error.code === 'messaging/invalid-registration-token' ||
    error.code === 'messaging/registration-token-not-registered') {
  // Clear invalid token from database
  await User.update(
    { fcm_token: null },
    { where: { fcm_token: fcmToken } }
  );
}
```

### Firebase Not Initialized

If Firebase credentials are not provided, notifications are silently skipped:

```
Firebase not initialized, skipping notification
```

---

## Best Practices

1. **Always handle notification errors gracefully** - Don't let notification failures break the main flow
2. **Use async/await with .catch()** - Notifications are fire-and-forget
3. **Keep notification text concise** - Mobile screens have limited space
4. **Include relevant data** - Pass IDs for deep linking
5. **Test on real devices** - Emulators may not receive notifications properly

---

## Contact

For questions or issues, contact the development team.
