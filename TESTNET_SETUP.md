# 🧪 TRON Nile Testnet Setup Guide

## The Problem You're Experiencing

You sent 1 USDT from TronLink to `TCowFxz2FpscxpVzbmC3L4Ez3VdfD6bXrj`, but:
- Transaction doesn't show on Tronscan
- App doesn't detect the deposit
- USDT was deducted from your account

**Root Cause**: Your TronLink is on **MAINNET**, but the app is in **TEST MODE** (monitoring Nile testnet).

**Important**: The same address (e.g., TCowFxz2FpscxpVzbmC3L4Ez3VdfD6bXrj) exists on BOTH mainnet and testnet - they're separate blockchains!

## ✅ Solution: Switch TronLink to Nile Testnet

### Step 1: Switch TronLink to Nile Testnet

#### On TronLink Mobile:
1. Open TronLink app
2. Tap on your wallet name at the top
3. Tap the **Settings** icon (⚙️)
4. Tap **Node Settings**
5. Select **Nile Testnet** (or add it if not available)
6. Confirm the switch

#### On TronLink Browser Extension:
1. Open TronLink extension
2. Click on your profile icon (top right)
3. Click **Settings**
4. Go to **Node Setting**
5. Select **Nile Testnet** from dropdown
6. Click **Confirm**

#### If Nile Testnet is Not Available:
Add it manually:
- **Network Name**: Nile Testnet
- **RPC URL**: `https://nile.trongrid.io`
- **Chain ID**: Leave default
- **Explorer**: `https://nile.tronscan.org`

### Step 2: Get Test TRX (Gas)

You need TRX for transaction fees:

1. Go to Nile Testnet Faucet: https://nileex.io/join/getJoinPage
2. Enter your TRON address: `TCowFxz2FpscxpVzbmC3L4Ez3VdfD6bXrj`
3. Complete CAPTCHA
4. Click "Submit"
5. Wait 1-2 minutes
6. You'll receive 10,000 test TRX

### Step 3: Get Test USDT (TRC20)

Option A - Using Testnet Faucet:
1. Search for "TRON Nile USDT faucet"
2. Request test USDT tokens

Option B - Use Test Endpoint (Easier):
```bash
# Simulate a deposit (test mode only)
curl -X POST https://algo.skylith.cloud/api/test/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "amount": 1
  }'
```

### Step 4: Send Test USDT

Once you have test USDT:
1. **Verify** you're on Nile Testnet in TronLink (check top of app)
2. Send 1 USDT (TRC20) to: `TCowFxz2FpscxpVzbmC3L4Ez3VdfD6bXrj`
3. Confirm transaction
4. Wait 1-2 minutes for confirmation

### Step 5: Verify on Testnet Explorer

1. Go to: https://nile.tronscan.org
2. Search for: `TCowFxz2FpscxpVzbmC3L4Ez3VdfD6bXrj`
3. You should see the transaction

## 🔍 How to Check Which Network You're On

### In TronLink:
- Look at the top of the app
- It should say **"Nile Testnet"** or **"Mainnet"**
- Network indicator is usually near your address/balance

### On Tronscan:
- **Mainnet**: https://tronscan.org
- **Nile Testnet**: https://nile.tronscan.org

The SAME address will show different transactions on each explorer!

## 📊 What Happens After Sending (Test Mode)

1. **Transaction Confirms** (~1-2 minutes on Nile testnet)
2. **Tatum Detects** the deposit via webhook
3. **Backend Processes**:
   - Verifies it's TRC20 USDT
   - Credits your platform balance: +1 USDT
   - Does NOT sweep (amount < 100 USDT)
4. **App Updates**: Your balance shows +1 USDT

## ⚠️ Common Mistakes

❌ **Sending from Mainnet to address monitored on Testnet**
- Your funds go to mainnet address
- App monitors testnet address
- They never meet!

❌ **Checking wrong explorer**
- Sending on testnet but checking tronscan.org (mainnet)
- Always use https://nile.tronscan.org for testnet

❌ **Not having TRX for fees**
- TRC20 transfers need TRX for gas
- Get free test TRX from faucet first

## 🎯 Quick Test Without Real USDT

Use the test deposit endpoint:

```bash
# Get your user ID from the app or API
USER_ID="your-firebase-uid-here"

# Simulate a 1 USDT deposit
curl -X POST https://algo.skylith.cloud/api/test/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "amount": 1
  }'
```

This will:
- ✅ Instantly credit 1 USDT to your platform balance
- ✅ Create a test transaction record
- ✅ Bypass blockchain entirely (test mode only)

## 🔄 Switching Between Test and Production

### Currently: TEST MODE
- Monitoring: Nile Testnet
- Addresses: Work on testnet
- Min deposit: 0.01 USDT

### To Switch to PRODUCTION:
Update `backend/.env`:
```bash
TATUM_MODE=production
```

Then restart:
```bash
pm2 restart algo-backend
```

## 🆘 Still Not Working?

### 1. Verify Your Setup:
```bash
# Check if webhook is subscribed
curl https://algo.skylith.cloud/api/admin/subscriptions

# Check your user's deposit address
curl https://algo.skylith.cloud/api/users/YOUR_USER_ID
```

### 2. Check Backend Logs:
```bash
pm2 logs algo-backend --lines 100
```

Look for:
- `[WEBHOOK]` messages
- `[DEPOSIT]` messages
- Any error messages

### 3. Manual Webhook Trigger:
Simulate what happens when USDT arrives:
```bash
curl -X POST https://algo.skylith.cloud/api/webhooks/tatum \
  -H "Content-Type: application/json" \
  -d '{
    "address": "TCowFxz2FpscxpVzbmC3L4Ez3VdfD6bXrj",
    "txHash": "test-tx-'$(date +%s)'",
    "amount": 1,
    "chain": "TRON",
    "token": "USDT",
    "contractAddress": ""
  }'
```

## 📝 Summary: Your Next Steps

1. ✅ Switch TronLink to **Nile Testnet**
2. ✅ Get test TRX from faucet
3. ✅ Use test deposit endpoint OR get test USDT
4. ✅ Send 1 USDT (TRC20) to your deposit address
5. ✅ Check https://nile.tronscan.org for transaction
6. ✅ Watch your app balance update

## 🚀 For Production Later

When ready to go live:
1. Update `TATUM_MODE=production` in `.env`
2. Use production API keys
3. Switch TronLink back to Mainnet
4. Send real USDT
5. Everything works the same!
