const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../schemas/user');
const { encrypt, decrypt, maskApiKey } = require('../utils/encryption');
const { exchangeLimiter, strictLimiter } = require('../middleware/rateLimiter');

// Input validation helper
function validateApiCredentials(apiKey, apiSecret) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key is required and must be a non-empty string' };
  }
  if (!apiSecret || typeof apiSecret !== 'string' || apiSecret.trim().length === 0) {
    return { valid: false, error: 'API secret is required and must be a non-empty string' };
  }
  if (apiKey.length < 10 || apiKey.length > 200) {
    return { valid: false, error: 'API key length must be between 10 and 200 characters' };
  }
  if (apiSecret.length < 10 || apiSecret.length > 200) {
    return { valid: false, error: 'API secret length must be between 10 and 200 characters' };
  }
  return { valid: true };
}

// Get all exchange APIs for a user
router.get('/:userId', exchangeLimiter, async (req, res, next) => {
  try {
    const { userId } = req.params;
    // Log without sensitive data
    console.log(`[EXCHANGE API GET] Fetching APIs for user: ${userId}`);

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Return APIs with masked keys
    const maskedApis = user.exchangeApis.map(api => ({
      _id: api._id,
      platform: api.platform,
      apiKey: maskApiKey(api.apiKey),
      label: api.label,
      permissions: api.permissions,
      isActive: api.isActive,
      lastUsed: api.lastUsed,
      createdAt: api.createdAt,
    }));

    console.log(`[EXCHANGE API GET] ✅ Found ${maskedApis.length} APIs`);
    res.json({
      success: true,
      data: maskedApis,
    });
  } catch (error) {
    console.error(`[EXCHANGE API GET] ❌ Error:`, error);
    next(error);
  }
});

// Add new exchange API
router.post('/:userId', strictLimiter, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { platform, apiKey, apiSecret, label, permissions } = req.body;

    // Log without sensitive data
    console.log(`[EXCHANGE API ADD] Adding API for user: ${userId}, platform: ${platform || 'unknown'}`);

    if (!platform || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'Platform, API key, and API secret are required',
      });
    }

    // Validate input
    const validation = validateApiCredentials(apiKey, apiSecret);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if API for this platform already exists
    const existingApi = user.exchangeApis.find(
      api => api.platform === platform && api.isActive
    );

    if (existingApi) {
      return res.status(409).json({
        success: false,
        error: `Active API for ${platform} already exists. Please delete it first or update it.`,
      });
    }

    // Encrypt API credentials before storing
    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);

    const newApi = {
      platform,
      apiKey: encryptedKey,
      apiSecret: encryptedSecret,
      label: label || 'Default',
      permissions: permissions || ['read', 'spot_trade'],
      isActive: true,
      createdAt: new Date(),
    };

    user.exchangeApis.push(newApi);

    // Add notification
    user.notifications.push({
      title: 'API Key Added 🔑',
      message: `Your ${platform.toUpperCase()} API has been successfully linked.`,
      type: 'success',
      read: false,
      createdAt: new Date(),
    });

    await user.save();

    const savedApi = user.exchangeApis[user.exchangeApis.length - 1];

    console.log(`[EXCHANGE API ADD] ✅ API added successfully`);
    res.status(201).json({
      success: true,
      message: 'Exchange API added successfully',
      data: {
        _id: savedApi._id,
        platform: savedApi.platform,
        apiKey: maskApiKey(apiKey),
        label: savedApi.label,
        permissions: savedApi.permissions,
        isActive: savedApi.isActive,
        createdAt: savedApi.createdAt,
      },
    });
  } catch (error) {
    console.error(`[EXCHANGE API ADD] ❌ Error:`, error);
    next(error);
  }
});

