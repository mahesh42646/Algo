# Quick Security Setup Guide

## ⚠️ CRITICAL: Generate Encryption Key

Before starting the server, you **MUST** generate and set the `ENCRYPTION_KEY` environment variable.

### Step 1: Generate Encryption Key
```bash
openssl rand -base64 32
```

This will output something like:
```
K8mN3pQ7rT2vX9yZ1aB4cD6eF8gH0jL2mN4pQ6rT8vX0yZ2aB4cD6eF8gH0=
```

### Step 2: Add to Environment File

**For Development** (`backend/.env.local`):
```env
ENCRYPTION_KEY=K8mN3pQ7rT2vX9yZ1aB4cD6eF8gH0jL2mN4pQ6rT8vX0yZ2aB4cD6eF8gH0=
```

**For Production** (`backend/.env.production`):
```env
ENCRYPTION_KEY=your-production-encryption-key-here
```

### Step 3: Install Dependencies
```bash
cd backend
npm install
```

### Step 4: Start Server
```bash
npm start
```

The server will **refuse to start** if `ENCRYPTION_KEY` is missing or invalid.

## What Changed?

1. ✅ **API keys and secrets are now encrypted with AES-256-GCM** (256-bit encryption)
2. ✅ **Sensitive data is never logged** - all logs are automatically sanitized
3. ✅ **Rate limiting** added to prevent abuse
4. ✅ **Input validation** for all API credentials
5. ✅ **Secure CORS** configuration
6. ✅ **Error messages** don't expose sensitive information

## Migration Notes

If you have existing API keys stored in the database:
- They will need to be re-entered (recommended for security)
- Or users can update them through the app interface

## Testing

After setup, verify:
1. Server starts without errors
2. API keys can be added through the app
3. API keys are encrypted in the database
4. Logs don't show sensitive data

## Need Help?

See `SECURITY_IMPROVEMENTS.md` for detailed information about all security enhancements.
