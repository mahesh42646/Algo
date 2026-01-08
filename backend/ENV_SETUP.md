# Backend Environment Setup

## Environment File Location
Backend uses `backend/.env.local` for all configuration.

## Required Environment Variables

### Server Configuration
- `BACKEND_PORT` - Server port (default: 4040)
- `NODE_ENV` - Environment (development/production)

### Database
- `MONGODB_URI` - MongoDB connection string

### Security
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `SESSION_SECRET` - Session secret (min 32 chars)
- `ENCRYPTION_KEY` - Encryption key (32 chars)

### CORS
- `CORS_ORIGIN` - Allowed origin for CORS

### Optional
- `API_RATE_LIMIT_MAX` - Max requests per window
- `API_RATE_LIMIT_WINDOW_MS` - Rate limit window in ms
- `LOG_LEVEL` - Logging level
- `ENABLE_REQUEST_LOGGING` - Enable request logging (true/false)

## Generating Secure Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Session Secret
openssl rand -base64 32

# Generate Encryption Key
openssl rand -base64 32
```

## Security Notes
- Never commit `.env.local` to version control
- Use different secrets for development and production
- Rotate secrets regularly in production
- Keep secrets at least 32 characters long
