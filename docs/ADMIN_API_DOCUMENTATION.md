# Safar Mitra - Admin Panel API Documentation

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
   - [Dashboard APIs](#1-dashboard-apis)
   - [User Management APIs](#2-user-management-apis)
   - [KYC Management APIs](#3-kyc-management-apis)
   - [Car Management APIs](#4-car-management-apis)
   - [Booking Request APIs](#5-booking-request-apis)
   - [Location Management APIs](#6-location-management-apis)
6. [Database Schema](#database-schema)
7. [Admin Workflows](#admin-workflows)

---

## Overview

The Admin Panel provides system administrators with tools to:

- **Monitor Platform** - View statistics and activity
- **Manage Users** - View, suspend, and activate users
- **Verify KYC** - Approve or reject user KYC documents
- **Manage Cars** - Monitor and remove car listings
- **Manage Locations** - Add, edit, and remove service locations
- **Monitor Bookings** - View all booking requests

### Admin Role

Admins are users with `role = 'ADMIN'` in the database. They use the same authentication system as regular users but have access to admin-specific endpoints.

---

## Authentication

### How Admin Authentication Works

1. Admin logs in using phone OTP (same as regular users)
2. Backend verifies Firebase token and issues JWT
3. JWT contains `roleCode: 'ADMIN'`
4. Admin endpoints check for ADMIN role

### Header Format

```
Authorization: Bearer <admin_jwt_token>
```

### JWT Token Payload (Admin)

```json
{
  "userId": "1",
  "roleId": 3,
  "roleCode": "ADMIN",
  "kycStatus": "APPROVED",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Creating an Admin User

Admins are created directly in the database:

```sql
-- First, get the ADMIN role ID
SELECT id FROM roles WHERE code = 'ADMIN';

-- Update an existing user to admin (replace values)
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE code = 'ADMIN'),
    kyc_status = 'APPROVED'
WHERE phone_number = '+91XXXXXXXXXX';
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

## 1. Dashboard APIs

### 1.1 Get Dashboard Statistics

Get comprehensive platform statistics.

**Endpoint:** `GET /admin/dashboard/stats`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Logic:**
1. Verify JWT token (authMiddleware)
2. Verify role is ADMIN (requireAdmin)
3. Count users by role (drivers, operators)
4. Count users by KYC status
5. Count cars by status
6. Count booking requests by status
7. Count locations
8. Return aggregated statistics

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
      "pending": 45,
      "approved": 1400,
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
    },
    "locations": {
      "total": 100,
      "active": 95
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

## 2. User Management APIs

### 2.1 List Users

List all users with filters and pagination.

**Endpoint:** `GET /admin/users`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Query Parameters:**

| Parameter    | Type    | Required | Default | Description                              |
|--------------|---------|----------|---------|------------------------------------------|
| `search`     | string  | No       | -       | Search by name or phone number           |
| `role`       | string  | No       | ALL     | `DRIVER`, `OPERATOR`, `ALL`              |
| `kyc_status` | string  | No       | ALL     | `PENDING`, `APPROVED`, `REJECTED`, `ALL` |
| `is_active`  | boolean | No       | -       | Filter by active status                  |
| `page`       | number  | No       | 1       | Page number                              |
| `limit`      | number  | No       | 10      | Items per page (max: 50)                 |

**Logic:**
1. Verify JWT token and admin role
2. Build query filters based on parameters
3. Exclude admin users from results
4. Include role and documents count
5. Order by created_at DESC
6. Return paginated results

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
    },
    {
      "id": "2",
      "phone_number": "+919876543211",
      "full_name": "Jane Smith",
      "role": "OPERATOR",
      "kyc_status": "APPROVED",
      "is_active": true,
      "profile_image_url": "https://s3.../profiles/jane.jpg",
      "documents_count": 3,
      "created_at": "2026-01-02T10:00:00.000Z"
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

### 2.2 Get User Details

Get detailed user information including KYC documents and statistics.

**Endpoint:** `GET /admin/users/:id`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**URL Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | number | User ID     |

**Logic:**
1. Verify JWT token and admin role
2. Find user by ID with role and documents
3. Calculate user statistics (cars, requests)
4. Return complete user profile

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
      },
      {
        "id": 2,
        "document_type": "DRIVING_LICENSE",
        "front_doc_url": "https://s3.../documents/dl_front.jpg",
        "back_doc_url": "https://s3.../documents/dl_back.jpg",
        "status": "PENDING",
        "reject_reason": null,
        "created_at": "2026-01-03T10:35:00.000Z"
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

### 2.3 Update User Status

Suspend or activate a user account.

**Endpoint:** `PUT /admin/users/:id/status`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**URL Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | number | User ID     |

**Request Body:**

| Field       | Type    | Required | Description                    |
|-------------|---------|----------|--------------------------------|
| `is_active` | boolean | Yes      | `true` to activate, `false` to suspend |
| `reason`    | string  | No       | Reason for status change (max 500 chars) |

**Validations:**
- `is_active`: Required, must be boolean
- `reason`: Optional, max 500 characters
- Cannot modify admin users

**Logic:**
1. Verify JWT token and admin role
2. Find user by ID
3. Check user is not an admin
4. Update is_active status
5. Return updated status

**Request Example (Suspend):**
```json
{
  "is_active": false,
  "reason": "Violation of platform terms and conditions"
}
```

**Request Example (Activate):**
```json
{
  "is_active": true
}
```

**Success Response (200) - Suspended:**
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

**Success Response (200) - Activated:**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "id": "1",
    "is_active": true
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | is_active is required | Missing is_active |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied | Not an admin |
| 403 | Cannot modify admin user status | Target is admin |
| 404 | User not found | Invalid user ID |

---

## 3. KYC Management APIs

### 3.1 List Pending KYC

List users with pending KYC verification.

**Endpoint:** `GET /admin/kyc/pending`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Query Parameters:**

| Parameter | Type   | Required | Default | Description                           |
|-----------|--------|----------|---------|---------------------------------------|
| `role`    | string | No       | ALL     | `DRIVER`, `OPERATOR`, `ALL`           |
| `page`    | number | No       | 1       | Page number                           |
| `limit`   | number | No       | 10      | Items per page (max: 50)              |

**Logic:**
1. Verify JWT token and admin role
2. Filter users with kyc_status = 'PENDING'
3. Apply role filter if provided
4. Order by created_at ASC (oldest first)
5. Return paginated results with documents summary

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
        },
        {
          "id": 2,
          "document_type": "DRIVING_LICENSE",
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

### 3.2 Update User KYC Status

Approve or reject a user's KYC verification.

**Endpoint:** `PUT /admin/users/:id/kyc`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**URL Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | number | User ID     |

**Request Body:**

| Field           | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `status`        | string | Yes      | `APPROVED` or `REJECTED`                 |
| `reject_reason` | string | No*      | Reason for rejection (max 500 chars)     |

*Required when status is REJECTED

**Validations:**
- `status`: Required, must be APPROVED or REJECTED
- `reject_reason`: Only allowed when status is REJECTED

**Logic:**
1. Verify JWT token and admin role
2. Find user by ID
3. Update kyc_status and kyc_reject_reason
4. If APPROVED: Also approve all pending documents
5. Return updated KYC status

**Request Example (Approve):**
```json
{
  "status": "APPROVED"
}
```

**Request Example (Reject):**
```json
{
  "status": "REJECTED",
  "reject_reason": "Documents are not clear. Please upload high-quality images and resubmit."
}
```

**Success Response (200) - Approved:**
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

**Success Response (200) - Rejected:**
```json
{
  "success": true,
  "message": "KYC rejected successfully",
  "data": {
    "id": "1",
    "kyc_status": "REJECTED",
    "kyc_reject_reason": "Documents are not clear. Please upload high-quality images and resubmit."
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Status is required | Missing status |
| 400 | Status must be either APPROVED or REJECTED | Invalid status |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied | Not an admin |
| 404 | User not found | Invalid user ID |

---

### 3.3 Update Document Status

Approve or reject an individual KYC document.

**Endpoint:** `PUT /admin/documents/:id/status`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**URL Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | number | Document ID |

**Request Body:**

| Field           | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `status`        | string | Yes      | `APPROVED` or `REJECTED`                 |
| `reject_reason` | string | No*      | Reason for rejection (max 500 chars)     |

*Required when status is REJECTED

**Logic:**
1. Verify JWT token and admin role
2. Find document by ID
3. Update status and reject_reason
4. Return updated document status

**Request Example (Approve):**
```json
{
  "status": "APPROVED"
}
```

**Request Example (Reject):**
```json
{
  "status": "REJECTED",
  "reject_reason": "Document image is blurry and unreadable"
}
```

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
| 400 | Status is required | Missing status |
| 400 | Status must be either APPROVED or REJECTED | Invalid status |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied | Not an admin |
| 404 | Document not found | Invalid document ID |

---

## 4. Car Management APIs

### 4.1 List Cars

List all cars with filters.

**Endpoint:** `GET /admin/cars`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Query Parameters:**

| Parameter     | Type    | Required | Default | Description                  |
|---------------|---------|----------|---------|------------------------------|
| `search`      | string  | No       | -       | Search by car name           |
| `operator_id` | number  | No       | -       | Filter by operator           |
| `category`    | string  | No       | -       | `TAXI` or `PRIVATE`          |
| `is_active`   | boolean | No       | -       | Filter by active status      |
| `page`        | number  | No       | 1       | Page number                  |
| `limit`       | number  | No       | 10      | Items per page (max: 50)     |

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
        }
      ],
      "operator": {
        "id": "5",
        "full_name": "Jane Smith",
        "agency_name": "XYZ Rentals",
        "phone_number": "+919876543210",
        "profile_image_url": "https://s3.../profiles/jane.jpg",
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

### 4.2 Get Car Details

Get detailed car information.

**Endpoint:** `GET /admin/cars/:id`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**URL Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | number | Car ID      |

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
    "images": [ ... ],
    "operator": { ... },
    "created_at": "2026-01-03T10:00:00.000Z",
    "updated_at": "2026-01-03T10:00:00.000Z"
  }
}
```

---

### 4.3 Delete Car

Delete a car listing (removes from platform).

**Endpoint:** `DELETE /admin/cars/:id`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**URL Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | number | Car ID      |

**Logic:**
1. Verify JWT token and admin role
2. Find car by ID with images
3. Delete all car images from S3
4. Delete RC documents from S3
5. Delete car record (cascade deletes images)
6. Return success

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
| 403 | Access denied | Not an admin |
| 404 | Car not found | Invalid car ID |

---

## 5. Booking Request APIs

### 5.1 List Booking Requests

List all booking requests with filters.

**Endpoint:** `GET /admin/booking-requests`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Query Parameters:**

| Parameter      | Type   | Required | Default | Description                              |
|----------------|--------|----------|---------|------------------------------------------|
| `status`       | string | No       | ALL     | `PENDING`, `ACCEPTED`, `REJECTED`, `ALL` |
| `initiated_by` | string | No       | ALL     | `DRIVER`, `OPERATOR`, `ALL`              |
| `car_id`       | number | No       | -       | Filter by car                            |
| `driver_id`    | number | No       | -       | Filter by driver                         |
| `operator_id`  | number | No       | -       | Filter by operator                       |
| `page`         | number | No       | 1       | Page number                              |
| `limit`        | number | No       | 10      | Items per page (max: 50)                 |

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
        "id": "3",
        "full_name": "John Doe",
        "phone_number": "+919876543210",
        "profile_image_url": "https://s3.../profiles/john.jpg"
      },
      "operator": {
        "id": "5",
        "full_name": "Jane Smith",
        "agency_name": "XYZ Rentals",
        "phone_number": "+919876543211",
        "profile_image_url": "https://s3.../profiles/jane.jpg"
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

## 6. Location Management APIs

### 6.1 List Locations (Admin)

List all locations including inactive ones.

**Endpoint:** `GET /admin/locations`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Query Parameters:**

| Parameter   | Type    | Required | Default | Description                  |
|-------------|---------|----------|---------|------------------------------|
| `search`    | string  | No       | -       | Search by area or city name  |
| `city_name` | string  | No       | -       | Filter by city               |
| `is_active` | boolean | No       | -       | Filter by active status      |
| `page`      | number  | No       | 1       | Page number                  |
| `limit`     | number  | No       | 50      | Items per page (max: 100)    |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Locations fetched successfully",
  "data": [
    {
      "id": "1",
      "area_name": "Andheri West",
      "city_name": "Mumbai",
      "is_active": true,
      "created_at": "2026-01-03T10:00:00.000Z",
      "updated_at": "2026-01-03T10:00:00.000Z"
    },
    {
      "id": "2",
      "area_name": "Bandra East",
      "city_name": "Mumbai",
      "is_active": true,
      "created_at": "2026-01-03T10:05:00.000Z",
      "updated_at": "2026-01-03T10:05:00.000Z"
    },
    {
      "id": "3",
      "area_name": "Koramangala",
      "city_name": "Bangalore",
      "is_active": false,
      "created_at": "2026-01-03T10:10:00.000Z",
      "updated_at": "2026-01-03T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "total_pages": 2
  }
}
```

---

### 6.2 Create Location

Create a new service location.

**Endpoint:** `POST /admin/locations`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Request Body:**

| Field       | Type    | Required | Default | Description                    |
|-------------|---------|----------|---------|--------------------------------|
| `area_name` | string  | Yes      | -       | Area name (max 100 chars)      |
| `city_name` | string  | Yes      | -       | City name (max 100 chars)      |
| `is_active` | boolean | No       | true    | Active status                  |

**Validations:**
- `area_name`: Required, max 100 characters
- `city_name`: Required, max 100 characters
- Combination of area_name + city_name must be unique

**Logic:**
1. Verify JWT token and admin role
2. Check for duplicate location (case-insensitive)
3. Create location record
4. Return created location

**Request Example:**
```json
{
  "area_name": "Andheri West",
  "city_name": "Mumbai",
  "is_active": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Location created successfully",
  "data": {
    "id": "1",
    "area_name": "Andheri West",
    "city_name": "Mumbai",
    "is_active": true,
    "created_at": "2026-01-03T10:00:00.000Z",
    "updated_at": "2026-01-03T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 400 | Area name is required | Missing area_name |
| 400 | City name is required | Missing city_name |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied | Not an admin |
| 409 | Location already exists | Duplicate area+city |

---

### 6.3 Update Location

Update an existing location.

**Endpoint:** `PUT /admin/locations/:id`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**URL Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | number | Location ID |

**Request Body:**

| Field       | Type    | Required | Description                    |
|-------------|---------|----------|--------------------------------|
| `area_name` | string  | No       | Area name (max 100 chars)      |
| `city_name` | string  | No       | City name (max 100 chars)      |
| `is_active` | boolean | No       | Active status                  |

**Logic:**
1. Verify JWT token and admin role
2. Find location by ID
3. Check for duplicate if changing names
4. Update location fields
5. Return updated location

**Request Example (Update name):**
```json
{
  "area_name": "Andheri East"
}
```

**Request Example (Deactivate):**
```json
{
  "is_active": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": {
    "id": "1",
    "area_name": "Andheri East",
    "city_name": "Mumbai",
    "is_active": true,
    "created_at": "2026-01-03T10:00:00.000Z",
    "updated_at": "2026-01-03T12:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied | Not an admin |
| 404 | Location not found | Invalid location ID |
| 409 | Location already exists | Duplicate area+city |

---

### 6.4 Delete Location

Delete a location.

**Endpoint:** `DELETE /admin/locations/:id`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**URL Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | number | Location ID |

**Logic:**
1. Verify JWT token and admin role
2. Find location by ID
3. Delete location record
4. Return success

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

**Error Responses:**

| Status | Message | When |
|--------|---------|------|
| 401 | Unauthorized | Missing/invalid token |
| 403 | Access denied | Not an admin |
| 404 | Location not found | Invalid location ID |

---

## Database Schema

### Roles Table

| id | code | name |
|----|------|------|
| 1 | DRIVER | Driver |
| 2 | OPERATOR | Operator |
| 3 | ADMIN | Administrator |

### Locations Table

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| area_name | VARCHAR(100) | Area name (e.g., "Andheri West") |
| city_name | VARCHAR(100) | City name (e.g., "Mumbai") |
| is_active | BOOLEAN | Active status (default: true) |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Unique Constraint:** `area_name` + `city_name`

---

## Admin Workflows

### KYC Verification Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                    KYC VERIFICATION FLOW                      │
├──────────────────────────��───────────────────────────────────┤
│                                                               │
│  1. User submits KYC (POST /kyc/submit)                       │
│     └── kyc_status = 'PENDING'                                │
│                                                               │
│  2. Admin views pending KYC (GET /admin/kyc/pending)          │
│     └── Shows users with pending KYC                          │
│                                                               │
│  3. Admin reviews user details (GET /admin/users/:id)         │
│     └── Shows documents with images                           │
│                                                               │
│  4. Admin approves/rejects:                                   │
│                                                               │
│     Option A: Approve entire KYC                              │
│     └── PUT /admin/users/:id/kyc                              │
│         {"status": "APPROVED"}                                │
│         └── All pending documents also approved               │
│                                                               │
│     Option B: Reject entire KYC                               │
│     └── PUT /admin/users/:id/kyc                              │
│         {"status": "REJECTED", "reject_reason": "..."}        │
│                                                               │
│     Option C: Approve/Reject individual documents             │
│     └── PUT /admin/documents/:id/status                       │
│         {"status": "APPROVED"} or                             │
│         {"status": "REJECTED", "reject_reason": "..."}        │
│                                                               │
│  5. User is notified (future: push notification)              │
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

### Location Management Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                 LOCATION MANAGEMENT FLOW                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Admin adds new service area                               │
│     └── POST /admin/locations                                 │
│         {"area_name": "...", "city_name": "..."}              │
│                                                               │
│  2. Location appears in public list                           │
│     └── GET /locations (for users)                            │
│                                                               │
│  3. To temporarily disable a location:                        │
│     └── PUT /admin/locations/:id                              │
│         {"is_active": false}                                  │
│     └── Location hidden from public list                      │
│                                                               │
│  4. To re-enable:                                             │
│     └── PUT /admin/locations/:id                              │
│         {"is_active": true}                                   │
│                                                               │
│  5. To permanently remove:                                    │
│     └── DELETE /admin/locations/:id                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### All Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
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
| **Location Management** |
| GET | `/admin/locations` | List all locations |
| POST | `/admin/locations` | Create location |
| PUT | `/admin/locations/:id` | Update location |
| DELETE | `/admin/locations/:id` | Delete location |

**Total: 15 Admin Endpoints**

---

## Testing with cURL

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
  -d '{"status": "REJECTED", "reject_reason": "Documents not clear"}'
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

### Create Location
```bash
curl -X POST http://localhost:3000/api/v1/admin/locations \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_name": "Andheri West", "city_name": "Mumbai", "is_active": true}'
```

### Update Location
```bash
curl -X PUT http://localhost:3000/api/v1/admin/locations/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

### Delete Location
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/locations/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Contact

For questions or issues, contact the development team.
