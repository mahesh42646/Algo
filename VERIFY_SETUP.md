# Verify Setup - Fix 404 Errors

## Current Issue
Getting 404 from ngrok instead of backend responses.

## Solution Steps

### 1. Restart Backend Server
```bash
# Stop current backend (Ctrl+C)
# Then restart:
cd backend
node server.js
```

**Look for these messages:**
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:4040
```

### 2. Verify Backend is Working
In a NEW terminal, test directly:
```bash
curl http://localhost:4040/api/health
```

**Expected:** Should return backend JSON (not ngrok 404)

**If you get ngrok 404:** Ngrok's web interface is intercepting. This is OK - test through ngrok URL instead.

### 3. Test Through Ngrok URL
```bash
curl -H "ngrok-skip-browser-warning: true" \
  https://annalisa-wispy-vania.ngrok-free.dev/api/health
```

**Expected:** `{"status":"ok","message":"Server is running","timestamp":"..."}`

**If still 404:** 
- Backend might not be running
- Ngrok might need restart
- Check backend terminal for logs

### 4. Check Backend Logs
When you make a request, you should see in backend terminal:
```
[2024-01-09T...] GET /api/health
[HEALTH CHECK] ✅ Health check requested from: ...
[2024-01-09T...] ✅ SUCCESS GET /api/health - 200 (...ms)
```

### 5. Restart Flutter App
After verifying backend works:
```bash
cd algobot_app
flutter run
```

## Quick Fix

If still getting 404:

1. **Kill all node processes:**
   ```bash
   pkill -f "node server"
   ```

2. **Restart backend:**
   ```bash
   cd backend
   node server.js
   ```

3. **Restart ngrok** (if needed):
   ```bash
   # Kill ngrok
   pkill ngrok
   # Restart
   ngrok http 4040
   ```

4. **Test ngrok URL:**
   ```bash
   curl -H "ngrok-skip-browser-warning: true" \
     https://annalisa-wispy-vania.ngrok-free.dev/api/health
   ```

5. **Update .env.local if ngrok URL changed**

6. **Restart Flutter app**

## Important

- Backend MUST be running before ngrok
- Test through ngrok URL, not localhost when ngrok is running
- Check backend terminal logs for request confirmation
