# Safar Mitra - Admin Panel API Documentation

**Version:** 2.0.0  
**Base URL:** `http://localhost:3000/api/v1`  
**Last Updated:** January 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [API Endpoints](#api-endpoints)
   - [Admin Auth APIs](#1-admin-auth-apis)
   - [Dashboard APIs](#2-dashboard-apis)
   - [User Management APIs](#3-user-management-apis)
   - [KYC Management APIs](#4-kyc-management-apis)
   - [Car Management APIs](#5-car-management-apis)
   - [Booking Request APIs](#6-booking-request-apis)
6. [Static Location Data](#static-location-data)
7. [Database Schema](#database-schema)
8. [Admin Workflows](#admin-workflows)
9. [Quick Reference](#quick-reference)

---

## Overview

The Admin Panel provides system administrators with tools to:

- **Monitor Platform** - View statistics and activity
- **Manage Users** - View, suspend, and activate users
- **Verify KYC** - Approve or reject user KYC documents
- **Manage Cars** - Monitor and remove car listings
- **Monitor Bookings** - View all booking requests

### Admin Role

Admins are users with `role = 'ADMIN'` in the database. They use **email/password authentication** (separate from regular user phone OTP flow).

---

## Authentication

### How Admin Authentication Works

Admin uses **email/password authentication** (separate from regular user phone OTP flow):

1. Admin logs in with email and password (`POST /auth/admin/login`)
2. Backend verifies credentials against database (bcrypt)
3. JWT token is issued with `roleCode: 'ADMIN'`
4. Admin endpoints check for ADMIN role via `requireAdmin` middleware

### Default Admin Credentials (MVP)

| Field | Value |
|-------|-------|
| Email | `admin@safarmitra.com` |
| Password | `Admin@123` |

> ⚠️ **Important:** Change the default password in production!

These can be configured via environment variables during migration:
```env
ADMIN_EMAIL=admin@safarmitra.com
ADMIN_PASSWORD=Admin@123
```

### Header Format

```
Authorization: Bearer <admin_jwt_token>
```

### JWT Token Payload (Admin)

```json
{
  "userId": "1",
  "phoneNumber": "+910000000000",
  "roleId": 3,
  "roleCode": "ADMIN",
  "kycStatus": "APPROVED",
  "fullName": "System Administrator",
  "agencyName": null,
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
| `FORBIDDEN` | 403 | Not an admin user |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ERROR` | 409 | Duplicate entry |
| `INTERNAL_ERROR` | 500 | Server error |

---

## API Endpoints

---

## 1. Admin Auth APIs

### 1.1 Admin Login

Authenticate admin with email and password.

**Endpoint:** `POST /auth/admin/login`  
**Auth Required:** No

**Middleware Chain:**
1. `validateAdminLogin` - Validates request body

**Request Body:**
```json
{
  "email": "admin@safarmitra.com",
  "password": "Admin@123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 6 characters |

**Service Logic (`authService.adminLogin`):**
1. Find user by email (case-insensitive)
2. Verify user exists and has ADMIN role
3. Verify password using bcrypt
4. Check if user is active (not suspended)
5. Generate JWT token
6. Return token and admin user data

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "email": "admin@safarmitra.com",
      "full_name": "System Administrator",
      "role": "ADMIN",
      "is_active": true,
      "created_at": "2026-01-24T05:37:49.641Z"
    }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Email is required | Missing email |
| 400 | Password must be at least 6 characters | Password too short |
| 401 | Invalid email or password | Wrong credentials or not admin |
| 403 | Your account has been suspended | Admin account is inactive |

---

### 1.2 Change Admin Password

Change the admin's password.

**Endpoint:** `PUT /auth/admin/change-password`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authMiddleware` - Verifies JWT token
2. `requireAdmin` - Checks user is admin
3. `validateChangePassword` - Validates request body

**Request Body:**
```json
{
  "current_password": "Admin@123",
  "new_password": "NewSecurePassword@456"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `current_password` | string | Yes | Current password |
| `new_password` | string | Yes | Min 6 characters |

**Service Logic (`authService.changeAdminPassword`):**
1. Find user by ID from JWT
2. Verify user is admin
3. Verify current password using bcrypt
4. Hash new password with bcrypt (10 rounds)
5. Update password in database

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Current password is required | Missing current_password |
| 400 | New password must be at least 6 characters | New password too short |
| 401 | Current password is incorrect | Wrong current password |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied | Not an admin |

---

## 2. Dashboard APIs

### 2.1 Get Dashboard Statistics

Get comprehensive platform statistics.

**Endpoint:** `GET /admin/dashboard/stats`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin

**Service Logic (`adminService.getDashboardStats`):**
1. Get role IDs for DRIVER and OPERATOR
2. Count users by role (total, drivers, operators)
3. Count new users today and this week
4. Count users by KYC status (not_submitted, pending, approved, rejected)
5. Count cars by status (total, active, inactive)
6. Count booking requests by status (total, pending, accepted, rejected, today)
7. Return aggregated statistics

**Success Response (200):**
```json
{
  "success": true,
  "message": "Dashboard stats fetched successfully",
  "data": {
    "users": {
      "total": 1500,
      "drivers": 1200,
      "operators": 300,
      "new_today": 15,
      "new_this_week": 85
    },
    "kyc": {
      "not_submitted": 100,
      "pending": 45,
      "approved": 1300,
      "rejected": 55
    },
    "cars": {
      "total": 250,
      "active": 200,
      "inactive": 50
    },
    "booking_requests": {
      "total": 5000,
      "pending": 120,
      "accepted": 4500,
      "rejected": 380,
      "today": 45
    }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied. Admin privileges required | Not an admin |

---

## 3. User Management APIs

### 3.1 List Users

List all users with filters and pagination.

**Endpoint:** `GET /admin/users`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin
3. `validateListUsers` - Validates query params

**Query Parameters:**

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `search` | string | No | - | Search by name or phone number |
| `role` | string | No | ALL | `DRIVER`, `OPERATOR`, `ALL` |
| `kyc_status` | string | No | ALL | `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED`, `ALL` |
| `is_active` | boolean | No | - | Filter by active status |
| `page` | number | No | 1 | Min 1 |
| `limit` | number | No | 10 | Min 1, Max 50 |

**Service Logic (`adminService.listUsers`):**
1. Get role IDs for DRIVER and OPERATOR
2. Build query filters:
   - Exclude ADMIN users
   - Apply role filter
   - Apply KYC status filter
   - Apply active status filter
   - Apply search filter (name or phone, case-insensitive)
3. Include role and documents count
4. Order by created_at DESC
5. Apply pagination
6. Return formatted users with meta

**Success Response (200):**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": [
    {
      "id": "1",
      "phone_number": "+919876543210",
      "full_name": "John Doe",
      "role": "DRIVER",
      "kyc_status": "PENDING",
      "is_active": true,
      "profile_image_url": "https://s3.../profiles/john.jpg",
      "documents_count": 2,
      "created_at": "2026-01-03T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1500,
    "total_pages": 150
  }
}
```

---

### 3.2 Get User Details

Get detailed user information including KYC documents and statistics.

**Endpoint:** `GET /admin/users/:id`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | User ID |

**Service Logic (`adminService.getUserById`):**
1. Find user by ID with role and documents
2. Get user statistics:
   - Cars count (for operators)
   - Booking requests sent
   - Booking requests received
3. Return formatted user with documents and stats

**Success Response (200):**
```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "id": "1",
    "phone_number": "+919876543210",
    "full_name": "John Doe",
    "address": "123 Main Street, Mumbai",
    "agency_name": null,
    "profile_image_url": "https://s3.../profiles/john.jpg",
    "dob": "1990-01-15",
    "role": "DRIVER",
    "kyc_status": "PENDING",
    "kyc_reject_reason": null,
    "is_active": true,
    "created_at": "2026-01-03T10:00:00.000Z",
    "documents": [
      {
        "id": 1,
        "document_type": "AADHAAR",
        "front_doc_url": "https://s3.../documents/aadhaar_front.jpg",
        "back_doc_url": "https://s3.../documents/aadhaar_back.jpg",
        "status": "PENDING",
        "reject_reason": null,
        "created_at": "2026-01-03T10:30:00.000Z"
      }
    ],
    "stats": {
      "cars_count": 0,
      "booking_requests_sent": 5,
      "booking_requests_received": 2
    }
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied | Not an admin |
| 404 | User not found | Invalid user ID |

---

### 3.3 Update User Status

Suspend or activate a user account.

**Endpoint:** `PUT /admin/users/:id/status`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin
3. `validateUpdateUserStatus` - Validates request body

**Request Body:**
```json
{
  "is_active": false,
  "reason": "Violation of terms of service"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `is_active` | boolean | Yes | `true` to activate, `false` to suspend |
| `reason` | string | No | Max 500 characters |

**Service Logic (`adminService.updateUserStatus`):**
1. Find user by ID
2. Check user is not an admin (can't modify admin status)
3. Update is_active status
4. Send push notification if status changed:
   - `notifyAccountActivated` if activated
   - `notifyAccountSuspended` if suspended
5. Return updated status

**Success Response (200):**
```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "id": "1",
    "is_active": false
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 403 | Cannot modify admin user status | Trying to suspend admin |
| 404 | User not found | Invalid user ID |

---

## 4. KYC Management APIs

### 4.1 List Pending KYC

List users with pending KYC verification.

**Endpoint:** `GET /admin/kyc/pending`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin
3. `validateListPendingKyc` - Validates query params

**Query Parameters:**

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `role` | string | No | ALL | `DRIVER`, `OPERATOR`, `ALL` |
| `page` | number | No | 1 | Min 1 |
| `limit` | number | No | 10 | Min 1, Max 50 |

**Service Logic (`adminService.listPendingKyc`):**
1. Build query with kyc_status = 'PENDING'
2. Exclude ADMIN users
3. Apply role filter
4. Include role and documents (id, type, status only)
5. Order by created_at ASC (oldest first for FIFO processing)
6. Apply pagination
7. Return formatted users with meta

**Success Response (200):**
```json
{
  "success": true,
  "message": "Pending KYC users fetched successfully",
  "data": [
    {
      "id": "1",
      "phone_number": "+919876543210",
      "full_name": "John Doe",
      "role": "DRIVER",
      "kyc_status": "PENDING",
      "profile_image_url": "https://s3.../profiles/john.jpg",
      "documents": [
        {
          "id": 1,
          "document_type": "AADHAAR",
          "status": "PENDING"
        }
      ],
      "submitted_at": "2026-01-03T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "total_pages": 5
  }
}
```

---

### 4.2 Update User KYC Status

Approve or reject a user's KYC verification.

**Endpoint:** `PUT /admin/users/:id/kyc`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin
3. `validateUpdateKycStatus` - Validates request body

**Request Body (Approve):**
```json
{
  "status": "APPROVED"
}
```

**Request Body (Reject):**
```json
{
  "status": "REJECTED",
  "reject_reason": "Document images are not clear. Please resubmit."
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | string | Yes | `APPROVED` or `REJECTED` |
| `reject_reason` | string | No* | Max 500 chars, *required when REJECTED |

**Service Logic (`adminService.updateUserKycStatus`):**
1. Find user by ID
2. Update kyc_status and kyc_reject_reason
3. If APPROVED: Also approve all pending documents
4. Send push notification:
   - `notifyKycApproved` if approved
   - `notifyKycRejected` if rejected (with reason)
5. Return updated status

**Success Response (200):**
```json
{
  "success": true,
  "message": "KYC approved successfully",
  "data": {
    "id": "1",
    "kyc_status": "APPROVED",
    "kyc_reject_reason": null
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Status must be APPROVED or REJECTED | Invalid status |
| 404 | User not found | Invalid user ID |

---

### 4.3 Update Document Status

Approve or reject an individual KYC document.

**Endpoint:** `PUT /admin/documents/:id/status`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin
3. `validateUpdateDocumentStatus` - Validates request body

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

OR

```json
{
  "status": "REJECTED",
  "reject_reason": "Document is expired"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | string | Yes | `APPROVED` or `REJECTED` |
| `reject_reason` | string | No* | Max 500 chars, *required when REJECTED |

**Service Logic (`adminService.updateDocumentStatus`):**
1. Find document by ID
2. Update status and reject_reason
3. Send push notification:
   - `notifyDocumentApproved` if approved
   - `notifyDocumentRejected` if rejected (with reason)
4. Return updated document

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document approved successfully",
  "data": {
    "id": 1,
    "document_type": "AADHAAR",
    "status": "APPROVED",
    "reject_reason": null
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 404 | Document not found | Invalid document ID |

---

## 5. Car Management APIs

### 5.1 List Cars

List all cars with filters.

**Endpoint:** `GET /admin/cars`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin
3. `validateListCars` - Validates query params

**Query Parameters:**

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `search` | string | No | - | Search by car name |
| `operator_id` | number | No | - | Filter by operator |
| `category` | string | No | - | `TAXI` or `PRIVATE` |
| `is_active` | boolean | No | - | Filter by active status |
| `page` | number | No | 1 | Min 1 |
| `limit` | number | No | 10 | Min 1, Max 50 |

**Service Logic (`adminService.listCars`):**
1. Build query filters
2. Include operator info and images
3. Order by created_at DESC
4. Apply pagination
5. Return formatted cars with meta

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
      "instructions": "No smoking",
      "rc_front_url": "https://...",
      "rc_back_url": "https://...",
      "is_active": true,
      "images": [
        {
          "id": 1,
          "image_url": "https://...",
          "is_primary": true
        }
      ],
      "operator": {
        "id": "4",
        "full_name": "Mahesh Bhai",
        "agency_name": "ABC Travels",
        "phone_number": "+919876543210",
        "profile_image_url": "https://...",
        "kyc_verified": true
      },
      "created_at": "2026-01-03T10:00:00.000Z",
      "updated_at": "2026-01-03T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "total_pages": 25
  }
}
```

---

### 5.2 Get Car Details

**Endpoint:** `GET /admin/cars/:id`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin

**Service Logic (`adminService.getCarById`):**
1. Find car by ID with operator and images
2. Return formatted car details

**Success Response (200):**
```json
{
  "success": true,
  "message": "Car fetched successfully",
  "data": {
    "id": "1",
    "car_name": "Swift Dzire",
    ...
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 404 | Car not found | Invalid car ID |

---

### 5.3 Delete Car

**Endpoint:** `DELETE /admin/cars/:id`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin

**Service Logic (`adminService.deleteCar`):**
1. Find car by ID with images
2. Delete all images from S3
3. Delete RC documents from S3
4. Delete car record (cascade deletes images)

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

---

## 6. Booking Request APIs

### 6.1 List Booking Requests

List all booking requests with filters.

**Endpoint:** `GET /admin/booking-requests`  
**Auth Required:** Yes (Admin JWT)

**Middleware Chain:**
1. `authenticate` - Verifies JWT token
2. `requireAdmin` - Checks user is admin
3. `validateListBookingRequests` - Validates query params

**Query Parameters:**

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `status` | string | No | ALL | `PENDING`, `ACCEPTED`, `REJECTED`, `ALL` |
| `initiated_by` | string | No | ALL | `DRIVER`, `OPERATOR`, `ALL` |
| `car_id` | number | No | - | Filter by car |
| `driver_id` | number | No | - | Filter by driver |
| `operator_id` | number | No | - | Filter by operator |
| `page` | number | No | 1 | Min 1 |
| `limit` | number | No | 10 | Min 1, Max 50 |

**Service Logic (`adminService.listBookingRequests`):**
1. Build query filters
2. Include car, driver, and operator info
3. Order by created_at DESC
4. Apply pagination
5. Return formatted requests with meta

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking requests fetched successfully",
  "data": [
    {
      "id": "1",
      "initiated_by": "DRIVER",
      "message": "I need this car for a wedding event",
      "status": "PENDING",
      "reject_reason": null,
      "created_at": "2026-01-03T10:00:00.000Z",
      "updated_at": "2026-01-03T10:00:00.000Z",
      "car": {
        "id": "1",
        "car_name": "Swift Dzire",
        "category": "TAXI"
      },
      "driver": {
        "id": "10",
        "full_name": "Driver Name",
        "phone_number": "+919876543210",
        "profile_image_url": "https://..."
      },
      "operator": {
        "id": "4",
        "full_name": "Operator Name",
        "agency_name": "ABC Travels",
        "phone_number": "+919876543211",
        "profile_image_url": "https://..."
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5000,
    "total_pages": 500
  }
}
```

---

## Static Location Data

> **Note:** Location data is managed via static JSON files instead of database APIs.

### Overview

Location data is served as static JSON files that can be directly fetched without authentication.

**Base URL for Static Files:** `http://localhost:3000/data`

### File Structure

```
public/
└── data/
    └── locations/
        ├── cities.json        # List of all available cities
        └── ahmedabad.json     # Areas for Ahmedabad city
```

### Get All Cities

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

### Get City Areas

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
    "Bodakdev",
    "...74 areas total..."
  ],
  "total_areas": 74
}
```

### Managing Locations (Admin)

Since locations are static JSON files, management is done by editing files directly:

#### Adding a New City

1. Add city entry to `public/data/locations/cities.json`
2. Create `public/data/locations/{city_slug}.json` with areas
3. Update `total` and `last_updated` in `cities.json`

#### Adding Areas to Existing City

Edit the city's JSON file and add new areas to the `areas` array. Keep sorted alphabetically and update `total_areas`.

---

## Database Schema

### Roles Table

| id | code | name |
|----|------|------|
| 1 | DRIVER | Driver |
| 2 | OPERATOR | Operator |
| 3 | ADMIN | Administrator |

### Users Table (Admin-specific columns)

| Column | Type | Description |
|--------|------|-------------|
| `email` | VARCHAR(255) | Admin email (unique) |
| `password_hash` | TEXT | Bcrypt hashed password |

---

## Admin Workflows

### KYC Verification Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                    KYC VERIFICATION FLOW                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User submits KYC (POST /kyc/submit)                       │
│     └── kyc_status = 'PENDING'                                │
│                                                               │
│  2. Admin views pending KYC (GET /admin/kyc/pending)          │
│     └── Shows users with pending KYC (oldest first)           │
│                                                               │
│  3. Admin reviews user details (GET /admin/users/:id)         │
│     └── Shows documents with images                           │
│                                                               │
│  4. Admin approves/rejects:                                   │
│     └── PUT /admin/users/:id/kyc                              │
│         {"status": "APPROVED"} or                             │
│         {"status": "REJECTED", "reject_reason": "..."}        │
│                                                               │
│  5. User is notified (push notification)                      │
│     └── If approved: User can now get JWT on next login       │
│     └── If rejected: User can resubmit KYC                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### User Suspension Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                   USER SUSPENSION FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Admin identifies problematic user                         │
│     └── GET /admin/users (search/filter)                      │
│                                                               │
│  2. Admin reviews user details                                │
│     └── GET /admin/users/:id                                  │
│                                                               │
│  3. Admin suspends user                                       │
│     └── PUT /admin/users/:id/status                           │
│         {"is_active": false, "reason": "..."}                 │
│                                                               │
│  4. Suspended user cannot:                                    │
│     - Login (returns 403)                                     │
│     - Access any authenticated endpoints                      │
│                                                               │
│  5. To reactivate:                                            │
│     └── PUT /admin/users/:id/status                           │
│         {"is_active": true}                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### All Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Authentication** |
| POST | `/auth/admin/login` | Admin login (email/password) |
| PUT | `/auth/admin/change-password` | Change admin password |
| **Dashboard** |
| GET | `/admin/dashboard/stats` | Get platform statistics |
| **User Management** |
| GET | `/admin/users` | List all users |
| GET | `/admin/users/:id` | Get user details |
| PUT | `/admin/users/:id/status` | Suspend/Activate user |
| **KYC Management** |
| GET | `/admin/kyc/pending` | List pending KYC |
| PUT | `/admin/users/:id/kyc` | Approve/Reject KYC |
| PUT | `/admin/documents/:id/status` | Approve/Reject document |
| **Car Management** |
| GET | `/admin/cars` | List all cars |
| GET | `/admin/cars/:id` | Get car details |
| DELETE | `/admin/cars/:id` | Delete car |
| **Booking Requests** |
| GET | `/admin/booking-requests` | List all requests |

**Total: 13 Admin Endpoints**

### Static Location Files

| URL | Description |
|-----|-------------|
| `GET /data/locations/cities.json` | List all cities |
| `GET /data/locations/{slug}.json` | Get city areas |

---

## Testing with cURL

### Admin Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@safarmitra.com", "password": "Admin@123"}'
```

### Change Admin Password
```bash
curl -X PUT http://localhost:3000/api/v1/auth/admin/change-password \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password": "Admin@123", "new_password": "NewPassword@456"}'
```

### Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### List Users
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?role=DRIVER&kyc_status=PENDING&page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Get User Details
```bash
curl -X GET http://localhost:3000/api/v1/admin/users/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Suspend User
```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/1/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false, "reason": "Violation of terms"}'
```

### List Pending KYC
```bash
curl -X GET "http://localhost:3000/api/v1/admin/kyc/pending?role=DRIVER" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Approve KYC
```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/1/kyc \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

### Reject KYC
```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/1/kyc \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "REJECTED", "reject_reason": "Documents are not clear"}'
```

### Approve Document
```bash
curl -X PUT http://localhost:3000/api/v1/admin/documents/1/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

### List Cars
```bash
curl -X GET "http://localhost:3000/api/v1/admin/cars?category=TAXI&is_active=true" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Delete Car
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/cars/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### List Booking Requests
```bash
curl -X GET "http://localhost:3000/api/v1/admin/booking-requests?status=PENDING&initiated_by=DRIVER" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Fetch Static Location Data
```bash
# Get all cities
curl -X GET http://localhost:3000/data/locations/cities.json

# Get areas for Ahmedabad
curl -X GET http://localhost:3000/data/locations/ahmedabad.json
```

---

## Contact

For questions or issues, contact the development team.
