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
5. [API Endpoints](#api-endpoints)
   - [Auth APIs](#1-auth-apis)
   - [User APIs](#2-user-apis)
   - [KYC APIs](#3-kyc-apis)
6. [Database Schema](#database-schema)
7. [Flow Diagrams](#flow-diagrams)

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
  "data": { ... },
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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firebase_token | string | Yes | Firebase ID token from Flutter (contains phone number) |
| fcm_token | string | No | FCM device token for push notifications |

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

**Onboarding Logic:**
- `role_selected`: `true` if user has selected DRIVER or OPERATOR
- `kyc_submitted`: `true` if user has submitted personal info (full_name not null)
- `kyc_status`: PENDING | APPROVED | REJECTED

**Flutter Navigation Flow:**
```
if (!onboarding.role_selected) → Role Selection Screen
else if (!onboarding.kyc_submitted) → KYC Screen
else if (onboarding.kyc_status == 'PENDING') → KYC Pending Screen
else if (onboarding.kyc_status == 'REJECTED') → KYC Rejected Screen
else → Dashboard
```

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| role | string | Yes | Either `DRIVER` or `OPERATOR` |

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
      "address": null,
      "agency_name": null,
      "profile_image_url": null,
      "dob": null,
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

**Request Body:** None

**Validations:**
- Valid JWT token required

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

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |

---

## 2. User APIs

### 2.1 Get My Profile

Get current logged-in user's profile.

**Endpoint:** `GET /users/me`  
**Auth Required:** Yes

**Request Body:** None

**Validations:**
- Valid JWT token required

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

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 404 | User not found | User deleted |

---

### 2.2 Update My Profile

Update current user's profile information and/or profile image.

**Endpoint:** `PUT /users/me`  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| full_name | string | No | Max 100 characters |
| address | string | No | Max 500 characters |
| agency_name | string | No | Max 150 characters |
| dob | string | No | Date of birth (max 15 chars) |
| profile_image | file | No | JPEG, JPG, or PNG (max 5MB) |

**Validations:**
- `full_name`: Max 100 characters
- `address`: Max 500 characters
- `agency_name`: Max 150 characters
- `dob`: Max 15 characters
- `profile_image`: Only JPEG/JPG/PNG, max 5MB

**Logic:**
1. Verify JWT token (authMiddleware)
2. Parse multipart form data (multer)
3. Validate profile image if provided (validateProfileImage)
4. Validate text fields (validateUpdateProfile)
5. Find user by ID
6. Build update data from allowed fields
7. If profile image provided:
   - Delete old image from S3 (if exists)
   - Upload new image to S3
   - Add new URL to update data
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
    "agency_name": "ABC Travels",
    "profile_image_url": "https://s3.../profiles/abc123.jpg",
    "dob": "1990-01-15",
    "role": "DRIVER",
    "kyc_status": "PENDING",
    "is_active": true,
    "created_at": "2026-01-03T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Full name must be less than 100 characters | Validation failed |
| 400 | Only JPEG, JPG and PNG images are allowed | Invalid image type |
| 400 | Image size must be less than 5MB | Image too large |
| 401 | Unauthorized | Missing/invalid token |
| 404 | User not found | User deleted |

---

### 2.3 Get User Profile by ID

Get public profile of any user by their ID.

**Endpoint:** `GET /users/profile/:id`  
**Auth Required:** Yes

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | User ID |

**Validations:**
- Valid JWT token required
- `id`: Must be valid user ID

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

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 404 | User not found | Invalid user ID |

---

## 3. KYC APIs

### 3.1 Get KYC Status

Get current KYC status and submitted documents.

**Endpoint:** `GET /kyc/status`  
**Auth Required:** Yes

**Request Body:** None

**Validations:**
- Valid JWT token required

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

**KYC Status Values:**
- `PENDING` - Waiting for admin review
- `APPROVED` - KYC verified
- `REJECTED` - KYC rejected (check `kyc_reject_reason`)

**Document Status Values:**
- `PENDING` - Document under review
- `APPROVED` - Document verified
- `REJECTED` - Document rejected (check `reject_reason`)

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 404 | User not found | User deleted |

---

### 3.2 Submit KYC

Submit or update KYC information (personal info + documents).

This single API handles:
- **Initial submission**: Send all personal info and documents
- **Resubmission**: Send only the fields/documents that need to be updated

**Endpoint:** `POST /kyc/submit`  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| full_name | string | No* | Max 100 characters |
| address | string | No* | Max 500 characters |
| agency_name | string | No | Max 150 characters |
| profile_image | file | No | JPEG, JPG, PNG (max 5MB) |
| documents | array | No* | Array of document objects |

*Required for initial submission, optional for resubmission

**Document Object:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| documents[i][document_type] | string | Yes | AADHAAR, DRIVING_LICENSE, PAN_CARD |
| documents[i][document_number] | string | Yes | Document number |
| documents[i][front_doc] | file | Yes | Front image (JPEG, JPG, PNG, PDF, max 5MB) |
| documents[i][back_doc] | file | No | Back image (JPEG, JPG, PNG, PDF, max 5MB) |

**Example Request (Initial Submission):**
```
full_name: John Doe
address: 123 Main Street, City
agency_name: ABC Travels
profile_image: <file>

documents[0][document_type]: AADHAAR
documents[0][document_number]: 1234-5678-9012
documents[0][front_doc]: <file>
documents[0][back_doc]: <file>

documents[1][document_type]: DRIVING_LICENSE
documents[1][document_number]: DL-1234567890
documents[1][front_doc]: <file>
documents[1][back_doc]: <file>
```

**Example Request (Resubmission - only rejected document):**
```
documents[0][document_type]: DRIVING_LICENSE
documents[0][document_number]: DL-1234567890
documents[0][front_doc]: <file>
documents[0][back_doc]: <file>
```

**Validations:**
- `full_name`: Max 100 characters
- `address`: Max 500 characters
- `agency_name`: Max 150 characters
- `profile_image`: Only JPEG/JPG/PNG, max 5MB
- `documents[i][document_type]`: Required if document provided
- `documents[i][document_number]`: Required if document provided
- `documents[i][front_doc]`: Required if document provided, JPEG/JPG/PNG/PDF, max 5MB
- `documents[i][back_doc]`: Optional, JPEG/JPG/PNG/PDF, max 5MB

**Logic:**
1. Verify JWT token (authMiddleware)
2. Parse multipart form data (multer)
3. Validate request body (validateKycSubmit)
4. Validate document files (validateDocumentFiles)
5. Find user by ID
6. Update personal info if provided (full_name, address, agency_name)
7. Upload profile image if provided:
   - Delete old image from S3
   - Upload new image
8. Process each document:
   - Hash document number (SHA-256)
   - Check for duplicates (same hash, different user)
   - Upload front/back images to S3
   - Create new or update existing document record
9. Update user's kyc_status to 'PENDING'
10. Return success with summary

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

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Full name must be less than 100 characters | Validation failed |
| 400 | Document type is required | Missing document_type |
| 400 | Document number is required | Missing document_number |
| 400 | Front document image is required for AADHAAR | Missing front_doc |
| 400 | Only JPEG, JPG, PNG and PDF files are allowed | Invalid file type |
| 400 | File size must be less than 5MB | File too large |
| 400 | AADHAAR is already registered with another account | Duplicate document |
| 401 | Unauthorized | Missing/invalid token |
| 404 | User not found | User deleted |

**Document Types:**
- `AADHAAR` - Aadhaar Card
- `DRIVING_LICENSE` - Driving License
- `PAN_CARD` - PAN Card

**Note:** Document numbers are hashed (SHA-256) before storing for security.

---

## Database Schema

### Tables Overview

```
┌─────────────────┐     ┌─────────────────┐
│     roles       ���     │     users       │
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
                                 │ 1:N
                                 ▼
                        ┌─────────────────┐
                        │ user_identity   │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ user_id (FK)    │
                        │ document_type   │
                        │ document_hash   │
                        │ front_doc_url   │
                        │ back_doc_url    │
                        │ status          │
                        │ reject_reason   │
                        │ created_at      │
                        │ updated_at      │
                        └─────────────────┘
```

### Roles Table

| Column | Type | Description |
|--------|------|-------------|
| id | SMALLINT | Primary key |
| code | VARCHAR(30) | DRIVER, OPERATOR, ADMIN |
| name | VARCHAR(50) | Display name |
| created_at | TIMESTAMP | Creation time |

**Seed Data:**
| id | code | name |
|----|------|------|
| 1 | DRIVER | Driver |
| 2 | OPERATOR | Operator |
| 3 | ADMIN | Admin |

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| role_id | SMALLINT | FK to roles |
| phone_number | VARCHAR(15) | Unique, international format |
| full_name | VARCHAR(100) | User's full name |
| address | TEXT | Complete address |
| agency_name | VARCHAR(150) | Agency name (for operators) |
| profile_image_url | TEXT | S3 URL |
| dob | VARCHAR(15) | Date of birth |
| fcm_token | TEXT | Firebase Cloud Messaging token |
| is_active | BOOLEAN | Account status |
| kyc_status | VARCHAR(20) | PENDING, APPROVED, REJECTED |
| kyc_reject_reason | TEXT | Reason if rejected |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |
| deleted_at | TIMESTAMP | Soft delete time |

### User Identity Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| user_id | BIGINT | FK to users |
| document_type | VARCHAR(30) | AADHAAR, DRIVING_LICENSE, PAN_CARD |
| document_number_hash | TEXT | SHA-256 hash (unique) |
| front_doc_url | TEXT | S3 URL |
| back_doc_url | TEXT | S3 URL (nullable) |
| status | VARCHAR(20) | PENDING, APPROVED, REJECTED |
| reject_reason | TEXT | Reason if rejected |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

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
│                      BACKEND API                              │
├──────────────────────────────────────────────────────────────┤
│  1. Verify Firebase ID Token                                  │
│  2. Extract phone number from token                           │
│  3. Find or create user in database                           │
│  4. Save FCM token for push notifications                     │
│  5. Generate JWT access token                                 │
│  6. Return token + user data + onboarding status              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    FLUTTER NAVIGATION                         │
├──────────────────────────────────────────────────────────────┤
│  Check onboarding status:                                     │
│                                                               │
│  if (!role_selected)     → Role Selection Screen              │
│  else if (!kyc_submitted) → KYC Screen                        │
│  else if (kyc_status == 'PENDING')  → KYC Pending Screen      │
│  else if (kyc_status == 'REJECTED') → KYC Rejected Screen     │
│  else → Dashboard                                             │
└──────────────────────────────────────────────────────────────┘
```

### KYC Flow

```
┌─────────────────────────────────────────────────────────────┐
│  POST /kyc/submit (Initial Submission)                      │
├─────────────────────────────────────────────────────────────┤
│  Send all data in single request:                           │
│  • Personal info: full_name, address, agency_name           │
│  • Profile image                                            │
│  • Documents: Aadhaar (front + back)                        │
│  • Documents: Driving License (front + back)                │
│                                                             │
│  Backend:                                                   │
│  • Saves personal info to users table                       │
│  • Uploads images to S3                                     │
│  • Hashes document numbers (SHA-256)                        │
│  • Saves documents to user_identity table                   │
│  • Sets kyc_status = 'PENDING'                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Admin Review (Admin Panel)                                 │
├─────────────────────────────────────────────────────────────┤
│  • Admin views pending KYC requests                         │
│  • Admin reviews documents                                  │
│  • Admin approves or rejects each document                  │
│  • Admin approves or rejects overall KYC                    │
└─────────────────────────────────────��───────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
┌───────────────────────┐   ┌───────────────────────┐
│  If Approved          │   │  If Rejected          │
├───────────────────────┤   ├───────────────────────┤
│  kyc_status =         │   │  kyc_status =         │
│    'APPROVED'         │   │    'REJECTED'         │
│                       │   │  kyc_reject_reason =  │
│  User can access      │   │    'Reason...'        │
│  all features         │   │                       │
│                       │   │  User calls           │
│                       │   │  GET /kyc/status      │
│                       │   │  to see which docs    │
│                       │   │  were rejected        │
│                       │   │                       │
│                       │   │  User calls           │
│                       │   │  POST /kyc/submit     │
│                       │   │  with only rejected   │
│                       │   │  documents            │
└───────────────────────┘   └───────────────────────┘
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=safarmitra
DB_USER=postgres
DB_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=safarmitra-uploads
```

---

## Quick Reference

### All Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | Login/Register with Firebase token |
| POST | `/auth/select-role` | Yes | Select DRIVER or OPERATOR role |
| POST | `/auth/logout` | Yes | Logout user |
| GET | `/users/me` | Yes | Get current user profile |
| PUT | `/users/me` | Yes | Update profile (info + image) |
| GET | `/users/profile/:id` | Yes | Get public profile by ID |
| GET | `/kyc/status` | Yes | Get KYC status & documents |
| POST | `/kyc/submit` | Yes | Submit/Update KYC |

**Total: 8 endpoints**

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"firebase_token": "FIREBASE_ID_TOKEN", "fcm_token": "FCM_TOKEN"}'
```

### Select Role
```bash
curl -X POST http://localhost:3000/api/v1/auth/select-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"role": "DRIVER"}'
```

### Get My Profile
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update My Profile
```bash
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "full_name=John Doe" \
  -F "address=123 Main St" \
  -F "profile_image=@/path/to/image.jpg"
```

### Get KYC Status
```bash
curl -X GET http://localhost:3000/api/v1/kyc/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Submit KYC (Initial)
```bash
curl -X POST http://localhost:3000/api/v1/kyc/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "full_name=John Doe" \
  -F "address=123 Main Street" \
  -F "profile_image=@/path/to/profile.jpg" \
  -F "documents[0][document_type]=AADHAAR" \
  -F "documents[0][document_number]=1234-5678-9012" \
  -F "documents[0][front_doc]=@/path/to/aadhaar_front.jpg" \
  -F "documents[0][back_doc]=@/path/to/aadhaar_back.jpg" \
  -F "documents[1][document_type]=DRIVING_LICENSE" \
  -F "documents[1][document_number]=DL-1234567890" \
  -F "documents[1][front_doc]=@/path/to/dl_front.jpg" \
  -F "documents[1][back_doc]=@/path/to/dl_back.jpg"
```

### Resubmit KYC (Only rejected document)
```bash
curl -X POST http://localhost:3000/api/v1/kyc/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "documents[0][document_type]=DRIVING_LICENSE" \
  -F "documents[0][document_number]=DL-1234567890" \
  -F "documents[0][front_doc]=@/path/to/dl_front_new.jpg" \
  -F "documents[0][back_doc]=@/path/to/dl_back_new.jpg"
```

### Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Contact

For questions or issues, contact the development team.
