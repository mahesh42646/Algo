# Backend Environment Setup

## Environment File Location
Backend uses `backend/.env` for all configuration.

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

### Tatum (USDT TRC20 Deposits)
- `TATUM_MODE` - `test` or `production`
- `TATUM_API_KEY_TEST` / `TATUM_API_KEY_PROD` - Tatum API keys
- `TATUM_WEBHOOK_SECRET` - Webhook signature secret
- `TATUM_TRON_CHAIN_TEST` / `TATUM_TRON_CHAIN_PROD` - Chain names
- `TATUM_TRON_USDT_CONTRACT_TEST` / `TATUM_TRON_USDT_CONTRACT_PROD` - USDT TRC20 contract
- `TATUM_MASTER_ADDRESS_TEST` / `TATUM_MASTER_ADDRESS_PROD` - Master TRON address
- `TATUM_MASTER_PRIVATE_KEY_TEST` / `TATUM_MASTER_PRIVATE_KEY_PROD` - Master private key
- `TATUM_MIN_DEPOSIT_USDT` - Minimum USDT deposit (default 100)
- `TATUM_TRX_GAS_AMOUNT` - TRX sent to user for gas (default 35)
- `TATUM_TRX_DUST_AMOUNT` - TRX left in user wallet (default 1)

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
- Never commit `.env` to version control
- Use different secrets for development and production
- Rotate secrets regularly in production
- Keep secrets at least 32 characters long
- **ENCRYPTION_KEY is REQUIRED** - Must be exactly 32 bytes (64 hex characters)
- Generate ENCRYPTION_KEY with: `openssl rand -hex 32`