const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../schemas/user');
const { encrypt, decrypt, maskSensitiveData } = require('../utils/encryption');

// Get all exchange APIs for a user
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Return APIs with masked keys (never expose actual keys)
    const maskedApis = user.exchangeApis.map(api => ({
      _id: api._id,
      platform: api.platform,
      apiKey: maskSensitiveData(api.apiKey), // Mask encrypted key for display
      label: api.label,
      permissions: api.permissions,
      isActive: api.isActive,
      lastUsed: api.lastUsed,
      createdAt: api.createdAt,
    }));

    res.json({
      success: true,
      data: maskedApis,
    });
  } catch (error) {
    console.error(`[EXCHANGE API GET] ❌ Error:`, error.message);
    next(error);
  }
});

// Add new exchange API
router.post('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { platform, apiKey, apiSecret, label, permissions } = req.body;

    // Validate input
    if (!platform || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'Platform, API key, and API secret are required',
      });
    }

    // Validate platform
    const validPlatforms = ['binance', 'kucoin', 'bybit', 'okx', 'gate.io', 'huobi'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`,
      });
    }

    // Validate API key and secret format (basic validation)
    if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key format',
      });
    }

    if (typeof apiSecret !== 'string' || apiSecret.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API secret format',
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
      api => api.platform === platform.toLowerCase() && api.isActive
    );

    if (existingApi) {
      return res.status(409).json({
        success: false,
        error: `Active API for ${platform} already exists. Please delete it first or update it.`,
      });
    }

    // Encrypt API credentials before storing (256-bit AES encryption)
    const encryptedKey = encrypt(apiKey.trim());
    const encryptedSecret = encrypt(apiSecret.trim());

    const newApi = {
      platform: platform.toLowerCase(),
      apiKey: encryptedKey,
      apiSecret: encryptedSecret,
      label: (label || 'Default').trim(),
      permissions: Array.isArray(permissions) ? permissions : ['read', 'spot_trade'],
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

    // Never return actual credentials, only masked version
    res.status(201).json({
      success: true,
      message: 'Exchange API added successfully',
      data: {
        _id: savedApi._id,
        platform: savedApi.platform,
        apiKey: maskSensitiveData(apiKey), // Mask original key for response
        label: savedApi.label,
        permissions: savedApi.permissions,
        isActive: savedApi.isActive,
        createdAt: savedApi.createdAt,
      },
    });
  } catch (error) {
    // Don't expose encryption errors
    if (error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE API ADD] ❌ Encryption configuration error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE API ADD] ❌ Error:`, error.message);
    next(error);
  }
});

// Update exchange API
router.put('/:userId/:apiId', async (req, res, next) => {
  try {
    const { userId, apiId } = req.params;
    const { apiKey, apiSecret, label, permissions, isActive } = req.body;

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
    if (apiKey !== undefined) {
      if (typeof apiKey !== 'string' || apiKey.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API key format',
        });
      }
      api.apiKey = encrypt(apiKey.trim());
    }
    
    if (apiSecret !== undefined) {
      if (typeof apiSecret !== 'string' || apiSecret.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Invalid API secret format',
        });
      }
      api.apiSecret = encrypt(apiSecret.trim());
    }
    
    if (label !== undefined) {
      api.label = typeof label === 'string' ? label.trim() : label;
    }
    
    if (permissions !== undefined) {
      api.permissions = Array.isArray(permissions) ? permissions : api.permissions;
    }
    
    if (isActive !== undefined) {
      api.isActive = Boolean(isActive);
    }

    await user.save();

    // Never return actual credentials
    res.json({
      success: true,
      message: 'Exchange API updated successfully',
      data: {
        _id: api._id,
        platform: api.platform,
        apiKey: maskSensitiveData(apiKey || 'existing'),
        label: api.label,
        permissions: api.permissions,
        isActive: api.isActive,
        createdAt: api.createdAt,
      },
    });
  } catch (error) {
    if (error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE API UPDATE] ❌ Encryption configuration error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE API UPDATE] ❌ Error:`, error.message);
    next(error);
  }
});

// Delete exchange API
router.delete('/:userId/:apiId', async (req, res, next) => {
  try {
    const { userId, apiId } = req.params;

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

    res.json({
      success: true,
      message: 'Exchange API deleted successfully',
    });
  } catch (error) {
    console.error(`[EXCHANGE API DELETE] ❌ Error:`, error.message);
    next(error);
  }
});

// Get decrypted API credentials (internal use for trading)
// WARNING: This endpoint returns sensitive data - ensure it's only called internally
// and never logged or exposed
router.get('/:userId/:platform/credentials', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform.toLowerCase() && a.isActive
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
    // NOTE: This data will be sanitized by logger middleware before logging
    const credentials = {
      apiKey: decrypt(api.apiKey),
      apiSecret: decrypt(api.apiSecret),
      permissions: api.permissions,
    };

    res.json({
      success: true,
      data: credentials,
    });
  } catch (error) {
    // Never expose decryption errors with details
    if (error.message.includes('Decryption failed') || error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE API CREDENTIALS] ❌ Security error`);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve credentials. Please contact support.',
      });
    }
    console.error(`[EXCHANGE API CREDENTIALS] ❌ Error:`, error.message);
    next(error);
  }
});

