# AlgoBot Project Structure

This repository contains three separate projects that share a common backend API.

## Project Overview

```
algobot/
├── backend/              # Node.js/Express Backend API (Shared)
├── src/                  # Next.js Web Admin Dashboard
└── algobot_app/          # Flutter Mobile App (Separate)
```

## Backend API (`/backend`)

**Purpose**: Common backend API for both web and mobile applications

- **Technology**: Node.js, Express, MongoDB
- **Port**: 4040
- **API Base**: `http://localhost:4040/api`
- **Environment**: `backend/.env.local`
- **Git**: Part of main repository

### Features
- RESTful API endpoints
- MongoDB database
- JWT authentication
- CORS enabled for frontend and mobile
- Security middleware (Helmet)
- Request logging

## Web Admin Dashboard (`/src`)

**Purpose**: Admin dashboard and public web interface

- **Technology**: Next.js 16, React 19
- **Port**: 3000
- **URL**: `http://localhost:3000`
- **Environment**: `.env.local` (root)
- **Git**: Part of main repository

### Features
- Admin dashboard
- Public web interface
- Connects to backend API
- Bootstrap UI framework
- Responsive design

## Mobile App (`/algobot_app`)

**Purpose**: Flutter mobile application (iOS & Android)

- **Technology**: Flutter, Dart
- **App Name**: AlgoBot
- **Environment**: `algobot_app/.env.local`
- **Git**: **Separate repository** (can be extracted)

### Features
- Cross-platform (iOS & Android)
- Connects only to backend API
- No connection to web project
- Independent deployment

## Environment Files

Each project has its own environment configuration:

1. **Backend**: `backend/.env.local`
   - Server configuration
   - Database connection
   - Security secrets
   - API settings

2. **Web**: `.env.local` (root)
   - Frontend URL
   - Backend API URL
   - Public configuration

3. **Mobile**: `algobot_app/.env.local`
   - Backend API URL
   - App configuration
   - Environment settings

## Git Repository Strategy

### Option 1: Monorepo (Current)
- All projects in one repository
- Shared backend code
- Separate `.gitignore` for Flutter app
- Can extract Flutter app later

### Option 2: Separate Repositories (Recommended)
- **Main Repo**: Backend + Web Admin
- **Mobile Repo**: Flutter app (separate)
- Both connect to same backend API

## Development Workflow

### Backend Development
```bash
cd backend
npm run server
```

### Web Development
```bash
npm run dev
```

### Mobile Development
```bash
cd algobot_app
flutter run
```

## API Connection

Both web and mobile apps connect to the same backend:

```
Web Admin (Next.js)  ──┐
                       ├──> Backend API (Express) ──> MongoDB
Mobile App (Flutter) ──┘
```

## Security

- Each project has separate `.env.local` files
- All `.env.local` files are git-ignored
- Backend secrets never exposed to clients
- Frontend only uses `NEXT_PUBLIC_*` variables
- Mobile app uses secure storage for tokens

## Team Collaboration

- **Backend Team**: Works on `/backend`
- **Web Team**: Works on `/src` (admin dashboard)
- **Mobile Team**: Works on `/algobot_app` (can be separate repo)

All teams coordinate through the shared backend API.
