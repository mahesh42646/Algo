# Ngrok 404 Fix

## Issue
Getting 404 errors from ngrok instead of backend responses.

## Solution

The backend server must be running **before** starting ngrok.

### Step 1: Start Backend
```bash
cd backend
node server.js
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:4040
```

### Step 2: Start Ngrok (in NEW terminal)
```bash
ngrok http 4040
```

### Step 3: Verify Connection

Test the ngrok URL:
```bash
curl -H "ngrok-skip-browser-warning: true" https://YOUR-NGROK-URL.ngrok-free.dev/api/health
```

Should return:
```json
{"status":"ok","message":"Server is running","timestamp":"..."}
```

### Step 4: Update Mobile App

If ngrok URL changed, update `.env.local`:
```
BACKEND_URL=https://YOUR-NGROK-URL.ngrok-free.dev/api
BACKEND_BASE_URL=https://YOUR-NGROK-URL.ngrok-free.dev
```

### Common Issues

**404 from ngrok:**
- Backend not running
- Ngrok started before backend
- Wrong port in ngrok command

**Connection timeout:**
- Ngrok not running
- Wrong URL in `.env.local`
- Network issues

**Fix:** Always start backend FIRST, then ngrok.
