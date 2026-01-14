# Troubleshooting Guide

## Connection Timeout Issues

If you're seeing connection timeout errors when the mobile app tries to connect to the backend:

### 1. Verify Backend is Running
```bash
cd backend
node server.js
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:4040
📡 API available at http://localhost:4040/api
🌐 Network access: http://YOUR_IP:4040/api
```

### 2. Check IP Address

The IP address shown in the backend logs must match the IP in your mobile app's `.env.local`:

**Backend shows:** `http://192.168.2.1:4040/api`
**Mobile app `.env.local` should have:**
```
BACKEND_URL=http://192.168.2.1:4040/api
BACKEND_BASE_URL=http://192.168.2.1:4040
```

### 3. Verify Same Network

- Mobile device and computer must be on the **same Wi-Fi network**
- Cannot use different networks (e.g., phone on cellular, computer on Wi-Fi)

### 4. Test Connection from Mobile Browser

On your mobile device, open a browser and navigate to:
```
http://YOUR_IP:4040/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "..."
}
```

If this doesn't work, the mobile device cannot reach the backend.

### 5. Check Firewall

**macOS:**
```bash
# Check if firewall is blocking
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If enabled, you may need to allow Node.js
```

**Temporarily disable firewall to test:**
System Settings → Network → Firewall → Turn Off

### 6. Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

If MongoDB isn't running, start it:
```bash
brew services start mongodb-community
# or
mongod
```

### 7. Test Backend Endpoint Directly

From your computer's terminal:
```bash
curl http://localhost:4040/api/health
curl http://192.168.2.1:4040/api/health
```

Both should return the health check JSON.

### 8. Common Issues

**Issue: "Connection timeout"**
- Backend not running
- Wrong IP address in `.env.local`
- Firewall blocking connections
- Different networks

**Issue: "User not created in database"**
- Backend connection failed (check logs)
- MongoDB not running
- Network connectivity issues

**Issue: "MongoDB connection error"**
- MongoDB not installed
- MongoDB not running
- Wrong MongoDB URI in `.env.local`

### 9. Quick Fix Commands

```bash
# 1. Find your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# 2. Update .env.local with correct IP
# Edit algobot_app/.env.local and backend/.env.local

# 3. Restart backend
cd backend
node server.js

# 4. Test from mobile browser
# Open: http://YOUR_IP:4040/api/health
```

### 10. Alternative: Use ngrok for Testing

If local network doesn't work, use ngrok:

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 4040

# Use the ngrok URL in .env.local
# Example: https://abc123.ngrok.io/api
```

## User Creation Issues

If users aren't being created in MongoDB:

1. **Check backend logs** - Should show `[USER CREATE]` messages
2. **Check MongoDB** - Verify database connection
3. **Check network** - Mobile app must reach backend
4. **Check Firebase** - User must be authenticated in Firebase first

## Logs to Check

**Backend logs should show:**
```
[USER CREATE] Attempting to create user: USER_ID, email@example.com
[USER CREATE] ✅ User created successfully: USER_ID
```

**Mobile app logs should show:**
```
🔄 Attempting to create user in database (attempt 1/3): USER_ID
✅ User created successfully in database: USER_ID
```

If you see timeout errors, the mobile app cannot reach the backend server.
