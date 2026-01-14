# User Management Setup Guide

## Overview

The user management system integrates Firebase Authentication with MongoDB for user data storage. Users are automatically created in MongoDB when they:
- Complete password setup after email verification
- Login for the first time

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

Required packages:
- `multer` - For handling file uploads
- `sharp` - For image optimization

### 2. Create Uploads Directory

The server will automatically create the uploads directory structure:
```
backend/
  uploads/
    user-profile-photos/
```

### 3. Environment Variables

Ensure your `.env.local` has:
```env
MONGODB_URI=mongodb://localhost:27017/algobot
BACKEND_PORT=4040
CORS_ORIGIN=http://localhost:3000
```

## User Schema

### Required Fields
- `userId` - Firebase UID (unique)
- `email` - User email (unique)

### Auto-Generated Fields
- `referralCode` - 10 digit alphanumeric (unique)
- `wallet.walletId` - 12 digit alphanumeric (unique)
- `nickname` - Default: "User{last6digits}"

### Default Values
- `subscription.plan` - "free"
- `subscription.permissions` - ["use_platform", "update_profile", "see_others_profile", "raise_disputes"]
- `language` - "en"

### Arrays
- `referrals` - User referral tracking
- `activities` - User activity log
- `notifications` - User notifications
- `strategies` - User trading strategies
- `wallet.balances` - Wallet balances
- `wallet.transactions` - Wallet transactions
- `subscription.permissions` - Subscription permissions
- `kyc` - KYC documents and status

## API Endpoints

### User Management
- `POST /api/users` - Create user (requires userId, email)
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user (nickname, location, language)
- `POST /api/users/:userId/avatar` - Upload profile photo

### User Data
- `GET /api/users/:userId/referrals` - Get user referrals
- `GET /api/users/:userId/activities` - Get user activities
- `GET /api/users/:userId/notifications` - Get user notifications
- `GET /api/users/:userId/strategies` - Get user strategies
- `GET /api/users/:userId/wallet` - Get user wallet
- `GET /api/users/:userId/permissions` - Get user permissions
- `GET /api/users/:userId/kyc` - Get user KYC data

## Image Upload

### Profile Photos
- Location: `backend/uploads/user-profile-photos/`
- Format: Optimized JPEG
- Size: Max 5MB
- Dimensions: 400x400px (maintains aspect ratio)
- Quality: 85%

### File Naming
- Format: `profile-{userId}-{timestamp}-optimized.jpg`
- Old files are automatically deleted when new avatar is uploaded

## Frontend Integration

### User Service
The `UserService` class handles all user-related API calls:
- `createUser()` - Create user in MongoDB
- `getUser()` - Get user profile
- `updateUser()` - Update user profile
- `uploadAvatar()` - Upload profile photo

### Auth Service Integration
The `AuthService` automatically creates users in MongoDB:
- After password setup
- On first login

## User Flow

1. **Registration**
   - User enters email → Firebase creates account
   - Email verification sent
   - User verifies email
   - User sets password → User created in MongoDB

2. **Login**
   - User logs in → If user doesn't exist in MongoDB, create it
   - User redirected to home

3. **Profile Management**
   - User goes to Mine page
   - Views profile information
   - Can edit: nickname, country, language
   - Can upload avatar

## Default Free Plan Permissions

- `use_platform` - Access to platform
- `update_profile` - Update own profile
- `see_others_profile` - View other user profiles
- `raise_disputes` - Create dispute tickets

## Counselor Assignment

Counselors are assigned by admin through the web dashboard. The counselor field references another User document.

## Testing

### Create User Manually
```bash
curl -X POST http://localhost:4040/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "email": "test@example.com",
    "nickname": "Test User"
  }'
```

### Get User
```bash
curl http://localhost:4040/api/users/test-user-123
```

### Update User
```bash
curl -X PUT http://localhost:4040/api/users/test-user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "Updated Name",
    "location": {"country": "United States"},
    "language": "en"
  }'
```

## Troubleshooting

### User Not Created in MongoDB
- Check Firebase Auth is working
- Check backend server is running
- Check MongoDB connection
- Check network connectivity from mobile app

### Image Upload Fails
- Check uploads directory exists
- Check file size (max 5MB)
- Check file format (jpeg, jpg, png, gif, webp)
- Check backend logs for errors

### Duplicate User Error
- User already exists (this is expected if user was created before)
- Check userId and email are unique
