# Safar Mitra - API Documentation

**Version:** 2.1.0  
**Base URL:** `http://localhost:3000/api/v1`  
**Last Updated:** January 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Static Data Files](#static-data-files)
6. [API Endpoints](#api-endpoints)
   - [Auth APIs](#1-auth-apis)
   - [User APIs](#2-user-apis)
   - [KYC APIs](#3-kyc-apis)
   - [Car APIs](#4-car-apis)
   - [Booking Request APIs](#5-booking-request-apis)
7. [Flow Diagrams](#flow-diagrams)

---

## Overview

Safar Mitra is a taxi/car rental platform connecting **Operators** (car owners) with **Drivers** (renters).

### User Roles

| Role | Description |
|------|-------------|
| **Driver** | Users who rent vehicles |
| **Operator** | Users who list vehicles for rent |
| **Admin** | System administrators who verify KYC |

---

## Authentication

### Two-Phase Authentication Model

| Phase | User State | Auth Method | Token |
|-------|------------|-------------|-------|
| **Onboarding** | KYC not approved | Onboarding Token | `obt_a1b2c3...` |
| **Verified** | KYC approved | JWT Token | `eyJhbG...` |

### Token Types

| Token | Format | Expires | Purpose |
|-------|--------|---------|---------|
| `onboarding_token` | `obt_` + 64 hex chars | 7 days | Onboarding APIs (select-role, KYC) |
| `token` (JWT) | `eyJhbG...` | 7 days | All protected APIs |

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Firebase Phone Auth (OTP verification)                  │
│     ↓                                                       │
│  2. POST /auth/login (firebase_token)                       │
│     ↓                                                       │
│  3. Backend verifies Firebase token                         │
│     ↓                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Is KYC APPROVED?                                    │    │
│  │                                                     │    │
│  │  NO                           YES                   │    │
│  │  ↓                            ↓                     │    │
│  │  Return:                      Return:               │    │
│  │  • token: null                • token: "eyJhbG..."  │    │
│  │  • onboarding_token: "obt_"   • onboarding_token:   │    │
│  │                                 null                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  4. Use appropriate token for subsequent APIs               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Header Formats

**For Onboarding APIs (Onboarding Token):**
- Pass `onboarding_token` in request body, OR
- Pass `X-Onboarding-Token` header, OR
- Pass `onboarding_token` query parameter

**For Protected APIs (JWT Token):**
```
Authorization: Bearer <jwt_token>
```

### JWT Token Payload

```json
{
  "userId": "4",
  "phoneNumber": "+919876543210",
  "roleId": 2,
  "roleCode": "OPERATOR",
  "kycStatus": "APPROVED",
  "fullName": "Mahesh Bhai Dabhi",
  "agencyName": "ABC Travels",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": [...]
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `ROLE_NOT_SELECTED` | 403 | User hasn't selected a role |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `KYC_NOT_APPROVED` | 403 | KYC verification required |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ERROR` | 409 | Duplicate entry |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Static Data Files

**Base URL:** `http://localhost:3000/data`

| File | URL | Description |
|------|-----|-------------|
| Cities | `/data/locations/cities.json` | List of available cities |
| City Areas | `/data/locations/{slug}.json` | Areas for a specific city |
| Car Models | `/data/cars/models.json` | All car companies and models |

---

## API Endpoints

---

## 1. Auth APIs

### 1.1 Login / Register

Login existing user or register new user with Firebase token.

**Endpoint:** `POST /auth/login`  
**Auth Required:** No (uses Firebase token)

**Request Body:**
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs...",
  "fcm_token": "fcm_device_token_here"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firebase_token` | string | Yes | Firebase ID token from Flutter |
| `fcm_token` | string | No | FCM device token for push notifications |

**Response when KYC is NOT APPROVED:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": null,
    "onboarding_token": "obt_a1b2c3d4e5f6g7h8i9j0...",
    "user": {
      "id": "1",
      "phone_number": "+919876543210",
      "full_name": null,
      "role": "OPERATOR",
      "kyc_status": "NOT_SUBMITTED",
      "is_active": true
    },
    "onboarding": {
      "role_selected": true,
      "kyc_submitted": false,
      "kyc_status": "NOT_SUBMITTED"
    }
  }
}
```

**Response when KYC is APPROVED:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "onboarding_token": null,
    "user": {
      "id": "4",
      "phone_number": "+919876543210",
      "full_name": "Mahesh Bhai Dabhi",
      "role": "OPERATOR",
      "kyc_status": "APPROVED",
      "is_active": true
    },
    "onboarding": {
      "role_selected": true,
      "kyc_submitted": true,
      "kyc_status": "APPROVED"
    }
  }
}
```

**KYC Status Values:**

| Status | Description |
|--------|-------------|
| `NOT_SUBMITTED` | User hasn't submitted KYC documents yet |
| `PENDING` | User submitted KYC, waiting for admin review |
| `APPROVED` | Admin approved KYC - JWT is issued |
| `REJECTED` | Admin rejected KYC |

**Flutter Navigation Logic:**
```dart
void handleLoginResponse(Map<String, dynamic> response) {
  final token = response['data']['token'];
  final onboardingToken = response['data']['onboarding_token'];
  final onboarding = response['data']['onboarding'];
  
  if (token != null) {
    // ✅ KYC APPROVED - Save JWT and go to Dashboard
    saveJwtToken(token);
    navigateTo(DashboardScreen());
  } else {
    // ❌ KYC NOT APPROVED - Save onboarding token
    saveOnboardingToken(onboardingToken);
    
    if (!onboarding['role_selected']) {
      navigateTo(RoleSelectionScreen());
    } else if (!onboarding['kyc_submitted']) {
      navigateTo(KYCSubmitScreen());
    } else if (onboarding['kyc_status'] == 'PENDING') {
      navigateTo(KYCPendingScreen());
    } else if (onboarding['kyc_status'] == 'REJECTED') {
      navigateTo(KYCRejectedScreen());
    }
  }
}
```

---

### 1.2 Select Role

Select user role after first login.

**Endpoint:** `POST /auth/select-role`  
**Auth Required:** Onboarding Token

**Request Body:**
```json
{
  "onboarding_token": "obt_a1b2c3d4e5f6...",
  "role": "OPERATOR"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `onboarding_token` | string | Yes | Onboarding token from login |
| `role` | string | Yes | `DRIVER` or `OPERATOR` |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Role selected successfully",
  "data": {
    "user": {
      "id": "1",
      "phone_number": "+919876543210",
      "role": "OPERATOR",
      "kyc_status": "NOT_SUBMITTED"
    },
    "onboarding": {
      "role_selected": true,
      "kyc_submitted": false,
      "kyc_status": "NOT_SUBMITTED"
    }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Role must be either DRIVER or OPERATOR | Invalid role |
| 400 | Cannot change role after KYC approval | Role already locked |
| 400 | Invalid or expired onboarding token | Token expired/invalid |

---

### 1.3 Logout

Logout user and clear FCM token.

**Endpoint:** `POST /auth/logout`  
**Auth Required:** JWT (only verified users)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. User APIs

All User APIs require **JWT token** (KYC must be APPROVED).

### 2.1 Get My Profile

**Endpoint:** `GET /users/me`  
**Auth Required:** JWT

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "4",
    "phone_number": "+919876543210",
    "full_name": "Mahesh Bhai Dabhi",
    "address": "123 Main Street, City",
    "agency_name": "ABC Travels",
    "profile_image_url": "http://localhost:3000/uploads/profiles/abc.jpg",
    "dob": "1990-01-15",
    "role": "OPERATOR",
    "kyc_status": "APPROVED",
    "is_active": true,
    "created_at": "2026-01-03T10:00:00.000Z",
    "onboarding": {
      "role_selected": true,
      "kyc_submitted": true,
      "kyc_status": "APPROVED"
    }
  }
}
```

---

### 2.2 Update My Profile

**Endpoint:** `PUT /users/me`  
**Auth Required:** JWT  
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | No | Max 100 characters |
| `address` | string | No | Max 500 characters |
| `agency_name` | string | No | Max 150 characters |
| `dob` | string | No | Date of birth |
| `profile_image` | file | No | JPEG/JPG/PNG (max 5MB) |

---

### 2.3 Get User Profile by ID

**Endpoint:** `GET /users/profile/:id`  
**Auth Required:** JWT

---

## 3. KYC APIs

KYC APIs use **Onboarding Token** (not JWT).

### 3.1 Get KYC Status

**Endpoint:** `GET /kyc/status`  
**Auth Required:** Onboarding Token

**Request (Option A - Query Parameter):**
```
GET /kyc/status?onboarding_token=obt_a1b2c3d4e5f6...
```

**Request (Option B - Header):**
```
GET /kyc/status
Header: X-Onboarding-Token: obt_a1b2c3d4e5f6...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "KYC status fetched successfully",
  "data": {
    "kyc_status": "PENDING",
    "kyc_reject_reason": null,
    "personal_info": {
      "full_name": "John Doe",
      "address": "123 Main Street",
      "agency_name": "ABC Travels",
      "profile_image_url": "http://localhost:3000/uploads/profiles/abc.jpg"
    },
    "documents": [
      {
        "id": 1,
        "document_type": "AADHAAR",
        "front_doc_url": "http://localhost:3000/uploads/documents/front.jpg",
        "back_doc_url": "http://localhost:3000/uploads/documents/back.jpg",
        "status": "PENDING",
        "reject_reason": null
      }
    ],
    "onboarding": {
      "role_selected": true,
      "kyc_submitted": true,
      "kyc_status": "PENDING"
    }
  }
}
```

---

### 3.2 Submit KYC

**Endpoint:** `POST /kyc/submit`  
**Auth Required:** Onboarding Token  
**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `onboarding_token` | string | Yes | Onboarding token from login |
| `full_name` | string | No* | Max 100 characters |
| `address` | string | No* | Max 500 characters |
| `agency_name` | string | No | Max 150 characters |
| `profile_image` | file | No | JPEG/JPG/PNG (max 5MB) |
| `documents` | array | No* | Array of document objects |

*Required for initial submission

**Document Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documents[i][document_type]` | string | Yes | `AADHAAR`, `DRIVING_LICENSE`, `PAN_CARD` |
| `documents[i][document_number]` | string | Yes | Document number |
| `documents[i][front_doc]` | file | Yes | Front image (max 5MB) |
| `documents[i][back_doc]` | file | No | Back image (max 5MB) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "KYC submitted for verification",
  "data": {
    "kyc_status": "PENDING",
    "personal_info_updated": true,
    "documents_processed": 2,
    "message": "KYC submitted for verification",
    "onboarding": {
      "role_selected": true,
      "kyc_submitted": true,
      "kyc_status": "PENDING"
    }
  }
}
```

---

## 4. Car APIs

All Car APIs require **JWT token** (KYC must be APPROVED).

### 4.1 List Cars

**Endpoint:** `GET /cars`  
**Auth Required:** JWT + KYC Approved

### 4.2 Get Car by ID

**Endpoint:** `GET /cars/:id`  
**Auth Required:** JWT + KYC Approved

### 4.3 Create Car

**Endpoint:** `POST /cars`  
**Auth Required:** JWT + KYC Approved + OPERATOR role

### 4.4 Update Car

**Endpoint:** `PUT /cars/:id`  
**Auth Required:** JWT + KYC Approved + OPERATOR role

### 4.5 Delete Car

**Endpoint:** `DELETE /cars/:id`  
**Auth Required:** JWT + KYC Approved + OPERATOR role

---

## 5. Booking Request APIs

All Booking Request APIs require **JWT token** (KYC must be APPROVED).

### 5.1 Create Booking Request

**Endpoint:** `POST /booking-requests`  
**Auth Required:** JWT + KYC Approved + DRIVER role

### 5.2 List Booking Requests

**Endpoint:** `GET /booking-requests`  
**Auth Required:** JWT + KYC Approved

### 5.3 Update Booking Request Status

**Endpoint:** `PUT /booking-requests/:id/status`  
**Auth Required:** JWT + KYC Approved + OPERATOR role

### 5.4 Cancel Booking Request

**Endpoint:** `DELETE /booking-requests/:id`  
**Auth Required:** JWT + KYC Approved + DRIVER role

### 5.5 Get Pending Request Count

**Endpoint:** `GET /booking-requests/pending-count`  
**Auth Required:** JWT + KYC Approved + DRIVER role

---

## Quick Reference

### All Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Firebase | Login/Register |
| POST | `/auth/select-role` | Onboarding | Select role |
| POST | `/auth/logout` | JWT | Logout |
| GET | `/users/me` | JWT | Get my profile |
| PUT | `/users/me` | JWT | Update my profile |
| GET | `/users/profile/:id` | JWT | Get user by ID |
| GET | `/kyc/status` | Onboarding | Get KYC status |
| POST | `/kyc/submit` | Onboarding | Submit KYC |
| GET | `/cars` | JWT + KYC | List cars |
| GET | `/cars/:id` | JWT + KYC | Get car by ID |
| POST | `/cars` | JWT + KYC + OPERATOR | Create car |
| PUT | `/cars/:id` | JWT + KYC + OPERATOR | Update car |
| DELETE | `/cars/:id` | JWT + KYC + OPERATOR | Delete car |
| POST | `/booking-requests` | JWT + KYC + DRIVER | Create request |
| GET | `/booking-requests` | JWT + KYC | List requests |
| GET | `/booking-requests/pending-count` | JWT + KYC + DRIVER | Get pending count |
| PUT | `/booking-requests/:id/status` | JWT + KYC + OPERATOR | Update status |
| DELETE | `/booking-requests/:id` | JWT + KYC + DRIVER | Cancel request |

**Auth Legend:**
- **Firebase** = Firebase ID token (only for login)
- **Onboarding** = Onboarding token (`obt_...`)
- **JWT** = JWT token (`eyJhbG...`)
- **KYC** = Requires KYC to be APPROVED

---

## Flow Diagrams

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPLETE USER JOURNEY                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Firebase Phone Auth (OTP)                               │
│     ↓                                                       │
│  2. POST /auth/login (firebase_token)                       │
│     → Returns: onboarding_token (KYC not approved)          │
│     ↓                                                       │
│  3. POST /auth/select-role (onboarding_token)               │
│     ↓                                                       │
│  4. POST /kyc/submit (onboarding_token)                     │
│     ↓                                                       │
│  5. Wait for Admin Review                                   │
│     → Poll GET /kyc/status (onboarding_token)               │
│     ↓                                                       │
│  6. KYC Approved!                                           │
│     ↓                                                       │
│  7. POST /auth/login (firebase_token)                       │
│     → Returns: token (JWT) + onboarding_token: null         │
│     ↓                                                       │
│  8. Use JWT for all protected APIs                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN LIFECYCLE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ONBOARDING TOKEN                                           │
│  ├─ Generated: After login (if KYC not approved)            │
│  ├─ Format: obt_<64 hex characters>                         │
│  ├─ Expires: 7 days                                         │
│  ├─ Stored: In database (users.onboarding_token)            │
│  ├─ Used for: select-role, kyc/status, kyc/submit           │
│  └─ Cleared: When KYC is approved                           │
│                                                             │
│  JWT TOKEN                                                  │
│  ├─ Generated: After login (if KYC approved)                │
│  ├─ Format: eyJhbGciOiJIUzI1NiIs...                         │
│  ├─ Expires: 7 days                                         │
│  ├─ Stored: Not stored (stateless)                          │
│  ├─ Used for: All protected APIs                            │
│  └─ Contains: userId, roleCode, kycStatus, etc.             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing with cURL

### Onboarding Flow

```bash
# 1. Login (get onboarding_token)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"firebase_token": "YOUR_FIREBASE_TOKEN"}'

# 2. Select Role (use onboarding_token)
curl -X POST http://localhost:3000/api/v1/auth/select-role \
  -H "Content-Type: application/json" \
  -d '{"onboarding_token": "obt_xxx...", "role": "OPERATOR"}'

# 3. Check KYC Status
curl -X GET "http://localhost:3000/api/v1/kyc/status?onboarding_token=obt_xxx..."

# 4. Submit KYC
curl -X POST http://localhost:3000/api/v1/kyc/submit \
  -F "onboarding_token=obt_xxx..." \
  -F "full_name=John Doe" \
  -F "address=123 Main Street" \
  -F "documents[0][document_type]=AADHAAR" \
  -F "documents[0][document_number]=1234-5678-9012" \
  -F "documents[0][front_doc]=@/path/to/aadhaar_front.jpg"
```

### Verified User Flow

```bash
# After KYC approved, login again to get JWT
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"firebase_token": "YOUR_FIREBASE_TOKEN"}'
# Response: "token": "eyJhbG...", "onboarding_token": null

# Use JWT for all subsequent requests
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/api/v1/cars \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Contact

For questions or issues, contact the development team.
