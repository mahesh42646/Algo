const axios = require('axios');

const TATUM_BASE_URL = process.env.TATUM_BASE_URL || 'https://api.tatum.io/v3';
const getTatumMode = () => (process.env.TATUM_MODE || 'test').toLowerCase();

const getEnvByMode = (baseName) => {
  const mode = getTatumMode();
  if (mode === 'production') {
    return process.env[`${baseName}_PROD`] || process.env[baseName];
  }
  return process.env[`${baseName}_TEST`] || process.env[baseName];
};

const getTatumApiKey = () => getEnvByMode('TATUM_API_KEY');
const getUsdtContract = () => getEnvByMode('TATUM_TRON_USDT_CONTRACT');

// Subscribe to address monitoring for TRC20 USDT deposits
const subscribeToAddressMonitoring = async (address) => {
  try {
    const apiKey = getTatumApiKey();
    if (!apiKey) {
      throw new Error('TATUM_API_KEY is required');
    }

    const webhookUrl = process.env.TATUM_WEBHOOK_URL || `${process.env.BACKEND_URL || 'https://algo.skylith.cloud/api'}/webhooks/tatum`;
    const contractAddress = getUsdtContract();

    console.log(`[WEBHOOK] Subscribing to address monitoring for ${address}`);
    console.log(`[WEBHOOK] Webhook URL: ${webhookUrl}`);
    console.log(`[WEBHOOK] Contract: ${contractAddress}`);

    // Subscribe to TRC20 token transfers (USDT)
    // Tatum v3 endpoint for subscription
    // In test mode, we monitor testnet transactions
    const mode = getTatumMode();
    const isTestMode = mode !== 'production';
    
    const subscriptionData = {
      type: 'ADDRESS_TRANSACTION',
      attr: {
        address: address,
        chain: 'TRON',  // Chain name is always TRON
        url: webhookUrl,
      },
    };

    // For testnet, we need to specify we're monitoring testnet
    if (isTestMode) {
      subscriptionData.attr.testnetType = 'TRON-SHASTA';  // or TRON-NILE
      console.log(`[WEBHOOK] Subscribing for TESTNET (Nile) monitoring`);
    }

    const response = await axios({
      method: 'post',
      url: `${TATUM_BASE_URL}/subscription`,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: subscriptionData,
      timeout: 20000,
    });

    console.log(`[WEBHOOK] ✅ Subscription created:`, {
      id: response.data.id,
      address,
      status: 'active',
    });

    return {
      success: true,
      subscriptionId: response.data.id,
      address,
      webhookUrl,
    };
  } catch (error) {
    if (error.response) {
      console.error(`[WEBHOOK] ❌ Subscription failed:`, {
        status: error.response.status,
        data: error.response.data,
        address,
      });
    } else {
      console.error(`[WEBHOOK] ❌ Subscription error:`, error.message);
    }
    
    // Don't throw error, just log it (webhook subscription is not critical for wallet creation)
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      address,
    };
  }
};

// List all active subscriptions
const listSubscriptions = async () => {
  try {
    const apiKey = getTatumApiKey();
    if (!apiKey) {
      throw new Error('TATUM_API_KEY is required');
    }

    const response = await axios({
      method: 'get',
      url: `${TATUM_BASE_URL}/subscription`,
      headers: {
        'x-api-key': apiKey,
      },
      timeout: 20000,
    });

    return response.data;
  } catch (error) {
    console.error(`[WEBHOOK] Error listing subscriptions:`, error.message);
    throw error;
  }
};

// Delete a subscription
const deleteSubscription = async (subscriptionId) => {
  try {
    const apiKey = getTatumApiKey();
    if (!apiKey) {
      throw new Error('TATUM_API_KEY is required');
    }

    await axios({
      method: 'delete',
      url: `${TATUM_BASE_URL}/subscription/${subscriptionId}`,
      headers: {
        'x-api-key': apiKey,
      },
      timeout: 20000,
    });

    console.log(`[WEBHOOK] ✅ Subscription deleted: ${subscriptionId}`);
    return { success: true };
  } catch (error) {
    console.error(`[WEBHOOK] Error deleting subscription:`, error.message);
    throw error;
  }
};

module.exports = {
  subscribeToAddressMonitoring,
  listSubscriptions,
  deleteSubscription,
};
