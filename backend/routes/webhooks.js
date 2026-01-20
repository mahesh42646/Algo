const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const {
  normalizeWebhookPayload,
  isValidUsdtTrc20Deposit,
  processDeposit,
} = require('../services/wallet_service');

const verifyWebhookSignature = (req) => {
  const secret = process.env.TATUM_WEBHOOK_SECRET;
  if (!secret) {
    return true;
  }

  const signature = req.headers['x-signature'] || req.headers['x-tatum-signature'];
  if (!signature || !req.rawBody) {
    return false;
  }

  const computed = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  return signature === computed;
};

router.post('/tatum', async (req, res) => {
  try {
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    const payload = normalizeWebhookPayload(req.body || {});
    if (!payload.address || !payload.txHash) {
      return res.status(200).json({ success: true, ignored: true, reason: 'Missing address/tx' });
    }

    if (!isValidUsdtTrc20Deposit(payload)) {
      return res.status(200).json({ success: true, ignored: true, reason: 'Not USDT TRC20' });
    }

    const result = await processDeposit(payload);
    if (result?.ignored) {
      return res.status(200).json({ success: true, ignored: true, reason: result.reason });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

module.exports = router;