// Update exchange API
router.put('/:userId/:apiId', strictLimiter, async (req, res, next) => {
  try {
    const { userId, apiId } = req.params;
    const { apiKey, apiSecret, label, permissions, isActive } = req.body;

    // Log without sensitive data
    console.log(`[EXCHANGE API UPDATE] Updating API: ${apiId} for user: ${userId}`);

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.id(apiId);

    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found',
      });
    }

    // Update fields with validation
    if (apiKey) {
      const validation = validateApiCredentials(apiKey, apiSecret || 'dummy');
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }
      api.apiKey = encrypt(apiKey);
    }
    if (apiSecret) {
      const validation = validateApiCredentials(apiKey || 'dummy', apiSecret);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }
      api.apiSecret = encrypt(apiSecret);
    }
    if (label !== undefined) api.label = label;
    if (permissions) api.permissions = permissions;
    if (isActive !== undefined) api.isActive = isActive;

    await user.save();

    console.log(`[EXCHANGE API UPDATE] ✅ API updated successfully`);
    res.json({
      success: true,
      message: 'Exchange API updated successfully',
      data: {
        _id: api._id,
        platform: api.platform,
        apiKey: maskApiKey(apiKey || 'existing'),
        label: api.label,
        permissions: api.permissions,
        isActive: api.isActive,
        createdAt: api.createdAt,
      },
    });
  } catch (error) {
    console.error(`[EXCHANGE API UPDATE] ❌ Error:`, error);
    next(error);
  }
});

// Delete exchange API
router.delete('/:userId/:apiId', strictLimiter, async (req, res, next) => {
  try {
    const { userId, apiId } = req.params;

    // Log without sensitive data
    console.log(`[EXCHANGE API DELETE] Deleting API: ${apiId} for user: ${userId}`);

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.id(apiId);

    if (!api) {
      return res.status(404).json({
        success: false,
        error: 'API not found',
      });
    }

    const platform = api.platform;
    user.exchangeApis.pull(apiId);

    // Add notification
    user.notifications.push({
      title: 'API Key Removed',
      message: `Your ${platform.toUpperCase()} API has been unlinked.`,
      type: 'info',
      read: false,
      createdAt: new Date(),
    });

    await user.save();

    console.log(`[EXCHANGE API DELETE] ✅ API deleted successfully`);
    res.json({
      success: true,
      message: 'Exchange API deleted successfully',
    });
  } catch (error) {
    console.error(`[EXCHANGE API DELETE] ❌ Error:`, error);
    next(error);
  }
});

// Get decrypted API credentials (internal use for trading)
// WARNING: This endpoint returns sensitive data - ensure it's only used internally
router.get('/:userId/:platform/credentials', exchangeLimiter, async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    // Log without sensitive data
    console.log(`[EXCHANGE API CREDENTIALS] Getting credentials for user: ${userId}, platform: ${platform}`);

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Update last used timestamp
    api.lastUsed = new Date();
    await user.save();

    // Decrypt and return credentials
    // NOTE: This is sensitive data - it will be sanitized by logger middleware
    const credentials = {
      apiKey: decrypt(api.apiKey),
      apiSecret: decrypt(api.apiSecret),
      permissions: api.permissions,
    };

    // Log success without exposing credentials
    console.log(`[EXCHANGE API CREDENTIALS] ✅ Credentials retrieved for ${platform}`);
    res.json({
      success: true,
      data: credentials,
    });
  } catch (error) {
    console.error(`[EXCHANGE API CREDENTIALS] ❌ Error:`, error);
    next(error);
  }
});