// Verify API connection with exchange
router.post('/:userId/:platform/verify', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform.toLowerCase() && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Decrypt credentials (will be sanitized in logs)
    const apiKey = decrypt(api.apiKey);
    const apiSecret = decrypt(api.apiSecret);

    // Verify with Binance API
    if (platform.toLowerCase() === 'binance') {
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
        // Don't expose detailed API errors
        const errorMessage = apiError.response?.data?.msg || 'API verification failed';
        console.error(`[EXCHANGE API VERIFY] ❌ Binance API error:`, errorMessage);
        return res.status(400).json({
          success: false,
          error: 'API verification failed. Please check your API key and secret.',
          details: errorMessage,
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
    if (error.message.includes('Decryption failed') || error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE API VERIFY] ❌ Security error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE API VERIFY] ❌ Error:`, error.message);
    next(error);
  }
});

// Get account balance from exchange
router.get('/:userId/:platform/balance', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;

    const user = await User.findOne({ userId }).select('exchangeApis');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const api = user.exchangeApis.find(
      a => a.platform === platform.toLowerCase() && a.isActive
    );

    if (!api) {
      return res.status(404).json({
        success: false,
        error: `No active API found for ${platform}`,
      });
    }

    // Decrypt credentials (will be sanitized in logs)
    const apiKey = decrypt(api.apiKey);
    const apiSecret = decrypt(api.apiSecret);

    if (platform.toLowerCase() === 'binance') {
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

        res.json({
          success: true,
          data: {
            balances,
            canTrade: response.data.canTrade,
            canWithdraw: response.data.canWithdraw,
          },
        });
      } catch (apiError) {
        const errorMessage = apiError.response?.data?.msg || 'Failed to get balance';
        console.error(`[EXCHANGE BALANCE] ❌ Binance API error:`, errorMessage);
        return res.status(400).json({
          success: false,
          error: 'Failed to get balance from Binance',
          details: errorMessage,
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: `Balance retrieval for ${platform} not implemented yet`,
      });
    }
  } catch (error) {
    if (error.message.includes('Decryption failed') || error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE BALANCE] ❌ Security error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE BALANCE] ❌ Error:`, error.message);
    next(error);
  }
});

// Place order on exchange
router.post('/:userId/:platform/order', async (req, res, next) => {
  try {
    const { userId, platform } = req.params;
    const { symbol, side, type, quantity, price } = req.body;

    // Validate required fields
    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, side, type, and quantity are required',
      });
    }

    // Validate side
    if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Side must be BUY or SELL',
      });
    }

    // Validate type
    if (!['MARKET', 'LIMIT'].includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Type must be MARKET or LIMIT',
      });
    }

    // Validate quantity
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a positive number',
      });
    }

    // Validate price for LIMIT orders
    if (type.toUpperCase() === 'LIMIT' && (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Price is required for LIMIT orders and must be a positive number',
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
      a => a.platform === platform.toLowerCase() && a.isActive
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

    // Decrypt credentials (will be sanitized in logs)
    const apiKey = decrypt(api.apiKey);
    const apiSecret = decrypt(api.apiSecret);

    if (platform.toLowerCase() === 'binance') {
      const axios = require('axios');
      const timestamp = Date.now();
      
      let queryString = `symbol=${symbol.toUpperCase()}&side=${side.toUpperCase()}&type=${type.toUpperCase()}&quantity=${qty}&timestamp=${timestamp}`;
      
      if (type.toUpperCase() === 'LIMIT' && price) {
        queryString += `&price=${parseFloat(price)}&timeInForce=GTC`;
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
          message: `${side.toUpperCase()} ${qty} ${symbol.toUpperCase()} - Order ID: ${response.data.orderId}`,
          type: 'success',
          read: false,
          createdAt: new Date(),
        });
        await user.save();

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
        const errorMessage = apiError.response?.data?.msg || 'Failed to place order';
        console.error(`[EXCHANGE ORDER] ❌ Binance API error:`, errorMessage);
        return res.status(400).json({
          success: false,
          error: 'Failed to place order on Binance',
          details: errorMessage,
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: `Trading on ${platform} not implemented yet`,
      });
    }
  } catch (error) {
    if (error.message.includes('Decryption failed') || error.message.includes('ENCRYPTION_KEY')) {
      console.error(`[EXCHANGE ORDER] ❌ Security error`);
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Please contact support.',
      });
    }
    console.error(`[EXCHANGE ORDER] ❌ Error:`, error.message);
    next(error);
  }
});

module.exports = router;
