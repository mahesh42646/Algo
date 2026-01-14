# Port Conflict Fix

## Issue
Ngrok's web interface uses port 4040, which conflicts with the backend.

## Solution
Backend now runs on port **3001** instead of 4040.

## Updated Setup

### 1. Update Ngrok Command
```bash
# Change from:
ngrok http 4040

# To:
ngrok http 3001
```

### 2. Restart Backend
```bash
cd backend
# Stop current server (Ctrl+C)
node server.js
```

You should see:
```
🚀 Server running on http://localhost:3001
📡 API available at http://localhost:3001/api
```

### 3. Restart Ngrok
```bash
# Stop current ngrok (Ctrl+C)
ngrok http 3001
```

### 4. Get New Ngrok URL
Ngrok will show a new URL. Update `algobot_app/.env.local`:
```
BACKEND_URL=https://NEW-NGROK-URL.ngrok-free.dev/api
BACKEND_BASE_URL=https://NEW-NGROK-URL.ngrok-free.dev
```

### 5. Test Connection
```bash
curl -H "ngrok-skip-browser-warning: true" \
  https://NEW-NGROK-URL.ngrok-free.dev/api/health
```

Should return:
```json
{"status":"ok","message":"Server is running","timestamp":"..."}
```

### 6. Restart Flutter App
```bash
cd algobot_app
flutter run
```

## Why This Fixes It

- **Before**: Backend on 4040, ngrok web interface on 4040 → Conflict
- **After**: Backend on 3001, ngrok forwards to 3001 → No conflict

Ngrok's web interface will still be on 4040 for monitoring, but it won't interfere with the backend.
