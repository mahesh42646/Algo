# Security Implementation

## Overview
This document outlines the security measures implemented in the AlgoBot backend to protect sensitive data, especially API keys and secrets.

## Encryption

### API Credentials Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **Key Format**: Hex string (64 characters)
- **Authentication**: GCM provides authenticated encryption

### Encryption Key Management
- Encryption key is stored in `.env` as `ENCRYPTION_KEY`
- Key is validated on server startup (must be exactly 32 bytes)
- Key is never logged or exposed in error messages
- Generate key with: `openssl rand -hex 32`

### Data Protection
- All API keys and secrets are encrypted before storage in MongoDB
- Encrypted data format: `iv:authTag:encryptedData` (all hex)
- Decryption only occurs when credentials are needed for API calls
- Decrypted credentials are never logged or exposed in responses

## Logging Security

### Sensitive Data Sanitization
- All request/response bodies are sanitized before logging
- Sensitive fields are automatically masked:
  - `apiKey`, `apiSecret`, `secret`, `password`
  - `token`, `accessToken`, `refreshToken`
  - `authorization`, `auth`, `credentials`
  - `privateKey`, `private_key`, `secretKey`, `secret_key`

### Header Sanitization
- Authorization headers are masked in logs
- Cookie headers are masked
- API key headers are masked

### Error Handling
- Error messages never expose sensitive data
- Encryption/decryption errors are generic
- Stack traces only shown in development mode

## Input Validation

### API Route Validation
- Platform validation (whitelist of allowed platforms)
- API key format validation (minimum length, type checking)
- API secret format validation
- Order parameters validation (symbol, side, type, quantity, price)

### Data Sanitization
- All inputs are trimmed
- Platform names are lowercased
- Quantity and price are parsed and validated as numbers

## Rate Limiting

### Implementation
- Rate limiting middleware applied to all `/api` routes
- Configurable via environment variables:
  - `RATE_LIMIT_WINDOW`: Time window in minutes (default: 15)
  - `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

### Protection
- Prevents brute force attacks
- Prevents API abuse
- Returns 429 status with retry information

## Security Headers

### Helmet Configuration
- HSTS (HTTP Strict Transport Security) enabled
- XSS protection enabled
- Content type sniffing disabled
- Powered-by header removed
- CSP disabled (for ngrok compatibility)

## Credential Endpoints

### `/api/exchange/:userId/:platform/credentials`
- **WARNING**: Returns decrypted credentials
- Only used internally for trading operations
- Response data is sanitized by logger middleware
- Should be protected by authentication in production

## Best Practices

### Environment Variables
- Never commit `.env` to version control
- Use strong, randomly generated secrets
- Rotate secrets regularly
- Use different secrets for development and production

### API Key Storage
- Keys are encrypted with 256-bit AES before storage
- Never store keys in plain text
- Never log keys or secrets
- Never expose keys in error messages

### Error Messages
- Generic error messages for users
- Detailed errors only in development mode
- Never expose encryption keys or internal errors

## Security Checklist

- ✅ API keys encrypted with AES-256-GCM
- ✅ Encryption key validated on startup
- ✅ Sensitive data sanitized in logs
- ✅ Input validation on all routes
- ✅ Rate limiting implemented
- ✅ Security headers configured
- ✅ Error messages don't expose sensitive data
- ✅ Credentials never logged
- ✅ Environment variables properly managed

## Migration Notes

If you have existing API keys stored with the old encryption:
1. Users will need to re-enter their API keys
2. Old encrypted data cannot be decrypted with new encryption key
3. Consider a migration script if needed

## Generating Secure Keys

```bash
# Generate Encryption Key (256-bit)
openssl rand -hex 32

# Generate JWT Secret
openssl rand -base64 32

# Generate Session Secret
openssl rand -base64 32
```
