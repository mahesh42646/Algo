# Network Setup for Mobile App

## Important: Local Network IP Address

Mobile devices **cannot** use `localhost` or `127.0.0.1` to connect to your development backend. You must use your **local network IP address**.

## Finding Your Local IP Address

### macOS / Linux
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or more specifically:
```bash
ifconfig en0 | grep "inet " | awk '{print $2}'
```

### Windows
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).

### Quick Check
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

## Updating Configuration

1. Find your local IP address (e.g., `192.168.1.100`)
2. Update `algobot_app/.env.local`:
   ```
   BACKEND_URL=http://YOUR_IP_ADDRESS:4040/api
   BACKEND_BASE_URL=http://YOUR_IP_ADDRESS:4040
   ```

3. Replace `YOUR_IP_ADDRESS` with your actual IP (e.g., `192.168.1.100`)

## Example

If your local IP is `192.168.1.100`, your `.env.local` should have:
```
BACKEND_URL=http://192.168.1.100:4040/api
BACKEND_BASE_URL=http://192.168.1.100:4040
```

## Backend Server Configuration

Make sure your backend server is configured to accept connections from your local network:

1. The backend should bind to `0.0.0.0` (all interfaces), not just `localhost`
2. Check `backend/server.js` - it should listen on all interfaces by default
3. Ensure your firewall allows connections on port 4040

## Testing Connection

### From Mobile Device
1. Make sure your mobile device is on the **same Wi-Fi network** as your development machine
2. Open the Flutter app
3. The app should connect to: `http://YOUR_IP:4040/api`

### Test from Mobile Browser
Open on your mobile device:
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

## Troubleshooting

### Can't Connect from Mobile
1. **Check IP Address**: Make sure you're using the correct local IP
2. **Same Network**: Ensure mobile device and computer are on same Wi-Fi
3. **Firewall**: Check if firewall is blocking port 4040
4. **Backend Running**: Verify backend is running and accessible
5. **Port Forwarding**: Not needed for local network

### Firewall Settings (macOS)
```bash
# Allow incoming connections on port 4040
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/node
```

### Firewall Settings (Windows)
1. Open Windows Defender Firewall
2. Add inbound rule for port 4040
3. Allow connections from local network

## Production

For production, use your production backend URL:
```
BACKEND_URL=https://api.yourdomain.com/api
BACKEND_BASE_URL=https://api.yourdomain.com
```
