# Ngrok Setup Guide

## Current Configuration

The app is configured to use ngrok for backend access:

- **Ngrok URL**: `https://annalisa-wispy-vania.ngrok-free.dev`
- **API URL**: `https://annalisa-wispy-vania.ngrok-free.dev/api`
- **Base URL**: `https://annalisa-wispy-vania.ngrok-free.dev`

## Important Notes

⚠️ **Ngrok URLs change every time you restart ngrok (on free plan)**

When you restart ngrok, you'll get a new URL. You must update:

1. **`.env.local`** file:
   ```
   BACKEND_URL=https://NEW-NGROK-URL.ngrok-free.dev/api
   BACKEND_BASE_URL=https://NEW-NGROK-URL.ngrok-free.dev
   ```

2. **Restart the Flutter app** after updating `.env.local`

## Starting Ngrok

```bash
# Make sure backend is running first
cd backend
node server.js

# In another terminal, start ngrok
ngrok http 4040
```

## Updating URLs

When ngrok gives you a new URL:

1. Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.dev`)
2. Update `algobot_app/.env.local`:
   ```
   BACKEND_URL=https://abc123.ngrok-free.dev/api
   BACKEND_BASE_URL=https://abc123.ngrok-free.dev
   ```
3. Restart Flutter app:
   ```bash
   flutter run
   ```

## Testing Connection

Test the ngrok URL in a browser:
```
https://annalisa-wispy-vania.ngrok-free.dev/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "..."
}
```

## Benefits of Ngrok

✅ Works from anywhere (no need for same network)
✅ HTTPS by default
✅ No firewall issues
✅ Easy to test from mobile devices

## Production

For production, use your actual domain:
```
BACKEND_URL=https://api.yourdomain.com/api
BACKEND_BASE_URL=https://api.yourdomain.com
```
