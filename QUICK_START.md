# Quick Start Guide

## Current Setup

✅ **Backend**: Running on `http://localhost:4040`
✅ **Ngrok**: Forwarding to `https://annalisa-wispy-vania.ngrok-free.dev`
✅ **Mobile App**: Configured to use ngrok URL

## Start Services

### 1. Start Backend
```bash
cd backend
node server.js
```

### 2. Start Ngrok (in another terminal)
```bash
ngrok http 4040
```

### 3. Run Mobile App
```bash
cd algobot_app
flutter run
```

## Important: Ngrok URL Changes

⚠️ **When you restart ngrok, you get a new URL!**

If ngrok URL changes, update `algobot_app/.env.local`:
```
BACKEND_URL=https://NEW-URL.ngrok-free.dev/api
BACKEND_BASE_URL=https://NEW-URL.ngrok-free.dev
```

Then restart the Flutter app.

## Test Connection

Open in browser: `https://annalisa-wispy-vania.ngrok-free.dev/api/health`

Should see:
```json
{"status":"ok","message":"Server is running","timestamp":"..."}
```

## User Registration Flow

1. User registers with email → Firebase creates account
2. User verifies email → Email verified
3. User sets password → **User created in MongoDB** ✅
4. User logs in → **User created in MongoDB if missing** ✅

## Troubleshooting

**Connection timeout?**
- Check ngrok is running
- Check backend is running
- Verify URL in `.env.local` matches ngrok URL

**User not created?**
- Check backend logs for `[USER CREATE]` messages
- Check MongoDB is running
- Verify ngrok URL is correct
