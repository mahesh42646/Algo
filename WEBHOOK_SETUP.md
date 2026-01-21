# Webhook Setup for Real-Time Deposit Detection

## Overview
The system now automatically monitors TRON addresses for USDT TRC20 deposits using Tatum webhooks.

## How It Works

1. **Automatic Subscription**: When a new wallet is created for a user, the system automatically subscribes that address to Tatum's webhook monitoring service.

2. **Real-Time Detection**: When USDT is sent to the user's deposit address:
   - Tatum detects the transaction on the blockchain
   - Tatum sends a webhook to: `https://algo.skylith.cloud/api/webhooks/tatum`
   - Backend processes the deposit automatically
   - User's balance is updated in the platform

3. **Conditional Sweeping**:
   - Deposits < 100 USDT: Held in user's address, credited to platform balance
   - Deposits >= 100 USDT: Swept to master wallet, credited to platform balance

## Setup Instructions

### 1. Update Environment Variables

Make sure your `backend/.env` has:
```bash
TATUM_WEBHOOK_URL=https://algo.skylith.cloud/api/webhooks/tatum
TATUM_WEBHOOK_SECRET=your-webhook-secret-here
```

### 2. Restart Backend
```bash
pm2 restart algo-backend
```

### 3. Subscribe Existing User Addresses

For users that already have wallets created before webhook system:

```bash
curl -X POST https://algo.skylith.cloud/api/admin/subscribe-all-addresses
```

This will subscribe all existing user addresses to webhook monitoring.

### 4. Verify Webhooks Are Active

Check active subscriptions:
```bash
curl https://algo.skylith.cloud/api/admin/subscriptions
```

## Testing Your Deposit

1. **Get your deposit address** from the app's profile/wallet section
2. **Send USDT (TRC20)** from TronLink to your deposit address
3. **Wait for confirmation** (~1-2 minutes on Nile testnet)
4. **Check your balance** - it should update automatically

## Webhook Endpoint

- **URL**: `POST /api/webhooks/tatum`
- **Security**: HMAC signature verification
- **Response**: 200 OK (success), 401 (invalid signature), 500 (processing error)

## Monitoring Logs

Watch for webhook events in your backend logs:
```bash
pm2 logs algo-backend
```

Look for:
- `[WEBHOOK] Subscribing to address monitoring`
- `[WEBHOOK] ✅ Subscription created`
- `[DEPOSIT] Processing deposit`
- `[WALLET] Balance updated`

## Troubleshooting

### Webhook Not Receiving Events

1. **Check subscription status**:
   ```bash
   curl https://algo.skylith.cloud/api/admin/subscriptions
   ```

2. **Verify webhook URL is accessible**:
   - Make sure `https://algo.skylith.cloud/api/webhooks/tatum` is publicly accessible
   - Tatum needs to reach this endpoint from the internet

3. **Check Tatum Dashboard**:
   - Log into your Tatum account
   - Check webhook subscriptions
   - Look for any error messages

### Deposits Not Processing

1. **Check transaction on blockchain**:
   - Use Nile Testnet explorer: https://nile.tronscan.org
   - Verify transaction is confirmed
   - Check it's TRC20 USDT transfer

2. **Check backend logs**:
   ```bash
   pm2 logs algo-backend --lines 100
   ```

3. **Verify deposit address**:
   - Make sure you sent to the correct address shown in your profile

### Manual Webhook Test

Simulate a deposit webhook call (test mode only):
```bash
curl -X POST https://algo.skylith.cloud/api/test/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "amount": 1
  }'
```

## Environment-Specific Notes

### Test Mode (Nile Testnet)
- Uses test API keys
- Monitors addresses on Nile testnet
- Minimum deposit: 0.01 USDT (for testing)
- Sweep threshold: 100 USDT

### Production Mode
- Uses production API keys
- Monitors addresses on mainnet
- Minimum deposit: 100 USDT
- Sweep threshold: 100 USDT

## Support

If you encounter issues:
1. Check backend logs: `pm2 logs algo-backend`
2. Verify subscription: `curl https://algo.skylith.cloud/api/admin/subscriptions`
3. Test webhook endpoint: `curl -X POST https://algo.skylith.cloud/api/webhooks/tatum -d '{"test":true}'`
