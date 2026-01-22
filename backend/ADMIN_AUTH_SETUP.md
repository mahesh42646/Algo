# Admin Authentication System Setup

## Overview

This document describes the database-based admin authentication system for the admin dashboard.

## Features

- ✅ Database-stored admin credentials (username and password)
- ✅ Secure password hashing using bcrypt
- ✅ Token-based authentication
- ✅ Protected admin routes
- ✅ Profile management (update username/password)
- ✅ Session management (24-hour expiration)

## Database Schema

### Admin Model (`backend/schemas/admin.js`)

- `username` - Unique, lowercase, alphanumeric + underscores (3-50 chars)
- `password` - Hashed using bcrypt (min 6 chars)
- `email` - Unique email address
- `isActive` - Boolean flag for account status
- `lastLogin` - Timestamp of last login
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

## API Endpoints

### POST /api/admin/login
Authenticate admin with username and password.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "...",
      "username": "admin",
      "email": "admin@dashboard.com",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "base64_encoded_token"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

### GET /api/admin/profile
Get authenticated admin profile (requires authentication token).

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "...",
      "username": "admin",
      "email": "admin@dashboard.com",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Authentication required. Please login."
}
```

### PUT /api/admin/profile
Update admin username and/or password (requires authentication token).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "username": "newusername",  // Optional
  "password": "newpassword",   // Optional (requires currentPassword)
  "currentPassword": "oldpassword"  // Required if updating password
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "admin": {
      "id": "...",
      "username": "newusername",
      "email": "admin@dashboard.com",
      "isActive": true,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

- **400** - Missing fields or validation error
- **401** - Invalid current password
- **401** - Authentication required

## Setup Instructions

### 1. Initialize Admin User

Run the initialization script to create the default admin user:

```bash
cd backend
npm run init-admin
```

Or directly:
```bash
node backend/scripts/initAdmin.js
```

**Default Credentials:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@dashboard.com`

⚠️ **IMPORTANT:** Change the default password immediately after first login!

### 2. Update Password

After logging in, use the PUT `/api/admin/profile` endpoint to update your password:

```bash
curl -X PUT http://localhost:4040/api/admin/profile \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "new_secure_password",
    "currentPassword": "admin123"
  }'
```

### 3. Frontend Integration

The frontend is already integrated with the authentication system:

- Login page: `/admin` - Uses POST `/api/admin/login`
- Dashboard: `/admin/dashboard` - Protected routes require authentication
- Auth hook: `src/hooks/useAuth.js` - Handles authentication state
- Auth utility: `src/utils/auth.js` - Token management
- Admin API: `src/utils/api.js` - API functions for admin endpoints

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt (cost factor 10)
2. **Token-Based Auth**: Simple token system (can be upgraded to JWT)
3. **Session Expiration**: Tokens expire after 24 hours
4. **Input Validation**: Username and password validation
5. **Protected Routes**: Middleware protects admin routes
6. **Error Handling**: Proper HTTP status codes (200, 400, 401)

## File Structure

```
backend/
├── schemas/
│   └── admin.js              # Admin Mongoose schema
├── middleware/
│   └── auth.js               # Authentication middleware
├── routes/
│   └── admin.js              # Admin routes (login, profile)
└── scripts/
    └── initAdmin.js          # Initialize admin user script

src/
├── hooks/
│   └── useAuth.js            # React hook for authentication
├── utils/
│   ├── auth.js                # Auth utility functions
│   └── api.js                 # Admin API functions
└── app/
    └── admin/
        ├── page.js            # Login page
        └── dashboard/
            └── layout.js      # Protected dashboard layout
```

## Testing

### Test Login
```bash
curl -X POST http://localhost:4040/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Test Profile (with token)
```bash
curl http://localhost:4040/api/admin/profile \
  -H "Authorization: Bearer <token>"
```

### Test Update Profile
```bash
curl -X PUT http://localhost:4040/api/admin/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "password": "newpassword",
    "currentPassword": "oldpassword"
  }'
```

## Notes

- The token system uses base64 encoding. For production, consider upgrading to JWT with proper signing.
- Session expiration is set to 24 hours. Adjust in `src/utils/auth.js` if needed.
- Admin accounts can be deactivated by setting `isActive: false`.
- Password updates require the current password for security.
