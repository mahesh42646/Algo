const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const User = require('../schemas/user');

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'algobot-default-encryption-key32';
const IV_LENGTH = 16;

// Encrypt sensitive data
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt sensitive data
function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Mask API key for display (show first 4 and last 4 characters)
function maskApiKey(apiKey) {
  if (apiKey.length <= 8) return '****';
  return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
}

// Get all exchange APIs for a user
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
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
router.post('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { platform, apiKey, apiSecret, label, permissions } = req.body;

    console.log(`[EXCHANGE API ADD] Adding API for user: ${userId}, platform: ${platform}`);

    if (!platform || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'Platform, API key, and API secret are required',
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
router.put('/:userId/:apiId', async (req, res, next) => {
  try {
    const { userId, apiId } = req.params;
    const { apiKey, apiSecret, label, permissions, isActive } = req.body;

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

    // Update fields
    if (apiKey) api.apiKey = encrypt(apiKey);
    if (apiSecret) api.apiSecret = encrypt(apiSecret);
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
router.delete('/:userId/:apiId', async (req, res, next) => {
  try {
    const { userId, apiId } = req.params;

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
router.get('/:userId/:platform/credentials', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

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
    const credentials = {
      apiKey: decrypt(api.apiKey),
      apiSecret: decrypt(api.apiSecret),
      permissions: api.permissions,
    };

    console.log(`[EXCHANGE API CREDENTIALS] ✅ Credentials retrieved`);
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
router.post('/:userId/:platform/verify', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

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
router.get('/:userId/:platform/balance', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

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
router.post('/:userId/:platform/order', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;
    const { symbol, side, type, quantity, price } = req.body;

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
