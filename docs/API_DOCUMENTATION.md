# Safar Mitra - API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api/v1`  
**Last Updated:** January 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Static Data Files](#static-data-files)
   - [Location Data](#location-data)
6. [API Endpoints](#api-endpoints)
   - [Auth APIs](#1-auth-apis)
   - [User APIs](#2-user-apis)
   - [KYC APIs](#3-kyc-apis)
   - [Car APIs](#4-car-apis)
   - [Booking Request APIs](#5-booking-request-apis)
7. [Database Schema](#database-schema)
8. [Flow Diagrams](#flow-diagrams)

---

## Overview

Safar Mitra is a taxi/car rental platform connecting **Operators** (car owners) with **Drivers** (renters). The platform includes:

- **Driver**: Users who rent vehicles
- **Operator**: Users who list vehicles for rent
- **Admin**: System administrators who verify KYC

### Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Sequelize |
| Authentication | Firebase Phone Auth + JWT |
| File Storage | AWS S3 |

---

## Authentication

### How It Works

1. **Flutter App** handles phone OTP verification via Firebase
2. **Flutter App** sends Firebase ID Token to backend (phone number is extracted from token)
3. **Backend** verifies Firebase token, extracts phone number, and issues JWT
4. **JWT** is used for all subsequent API calls

### Header Format

```
Authorization: Bearer <jwt_token>
```

### JWT Token Payload

```json
{
  "userId": "1",
  "roleId": 1,
  "roleCode": "DRIVER",
  "kycStatus": "PENDING",
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

Location data is served as static JSON files. The frontend can directly fetch these files without authentication.

**Base URL for Static Files:** `http://localhost:3000/data`

### Location Data

#### File Structure

```
public/
└── data/
    └── locations/
        ├── cities.json        # List of all available cities
        └── ahmedabad.json     # Areas for Ahmedabad city
```

---

### Get All Cities

Fetch the list of all available cities.

**URL:** `GET /data/locations/cities.json`  
**Auth Required:** No

**Response:**
```json
{
  "cities": [
    {
      "slug": "ahmedabad",
      "name": "Ahmedabad",
      "state": "Gujarat",
      "country": "India"
    }
  ],
  "total": 1,
  "last_updated": "2025-01-10"
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `cities` | array | List of city objects |
| `cities[].slug` | string | URL-friendly city identifier (use to fetch areas) |
| `cities[].name` | string | Display name of the city |
| `cities[].state` | string | State name |
| `cities[].country` | string | Country name |
| `total` | number | Total number of cities |
| `last_updated` | string | Date when data was last updated (YYYY-MM-DD) |

---

### Get City Areas

Fetch all areas for a specific city using the city slug.

**URL:** `GET /data/locations/{city_slug}.json`  
**Auth Required:** No

**Example:** `GET /data/locations/ahmedabad.json`

**Response:**
```json
{
  "slug": "ahmedabad",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "country": "India",
  "areas": [
    "Ambawadi",
    "Amraiwadi",
    "Asarwa",
    "Ashram Road",
    "Bodakdev",
    "Bopal",
    "...more areas..."
  ],
  "total_areas": 74
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | URL-friendly city identifier |
| `city` | string | Display name of the city |
| `state` | string | State name |
| `country` | string | Country name |
| `areas` | array | List of area names (sorted alphabetically) |
| `total_areas` | number | Total number of areas |

---

### Adding New Cities

To add a new city:

1. Add city entry to `public/data/locations/cities.json`
2. Create a new file `public/data/locations/{city_slug}.json` with areas

**Example: Adding Mumbai**

1. Update `cities.json`:
```json
{
  "cities": [
    {
      "slug": "ahmedabad",
      "name": "Ahmedabad",
      "state": "Gujarat",
      "country": "India"
    },
    {
      "slug": "mumbai",
      "name": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    }
  ],
  "total": 2,
  "last_updated": "2025-01-15"
}
```

2. Create `mumbai.json`:
```json
{
  "slug": "mumbai",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "areas": [
    "Andheri East",
    "Andheri West",
    "Bandra East",
    "Bandra West",
    "...more areas..."
  ],
  "total_areas": 50
}
```

---

## API Endpoints

---

## 1. Auth APIs

### 1.1 Login / Register

Login existing user or register new user with Firebase token.

**Endpoint:** `POST /auth/login`  
**Auth Required:** No

**Request Body:**
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs...",
  "fcm_token": "fcm_device_token_here"
}
```

| Field            | Type   | Required | Description                                          |
|------------------|--------|----------|------------------------------------------------------|
| `firebase_token` | string | Yes      | Firebase ID token from Flutter (contains phone number) |
| `fcm_token`      | string | No       | FCM device token for push notifications              |

**Validations:**
- `firebase_token`: Required, must be valid Firebase ID token
- `fcm_token`: Optional, string

**Logic:**
1. Validate request body (middleware)
2. Verify Firebase ID token using Firebase Admin SDK
3. Extract phone number from decoded token
4. Find user by phone number in database
5. If user not found → Create new user with phone number and FCM token
6. If user found → Update FCM token if provided
7. Check if user is active (not suspended)
8. Generate JWT token with user data
9. Build onboarding status (role_selected, kyc_submitted, kyc_status)
10. Return token, user data, and onboarding status

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "phone_number": "+919876543210",
      "full_name": null,
      "address": null,
      "agency_name": null,
      "profile_image_url": null,
      "dob": null,
      "role": null,
      "kyc_status": "PENDING",
      "is_active": true,
      "created_at": "2026-01-03T10:00:00.000Z"
    },
    "onboarding": {
      "role_selected": false,
      "kyc_submitted": false,
      "kyc_status": "PENDING"
    }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Firebase token is required | Missing firebase_token |
| 401 | Invalid Firebase token | Token verification failed |
| 403 | Account suspended | User is_active = false |

---

### 1.2 Select Role

Select user role after first login.

**Endpoint:** `POST /auth/select-role`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "role": "DRIVER"
}
```

| Field  | Type   | Required | Description                    |
|--------|--------|----------|--------------------------------|
| `role` | string | Yes      | Either `DRIVER` or `OPERATOR`  |

**Validations:**
- `role`: Required, must be exactly "DRIVER" or "OPERATOR"

**Logic:**
1. Verify JWT token (authMiddleware)
2. Validate request body (middleware)
3. Find role by code in roles table
4. Update user's role_id
5. Return updated user data

**Success Response (200):**
```json
{
  "success": true,
  "message": "Role selected successfully",
  "data": {
    "user": {
      "id": "1",
      "phone_number": "+919876543210",
      "full_name": null,
      "role": "DRIVER",
      "kyc_status": "PENDING",
      "is_active": true,
      "created_at": "2026-01-03T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Role must be either DRIVER or OPERATOR | Invalid role value |
| 401 | Unauthorized | Missing/invalid token |

---

### 1.3 Logout

Logout user and clear FCM token.

**Endpoint:** `POST /auth/logout`  
**Auth Required:** Yes

**Logic:**
1. Verify JWT token (authMiddleware)
2. Clear FCM token from user record (set to null)
3. Return success (client should discard JWT token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. User APIs

### 2.1 Get My Profile

Get current logged-in user's profile.

**Endpoint:** `GET /users/me`  
**Auth Required:** Yes

**Logic:**
1. Verify JWT token (authMiddleware)
2. Extract userId from token
3. Find user by ID with role association
4. Return formatted user profile

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "1",
    "phone_number": "+919876543210",
    "full_name": "John Doe",
    "address": "123 Main Street, City",
    "agency_name": "ABC Travels",
    "profile_image_url": "https://s3.../profiles/abc.jpg",
    "dob": "1990-01-15",
    "role": "DRIVER",
    "kyc_status": "APPROVED",
    "is_active": true,
    "created_at": "2026-01-03T10:00:00.000Z"
  }
}
```

---

### 2.2 Update My Profile

Update current user's profile information and/or profile image.

**Endpoint:** `PUT /users/me`  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

**Request Body:**

| Field           | Type   | Required | Description                      |
|-----------------|--------|----------|----------------------------------|
| `full_name`     | string | No       | Max 100 characters               |
| `address`       | string | No       | Max 500 characters               |
| `agency_name`   | string | No       | Max 150 characters               |
| `dob`           | string | No       | Date of birth (max 15 chars)     |
| `profile_image` | file   | No       | JPEG, JPG, or PNG (max 5MB)      |

**Validations:**
- `full_name`: Max 100 characters
- `address`: Max 500 characters
- `agency_name`: Max 150 characters
- `dob`: Max 15 characters
- `profile_image`: Only JPEG/JPG/PNG, max 5MB

**Logic:**
1. Verify JWT token (authMiddleware)
2. Parse multipart form data (multer)
3. Validate profile image if provided
4. Validate text fields
5. Find user by ID
6. Build update data from allowed fields
7. If profile image provided → Delete old from S3, upload new
8. Update user record
9. Return updated profile

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "1",
    "phone_number": "+919876543210",
    "full_name": "John Doe",
    "address": "123 Main Street, City",
    "profile_image_url": "https://s3.../profiles/abc123.jpg",
    "role": "DRIVER",
    "kyc_status": "PENDING",
    "is_active": true
  }
}
```

---

### 2.3 Get User Profile by ID

Get public profile of any user by their ID.

**Endpoint:** `GET /users/profile/:id`  
**Auth Required:** Yes

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID |

**Logic:**
1. Verify JWT token (authMiddleware)
2. Extract user ID from URL params
3. Find user by ID with limited fields
4. Return public profile data

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "5",
    "full_name": "Jane Smith",
    "agency_name": "XYZ Rentals",
    "profile_image_url": "https://s3.../profiles/xyz.jpg",
    "phone_number": "+919876543210",
    "kyc_verified": true
  }
}
```

---

## 3. KYC APIs

### 3.1 Get KYC Status

Get current KYC status and submitted documents.

**Endpoint:** `GET /kyc/status`  
**Auth Required:** Yes

**Logic:**
1. Verify JWT token (authMiddleware)
2. Extract userId from token
3. Find user with KYC fields
4. Find all documents for user from user_identity table
5. Return KYC status, personal info, and documents list

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
      "profile_image_url": "https://s3.../profiles/abc.jpg"
    },
    "documents": [
      {
        "id": 1,
        "document_type": "AADHAAR",
        "front_doc_url": "https://s3.../documents/front.jpg",
        "back_doc_url": "https://s3.../documents/back.jpg",
        "status": "APPROVED",
        "reject_reason": null
      },
      {
        "id": 2,
        "document_type": "DRIVING_LICENSE",
        "front_doc_url": "https://s3.../documents/dl_front.jpg",
        "back_doc_url": "https://s3.../documents/dl_back.jpg",
        "status": "REJECTED",
        "reject_reason": "Document is not clear"
      }
    ]
  }
}
```

---

### 3.2 Submit KYC

Submit or update KYC information (personal info + documents).

**Endpoint:** `POST /kyc/submit`  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

**Request Body:**

| Field           | Type   | Required | Description                    |
|-----------------|--------|----------|--------------------------------|
| `full_name`     | string | No*      | Max 100 characters             |
| `address`       | string | No*      | Max 500 characters             |
| `agency_name`   | string | No       | Max 150 characters             |
| `profile_image` | file   | No       | JPEG, JPG, PNG (max 5MB)       |
| `documents`     | array  | No*      | Array of document objects      |

*Required for initial submission, optional for resubmission

**Document Fields:**

| Field                           | Type   | Required | Description                              |
|---------------------------------|--------|----------|------------------------------------------|
| `documents[i][document_type]`   | string | Yes      | `AADHAAR`, `DRIVING_LICENSE`, `PAN_CARD` |
| `documents[i][document_number]` | string | Yes      | Document number                          |
| `documents[i][front_doc]`       | file   | Yes      | Front image (max 5MB)                    |
| `documents[i][back_doc]`        | file   | No       | Back image (max 5MB)                     |

**Logic:**
1. Verify JWT token (authMiddleware)
2. Parse multipart form data (multer)
3. Validate request body and files
4. Find user by ID
5. Update personal info if provided
6. Upload profile image if provided
7. Process each document:
   - Hash document number (SHA-256)
   - Check for duplicates
   - Upload images to S3
   - Create/update document record
8. Update user's kyc_status to 'PENDING'
9. Return success with summary

**Success Response (200):**
```json
{
  "success": true,
  "message": "KYC submitted for verification",
  "data": {
    "kyc_status": "PENDING",
    "personal_info_updated": true,
    "documents_processed": 2,
    "message": "KYC submitted for verification"
  }
}
```

---

## 4. Car APIs

### 4.1 List Cars

List cars with filters and pagination.

**Endpoint:** `GET /cars`  
**Auth Required:** Yes  
**KYC Required:** Yes

**Behavior by Role:**
- **DRIVER**: Shows only active cars from all operators
- **OPERATOR**: Shows only their own cars (active + inactive)

**Query Parameters:**

| Parameter      | Type    | Required | Description                                    |
|----------------|---------|----------|------------------------------------------------|
| `search`       | string  | No       | Search by car name                             |
| `category`     | string  | No       | `TAXI` / `PRIVATE`                             |
| `fuel_type`    | string  | No       | `PETROL` / `DIESEL` / `CNG` / `ELECTRIC`       |
| `transmission` | string  | No       | `MANUAL` / `AUTOMATIC`                         |
| `rate_type`    | string  | No       | `12HR` / `24HR`                                |
| `min_price`    | number  | No       | Minimum rate amount                            |
| `max_price`    | number  | No       | Maximum rate amount                            |
| `purposes`     | string  | No       | Comma-separated: `SELF_DRIVE,CORPORATE`        |
| `is_active`    | boolean | No       | For operators only (filter by status)          |
| `page`         | number  | No       | Page number (default: 1)                       |
| `limit`        | number  | No       | Items per page (default: 10)                   |

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Check user role
4. For DRIVER: Filter where is_active = true
5. For OPERATOR: Filter where operator_id = userId
6. Apply search and filters
7. Apply pagination
8. Return cars with FULL details (all images, operator info)

**Note:** Returns full car details in listing so Flutter can navigate to detail page instantly without additional API call.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cars fetched successfully",
  "data": [
    {
      "id": "1",
      "car_name": "Swift Dzire",
      "category": "TAXI",
      "transmission": "MANUAL",
      "fuel_type": "PETROL",
      "rate_type": "24HR",
      "rate_amount": 1200.00,
      "deposit_amount": 5000.00,
      "purposes": ["SELF_DRIVE", "CORPORATE"],
      "instructions": "Please return with full tank",
      "rc_front_url": "https://s3.../cars/rc/front.jpg",
      "rc_back_url": "https://s3.../cars/rc/back.jpg",
      "is_active": true,
      "images": [
        {
          "id": 1,
          "image_url": "https://s3.../cars/images/1.jpg",
          "is_primary": true
        },
        {
          "id": 2,
          "image_url": "https://s3.../cars/images/2.jpg",
          "is_primary": false
        }
      ],
      "operator": {
        "id": "5",
        "full_name": "Jane Smith",
        "agency_name": "XYZ Rentals",
        "profile_image_url": "https://s3.../profiles/xyz.jpg",
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
    "total": 25,
    "total_pages": 3
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |

---

### 4.2 Get Car by ID

Get car details by ID.

**Endpoint:** `GET /cars/:id`  
**Auth Required:** Yes  
**KYC Required:** Yes

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Car ID |

**Behavior by Role:**
- **DRIVER**: Can view active cars only
- **OPERATOR**: Can view their own cars only

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Find car by ID with images and operator info
4. For DRIVER: Check car is active
5. For OPERATOR: Check car belongs to them
6. Return full car details

**Success Response (200):**
```json
{
  "success": true,
  "message": "Car fetched successfully",
  "data": {
    "id": "1",
    "car_name": "Swift Dzire",
    "category": "TAXI",
    "transmission": "MANUAL",
    "fuel_type": "PETROL",
    "rate_type": "24HR",
    "rate_amount": 1200.00,
    "deposit_amount": 5000.00,
    "purposes": ["SELF_DRIVE", "CORPORATE"],
    "instructions": "Please return with full tank",
    "rc_front_url": "https://s3.../cars/rc/front.jpg",
    "rc_back_url": "https://s3.../cars/rc/back.jpg",
    "is_active": true,
    "images": [
      {
        "id": 1,
        "image_url": "https://s3.../cars/images/1.jpg",
        "is_primary": true
      },
      {
        "id": 2,
        "image_url": "https://s3.../cars/images/2.jpg",
        "is_primary": false
      }
    ],
    "operator": {
      "id": "5",
      "full_name": "Jane Smith",
      "agency_name": "XYZ Rentals",
      "profile_image_url": "https://s3.../profiles/xyz.jpg",
      "phone_number": "+919876543210",
      "kyc_verified": true
    },
    "created_at": "2026-01-03T10:00:00.000Z",
    "updated_at": "2026-01-03T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |
| 403 | You do not have permission | Operator viewing other's car |
| 404 | Car not found | Invalid ID or inactive car for driver |

---

### 4.3 Create Car

Create a new car listing (OPERATOR only).

**Endpoint:** `POST /cars`  
**Auth Required:** Yes  
**KYC Required:** Yes  
**Role Required:** OPERATOR  
**Content-Type:** `multipart/form-data`

**Request Body:**

| Field                 | Type    | Required | Description                                              |
|-----------------------|---------|----------|----------------------------------------------------------|
| `car_name`            | string  | Yes      | Car name/model (max 100 chars)                           |
| `category`            | string  | Yes      | `TAXI` / `PRIVATE`                                       |
| `transmission`        | string  | Yes      | `MANUAL` / `AUTOMATIC`                                   |
| `fuel_type`           | string  | Yes      | `PETROL` / `DIESEL` / `CNG` / `ELECTRIC`                 |
| `rate_type`           | string  | Yes      | `12HR` / `24HR`                                          |
| `rate_amount`         | number  | Yes      | Rate amount (positive)                                   |
| `deposit_amount`      | number  | No       | Deposit amount                                           |
| `purposes`            | string  | No       | Comma-separated: `SELF_DRIVE,CORPORATE,ONLY_VERIFIED_DRIVER` |
| `instructions`        | string  | No       | Instructions for drivers (max 1000 chars)                |
| `is_active`           | boolean | No       | Active status (default: true)                            |
| `rc_front`            | file    | Yes      | RC front image (max 5MB)                                 |
| `rc_back`             | file    | Yes      | RC back image (max 5MB)                                  |
| `images`              | files   | No       | Car images (max 5 files, each max 5MB)                   |
| `primary_image_index` | number  | No       | Index of primary image (0-4)                             |

**Validations:**
- `car_name`: Required, max 100 characters
- `category`: Required, must be TAXI or PRIVATE
- `transmission`: Required, must be MANUAL or AUTOMATIC
- `fuel_type`: Required, must be PETROL, DIESEL, CNG, or ELECTRIC
- `rate_type`: Required, must be 12HR or 24HR
- `rate_amount`: Required, must be positive number
- `rc_front`: Required, JPEG/JPG/PNG/PDF, max 5MB
- `rc_back`: Required, JPEG/JPG/PNG/PDF, max 5MB
- `images`: Optional, max 5 files, each JPEG/JPG/PNG/PDF, max 5MB

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Verify role is OPERATOR (requireRole)
4. Parse multipart form data (multer)
5. Validate request body
6. Validate RC documents exist
7. Upload RC front and back to S3
8. Parse purposes from comma-separated string
9. Create car record
10. Upload car images to S3
11. Create car image records with primary flag
12. Return created car

**Success Response (201):**
```json
{
  "success": true,
  "message": "Car created successfully",
  "data": {
    "id": "1",
    "car_name": "Swift Dzire",
    "category": "TAXI",
    "transmission": "MANUAL",
    "fuel_type": "PETROL",
    "rate_type": "24HR",
    "rate_amount": 1200.00,
    "deposit_amount": 5000.00,
    "purposes": ["SELF_DRIVE", "CORPORATE"],
    "instructions": "Please return with full tank",
    "rc_front_url": "https://s3.../cars/rc/front.jpg",
    "rc_back_url": "https://s3.../cars/rc/back.jpg",
    "is_active": true,
    "images": [
      {
        "id": 1,
        "image_url": "https://s3.../cars/images/1.jpg",
        "is_primary": true
      }
    ],
    "operator": { ... },
    "created_at": "2026-01-03T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Car name is required | Missing car_name |
| 400 | Category must be either TAXI or PRIVATE | Invalid category |
| 400 | RC front image is required | Missing rc_front |
| 400 | Maximum 5 car images allowed | Too many images |
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |
| 403 | Access denied | Not an operator |

---

### 4.4 Update Car

Update car details (OPERATOR only, own cars).

**Endpoint:** `PUT /cars/:id`  
**Auth Required:** Yes  
**KYC Required:** Yes  
**Role Required:** OPERATOR  
**Content-Type:** `multipart/form-data`

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Car ID |

**Request Body:**

| Field                 | Type    | Required | Description                              |
|-----------------------|---------|----------|------------------------------------------|
| `car_name`            | string  | No       | Car name/model                           |
| `category`            | string  | No       | `TAXI` / `PRIVATE`                       |
| `transmission`        | string  | No       | `MANUAL` / `AUTOMATIC`                   |
| `fuel_type`           | string  | No       | `PETROL` / `DIESEL` / `CNG` / `ELECTRIC` |
| `rate_type`           | string  | No       | `12HR` / `24HR`                          |
| `rate_amount`         | number  | No       | Rate amount                              |
| `deposit_amount`      | number  | No       | Deposit amount                           |
| `purposes`            | string  | No       | Comma-separated purposes                 |
| `instructions`        | string  | No       | Instructions for drivers                 |
| `is_active`           | boolean | No       | Active/Inactive status                   |
| `rc_front`            | file    | No       | New RC front image                       |
| `rc_back`             | file    | No       | New RC back image                        |
| `images`              | files   | No       | New car images (max 5)                   |
| `primary_image_index` | number  | No       | Index of primary image                   |
| `remove_images`       | string  | No       | Comma-separated image IDs to remove      |

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Verify role is OPERATOR (requireRole)
4. Parse multipart form data (multer)
5. Validate request body
6. Find car and verify ownership
7. Update RC documents if provided (delete old, upload new)
8. Update car fields
9. Handle image removal (delete from S3 and DB)
10. Upload new images if provided
11. Update primary image flag
12. Return updated car

**Success Response (200):**
```json
{
  "success": true,
  "message": "Car updated successfully",
  "data": {
    "id": "1",
    "car_name": "Swift Dzire",
    "category": "TAXI",
    "is_active": false,
    "images": [ ... ],
    "operator": { ... },
    "updated_at": "2026-01-03T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Category must be either TAXI or PRIVATE | Invalid category |
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |
| 403 | Access denied | Not an operator |
| 403 | You do not have permission | Not owner of car |
| 404 | Car not found | Invalid car ID |

---

### 4.5 Delete Car

Delete a car listing (OPERATOR only, own cars).

**Endpoint:** `DELETE /cars/:id`  
**Auth Required:** Yes  
**KYC Required:** Yes  
**Role Required:** OPERATOR

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Car ID |

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Verify role is OPERATOR (requireRole)
4. Find car and verify ownership
5. Delete all car images from S3
6. Delete RC documents from S3
7. Delete car record (cascade deletes images)
8. Return success

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
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |
| 403 | Access denied | Not an operator |
| 403 | You do not have permission | Not owner of car |
| 404 | Car not found | Invalid car ID |

---

## 5. Booking Request APIs

### 5.1 Create Booking Request

Create a new booking request for a car (DRIVER only).

**Endpoint:** `POST /booking-requests`  
**Auth Required:** Yes  
**KYC Required:** Yes  
**Role Required:** DRIVER

**Request Body:**

| Field     | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `car_id`  | number | Yes      | ID of the car to request           |
| `message` | string | No       | Message to operator (max 1000 chars) |

**Validations:**
- `car_id`: Required, must be a valid car ID
- `message`: Optional, max 1000 characters
- Car must be active
- Cannot request your own car
- Cannot have duplicate pending request for same car

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Verify role is DRIVER (requireRole)
4. Validate request body
5. Find car and verify it's active
6. Check driver is not the car owner
7. Check for existing pending request
8. Create booking request with status PENDING
9. Return created request with full details

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking request created successfully",
  "data": {
    "id": "1",
    "message": "I need this car for a wedding event",
    "status": "PENDING",
    "reject_reason": null,
    "created_at": "2026-01-03T10:00:00.000Z",
    "updated_at": "2026-01-03T10:00:00.000Z",
    "car": {
      "id": "1",
      "car_name": "Swift Dzire",
      "category": "TAXI",
      "transmission": "MANUAL",
      "fuel_type": "PETROL",
      "rate_type": "24HR",
      "rate_amount": 1200.00,
      "deposit_amount": 5000.00,
      "purposes": ["SELF_DRIVE", "CORPORATE"],
      "instructions": "Please return with full tank",
      "is_active": true,
      "images": [
        {
          "id": 1,
          "image_url": "https://s3.../cars/images/1.jpg",
          "is_primary": true
        }
      ]
    },
    "operator": {
      "id": "5",
      "full_name": "Jane Smith",
      "agency_name": "XYZ Rentals",
      "phone_number": "+919876543210",
      "profile_image_url": "https://s3.../profiles/xyz.jpg",
      "kyc_verified": true
    }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Car ID is required | Missing car_id |
| 400 | Car is not available for booking | Car is inactive |
| 400 | You cannot book your own car | Driver owns the car |
| 400 | You already have a pending request for this car | Duplicate request |
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |
| 403 | Access denied | Not a driver |
| 404 | Car not found | Invalid car ID |

---

### 5.2 List Booking Requests

List booking requests with filters and pagination. Returns FULL details.

**Endpoint:** `GET /booking-requests`  
**Auth Required:** Yes  
**KYC Required:** Yes

**Behavior by Role:**
- **DRIVER**: Shows their own requests with car + operator details
- **OPERATOR**: Shows requests for their cars with car + driver details

**Query Parameters:**

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `status`  | string | No       | `PENDING` / `ACCEPTED` / `REJECTED` / `ALL` (default: ALL) |
| `car_id`  | number | No       | Filter by car ID (for operators only)            |
| `page`    | number | No       | Page number (default: 1)                         |
| `limit`   | number | No       | Items per page (default: 10, max: 50)            |

**Note:** Returns full details in listing so Flutter can navigate to detail page instantly without additional API call.

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Check user role
4. For DRIVER: Filter where driver_id = userId
5. For OPERATOR: Filter where operator_id = userId
6. Apply status filter
7. Apply car_id filter (operators only)
8. Apply pagination
9. Return requests with FULL details

**Success Response for DRIVER (200):**
```json
{
  "success": true,
  "message": "Booking requests fetched successfully",
  "data": [
    {
      "id": "1",
      "message": "I need this car for a wedding event",
      "status": "PENDING",
      "reject_reason": null,
      "created_at": "2026-01-03T10:00:00.000Z",
      "updated_at": "2026-01-03T10:00:00.000Z",
      "car": {
        "id": "1",
        "car_name": "Swift Dzire",
        "category": "TAXI",
        "transmission": "MANUAL",
        "fuel_type": "PETROL",
        "rate_type": "24HR",
        "rate_amount": 1200.00,
        "deposit_amount": 5000.00,
        "purposes": ["SELF_DRIVE", "CORPORATE"],
        "instructions": "Please return with full tank",
        "is_active": true,
        "images": [
          {
            "id": 1,
            "image_url": "https://s3.../cars/images/1.jpg",
            "is_primary": true
          }
        ]
      },
      "operator": {
        "id": "5",
        "full_name": "Jane Smith",
        "agency_name": "XYZ Rentals",
        "phone_number": "+919876543210",
        "profile_image_url": "https://s3.../profiles/xyz.jpg",
        "kyc_verified": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "total_pages": 1
  }
}
```

**Success Response for OPERATOR (200):**
```json
{
  "success": true,
  "message": "Booking requests fetched successfully",
  "data": [
    {
      "id": "1",
      "message": "I need this car for a wedding event",
      "status": "PENDING",
      "reject_reason": null,
      "created_at": "2026-01-03T10:00:00.000Z",
      "updated_at": "2026-01-03T10:00:00.000Z",
      "car": {
        "id": "1",
        "car_name": "Swift Dzire",
        "category": "TAXI",
        "transmission": "MANUAL",
        "fuel_type": "PETROL",
        "rate_type": "24HR",
        "rate_amount": 1200.00,
        "deposit_amount": 5000.00,
        "purposes": ["SELF_DRIVE", "CORPORATE"],
        "instructions": "Please return with full tank",
        "is_active": true,
        "images": [
          {
            "id": 1,
            "image_url": "https://s3.../cars/images/1.jpg",
            "is_primary": true
          }
        ]
      },
      "driver": {
        "id": "3",
        "full_name": "John Doe",
        "phone_number": "+919876543210",
        "profile_image_url": "https://s3.../profiles/john.jpg",
        "kyc_verified": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "total_pages": 1
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |

---

### 5.3 Update Booking Request Status

Accept or reject a booking request (OPERATOR only).

**Endpoint:** `PUT /booking-requests/:id/status`  
**Auth Required:** Yes  
**KYC Required:** Yes  
**Role Required:** OPERATOR

**URL Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `id`      | number | Booking request ID |

**Request Body:**

| Field           | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `status`        | string | Yes      | `ACCEPTED` or `REJECTED`                 |
| `reject_reason` | string | No       | Reason for rejection (max 500 chars)     |

**Validations:**
- `status`: Required, must be ACCEPTED or REJECTED
- `reject_reason`: Optional, only allowed when status is REJECTED
- Only operator who owns the car can update
- Only PENDING requests can be updated

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Verify role is OPERATOR (requireRole)
4. Validate request body
5. Find booking request
6. Verify operator owns the car
7. Verify request is PENDING
8. Update status and reject_reason
9. Return updated request with full details

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking request accepted successfully",
  "data": {
    "id": "1",
    "message": "I need this car for a wedding event",
    "status": "ACCEPTED",
    "reject_reason": null,
    "created_at": "2026-01-03T10:00:00.000Z",
    "updated_at": "2026-01-03T11:00:00.000Z",
    "car": { ... },
    "driver": { ... }
  }
}
```

**Rejection Response (200):**
```json
{
  "success": true,
  "message": "Booking request rejected successfully",
  "data": {
    "id": "1",
    "message": "I need this car for a wedding event",
    "status": "REJECTED",
    "reject_reason": "Car is not available for this period",
    "created_at": "2026-01-03T10:00:00.000Z",
    "updated_at": "2026-01-03T11:00:00.000Z",
    "car": { ... },
    "driver": { ... }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Status is required | Missing status |
| 400 | Status must be either ACCEPTED or REJECTED | Invalid status |
| 400 | Cannot update request. Current status is ACCEPTED | Already processed |
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |
| 403 | Access denied | Not an operator |
| 403 | You do not have permission to update this request | Not owner of car |
| 404 | Booking request not found | Invalid request ID |

---

### 5.4 Cancel Booking Request

Cancel a pending booking request (DRIVER only).

**Endpoint:** `DELETE /booking-requests/:id`  
**Auth Required:** Yes  
**KYC Required:** Yes  
**Role Required:** DRIVER

**URL Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `id`      | number | Booking request ID |

**Validations:**
- Only driver who created the request can cancel
- Only PENDING requests can be cancelled

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Verify role is DRIVER (requireRole)
4. Find booking request
5. Verify driver owns the request
6. Verify request is PENDING
7. Delete the request
8. Return success

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
| 401 | Unauthorized | Missing/invalid token |
| 403 | KYC verification required | KYC not approved |
| 403 | Access denied | Not a driver |
| 403 | You do not have permission to cancel this request | Not owner of request |
| 404 | Booking request not found | Invalid request ID |

---

### 5.5 Get Pending Request Count

Get count of pending requests for current driver.

**Endpoint:** `GET /booking-requests/pending-count`  
**Auth Required:** Yes  
**KYC Required:** Yes  
**Role Required:** DRIVER

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify KYC approved (requireKyc)
3. Verify role is DRIVER (requireRole)
4. Count pending requests for driver
5. Return count

**Success Response (200):**
```json
{
  "success": true,
  "message": "Pending request count fetched successfully",
  "data": {
    "pending_count": 3
  }
}
```

---

## Database Schema

### Tables Overview

```
┌─────────────────┐     ┌─────────────────┐
│     roles       │     │     users       │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ role_id (FK)    │
│ code            │     │ id (PK)         │
│ name            │     │ phone_number    │
│ created_at      │     │ full_name       │
└─────────────────┘     │ address         │
                        │ agency_name     │
                        │ profile_image   │
                        │ dob             │
                        │ fcm_token       │
                        │ is_active       │
                        │ kyc_status      │
                        │ kyc_reject_reason│
                        │ created_at      │
                        │ updated_at      │
                        │ deleted_at      │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ user_identity   │   │     cars        │   │booking_requests │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ id (PK)         │   │ id (PK)         │   │ id (PK)         │
│ user_id (FK)    │   │ operator_id(FK) │   │ car_id (FK)     │
│ document_type   │   │ car_name        │   │ driver_id (FK)  │
│ document_hash   │   │ category        │   │ operator_id(FK) │
│ front_doc_url   │   │ transmission    │   │ message         │
│ back_doc_url    │   │ fuel_type       │   │ status          │
│ status          │   │ rate_type       │   │ reject_reason   │
│ reject_reason   │   │ rate_amount     │   │ created_at      │
│ created_at      │   │ deposit_amount  │   │ updated_at      │
│ updated_at      │   │ purposes        │   └─────────────────┘
└─────────────────┘   │ instructions    │
                      │ rc_front_url    │
                      │ rc_back_url     │
                      │ is_active       │
                      │ created_at      │
                      │ updated_at      │
                      └────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │   car_images    │
                      ├─────────────────┤
                      │ id (PK)         │
                      │ car_id (FK)     │
                      │ image_url       │
                      │ is_primary      │
                      │ created_at      │
                      └─────────────────┘
```

### Cars Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| operator_id | BIGINT | FK to users |
| car_name | VARCHAR(100) | Car name/model |
| category | VARCHAR(20) | TAXI / PRIVATE |
| transmission | VARCHAR(20) | MANUAL / AUTOMATIC |
| fuel_type | VARCHAR(20) | PETROL / DIESEL / CNG / ELECTRIC |
| rate_type | VARCHAR(10) | 12HR / 24HR |
| rate_amount | DECIMAL(10,2) | Rate amount |
| deposit_amount | DECIMAL(10,2) | Deposit amount (nullable) |
| purposes | TEXT[] | Array of purposes |
| instructions | TEXT | Instructions for drivers |
| rc_front_url | TEXT | RC front image URL |
| rc_back_url | TEXT | RC back image URL |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### Car Images Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| car_id | BIGINT | FK to cars |
| image_url | TEXT | Image URL |
| is_primary | BOOLEAN | Primary image flag |
| created_at | TIMESTAMP | Creation time |

---

## Flow Diagrams

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      FLUTTER APP                              │
├──────────────────────────────────────────────────────────────┤
│  1. User enters phone number                                  │
│  2. Firebase sends OTP to phone                               │
│  3. User enters OTP                                           │
│  4. Firebase verifies OTP                                     │
│  5. Flutter gets Firebase ID Token + FCM Token                │
│  6. Flutter calls POST /auth/login                            │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    FLUTTER NAVIGATION                         │
├────────────────────────────────────���─────────────────────────┤
│  Check onboarding status:                                     │
│                                                               │
│  if (!role_selected)     → Role Selection Screen              │
│  else if (!kyc_submitted) → KYC Screen                        │
│  else if (kyc_status == 'PENDING')  → KYC Pending Screen      │
│  else if (kyc_status == 'REJECTED') → KYC Rejected Screen     │
│  else → Dashboard                                             │
└──────────────────────────────────────────────────────────────┘
```

### Car Listing Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    DRIVER FLOW                                │
├──────────────────────────────────────────────────────────────┤
│  GET /cars                                                    │
│  • Shows only active cars from all operators                  │
│  • Can filter by category, fuel, transmission, price, etc.    │
│  • Returns paginated list with primary image                  │
│                                                               │
│  GET /cars/:id                                                │
│  • Shows full car details                                     │
│  • Shows operator contact info                                │
│  • Can only view active cars                                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   OPERATOR FLOW                               │
├──────────────────────────────────────────────────────────────┤
│  GET /cars                                                    │
│  • Shows only their own cars                                  │
│  • Shows both active and inactive cars                        │
│  • Can filter by is_active status                             │
│                                                               │
│  POST /cars                                                   │
│  • Create new car listing                                     │
│  • Upload RC documents and car images                         │
│                                                               │
│  PUT /cars/:id                                                │
│  • Update car details                                         │
│  • Change active/inactive status                              │
│  • Add/remove images                                          │
│                                                               │
│  DELETE /cars/:id                                             │
│  • Delete car listing                                         │
│  • Removes all images from S3                                 │
└──────────────────────────────────────────────────────────────┘
```

### Booking Request Flow

```
┌───────────────────���──────────────────────────────────────────┐
│                    DRIVER FLOW                                │
├──────────────────────────────────────────────────────────────┤
│  1. Browse cars (GET /cars)                                   │
│  2. View car details (GET /cars/:id)                          │
│  3. Create booking request (POST /booking-requests)           │
│     • Sends request to operator                               │
│     • Status: PENDING                                         │
│  4. Track requests (GET /booking-requests)                    │
│     • Filter by status: PENDING, ACCEPTED, REJECTED           │
│  5. Cancel pending request (DELETE /booking-requests/:id)     │
│     • Only PENDING requests can be cancelled                  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   OPERATOR FLOW                               │
├──────────────────────────────────────────────────────────────┤
│  1. View incoming requests (GET /booking-requests)            │
│     • Filter by status or car_id                              │
│     • See driver details + KYC verified badge                 │
│  2. Accept request (PUT /booking-requests/:id/status)         │
│     • status: "ACCEPTED"                                      │
│     • Driver gets notified                                    │
│  3. Reject request (PUT /booking-requests/:id/status)         │
│     • status: "REJECTED"                                      │
│     • reject_reason: "Car not available"                      │
│     • Driver gets notified with reason                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 REQUEST STATUS FLOW                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐    Accept    ┌──────────┐                       │
│  │ PENDING │─────────────►│ ACCEPTED │                       │
│  └────┬────┘              └──────────┘                       │
│       │                                                       │
│       │ Reject                                                │
│       │                                                       │
│       ▼                                                       │
│  ┌──────────┐                                                │
│  │ REJECTED │                                                │
│  └──────────┘                                                │
│                                                               │
│  Note: Only PENDING requests can be updated or cancelled      │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### All Endpoints Summary

| Method | Endpoint | Auth | KYC | Role | Description |
|--------|----------|------|-----|------|-------------|
| POST | `/auth/login` | No | No | - | Login/Register |
| POST | `/auth/select-role` | Yes | No | - | Select role |
| POST | `/auth/logout` | Yes | No | - | Logout |
| GET | `/users/me` | Yes | No | - | Get my profile |
| PUT | `/users/me` | Yes | No | - | Update my profile |
| GET | `/users/profile/:id` | Yes | No | - | Get user by ID |
| GET | `/kyc/status` | Yes | No | - | Get KYC status |
| POST | `/kyc/submit` | Yes | No | - | Submit/Update KYC |
| GET | `/cars` | Yes | Yes | - | List cars |
| GET | `/cars/:id` | Yes | Yes | - | Get car by ID |
| POST | `/cars` | Yes | Yes | OPERATOR | Create car |
| PUT | `/cars/:id` | Yes | Yes | OPERATOR | Update car |
| DELETE | `/cars/:id` | Yes | Yes | OPERATOR | Delete car |
| POST | `/booking-requests` | Yes | Yes | DRIVER | Create booking request |
| GET | `/booking-requests` | Yes | Yes | - | List booking requests |
| GET | `/booking-requests/pending-count` | Yes | Yes | DRIVER | Get pending count |
| PUT | `/booking-requests/:id/status` | Yes | Yes | OPERATOR | Accept/Reject request |
| DELETE | `/booking-requests/:id` | Yes | Yes | DRIVER | Cancel request |

**Total: 18 endpoints**

---

## Testing with cURL

### List Cars (Driver)
```bash
curl -X GET "http://localhost:3000/api/v1/cars?category=TAXI&fuel_type=PETROL&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List Cars (Operator - own cars)
```bash
curl -X GET "http://localhost:3000/api/v1/cars?is_active=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Car by ID
```bash
curl -X GET http://localhost:3000/api/v1/cars/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Car (Operator)
```bash
curl -X POST http://localhost:3000/api/v1/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "car_name=Swift Dzire" \
  -F "category=TAXI" \
  -F "transmission=MANUAL" \
  -F "fuel_type=PETROL" \
  -F "rate_type=24HR" \
  -F "rate_amount=1200" \
  -F "deposit_amount=5000" \
  -F "purposes=SELF_DRIVE,CORPORATE" \
  -F "instructions=Please return with full tank" \
  -F "rc_front=@/path/to/rc_front.jpg" \
  -F "rc_back=@/path/to/rc_back.jpg" \
  -F "images=@/path/to/car1.jpg" \
  -F "images=@/path/to/car2.jpg" \
  -F "primary_image_index=0"
```

### Update Car (Operator)
```bash
curl -X PUT http://localhost:3000/api/v1/cars/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "rate_amount=1500" \
  -F "is_active=false" \
  -F "remove_images=2,3"
```

### Delete Car (Operator)
```bash
curl -X DELETE http://localhost:3000/api/v1/cars/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Booking Request (Driver)
```bash
curl -X POST http://localhost:3000/api/v1/booking-requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"car_id": 1, "message": "I need this car for a wedding event"}'
```

### List Booking Requests
```bash
curl -X GET "http://localhost:3000/api/v1/booking-requests?status=PENDING&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Pending Request Count (Driver)
```bash
curl -X GET http://localhost:3000/api/v1/booking-requests/pending-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Accept Booking Request (Operator)
```bash
curl -X PUT http://localhost:3000/api/v1/booking-requests/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ACCEPTED"}'
```

### Reject Booking Request (Operator)
```bash
curl -X PUT http://localhost:3000/api/v1/booking-requests/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "REJECTED", "reject_reason": "Car is not available"}'
```

### Cancel Booking Request (Driver)
```bash
curl -X DELETE http://localhost:3000/api/v1/booking-requests/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Contact

For questions or issues, contact the development team.