// Verify API connection with exchange
router.post('/:userId/:platform/verify', exchangeLimiter, async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    // Log without sensitive data
    console.log(`[EXCHANGE API VERIFY] Verifying API for user: ${userId}, platform: ${platform}`);

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Decrypt credentials
    const apiKey = decrypt(api.apiKey);
    const apiSecret = decrypt(api.apiSecret);

    // Verify with Binance API
    if (platform === 'binance') {
      const axios = require('axios');
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');

      try {
        const response = await axios.get(
          `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
          {
            headers: {
              'X-MBX-APIKEY': apiKey,
            },
            timeout: 10000,
          }
        );

        // Update last used
        api.lastUsed = new Date();
        await user.save();

        console.log(`[EXCHANGE API VERIFY] ✅ API verified successfully`);
        res.json({
          success: true,
          message: 'API connection verified successfully',
          data: {
            canTrade: response.data.canTrade,
            canWithdraw: response.data.canWithdraw,
            canDeposit: response.data.canDeposit,
            balances: response.data.balances
              .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
              .slice(0, 10), // Return top 10 non-zero balances
          },
        });
      } catch (apiError) {
        console.error(`[EXCHANGE API VERIFY] ❌ Binance API error:`, apiError.response?.data || apiError.message);
        return res.status(400).json({
          success: false,
          error: 'API verification failed. Please check your API key and secret.',
          details: apiError.response?.data?.msg || apiError.message,
        });
      }
    } else {
      // For other platforms, just return success for now
      res.json({
        success: true,
        message: 'API stored successfully. Verification for this platform coming soon.',
      });
    }
  } catch (error) {
    console.error(`[EXCHANGE API VERIFY] ❌ Error:`, error);
    next(error);
  }
});

// Get account balance from exchange
router.get('/:userId/:platform/balance', exchangeLimiter, async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    // Log without sensitive data
    console.log(`[EXCHANGE BALANCE] Getting balance for user: ${userId}, platform: ${platform}`);

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    const apiKey = decrypt(api.apiKey);
    const apiSecret = decrypt(api.apiSecret);

    if (platform === 'binance') {
      const axios = require('axios');
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');

      try {
        const response = await axios.get(
          `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
          {
            headers: {
              'X-MBX-APIKEY': apiKey,
            },
            timeout: 10000,
          }
        );

        const balances = response.data.balances
          .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
          .map(b => ({
            asset: b.asset,
            free: parseFloat(b.free),
            locked: parseFloat(b.locked),
            total: parseFloat(b.free) + parseFloat(b.locked),
          }));

        console.log(`[EXCHANGE BALANCE] ✅ Got ${balances.length} non-zero balances`);
        res.json({
          success: true,
          data: {
            balances,
            canTrade: response.data.canTrade,
            canWithdraw: response.data.canWithdraw,
          },
        });
      } catch (apiError) {
        console.error(`[EXCHANGE BALANCE] ❌ Binance API error:`, apiError.response?.data || apiError.message);
        return res.status(400).json({
          success: false,
          error: 'Failed to get balance from Binance',
          details: apiError.response?.data?.msg || apiError.message,
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: `Balance retrieval for ${platform} not implemented yet`,
      });
    }
  } catch (error) {
    console.error(`[EXCHANGE BALANCE] ❌ Error:`, error);
    next(error);
  }
});

// Place order on exchange
router.post('/:userId/:platform/order', exchangeLimiter, async (req, res, next) => {
  try {
    const { userId, platform } = req.params;
    const { symbol, side, type, quantity, price } = req.body;

    // Log without sensitive data
    console.log(`[EXCHANGE ORDER] Placing order for user: ${userId}, platform: ${platform}`);
    console.log(`[EXCHANGE ORDER] Order details: ${side} ${quantity} ${symbol} @ ${price || 'market'}`);

    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, side, type, and quantity are required',
      });
    }

    const user = await User.findOne({ userId }).select('exchangeApis notifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Check permissions
    if (!api.permissions.includes('spot_trade')) {
      return res.status(403).json({
        success: false,
        error: 'API does not have trading permission',
      });
    }

    const apiKey = decrypt(api.apiKey);
    const apiSecret = decrypt(api.apiSecret);

    if (platform === 'binance') {
      const axios = require('axios');
      const timestamp = Date.now();
      
      let queryString = `symbol=${symbol}&side=${side.toUpperCase()}&type=${type.toUpperCase()}&quantity=${quantity}&timestamp=${timestamp}`;
      
      if (type.toUpperCase() === 'LIMIT' && price) {
        queryString += `&price=${price}&timeInForce=GTC`;
      }
      
      const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');

      try {
        const response = await axios.post(
          `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
          null,
          {
            headers: {
              'X-MBX-APIKEY': apiKey,
            },
            timeout: 10000,
          }
        );

        // Add notification
        user.notifications.push({
          title: `Order ${side.toUpperCase()} Executed 📈`,
          message: `${side.toUpperCase()} ${quantity} ${symbol} - Order ID: ${response.data.orderId}`,
          type: 'success',
          read: false,
          createdAt: new Date(),
        });
        await user.save();

        console.log(`[EXCHANGE ORDER] ✅ Order placed successfully: ${response.data.orderId}`);
        res.json({
          success: true,
          message: 'Order placed successfully',
          data: {
            orderId: response.data.orderId,
            symbol: response.data.symbol,
            side: response.data.side,
            type: response.data.type,
            quantity: response.data.origQty,
            price: response.data.price,
            status: response.data.status,
            executedQty: response.data.executedQty,
          },
        });
      } catch (apiError) {
        console.error(`[EXCHANGE ORDER] ❌ Binance API error:`, apiError.response?.data || apiError.message);
        return res.status(400).json({
          success: false,
          error: 'Failed to place order on Binance',
          details: apiError.response?.data?.msg || apiError.message,
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: `Trading on ${platform} not implemented yet`,
      });
    }
  } catch (error) {
    console.error(`[EXCHANGE ORDER] ❌ Error:`, error);
    next(error);
  }
});

module.exports = router;
