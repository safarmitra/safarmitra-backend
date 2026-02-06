# Safar Mitra - API Documentation

**Version:** 2.3.0  
**Base URL:** `http://localhost:3000/api/v1`  
**Last Updated:** January 2025

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
   - [Notification APIs](#6-notification-apis)
7. [Flow Diagrams](#flow-diagrams)
8. [Quick Reference](#quick-reference)

---

## Overview

Safar Mitra is a taxi/car rental platform connecting **Operators** (car owners) with **Drivers** (renters).

### User Roles

| Role | Description |
|------|-------------|
| **Driver** | Users who rent vehicles |
| **Operator** | Users who list vehicles for rent |
| **Admin** | System administrators (see Admin API docs) |

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
└────────────────────────────────────────────────────────��────┘
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

### Success Response with Pagination

```json
{
  "success": true,
  "message": "Operation successful",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": [
      {
        "field": "field_name",
        "message": "Error message"
      }
    ]
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

**Middleware Chain:**
1. `validateLogin` - Validates request body

**Request Body:**
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs...",
  "fcm_token": "fcm_device_token_here"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `firebase_token` | string | Yes | Firebase ID token from Flutter |
| `fcm_token` | string | No | FCM device token for push notifications |

**Service Logic (`authService.loginOrRegister`):**
1. Verify Firebase ID token using Firebase Admin SDK
2. Extract phone number from decoded token
3. Find existing user by phone number OR create new user
4. Update FCM token if provided
5. Check if user is active (not suspended)
6. Build onboarding status object
7. If KYC APPROVED → Generate JWT token, clear onboarding token
8. If KYC NOT APPROVED → Generate onboarding token (valid 7 days)
9. Return appropriate token, user data, and onboarding status

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

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Firebase token is required | Missing token |
| 401 | Invalid Firebase token | Token verification failed |
| 403 | Your account has been suspended | User is inactive |

---

### 1.2 Select Role

Select user role after first login.

**Endpoint:** `POST /auth/select-role`  
**Auth Required:** Onboarding Token

**Middleware Chain:**
1. `validateSelectRole` - Validates request body

**Request Body:**
```json
{
  "onboarding_token": "obt_a1b2c3d4e5f6...",
  "role": "OPERATOR"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `onboarding_token` | string | Yes | Valid onboarding token |
| `role` | string | Yes | `DRIVER` or `OPERATOR` |

**Service Logic (`authService.selectRole`):**
1. Find user by onboarding token (must not be expired)
2. Validate role code exists in database
3. Check user hasn't already completed KYC (role can't change after approval)
4. Update user's role_id
5. Return updated user data with onboarding status

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
**Auth Required:** JWT

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token

**Service Logic (`authService.logout`):**
1. Clear FCM token from user record
2. Client should discard JWT token

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

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token

**Service Logic (`userService.getMyProfile`):**
1. Get user ID from JWT token
2. Fetch user with role association
3. Build onboarding status
4. Return formatted user profile

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

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token
2. `upload.single('profile_image')` - Handles file upload
3. `validateProfileImage` - Validates image file
4. `validateUpdateProfile` - Validates request body

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `full_name` | string | No | Max 100 characters |
| `address` | string | No | Max 500 characters |
| `agency_name` | string | No | Max 150 characters |
| `dob` | string | No | Max 15 characters |
| `profile_image` | file | No | JPEG/JPG/PNG, max 5MB |

**Service Logic (`userService.updateMyProfile`):**
1. Get user ID from JWT token
2. Find user by ID
3. If profile_image provided:
   - Delete old image from S3 (if exists)
   - Upload new image to S3
4. Update user fields
5. Return updated profile

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "4",
    "phone_number": "+919876543210",
    "full_name": "Updated Name",
    "address": "New Address",
    "agency_name": "New Agency",
    "profile_image_url": "http://localhost:3000/uploads/profiles/new.jpg",
    "dob": "1990-01-15",
    "role": "OPERATOR",
    "kyc_status": "APPROVED",
    "is_active": true
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Only JPEG, JPG and PNG images are allowed | Invalid file type |
| 400 | Image size must be less than 5MB | File too large |

---

### 2.3 Get User Profile by ID

**Endpoint:** `GET /users/profile/:id`  
**Auth Required:** JWT

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token

**Service Logic (`userService.getProfileById`):**
1. Find user by ID with role association
2. Return public profile (limited fields)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "5",
    "full_name": "John Doe",
    "agency_name": "XYZ Travels",
    "profile_image_url": "http://localhost:3000/uploads/profiles/john.jpg",
    "role": "OPERATOR",
    "kyc_verified": true
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 404 | User not found | Invalid user ID |

---

### 2.4 List Drivers (For Operators)

List verified drivers for operators to invite.

**Endpoint:** `GET /users/drivers`  
**Auth Required:** JWT + KYC Approved + OPERATOR role

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `requireRole('OPERATOR')` - Checks user is operator
4. `validateListDrivers` - Validates query params

**Query Parameters:**

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `search` | string | No | - | Max 100 chars, search by name/phone |
| `city` | string | No | - | Max 100 chars, filter by city (case-insensitive) |
| `area` | string | No | - | Max 100 chars, filter by area (case-insensitive) |
| `page` | number | No | 1 | Min 1 |
| `limit` | number | No | 10 | Min 1, Max 50 |

**Service Logic (`userService.listDrivers`):**
1. Get DRIVER role ID
2. Build query with filters:
   - role_id = DRIVER
   - kyc_status = APPROVED
   - is_active = true
3. Apply city filter (case-insensitive exact match)
4. Apply area filter (case-insensitive exact match)
5. Apply search filter (name or phone)
6. Apply pagination
7. Return list with meta

**Success Response (200):**
```json
{
  "success": true,
  "message": "Drivers fetched successfully",
  "data": [
    {
      "id": "10",
      "full_name": "Driver Name",
      "phone_number": "+919876543210",
      "profile_image_url": "http://...",
      "city": "Ahmedabad",
      "area": "Bodakdev",
      "kyc_verified": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

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

**Service Logic (`kycService.getKycStatus`):**
1. Find user by onboarding token
2. Fetch user's documents (UserIdentity)
3. Build personal info object
4. Build onboarding status
5. Return KYC status with documents

**Success Response when KYC is PENDING (200):**
```json
{
  "success": true,
  "message": "KYC status fetched successfully",
  "data": {
    "token": null,
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
    "user": null,
    "onboarding": {
      "role_selected": true,
      "kyc_submitted": true,
      "kyc_status": "PENDING"
    }
  }
}
```

**Success Response when KYC is APPROVED (200):**
```json
{
  "success": true,
  "message": "KYC status fetched successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "kyc_status": "APPROVED",
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
        "status": "APPROVED",
        "reject_reason": null
      }
    ],
    "user": {
      "id": "1",
      "phone_number": "+919876543210",
      "full_name": "John Doe",
      "address": "123 Main Street",
      "agency_name": "ABC Travels",
      "profile_image_url": "http://...",
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

> **Note:** When KYC is APPROVED, the response includes a JWT `token` and `user` object. The `onboarding_token` is automatically cleared. Use the JWT token for all subsequent protected API calls.

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Onboarding token is required | Missing token |
| 400 | Invalid or expired onboarding token | Token invalid/expired |

---

### 3.2 Submit KYC

**Endpoint:** `POST /kyc/submit`  
**Auth Required:** Onboarding Token  
**Content-Type:** `multipart/form-data`

**Middleware Chain:**
1. `upload.any()` - Handles multiple file uploads
2. `validateKycSubmit` - Validates request body
3. `validateDocumentFiles` - Validates document files

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `onboarding_token` | string | Yes | Valid onboarding token |
| `full_name` | string | No* | Max 100 characters |
| `address` | string | No* | Max 500 characters |
| `agency_name` | string | No | Max 150 characters |
| `profile_image` | file | No | JPEG/JPG/PNG (max 5MB) |
| `documents` | array | No* | Array of document objects |

*Required for initial submission

**Document Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `documents[i][document_type]` | string | Yes | `AADHAAR`, `DRIVING_LICENSE`, `PAN_CARD` |
| `documents[i][document_number]` | string | Yes | Document number |
| `documents[i][front_doc]` | file | Yes | JPEG/JPG/PNG/PDF (max 5MB) |
| `documents[i][back_doc]` | file | No | JPEG/JPG/PNG/PDF (max 5MB) |

**Service Logic (`kycService.submitKyc`):**
1. Find user by onboarding token
2. Check user has selected a role
3. Update personal info (full_name, address, agency_name)
4. Upload profile image to S3 (if provided)
5. Process each document:
   - Check if document type already exists
   - If exists: Update document (upload new files, delete old)
   - If new: Create document record
6. Update user's kyc_status to 'PENDING'
7. Return submission result

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

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Please select a role first | Role not selected |
| 400 | Front document image is required | Missing front doc |
| 400 | Only JPEG, JPG, PNG and PDF files are allowed | Invalid file type |
| 400 | File size must be less than 5MB | File too large |

---

## 4. Car APIs

All Car APIs require **JWT token** (KYC must be APPROVED).

### 4.1 List Cars

**Endpoint:** `GET /cars`  
**Auth Required:** JWT + KYC Approved

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search by car name |
| `city` | string | No | - | Filter by city name (case-insensitive) |
| `area` | string | No | - | Filter by area name (case-insensitive) |
| `category` | string | No | - | `TAXI` or `PRIVATE` |
| `fuel_type` | string | No | - | `PETROL`, `DIESEL`, `CNG`, `ELECTRIC` |
| `transmission` | string | No | - | `MANUAL` or `AUTOMATIC` |
| `rate_type` | string | No | - | `12HR` or `24HR` |
| `min_price` | number | No | - | Minimum rate amount |
| `max_price` | number | No | - | Maximum rate amount |
| `purposes` | string | No | - | Comma-separated purposes |
| `is_active` | boolean | No | - | Filter by active status (OPERATOR only) |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 10 | Items per page |

**Service Logic (`carService.listCars`):**
1. Check user role (DRIVER or OPERATOR)
2. **For DRIVER:** Show only active cars from all operators
3. **For OPERATOR:** Show only their own cars (active + inactive)
4. Apply filters (search, category, fuel_type, etc.)
5. Apply pagination
6. Return cars with FULL details (all images, operator info)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cars fetched successfully",
  "data": [
    {
      "id": "1",
      "car_number": "GJ01AB1234",
      "car_name": "Swift Dzire",
      "category": "TAXI",
      "transmission": "MANUAL",
      "fuel_type": "PETROL",
      "rate_type": "24HR",
      "rate_amount": 1200.00,
      "deposit_amount": 5000.00,
      "purposes": ["SELF_DRIVE", "CORPORATE"],
      "instructions": "No smoking in car",
      "rc_front_url": "http://...",
      "rc_back_url": "http://...",
      "is_active": true,
      "images": [
        {
          "id": 1,
          "image_url": "http://...",
          "is_primary": true
        }
      ],
      "operator": {
        "id": "4",
        "full_name": "Mahesh Bhai",
        "agency_name": "ABC Travels",
        "profile_image_url": "http://...",
        "phone_number": "+919876543210",
        "kyc_verified": true
      },
      "created_at": "2026-01-03T10:00:00.000Z",
      "updated_at": "2026-01-03T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

---

### 4.2 Get Car by ID

**Endpoint:** `GET /cars/:id`  
**Auth Required:** JWT + KYC Approved

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved

**Service Logic (`carService.getCarById`):**
1. Find car by ID with images and operator info
2. **For DRIVER:** Only allow viewing active cars
3. **For OPERATOR:** Only allow viewing their own cars
4. Return full car details

**Success Response (200):**
```json
{
  "success": true,
  "message": "Car fetched successfully",
  "data": {
    "id": "1",
    "car_number": "GJ01AB1234",
    "car_name": "Swift Dzire",
    "category": "TAXI",
    "transmission": "MANUAL",
    "fuel_type": "PETROL",
    "rate_type": "24HR",
    "rate_amount": 1200.00,
    "deposit_amount": 5000.00,
    "purposes": ["SELF_DRIVE", "CORPORATE"],
    "instructions": "No smoking in car",
    "rc_front_url": "http://...",
    "rc_back_url": "http://...",
    "is_active": true,
    "images": [...],
    "operator": {...},
    "created_at": "2026-01-03T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 404 | Car not found | Invalid car ID or inactive (for driver) |
| 403 | You do not have permission to view this car | Operator viewing other's car |

---

### 4.3 Create Car

**Endpoint:** `POST /cars`  
**Auth Required:** JWT + KYC Approved + OPERATOR role  
**Content-Type:** `multipart/form-data`

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `requireRole('OPERATOR')` - Checks user is operator
4. `carUploadFields` - Handles file uploads (multer)
5. `validateCreateCar` - Validates request body
6. `validateRcDocuments` - Validates RC documents

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `car_number` | string | Yes | Exactly 10 chars, unique. Format: `GJ01AB1234` or `22BH1234AB` (Bharat Series) |
| `car_name` | string | Yes | Max 100 chars |
| `city` | string | Yes | Max 100 chars (from cities.json) |
| `area` | string | No | Max 100 chars (from city areas json) |
| `category` | string | Yes | `TAXI` or `PRIVATE` |
| `transmission` | string | Yes | `MANUAL` or `AUTOMATIC` |
| `fuel_type` | string | Yes | `PETROL`, `DIESEL`, `CNG`, `ELECTRIC` |
| `rate_type` | string | Yes | `12HR` or `24HR` |
| `rate_amount` | number | Yes | Positive number |
| `deposit_amount` | number | No | Min 0 |
| `purposes` | string | No | Comma-separated values |
| `instructions` | string | No | Max 1000 chars |
| `is_active` | boolean | No | Default: true |
| `primary_image_index` | number | No | 0-4, which image is primary |
| `rc_front` | file | Yes | JPEG/JPG/PNG/PDF, max 5MB |
| `rc_back` | file | Yes | JPEG/JPG/PNG/PDF, max 5MB |
| `images` | file[] | No | Max 5 images, JPEG/JPG/PNG/PDF, max 5MB each |

**Service Logic (`carService.createCar`):**
1. Normalize car number (uppercase, remove spaces)
2. Check if car_number already exists:
   - If exists for SAME operator with no images (incomplete) → Delete and retry
   - If exists for SAME operator with images → Error: "You have already registered"
   - If exists for DIFFERENT operator → Error: "Already exists"
3. Upload all files to S3 FIRST (before transaction)
4. Start database transaction
5. Create car record
6. Create car image records
7. Commit transaction
8. If DB fails → Rollback and cleanup S3 files
9. Return created car

**Success Response (201):**
```json
{
  "success": true,
  "message": "Car created successfully",
  "data": {
    "id": "1",
    "car_number": "GJ01AB1234",
    "car_name": "Swift Dzire",
    "category": "TAXI",
    ...
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Car registration number is required | Missing car_number |
| 400 | RC front image is required | Missing rc_front |
| 400 | RC back image is required | Missing rc_back |
| 400 | Only JPEG, JPG, PNG and PDF files are allowed | Invalid file type |
| 400 | File size must be less than 5MB | File too large |
| 400 | Maximum 5 car images allowed | Too many images |
| 409 | You have already registered this car | Duplicate for same operator |
| 409 | A car with this registration number already exists | Duplicate for different operator |

---

### 4.4 Update Car

**Endpoint:** `PUT /cars/:id`  
**Auth Required:** JWT + KYC Approved + OPERATOR role  
**Content-Type:** `multipart/form-data`

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `requireRole('OPERATOR')` - Checks user is operator
4. `carUploadFields` - Handles file uploads
5. `validateUpdateCar` - Validates request body
6. `validateUpdateFiles` - Validates files

**Request Body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| `car_name` | string | Max 100 chars |
| `category` | string | `TAXI` or `PRIVATE` |
| `transmission` | string | `MANUAL` or `AUTOMATIC` |
| `fuel_type` | string | `PETROL`, `DIESEL`, `CNG`, `ELECTRIC` |
| `rate_type` | string | `12HR` or `24HR` |
| `rate_amount` | number | Positive number |
| `deposit_amount` | number | Min 0 |
| `purposes` | string | Comma-separated values |
| `instructions` | string | Max 1000 chars |
| `is_active` | boolean | Active status |
| `primary_image_index` | number | 0-4 |
| `remove_images` | string | Comma-separated image IDs to remove |
| `rc_front` | file | New RC front image |
| `rc_back` | file | New RC back image |
| `images` | file[] | New images to add |

**Service Logic (`carService.updateCar`):**
1. Find car and verify ownership
2. Update RC documents if provided (delete old from S3)
3. Update car fields
4. Handle image removal (remove_images):
   - Delete from S3
   - Delete from database
5. Upload new images if provided
6. Update primary image index
7. Return updated car

**Success Response (200):**
```json
{
  "success": true,
  "message": "Car updated successfully",
  "data": { ... }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 404 | Car not found | Invalid car ID |
| 403 | You do not have permission to update this car | Not owner |

---

### 4.5 Delete Car

**Endpoint:** `DELETE /cars/:id`  
**Auth Required:** JWT + KYC Approved + OPERATOR role

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `requireRole('OPERATOR')` - Checks user is operator

**Service Logic (`carService.deleteCar`):**
1. Find car and verify ownership
2. Delete all car images from S3
3. Delete RC documents from S3
4. Delete car images records (cascade)
5. Delete car record

**Success Response (200):**
```json
{
  "success": true,
  "message": "Car deleted successfully"
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 404 | Car not found | Invalid car ID |
| 403 | You do not have permission to delete this car | Not owner |

---

## 5. Booking Request APIs

All Booking Request APIs require **JWT token** (KYC must be APPROVED).

### Booking Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 BOOKING REQUEST FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DRIVER → OPERATOR (Driver requests a car)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Driver: POST /booking-requests                   │    │
│  │    → Creates request (initiated_by: DRIVER)         │    │
│  │ 2. Operator receives notification                   │    │
│  │ 3. Operator: PUT /booking-requests/:id/status       │    │
│  │    → ACCEPTED or REJECTED                           │    │
│  │ 4. Driver receives notification                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  OPERATOR → DRIVER (Operator invites a driver)              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Operator: POST /booking-requests/invite          │    │
│  │    → Creates invitation (initiated_by: OPERATOR)    │    │
│  │ 2. Driver receives notification                     │    │
│  │ 3. Driver: PUT /booking-requests/:id/status         │    │
│  │    → ACCEPTED or REJECTED                           │    │
│  │ 4. Operator receives notification                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Booking Request Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Waiting for response (expires after 3 days) |
| `ACCEPTED` | Request accepted - phone numbers visible |
| `REJECTED` | Request rejected |
| `EXPIRED` | Auto-expired after 3 days or car deactivated |

### Booking Request Expiry (3 Days)

```
┌─────────────────────────────────────────────────────────────┐
│              BOOKING REQUEST EXPIRY FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Request Created                                         │
│     └── expires_at = created_at + 3 days                    │
│                                                             │
│  2. On API Call (Lazy Expiry)                               │
│     └── Check if expires_at < NOW()                         │
│     └── If expired: Update status = 'EXPIRED'               │
│     └── Send notification to initiator                      │
│                                                             │
│  3. Expired requests visible in history with EXPIRED status │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Car Auto-Deactivation (7 Days Inactivity)

```
┌─────────────────────────────────────────────────────────────┐
│              CAR AUTO-DEACTIVATION FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Activity Tracking:                                         │
│  └── last_active_at updated ONLY on car update              │
│                                                             │
│  On Driver Listing Cars:                                    │
│  └── Check if car.last_active_at < 7 days ago               │
│  └── If inactive: Auto-deactivate car                       │
│  └── Expire all pending requests for this car               │
│  └── Notify operator                                        │
│                                                             │
│  Operator Reactivation:                                     │
│  └── Edit car → set is_active = true                        │
│  └── last_active_at automatically reset to NOW()            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Phone Number Visibility

```
┌─────────────────────────────────────────────────────────────┐
│              PHONE NUMBER VISIBILITY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Status: PENDING / REJECTED / EXPIRED                       │
│  ├── driver.phone_number = null (HIDDEN)                    │
│  └── operator.phone_number = null (HIDDEN)                  │
│                                                             │
│  Status: ACCEPTED                                           │
│  ├── driver.phone_number = "+919876543210" (VISIBLE)        │
│  └── operator.phone_number = "+919876543211" (VISIBLE)      │
│                                                             │
│  Push Notification (on ACCEPTED):                           │
│  ├── To Initiator: "Request accepted! Contact: {phone}"     │
│  └── To Acceptor: "You accepted. Contact: {phone}"          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.1 Create Booking Request (Driver)

**Endpoint:** `POST /booking-requests`  
**Auth Required:** JWT + KYC Approved + DRIVER role

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `requireRole('DRIVER')` - Checks user is driver
4. `validateCreateBookingRequest` - Validates request body

**Request Body:**
```json
{
  "car_id": 1,
  "message": "I need this car for a wedding event"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `car_id` | number | Yes | Positive integer |
| `message` | string | No | Max 1000 chars |

**Service Logic (`bookingRequestService.createBookingRequest`):**
1. Find the car with operator info
2. Check if car exists and is active
3. Check driver is not booking their own car
4. Check for existing pending request (same car, same driver)
5. Create booking request (initiated_by: DRIVER)
6. Send push notification to operator
7. Return created request with full details

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking request created successfully",
  "data": {
    "id": "1",
    "initiated_by": "DRIVER",
    "message": "I need this car for a wedding event",
    "status": "PENDING",
    "reject_reason": null,
    "created_at": "2026-01-03T10:00:00.000Z",
    "car": {
      "id": "1",
      "car_name": "Swift Dzire",
      "category": "TAXI",
      "transmission": "MANUAL",
      "fuel_type": "PETROL",
      "rate_type": "24HR",
      "rate_amount": 1200.00,
      "deposit_amount": 5000.00,
      "purposes": ["SELF_DRIVE"],
      "instructions": null,
      "is_active": true,
      "images": [...]
    },
    "driver": {
      "id": "10",
      "full_name": "Driver Name",
      "phone_number": "+919876543210",
      "profile_image_url": "http://...",
      "kyc_verified": true
    },
    "operator": {
      "id": "4",
      "full_name": "Operator Name",
      "agency_name": "ABC Travels",
      "phone_number": "+919876543211",
      "profile_image_url": "http://...",
      "kyc_verified": true
    }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Car ID is required | Missing car_id |
| 400 | You cannot book your own car | Self-booking attempt |
| 400 | You already have a pending request for this car | Duplicate request |
| 400 | Car is not available for booking | Car is inactive |
| 404 | Car not found | Invalid car_id |

---

### 5.2 Invite Driver (Operator)

**Endpoint:** `POST /booking-requests/invite`  
**Auth Required:** JWT + KYC Approved + OPERATOR role

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `requireRole('OPERATOR')` - Checks user is operator
4. `validateInviteDriver` - Validates request body

**Request Body:**
```json
{
  "car_id": 1,
  "driver_id": 10,
  "message": "Would you like to drive this car?"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `car_id` | number | Yes | Positive integer |
| `driver_id` | number | Yes | Positive integer |
| `message` | string | No | Max 1000 chars |

**Service Logic (`bookingRequestService.inviteDriver`):**
1. Find the car and verify operator owns it
2. Check if car is active
3. Find the driver and verify:
   - User exists
   - User is a DRIVER
   - Driver's KYC is approved
4. Check operator is not inviting themselves
5. Check for existing pending invitation (same car, same driver)
6. Create booking request (initiated_by: OPERATOR)
7. Send push notification to driver
8. Return created invitation with full details

**Success Response (201):**
```json
{
  "success": true,
  "message": "Driver invited successfully",
  "data": {
    "id": "2",
    "initiated_by": "OPERATOR",
    "message": "Would you like to drive this car?",
    "status": "PENDING",
    ...
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | You cannot invite yourself | Self-invitation |
| 400 | You already have a pending invitation for this driver | Duplicate invitation |
| 400 | Car must be active to invite drivers | Car is inactive |
| 400 | User is not a driver | Target user is not driver |
| 400 | Driver KYC is not approved | Driver KYC not approved |
| 403 | You can only invite drivers for your own cars | Not car owner |
| 404 | Car not found | Invalid car_id |
| 404 | Driver not found | Invalid driver_id |

---

### 5.3 List Sent Requests

**Endpoint:** `GET /booking-requests/sent`  
**Auth Required:** JWT + KYC Approved

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `validateListBookingRequests` - Validates query params

**Query Parameters:**

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `status` | string | No | ALL | `PENDING`, `ACCEPTED`, `REJECTED`, `ALL` |
| `car_id` | number | No | - | Positive integer |
| `page` | number | No | 1 | Min 1 |
| `limit` | number | No | 10 | Min 1, Max 50 |

**Service Logic (`bookingRequestService.listSentRequests`):**
- **For DRIVER:** Returns requests where `initiated_by = DRIVER` and `driver_id = userId`
- **For OPERATOR:** Returns requests where `initiated_by = OPERATOR` and `operator_id = userId`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sent requests fetched successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

---

### 5.4 List Received Requests

**Endpoint:** `GET /booking-requests/received`  
**Auth Required:** JWT + KYC Approved

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `validateListBookingRequests` - Validates query params

**Query Parameters:** Same as List Sent Requests

**Service Logic (`bookingRequestService.listReceivedRequests`):**
- **For DRIVER:** Returns requests where `initiated_by = OPERATOR` and `driver_id = userId`
- **For OPERATOR:** Returns requests where `initiated_by = DRIVER` and `operator_id = userId`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Received requests fetched successfully",
  "data": [...],
  "meta": {...}
}
```

---

### 5.5 Get Request Counts

**Endpoint:** `GET /booking-requests/counts`  
**Auth Required:** JWT + KYC Approved

**Service Logic (`bookingRequestService.getRequestCounts`):**
1. Count sent pending requests
2. Count received pending requests
3. Return counts

**Success Response (200):**
```json
{
  "success": true,
  "message": "Request counts fetched successfully",
  "data": {
    "sent_pending_count": 5,
    "received_pending_count": 3,
    "total_pending_count": 8
  }
}
```

---

### 5.6 Update Request Status

**Endpoint:** `PUT /booking-requests/:id/status`  
**Auth Required:** JWT + KYC Approved

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireKyc` - Checks KYC is approved
3. `validateUpdateStatus` - Validates request body

**Request Body:**
```json
{
  "status": "ACCEPTED"
}
```

OR

```json
{
  "status": "REJECTED",
  "reject_reason": "Car is already booked for that date"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | string | Yes | `ACCEPTED` or `REJECTED` |
| `reject_reason` | string | No | Max 500 chars, only when REJECTED |

**Service Logic (`bookingRequestService.updateBookingRequestStatus`):**
1. Find booking request
2. Verify user is the RECEIVER of the request:
   - If `initiated_by = DRIVER` → OPERATOR can respond
   - If `initiated_by = OPERATOR` → DRIVER can respond
3. Check request is still PENDING
4. Update status and reject_reason
5. Send push notification to initiator
6. Return updated request

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking request accepted successfully",
  "data": {
    "id": "1",
    "status": "ACCEPTED",
    ...
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Cannot update request. Current status is ACCEPTED | Already processed |
| 403 | You do not have permission to update this request | Not the receiver |
| 404 | Booking request not found | Invalid request ID |

---

### 5.7 Cancel Request

**Endpoint:** `DELETE /booking-requests/:id`  
**Auth Required:** JWT + KYC Approved

**Service Logic (`bookingRequestService.cancelBookingRequest`):**
1. Find booking request
2. Verify user is the INITIATOR of the request:
   - If `initiated_by = DRIVER` → DRIVER can cancel
   - If `initiated_by = OPERATOR` → OPERATOR can cancel
3. Check request is still PENDING
4. Delete the request
5. Send push notification to receiver

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking request cancelled successfully"
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Cannot cancel request. Current status is ACCEPTED | Already processed |
| 403 | You do not have permission to cancel this request | Not the initiator |
| 404 | Booking request not found | Invalid request ID |

---

### 5.8 Get Pending Count (Legacy)

**Endpoint:** `GET /booking-requests/pending-count`  
**Auth Required:** JWT + KYC Approved + DRIVER role

**Note:** This is a legacy endpoint. Use `/booking-requests/counts` instead.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Pending request count fetched successfully",
  "data": {
    "pending_count": 5
  }
}
```

---

### 5.9 Get Daily Limits

Get the daily request/invitation limits for the current user.

**Endpoint:** `GET /booking-requests/daily-limits`  
**Auth Required:** JWT + KYC Approved

**Service Logic (`bookingRequestService.getDailyLimits`):**
1. Get user's role (DRIVER or OPERATOR)
2. Count requests/invitations made today (since midnight)
3. Return limit info based on role:
   - **DRIVER:** Daily request limit (default: 5)
   - **OPERATOR:** Daily invitation limit (default: 5)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Daily limits fetched successfully",
  "data": {
    "daily_limit": 5,
    "used_today": 3,
    "remaining": 2
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `daily_limit` | number | Maximum requests/invitations allowed per day |
| `used_today` | number | Number of requests/invitations made today |
| `remaining` | number | Remaining requests/invitations for today |

**Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `DRIVER_DAILY_REQUEST_LIMIT` | 5 | Max requests a driver can send per day |
| `OPERATOR_DAILY_INVITATION_LIMIT` | 5 | Max invitations an operator can send per day |

**Note:** When the daily limit is reached, creating new requests/invitations will return a `429 Too Many Requests` error:

```json
{
  "success": false,
  "message": "You have reached your daily limit of 5 requests. Please try again tomorrow."
}
```

---

## 6. Notification APIs

All Notification APIs require **JWT token** (authentication required).

### Notification Retention

Notifications are retained for **7 days** only. Older notifications are automatically filtered out when fetching and periodically cleaned up from the database.

### Notification Types

| Type | Description | Recipient | Phone Included |
|------|-------------|-----------|----------------|
| **Booking Events** |
| `BOOKING_REQUEST_CREATED` | Driver requested a car | Operator | No |
| `BOOKING_INVITATION_CREATED` | Operator invited driver | Driver | No |
| `BOOKING_REQUEST_ACCEPTED` | Operator accepted request | Driver | ✅ Operator's phone |
| `BOOKING_REQUEST_ACCEPTED_CONFIRMATION` | Operator accepted request | Operator | ✅ Driver's phone |
| `BOOKING_REQUEST_REJECTED` | Operator rejected request | Driver | No |
| `BOOKING_INVITATION_ACCEPTED` | Driver accepted invitation | Operator | ✅ Driver's phone |
| `BOOKING_INVITATION_ACCEPTED_CONFIRMATION` | Driver accepted invitation | Driver | ✅ Operator's phone |
| `BOOKING_INVITATION_REJECTED` | Driver rejected invitation | Operator | No |
| `BOOKING_REQUEST_CANCELLED` | Driver cancelled request | Operator | No |
| `BOOKING_INVITATION_CANCELLED` | Operator cancelled invitation | Driver | No |
| **Expiry Events** |
| `BOOKING_REQUEST_EXPIRED` | Request expired (3 days) | Driver | No |
| `BOOKING_INVITATION_EXPIRED` | Invitation expired (3 days) | Operator | No |
| `REQUEST_EXPIRED_CAR_UNAVAILABLE` | Car deactivated | Initiator | No |
| `CAR_AUTO_DEACTIVATED` | Car inactive 7 days | Operator | No |
| **Limit Events** |
| `DAILY_LIMIT_REACHED` | Daily limit reached | User | No |
| **KYC Events** |
| `KYC_APPROVED` | KYC approved by admin | User | No |
| `KYC_REJECTED` | KYC rejected by admin | User | No |
| `DOCUMENT_APPROVED` | Document approved by admin | User | No |
| `DOCUMENT_REJECTED` | Document rejected by admin | User | No |
| **Account Events** |
| `ACCOUNT_SUSPENDED` | Account suspended by admin | User | No |
| `ACCOUNT_ACTIVATED` | Account reactivated by admin | User | No |

**Total: 21 notification types**

---

### 6.1 List Notifications

Get user's notifications (paginated).

**Endpoint:** `GET /notifications`  
**Auth Required:** JWT

**Query Parameters:**

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `page` | number | No | 1 | Min 1 |
| `limit` | number | No | 20 | Min 1, Max 50 |
| `type` | string | No | - | Valid notification type |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "1",
      "type": "BOOKING_REQUEST_CREATED",
      "title": "New Booking Request",
      "body": "John Doe requested your Swift Dzire",
      "data": {
        "type": "BOOKING_REQUEST_CREATED",
        "request_id": "5",
        "car_id": "2",
        "click_action": "OPEN_RECEIVED_REQUESTS"
      },
      "is_read": false,
      "created_at": "2026-01-15T10:30:00.000Z"
    },
    {
      "id": "2",
      "type": "KYC_APPROVED",
      "title": "KYC Approved! ✅",
      "body": "Your KYC has been verified. You can now use all features.",
      "data": {
        "type": "KYC_APPROVED",
        "click_action": "OPEN_DASHBOARD"
      },
      "is_read": true,
      "created_at": "2026-01-14T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3,
    "unread_count": 5
  }
}
```

---

### 6.2 Get Unread Count

Get the count of unread notifications.

**Endpoint:** `GET /notifications/unread-count`  
**Auth Required:** JWT

**Success Response (200):**
```json
{
  "success": true,
  "message": "Unread count fetched successfully",
  "data": {
    "unread_count": 5
  }
}
```

---

### 6.3 Mark Notification as Read

Mark a specific notification as read.

**Endpoint:** `PUT /notifications/:id/read`  
**Auth Required:** JWT

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "1",
    "is_read": true
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 404 | Notification not found | Invalid notification ID or not owned by user |

---

### 6.4 Mark All Notifications as Read

Mark all unread notifications as read.

**Endpoint:** `PUT /notifications/read-all`  
**Auth Required:** JWT

**Success Response (200):**
```json
{
  "success": true,
  "message": "5 notifications marked as read",
  "data": {
    "updated_count": 5
  }
}
```

---

### Notification Data Payload

Each notification includes a `data` object with:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Notification type (for app routing) |
| `click_action` | string | Action to perform when notification is tapped |
| `request_id` | string | Booking request ID (if applicable) |
| `car_id` | string | Car ID (if applicable) |
| `document_type` | string | Document type (for document notifications) |
| `limit` | string | Limit value (for limit notifications) |

**Click Actions:**

| Action | Description |
|--------|-------------|
| `OPEN_RECEIVED_REQUESTS` | Open received requests screen |
| `OPEN_SENT_REQUESTS` | Open sent requests screen |
| `OPEN_DASHBOARD` | Open main dashboard |
| `OPEN_KYC` | Open KYC screen |
| `OPEN_MY_CARS` | Open my cars screen (for operators) |
| `LOGOUT` | Force logout user |

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

## Quick Reference

### All Endpoints Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| **Auth** |
| POST | `/auth/login` | Firebase | - | Login/Register |
| POST | `/auth/select-role` | Onboarding | - | Select role |
| POST | `/auth/logout` | JWT | - | Logout |
| **User** |
| GET | `/users/me` | JWT | - | Get my profile |
| PUT | `/users/me` | JWT | - | Update my profile |
| GET | `/users/profile/:id` | JWT | - | Get user by ID |
| GET | `/users/drivers` | JWT + KYC | OPERATOR | List drivers |
| **KYC** |
| GET | `/kyc/status` | Onboarding | - | Get KYC status |
| POST | `/kyc/submit` | Onboarding | - | Submit KYC |
| **Car** |
| GET | `/cars` | JWT + KYC | - | List cars |
| GET | `/cars/:id` | JWT + KYC | - | Get car by ID |
| POST | `/cars` | JWT + KYC | OPERATOR | Create car |
| PUT | `/cars/:id` | JWT + KYC | OPERATOR | Update car |
| DELETE | `/cars/:id` | JWT + KYC | OPERATOR | Delete car |
| **Booking Request** |
| POST | `/booking-requests` | JWT + KYC | DRIVER | Create request |
| POST | `/booking-requests/invite` | JWT + KYC | OPERATOR | Invite driver |
| GET | `/booking-requests/sent` | JWT + KYC | - | List sent requests |
| GET | `/booking-requests/received` | JWT + KYC | - | List received requests |
| GET | `/booking-requests/counts` | JWT + KYC | - | Get request counts |
| GET | `/booking-requests/pending-count` | JWT + KYC | DRIVER | Get pending count (legacy) |
| GET | `/booking-requests/daily-limits` | JWT + KYC | - | Get daily limits |
| PUT | `/booking-requests/:id/status` | JWT + KYC | - | Update status |
| DELETE | `/booking-requests/:id` | JWT + KYC | - | Cancel request |
| **Notification** |
| GET | `/notifications` | JWT | - | List notifications |
| GET | `/notifications/unread-count` | JWT | - | Get unread count |
| PUT | `/notifications/read-all` | JWT | - | Mark all as read |
| PUT | `/notifications/:id/read` | JWT | - | Mark as read |

**Total: 23 User Endpoints**

**Auth Legend:**
- **Firebase** = Firebase ID token (only for login)
- **Onboarding** = Onboarding token (`obt_...`)
- **JWT** = JWT token (`eyJhbG...`)
- **KYC** = Requires KYC to be APPROVED

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

# Use JWT for all subsequent requests
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List cars
curl -X GET "http://localhost:3000/api/v1/cars?category=TAXI" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create car (Operator)
curl -X POST http://localhost:3000/api/v1/cars \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "car_number=GJ01AB1234" \
  -F "car_name=Swift Dzire" \
  -F "category=TAXI" \
  -F "transmission=MANUAL" \
  -F "fuel_type=PETROL" \
  -F "rate_type=24HR" \
  -F "rate_amount=1200" \
  -F "rc_front=@/path/to/rc_front.jpg" \
  -F "rc_back=@/path/to/rc_back.jpg" \
  -F "images=@/path/to/car1.jpg" \
  -F "images=@/path/to/car2.jpg"

# Create booking request (Driver)
curl -X POST http://localhost:3000/api/v1/booking-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"car_id": 1, "message": "I need this car"}'

# Accept booking request (Operator)
curl -X PUT http://localhost:3000/api/v1/booking-requests/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACCEPTED"}'
```

---

## Contact

For questions or issues, contact the development team.
