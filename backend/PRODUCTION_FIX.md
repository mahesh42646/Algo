# Production Environment Fix

## Issue
The backend server is failing to start because `ENCRYPTION_KEY` is missing in the production environment.

## Quick Fix

### Option 1: Add to .env.production file (Recommended)

1. SSH into your production server
2. Navigate to the backend directory:
   ```bash
   cd /home/mahesh/Algo/backend
   ```

3. Generate an encryption key:
   ```bash
   openssl rand -base64 32
   ```

4. Edit or create `.env.production`:
   ```bash
   nano .env.production
   ```

5. Add the ENCRYPTION_KEY (and other required variables if missing):
   ```env
   NODE_ENV=production
   BACKEND_PORT=4006
   MONGODB_URI=mongodb://localhost:27017/algobot_prod
   JWT_SECRET=your-existing-jwt-secret
   SESSION_SECRET=your-existing-session-secret
   ENCRYPTION_KEY=your-generated-key-from-step-3
   CORS_ORIGIN=https://algo.skylith.cloud
   ENABLE_REQUEST_LOGGING=false
   API_BASE_URL=https://algo.skylith.cloud/api
   RATE_LIMIT_WINDOW_MS=15
   RATE_LIMIT_MAX_REQUESTS=100
   ```

6. Save the file and restart PM2:
   ```bash
   pm2 restart algobot-backend
   pm2 logs algobot-backend
   ```

### Option 2: Set via PM2 Ecosystem File

1. Create or edit PM2 ecosystem file:
   ```bash
   nano ecosystem.config.js
   ```

2. Add environment variables:
   ```javascript
   module.exports = {
     apps: [{
       name: 'algobot-backend',
       script: './backend/server.js',
       env: {
         NODE_ENV: 'production',
         BACKEND_PORT: 4006,
         MONGODB_URI: 'mongodb://localhost:27017/algobot_prod',
         ENCRYPTION_KEY: 'your-generated-key-here',
         // ... other env vars
       }
     }]
   };
   ```

3. Restart with ecosystem file:
   ```bash
   pm2 delete algobot-backend
   pm2 start ecosystem.config.js
   pm2 save
   ```

### Option 3: Set Environment Variable Directly in PM2

```bash
pm2 delete algobot-backend
pm2 start backend/server.js --name "algobot-backend" \
  --env production \
  --update-env \
  -- ENCRYPTION_KEY="$(openssl rand -base64 32)"
pm2 save
```

**Note**: This method requires setting all environment variables in the command, which can be cumbersome.

## Verify Fix

After applying the fix, check the logs:
```bash
pm2 logs algobot-backend --lines 50
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:4006
```

If you still see the ENCRYPTION_KEY error, verify:
1. The key is exactly 32 bytes (base64 encoded)
2. No extra spaces or quotes around the key
3. The .env.production file is in the correct location
4. PM2 is reading the environment variables correctly

## Important Notes

⚠️ **CRITICAL**: 
- Keep the `ENCRYPTION_KEY` secure and backed up
- If you lose this key, all encrypted API keys in the database cannot be decrypted
- Use a different key for each environment (dev, staging, production)
- Never commit the key to version control

## After Fix

Once the server starts successfully:
1. Existing API keys in the database may need to be re-entered (if they were stored with old encryption)
2. New API keys will be encrypted with the new secure method
3. All sensitive data will be properly encrypted and never logged
