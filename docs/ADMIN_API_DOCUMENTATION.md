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
6. [Static Location Data](#static-location-data)
7. [Database Schema](#database-schema)
8. [Admin Workflows](#admin-workflows)

---

## Overview

The Admin Panel provides system administrators with tools to:

- **Monitor Platform** - View statistics and activity
- **Manage Users** - View, suspend, and activate users
- **Verify KYC** - Approve or reject user KYC documents
- **Manage Cars** - Monitor and remove car listings
- **Monitor Bookings** - View all booking requests

> **Note:** Location data is now managed via static JSON files. See [Static Location Data](#static-location-data) section.

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

### 2.3 Update User Status

Suspend or activate a user account.

**Endpoint:** `PUT /admin/users/:id/status`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Request Body:**

| Field       | Type    | Required | Description                    |
|-------------|---------|----------|--------------------------------|
| `is_active` | boolean | Yes      | `true` to activate, `false` to suspend |
| `reason`    | string  | No       | Reason for status change (max 500 chars) |

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

### 3.2 Update User KYC Status

Approve or reject a user's KYC verification.

**Endpoint:** `PUT /admin/users/:id/kyc`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Request Body:**

| Field           | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `status`        | string | Yes      | `APPROVED` or `REJECTED`                 |
| `reject_reason` | string | No*      | Reason for rejection (max 500 chars)     |

*Required when status is REJECTED

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

---

### 3.3 Update Document Status

Approve or reject an individual KYC document.

**Endpoint:** `PUT /admin/documents/:id/status`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Request Body:**

| Field           | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `status`        | string | Yes      | `APPROVED` or `REJECTED`                 |
| `reject_reason` | string | No*      | Reason for rejection (max 500 chars)     |

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
      "is_active": true,
      "images": [...],
      "operator": {...},
      "created_at": "2026-01-03T10:00:00.000Z"
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

**Endpoint:** `GET /admin/cars/:id`  
**Auth Required:** Yes  
**Role Required:** ADMIN

---

### 4.3 Delete Car

**Endpoint:** `DELETE /admin/cars/:id`  
**Auth Required:** Yes  
**Role Required:** ADMIN

**Success Response (200):**
```json
{
  "success": true,
  "message": "Car deleted successfully"
}
```

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
      "car": {...},
      "driver": {...},
      "operator": {...}
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

> **Note:** Location data is now managed via static JSON files instead of database APIs. This approach is simpler, requires no database, and is easy to update.

### Overview

Location data is served as static JSON files that can be directly fetched by the frontend without authentication.

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

Since locations are now static JSON files, management is done by editing the files directly:

#### Adding a New City

1. Add city entry to `public/data/locations/cities.json`
2. Create `public/data/locations/{city_slug}.json` with areas
3. Update `total` and `last_updated` in `cities.json`

#### Adding Areas to Existing City

Edit the city's JSON file and add new areas to the `areas` array. Keep the array sorted alphabetically and update `total_areas`.

#### Removing a City

1. Remove the city entry from `cities.json`
2. Delete the city's JSON file
3. Update `total` count and `last_updated` in `cities.json`

---

## Database Schema

### Roles Table

| id | code | name |
|----|------|------|
| 1 | DRIVER | Driver |
| 2 | OPERATOR | Operator |
| 3 | ADMIN | Administrator |

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
│     └── Shows users with pending KYC                          │
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

**Total: 11 Admin Endpoints**

### Static Location Files

| URL | Description |
|-----|-------------|
| `GET /data/locations/cities.json` | List all cities |
| `GET /data/locations/{slug}.json` | Get city areas (e.g., `ahmedabad.json`) |

> **Note:** Location management is done by editing JSON files in `public/data/locations/`

---

## Testing with cURL

### Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### List Users
```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?role=DRIVER&kyc_status=PENDING" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Suspend User
```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/1/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false, "reason": "Violation of terms"}'
```

### Approve KYC
```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/1/kyc \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

### List Cars
```bash
curl -X GET "http://localhost:3000/api/v1/admin/cars?category=TAXI" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Delete Car
```bash
curl -X DELETE http://localhost:3000/api/v1/admin/cars/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### List Booking Requests
```bash
curl -X GET "http://localhost:3000/api/v1/admin/booking-requests?status=PENDING" \
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
