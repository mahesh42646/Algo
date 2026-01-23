const express = require('express');
const router = express.Router();
const User = require('../schemas/user');
const { decrypt } = require('../utils/encryption');
const crypto = require('crypto');
const axios = require('axios');

// Store active algo trades in memory (in production, use Redis or database)
const activeTrades = new Map();

// Helper function to get Binance API URL based on test mode
function getBinanceApiUrl(isTest = false) {
  return isTest ? 'https://testnet.binance.vision/api/v3' : 'https://api.binance.com/api/v3';
}

// Start algo trading
router.post('/:userId/start', async (req, res, next) => {
  const startTime = Date.now();
  const { userId } = req.params;
  const { symbol, apiId, maxLossPerTrade, maxLossOverall, maxProfitBook, amountPerLevel, numberOfLevels, useMargin } = req.body;

  console.log(`[ALGO TRADING START] 📊 Request from user ${userId}`);
  console.log(`[ALGO TRADING START] 📋 Parameters:`, {
    symbol,
    apiId,
    maxLossPerTrade,
    maxLossOverall,
    maxProfitBook,
    amountPerLevel,
    numberOfLevels,
    useMargin,
  });

  try {
    // Validate input
    if (!symbol || !apiId || !maxLossPerTrade || !maxLossOverall || !maxProfitBook || !amountPerLevel || !numberOfLevels) {
      console.error(`[ALGO TRADING START] ❌ Missing required parameters`);
      return res.status(400).json({
        success: false,
        error: 'All parameters are required (symbol, apiId, maxLossPerTrade, maxLossOverall, maxProfitBook, amountPerLevel, numberOfLevels)',
      });
    }

    const user = await User.findOne({ userId }).select('exchangeApis wallet notifications');

    if (!user) {
      console.error(`[ALGO TRADING START] ❌ User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if there's an active trade for this symbol
    const tradeKey = `${userId}:${symbol.toUpperCase()}`;
    if (activeTrades.has(tradeKey)) {
      console.log(`[ALGO TRADING START] ⚠️ Stopping existing trade for ${symbol}`);
      const existingTrade = activeTrades.get(tradeKey);
      if (existingTrade.intervalId) {
        clearInterval(existingTrade.intervalId);
      }
      activeTrades.delete(tradeKey);
    }

    // Get selected API
    const api = user.exchangeApis.find(a => a._id.toString() === apiId && a.isActive);

    if (!api) {
      console.error(`[ALGO TRADING START] ❌ API not found or inactive: ${apiId}`);
      return res.status(404).json({
        success: false,
        error: 'API not found or inactive. Please select a valid API.',
      });
    }

    console.log(`[ALGO TRADING START] ✅ API found: ${api.platform} - ${api.label}`);

    // Validate permissions
    const requiredPermission = useMargin ? 'margin_trade' : 'spot_trade';
    if (!api.permissions.includes(requiredPermission)) {
      console.error(`[ALGO TRADING START] ❌ Missing permission: ${requiredPermission}`);
      return res.status(403).json({
        success: false,
        error: `API does not have ${useMargin ? 'margin' : 'spot'} trading permission`,
        details: `Required: ${requiredPermission}, Available: ${api.permissions.join(', ')}`,
      });
    }

    console.log(`[ALGO TRADING START] ✅ Permission check passed: ${requiredPermission}`);

    // Decrypt credentials
    let apiKey, apiSecret;
    try {
      apiKey = decrypt(api.apiKey);
      apiSecret = decrypt(api.apiSecret);
      console.log(`[ALGO TRADING START] ✅ Credentials decrypted`);
    } catch (error) {
      console.error(`[ALGO TRADING START] ❌ Decryption failed:`, error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to decrypt API credentials',
      });
    }

    // Calculate total trade amount for all levels
    const totalTradeAmount = parseFloat(amountPerLevel) * parseInt(numberOfLevels);
    
    // Check exchange balance - must be sufficient for ALL levels
    const exchangeBalance = await getExchangeBalance(apiKey, apiSecret, symbol.toUpperCase(), api.isTest);
    if (exchangeBalance < totalTradeAmount) {
      console.error(`[ALGO TRADING START] ❌ Insufficient exchange balance: ${exchangeBalance} < ${totalTradeAmount}`);
      return res.status(400).json({
        success: false,
        error: 'Insufficient exchange balance',
        details: `You need at least \$${totalTradeAmount.toFixed(2)} in your ${api.platform} account for all ${numberOfLevels} levels. Current: \$${exchangeBalance.toFixed(2)}`,
        required: totalTradeAmount,
        current: exchangeBalance,
      });
    }

    console.log(`[ALGO TRADING START] ✅ Exchange balance: \$${exchangeBalance.toFixed(2)} (Required: \$${totalTradeAmount.toFixed(2)} for ${numberOfLevels} levels)`);

    // Calculate required platform wallet balance
    // For test keys: 3% fee, for real keys (demo): 0.3% fee
    const feePercentage = api.isTest ? 0.03 : 0.003; // 3% for test, 0.3% for demo
    const requiredWalletBalance = totalTradeAmount * feePercentage;

    // Check platform wallet balance
    const walletBalances = user.wallet?.balances || [];
    const usdtBalance = walletBalances.find(b => b.currency === 'USDT');
    const platformWalletBalance = usdtBalance?.amount || 0;

    if (platformWalletBalance < requiredWalletBalance) {
      console.error(`[ALGO TRADING START] ❌ Insufficient platform wallet: ${platformWalletBalance} < ${requiredWalletBalance}`);
      return res.status(400).json({
        success: false,
        error: 'Insufficient platform wallet balance',
        details: `You need at least ${(feePercentage * 100).toFixed(1)}% of total trade amount (\$${requiredWalletBalance.toFixed(2)}) in platform wallet. Current: \$${platformWalletBalance.toFixed(2)}`,
        required: requiredWalletBalance,
        current: platformWalletBalance,
      });
    }

    console.log(`[ALGO TRADING START] ✅ Platform wallet balance: \$${platformWalletBalance.toFixed(2)} (Required: \$${requiredWalletBalance.toFixed(2)} for all levels)`);

    // Reserve platform wallet balance (3% of total for all levels) - will be deducted at each level
    // Don't deduct upfront, deduct at each level execution
    console.log(`[ALGO TRADING START] 💰 Platform wallet balance reserved: \$${requiredWalletBalance.toFixed(2)} (will be deducted at each level)`);

    // Create trade object - starts in WAITING state until strong signal
    const trade = {
      userId,
      symbol: symbol.toUpperCase(),
      apiId: api._id.toString(),
      platform: api.platform,
      isTest: api.isTest, // Store test mode
      isDemo: !api.isTest, // Demo mode for real keys
      maxLossPerTrade: parseFloat(maxLossPerTrade),
      maxLossOverall: parseFloat(maxLossOverall),
      maxProfitBook: parseFloat(maxProfitBook),
      amountPerLevel: parseFloat(amountPerLevel),
      numberOfLevels: parseInt(numberOfLevels),
      useMargin: useMargin === true,
      apiKey,
      apiSecret,
      startPrice: 0,
      currentLevel: 0,
      totalInvested: 0,
      orders: [],
      isActive: true,
      isStarted: false, // New: track if trade has actually started (after strong signal)
      tradeDirection: null, // 'BUY' or 'SELL' - set when first order is placed
      startedAt: new Date(),
      lastSignal: null,
      intervalId: null,
      platformWalletFees: [], // Track all fees (deducted at each level)
    };

    // Start the algo trading loop
    const intervalId = setInterval(async () => {
      try {
        await executeAlgoTradingStep(trade);
      } catch (error) {
        console.error(`[ALGO TRADING] ❌ Error in trading step for ${symbol}:`, error.message);
      }
    }, 30000); // Check every 30 seconds

    trade.intervalId = intervalId;
    activeTrades.set(tradeKey, trade);

    // Add notification - trade is waiting for signal
    user.notifications.push({
      title: 'Algo Trading Waiting for Signal ⏳',
      message: `Algo trading configured for ${trade.symbol}. Waiting for strong signal to start...`,
      type: 'info',
      read: false,
      createdAt: new Date(),
    });

    // Save as strategy
    const strategyName = `Algo Trade - ${trade.symbol}`;
    user.strategies.push({
      strategyId: null, // Algo trades don't use Strategy model
      name: strategyName,
      createdAt: new Date(),
      status: 'active',
      type: 'algo_trading', // Custom field to identify algo trades
      symbol: trade.symbol,
      platform: trade.platform,
      config: {
        maxLossPerTrade: trade.maxLossPerTrade,
        maxLossOverall: trade.maxLossOverall,
        maxProfitBook: trade.maxProfitBook,
        amountPerLevel: trade.amountPerLevel,
        numberOfLevels: trade.numberOfLevels,
        useMargin: trade.useMargin,
      },
    });
    await user.save();

    console.log(`[ALGO TRADING START] 📝 Saved as strategy: ${strategyName}`);

    const duration = Date.now() - startTime;
    console.log(`[ALGO TRADING START] ✅ Started algo trading for ${symbol} (User: ${userId}, Duration: ${duration}ms)`);
    console.log(`[ALGO TRADING START] 📊 Trade Summary:`, {
      symbol: trade.symbol,
      platform: trade.platform,
      useMargin: trade.useMargin,
      totalTradeAmount: totalTradeAmount.toFixed(2),
      numberOfLevels: trade.numberOfLevels,
      amountPerLevel: trade.amountPerLevel.toFixed(2),
    });

    res.json({
      success: true,
      message: 'Algo trading configured successfully. Waiting for strong signal to start...',
      data: {
        symbol: trade.symbol,
        startedAt: trade.startedAt,
        status: 'waiting_for_signal',
        requiredWalletBalance: requiredWalletBalance,
        totalTradeAmount: totalTradeAmount,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ALGO TRADING START] ❌ Error starting algo trade (Duration: ${duration}ms):`, error);
    next(error);
  }
});

// Helper function to get exchange balance
async function getExchangeBalance(apiKey, apiSecret, symbol, isTest = false) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const binanceBaseUrl = getBinanceApiUrl(isTest);
    const response = await axios.get(
      `${binanceBaseUrl}/account?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
        timeout: 10000,
      }
    );

    // Get USDT balance (or quote currency)
    const quoteCurrency = symbol.includes('USDT') ? 'USDT' : symbol.replace(/[A-Z]+$/, '');
    const balance = response.data.balances.find(b => b.asset === quoteCurrency);
    return balance ? parseFloat(balance.free) + parseFloat(balance.locked) : 0;
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error getting exchange balance:`, error.message);
    return 0;
  }
}

// Stop algo trading
router.post('/:userId/stop', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required',
      });
    }

    const tradeKey = `${userId}:${symbol.toUpperCase()}`;
    const trade = activeTrades.get(tradeKey);

    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'No active trade found for this symbol',
      });
    }

    // Stop the interval
    if (trade.intervalId) {
      clearInterval(trade.intervalId);
    }

    // Mark as inactive
    trade.isActive = false;
    trade.stoppedAt = new Date();
    trade.stopReason = 'user_stopped';

    activeTrades.delete(tradeKey);

    // Update strategy status
    const user = await User.findOne({ userId }).select('strategies notifications');
    if (user) {
      const strategy = user.strategies.find(
        s => s.type === 'algo_trading' && s.symbol === symbol.toUpperCase() && s.status === 'active'
      );
      if (strategy) {
        strategy.status = 'inactive';
        console.log(`[ALGO TRADING STOP] 📝 Updated strategy status to inactive: ${strategy.name}`);
      }

      user.notifications.push({
        title: `Algo Trading Stopped - ${symbol.toUpperCase()} 🛑`,
        message: `You stopped the algo trade for ${symbol.toUpperCase()}.`,
        type: 'info',
        read: false,
        createdAt: new Date(),
      });

      await user.save();
    }

    console.log(`[ALGO TRADING] ⏹️ Stopped algo trading for ${symbol} (User: ${userId})`);

    res.json({
      success: true,
      message: 'Algo trading stopped successfully',
    });
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error stopping algo trade:`, error);
    next(error);
  }
});

// Get trade status
router.get('/:userId/status', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required',
      });
    }

    const tradeKey = `${userId}:${symbol.toUpperCase()}`;
    const trade = activeTrades.get(tradeKey);

    if (!trade || !trade.isActive) {
      return res.json({
        success: true,
        data: {
          isActive: false,
        },
      });
    }

    // Return trade status without sensitive data
    res.json({
      success: true,
      data: {
        isActive: true,
        symbol: trade.symbol,
        currentLevel: trade.currentLevel,
        totalInvested: trade.totalInvested,
        numberOfLevels: trade.numberOfLevels,
        startedAt: trade.startedAt,
        lastSignal: trade.lastSignal,
      },
    });
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error getting trade status:`, error);
    next(error);
  }
});

// Get all active trades
router.get('/:userId/trades', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userTrades = [];
    for (const [key, trade] of activeTrades.entries()) {
      if (trade.userId === userId && trade.isActive) {
        userTrades.push({
          symbol: trade.symbol,
          currentLevel: trade.currentLevel,
          totalInvested: trade.totalInvested,
          numberOfLevels: trade.numberOfLevels,
          isStarted: trade.isStarted,
          tradeDirection: trade.tradeDirection,
          startedAt: trade.startedAt,
          lastSignal: trade.lastSignal,
        });
      }
    }

    res.json({
      success: true,
      data: userTrades,
    });
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error getting active trades:`, error);
    next(error);
  }
});

// Get profit details for algo trades
router.get('/:userId/profits', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { period = '7d' } = req.query; // 7d, 30d, all

    // Get all trades (active and stopped) for this user
    const userTrades = [];
    for (const [key, trade] of activeTrades.entries()) {
      if (trade.userId === userId) {
        userTrades.push(trade);
      }
    }

    // Calculate profits
    let totalProfit = 0;
    let todayProfit = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tradeHistory = [];
    for (const trade of userTrades) {
      if (trade.stoppedAt) {
        // Calculate profit for stopped trades
        const profit = trade.totalInvested > 0 
          ? (trade.totalInvested * (trade.maxProfitBook / 100)) - trade.platformWalletFees.reduce((a, b) => a + b, 0)
          : 0;
        
        totalProfit += profit;
        
        if (new Date(trade.stoppedAt) >= today) {
          todayProfit += profit;
        }

        tradeHistory.push({
          symbol: trade.symbol,
          profit: profit,
          stoppedAt: trade.stoppedAt,
          reason: trade.stopReason,
          levels: trade.currentLevel,
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalProfit: totalProfit,
        todayProfit: todayProfit,
        tradeHistory: tradeHistory,
      },
    });
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error getting profits:`, error);
    next(error);
  }
});

// Execute one step of algo trading
async function executeAlgoTradingStep(trade) {
  try {
    const status = trade.isStarted ? 'ACTIVE' : 'WAITING';
    console.log(`[ALGO TRADING STEP] 🔄 Processing step for ${trade.symbol} (Status: ${status}, Level: ${trade.currentLevel}/${trade.numberOfLevels})`);
    
    // Get current price
    const currentPrice = await getCurrentPrice(trade.symbol, trade.isTest);
    
    // If trade hasn't started yet, wait for strong signal
    if (!trade.isStarted) {
      console.log(`[ALGO TRADING STEP] ⏳ Waiting for strong signal to start trade...`);
      
      // Get technical indicators
      const candles = await getCandlesticks(trade.symbol, '5m', 200, trade.isTest);
      const signal = await getTradingSignal(candles, currentPrice);
      trade.lastSignal = signal;

      // Wait for strong signal (either BUY or SELL)
      if (signal.strength === 'strong' && (signal.direction === 'BUY' || signal.direction === 'SELL')) {
        console.log(`[ALGO TRADING STEP] ✅ Strong ${signal.direction} signal detected - Starting trade!`);
        
        // Set start price and trade direction
        trade.startPrice = currentPrice;
        trade.tradeDirection = signal.direction;
        trade.isStarted = true;
        
        // Deduct platform wallet fee for first level (3% for test, 0.3% for demo)
        const feePercentage = trade.isTest ? 0.03 : 0.003;
        const levelFee = trade.amountPerLevel * feePercentage;
        const user = await User.findOne({ userId: trade.userId }).select('wallet notifications');
        
        if (user) {
          const walletBalances = user.wallet?.balances || [];
          const usdtBalance = walletBalances.find(b => b.currency === 'USDT');
          
          if (usdtBalance && usdtBalance.amount >= levelFee) {
            usdtBalance.amount = Math.max(0, usdtBalance.amount - levelFee);
            trade.platformWalletFees.push(levelFee);
            await user.save();
            
            console.log(`[ALGO TRADING STEP] 💰 Deducted platform wallet fee: \$${levelFee.toFixed(2)} (Level 1)`);
            
            // Add notification
            user.notifications.push({
              title: `Algo Trading Started - ${trade.symbol} 🚀`,
              message: `Trade started with ${signal.direction} signal. Level 1 executed. Fee: \$${levelFee.toFixed(2)}`,
              type: 'success',
              read: false,
              createdAt: new Date(),
            });
            await user.save();
          } else {
            console.error(`[ALGO TRADING STEP] ❌ Insufficient platform wallet for level fee: \$${levelFee.toFixed(2)}`);
            await closeAllPositions(trade, 'insufficient_funds');
            return;
          }
        }
        
        // Place first order
        await placeOrder(trade, signal.direction, currentPrice, trade.amountPerLevel);
        trade.currentLevel = 1;
        console.log(`[ALGO TRADING STEP] ✅ Trade started! Level 1 ${signal.direction} order placed at \$${currentPrice.toFixed(8)}`);
        return;
      } else {
        console.log(`[ALGO TRADING STEP] ⏭️ ${trade.symbol}: ${signal.direction} signal (${signal.strength}) - Still waiting for strong signal`);
        return;
      }
    }

    // Trade has started - now handle loss adjustments and profit booking
    // Calculate current P&L
    const currentPnL = ((currentPrice - trade.startPrice) / trade.startPrice) * 100;
    const avgPrice = trade.totalInvested > 0 
      ? trade.totalInvested / (trade.orders.reduce((sum, o) => sum + parseFloat(o.quantity), 0) || 1)
      : currentPrice;

    console.log(`[ALGO TRADING STEP] 📊 Current P&L: ${currentPnL.toFixed(2)}%, Price: \$${currentPrice.toFixed(8)}, Direction: ${trade.tradeDirection}`);

    // Check stop conditions
    if (currentPnL >= trade.maxProfitBook) {
      console.log(`[ALGO TRADING STEP] ✅ Profit target reached: ${currentPnL.toFixed(2)}% >= ${trade.maxProfitBook}%`);
      await closeAllPositions(trade, 'profit');
      return;
    }

    if (trade.currentLevel >= trade.numberOfLevels) {
      // Max levels reached, check overall loss
      const overallLoss = ((avgPrice - trade.startPrice) / trade.startPrice) * 100;
      if (overallLoss <= -trade.maxLossOverall) {
        console.log(`[ALGO TRADING STEP] ⛔ Max loss reached: ${overallLoss.toFixed(2)}% <= -${trade.maxLossOverall}%`);
        await closeAllPositions(trade, 'max_loss');
        return;
      }
    }

    // Check if we need to add more (averaging down) - NO SIGNAL CHECK, just check loss
    // Loss adjustments are always in the SAME direction as initial trade
    if (currentPnL <= -trade.maxLossPerTrade && trade.currentLevel < trade.numberOfLevels) {
      console.log(`[ALGO TRADING STEP] 📉 Loss threshold hit: ${currentPnL.toFixed(2)}% <= -${trade.maxLossPerTrade}%`);
      console.log(`[ALGO TRADING STEP] 🔄 Adding level in same direction: ${trade.tradeDirection} (no signal check)`);
      
      // Deduct platform wallet fee before placing order (3% for test, 0.3% for demo)
      const feePercentage = trade.isTest ? 0.03 : 0.003;
      const levelFee = trade.amountPerLevel * feePercentage;
      const user = await User.findOne({ userId: trade.userId }).select('wallet notifications');
      
      if (user) {
        const walletBalances = user.wallet?.balances || [];
        const usdtBalance = walletBalances.find(b => b.currency === 'USDT');
        
        if (usdtBalance && usdtBalance.amount >= levelFee) {
          usdtBalance.amount = Math.max(0, usdtBalance.amount - levelFee);
          trade.platformWalletFees.push(levelFee);
          await user.save();
          
          console.log(`[ALGO TRADING STEP] 💰 Deducted platform wallet fee: \$${levelFee.toFixed(2)} (Level ${trade.currentLevel + 1})`);
          
          // Add notification
          user.notifications.push({
            title: `Algo Trading - Level ${trade.currentLevel + 1} 📈`,
            message: `Level ${trade.currentLevel + 1} executed for ${trade.symbol} (${trade.tradeDirection}). Fee: \$${levelFee.toFixed(2)}`,
            type: 'info',
            read: false,
            createdAt: new Date(),
          });
          await user.save();
        } else {
          console.error(`[ALGO TRADING STEP] ❌ Insufficient platform wallet for level fee: \$${levelFee.toFixed(2)}`);
          await closeAllPositions(trade, 'insufficient_funds');
          return;
        }
      }
      
      // Place order in SAME direction as initial trade (no signal check)
      await placeOrder(trade, trade.tradeDirection, currentPrice, trade.amountPerLevel);
      trade.currentLevel++;
      console.log(`[ALGO TRADING STEP] ✅ Level ${trade.currentLevel} ${trade.tradeDirection} order placed (loss adjustment)`);
    }

  } catch (error) {
    console.error(`[ALGO TRADING STEP] ❌ Error in trading step for ${trade.symbol}:`, error.message);
    console.error(`[ALGO TRADING STEP] ❌ Stack:`, error.stack);
  }
}

// Get current price
async function getCurrentPrice(symbol, isTest = false) {
  try {
    const binanceBaseUrl = getBinanceApiUrl(isTest);
    const response = await axios.get(
      `${binanceBaseUrl}/ticker/price?symbol=${symbol}`,
      { timeout: 5000 }
    );
    return parseFloat(response.data.price);
  } catch (error) {
    throw new Error(`Failed to get current price: ${error.message}`);
  }
}

// Get candlesticks
async function getCandlesticks(symbol, interval, limit, isTest = false) {
  try {
    const binanceBaseUrl = getBinanceApiUrl(isTest);
    const response = await axios.get(
      `${binanceBaseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { timeout: 5000 }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get candlesticks: ${error.message}`);
  }
}

// Get trading signal from technical indicators
async function getTradingSignal(candles, currentPrice) {
  try {
    const closes = candles.map(c => parseFloat(c[4])); // Close prices
    
    // Calculate MAs
    const ma20 = calculateSMA(closes, 20);
    const ma50 = calculateSMA(closes, 50);
    const ma200 = calculateSMA(closes, 200);
    
    if (ma20.length === 0 || ma50.length === 0 || ma200.length === 0) {
      return { direction: 'NEUTRAL', strength: 'weak' };
    }

    const ma20Value = ma20[ma20.length - 1];
    const ma50Value = ma50[ma50.length - 1];
    const ma200Value = ma200[ma200.length - 1];

    // Calculate MACD
    const macd = calculateMACD(closes);
    const macdLine = macd.macd[macd.macd.length - 1];
    const signalLine = macd.signal[macd.signal.length - 1];

    // Determine signal strength
    let buySignals = 0;
    let sellSignals = 0;

    // MA signals
    if (currentPrice > ma20Value && ma20Value > ma50Value && ma50Value > ma200Value) {
      buySignals += 2; // Strong buy
    } else if (currentPrice < ma20Value && ma20Value < ma50Value && ma50Value < ma200Value) {
      sellSignals += 2; // Strong sell
    }

    if (currentPrice > ma20Value) buySignals++;
    else if (currentPrice < ma20Value) sellSignals++;

    // MACD signals
    if (macdLine > signalLine && macdLine > 0) {
      buySignals++;
    } else if (macdLine < signalLine && macdLine < 0) {
      sellSignals++;
    }

    // Determine direction and strength
    if (buySignals >= 3) {
      return { direction: 'BUY', strength: 'strong' };
    } else if (sellSignals >= 3) {
      return { direction: 'SELL', strength: 'strong' };
    } else if (buySignals > sellSignals) {
      return { direction: 'BUY', strength: 'weak' };
    } else if (sellSignals > buySignals) {
      return { direction: 'SELL', strength: 'weak' };
    }

    return { direction: 'NEUTRAL', strength: 'weak' };
  } catch (error) {
    console.error(`[ALGO TRADING] Error calculating signal:`, error.message);
    return { direction: 'NEUTRAL', strength: 'weak' };
  }
}

// Place order
async function placeOrder(trade, side, price, amount) {
  try {
    // For demo trading (real keys), simulate order without actual API call
    if (trade.isDemo) {
      console.log(`[ALGO TRADING DEMO] 📝 Simulating ${side} order for ${trade.symbol}`);
      const timestamp = Date.now();
      const quantity = (amount / price).toFixed(8);
      const limitPrice = side === 'BUY' 
        ? (price * 0.998).toFixed(8)
        : (price * 1.002).toFixed(8);

      // Simulate order response
      const simulatedOrder = {
        orderId: `DEMO_${timestamp}`,
        symbol: trade.symbol,
        side: side,
        type: 'LIMIT',
        quantity: quantity,
        price: limitPrice,
        status: 'NEW',
      };

      trade.orders.push({
        orderId: simulatedOrder.orderId,
        side,
        quantity,
        price: limitPrice,
        timestamp: new Date(),
      });

      trade.totalInvested += amount;

      console.log(`[ALGO TRADING DEMO] ✅ Simulated ${side} order for ${trade.symbol}: ${quantity} @ ${limitPrice}`);
      return simulatedOrder;
    }

    // For test keys, use testnet API
    const timestamp = Date.now();
    const quantity = (amount / price).toFixed(8);
    
    // For limit orders, place slightly below market for buy, above for sell
    const limitPrice = side === 'BUY' 
      ? (price * 0.998).toFixed(8) // 0.2% below
      : (price * 1.002).toFixed(8); // 0.2% above

    const queryString = `symbol=${trade.symbol}&side=${side}&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${limitPrice}&timestamp=${timestamp}`;
    
    const signature = crypto
      .createHmac('sha256', trade.apiSecret)
      .update(queryString)
      .digest('hex');

    const binanceBaseUrl = getBinanceApiUrl(trade.isTest);
    const response = await axios.post(
      `${binanceBaseUrl}/order?${queryString}&signature=${signature}`,
      null,
      {
        headers: {
          'X-MBX-APIKEY': trade.apiKey,
        },
        timeout: 10000,
      }
    );

    trade.orders.push({
      orderId: response.data.orderId,
      side,
      quantity,
      price: limitPrice,
      timestamp: new Date(),
    });

    trade.totalInvested += amount;

    console.log(`[ALGO TRADING] ✅ Placed ${side} order for ${trade.symbol}: ${quantity} @ ${limitPrice}`);

    return response.data;
  } catch (error) {
    console.error(`[ALGO TRADING] ❌ Error placing order:`, error.response?.data || error.message);
    throw error;
  }
}

// Close all positions
async function closeAllPositions(trade, reason) {
  try {
    console.log(`[ALGO TRADING CLOSE] 🔚 Closing positions for ${trade.symbol} (Reason: ${reason})`);
    
    // Get account balance for the base asset
    const baseAsset = trade.symbol.replace('USDT', '').replace('BUSD', '');
    
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', trade.apiSecret)
      .update(queryString)
      .digest('hex');

    const binanceBaseUrl = getBinanceApiUrl(trade.isTest);
    const accountResponse = await axios.get(
      `${binanceBaseUrl}/account?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': trade.apiKey,
        },
        timeout: 10000,
      }
    );

    const balance = accountResponse.data.balances.find(
      b => b.asset === baseAsset && parseFloat(b.free) > 0
    );

    if (balance && parseFloat(b.free) > 0) {
      // Place market sell order
      const sellTimestamp = Date.now();
      const sellQueryString = `symbol=${trade.symbol}&side=SELL&type=MARKET&quantity=${parseFloat(balance.free).toFixed(8)}&timestamp=${sellTimestamp}`;
      
      const sellSignature = crypto
        .createHmac('sha256', trade.apiSecret)
        .update(sellQueryString)
        .digest('hex');

      const binanceBaseUrl = getBinanceApiUrl(trade.isTest);
      await axios.post(
        `${binanceBaseUrl}/order?${sellQueryString}&signature=${sellSignature}`,
        null,
        {
          headers: {
            'X-MBX-APIKEY': trade.apiKey,
          },
          timeout: 10000,
        }
      );

      console.log(`[ALGO TRADING CLOSE] ✅ Closed all positions for ${trade.symbol} (Quantity: ${balance.free})`);
    }

    // Stop the trade
    if (trade.intervalId) {
      clearInterval(trade.intervalId);
    }
    trade.isActive = false;
    trade.stoppedAt = new Date();
    trade.stopReason = reason;

    const tradeKey = `${trade.userId}:${trade.symbol}`;
    activeTrades.delete(tradeKey);

    // Add notification and update strategy status
    const user = await User.findOne({ userId: trade.userId }).select('notifications strategies');
    if (user) {
      const reasonMessages = {
        'profit': 'Profit target reached',
        'max_loss': 'Maximum loss limit reached',
        'insufficient_funds': 'Insufficient platform wallet balance',
        'admin_stopped': 'Stopped by administrator',
      };
      
      user.notifications.push({
        title: `Algo Trading Stopped - ${trade.symbol} 🛑`,
        message: `${reasonMessages[reason] || reason}. Total levels: ${trade.currentLevel}, Total fees: \$${trade.platformWalletFees.reduce((a, b) => a + b, 0).toFixed(2)}`,
        type: reason === 'profit' ? 'success' : reason === 'max_loss' ? 'warning' : 'error',
        read: false,
        createdAt: new Date(),
      });

      // Update strategy status to inactive
      const strategy = user.strategies.find(
        s => s.type === 'algo_trading' && s.symbol === trade.symbol && s.status === 'active'
      );
      if (strategy) {
        strategy.status = 'inactive';
        console.log(`[ALGO TRADING CLOSE] 📝 Updated strategy status to inactive: ${strategy.name}`);
      }

      await user.save();
      
      console.log(`[ALGO TRADING CLOSE] 📬 Notification sent to user ${trade.userId}`);
    }

    const totalFees = trade.platformWalletFees.reduce((a, b) => a + b, 0);
    console.log(`[ALGO TRADING CLOSE] 📊 Trade Summary:`, {
      symbol: trade.symbol,
      reason,
      levels: trade.currentLevel,
      totalInvested: trade.totalInvested.toFixed(2),
      totalFees: totalFees.toFixed(2),
      duration: Math.round((Date.now() - trade.startedAt.getTime()) / 1000 / 60), // minutes
    });

  } catch (error) {
    console.error(`[ALGO TRADING CLOSE] ❌ Error closing positions:`, error.message);
    console.error(`[ALGO TRADING CLOSE] ❌ Stack:`, error.stack);
  }
}

// Helper functions for technical indicators
function calculateSMA(prices, period) {
  if (prices.length < period) return [];
  
  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j];
    }
    sma.push(sum / period);
  }
  return sma;
}

function calculateEMA(prices, period) {
  if (prices.length < period) return [];
  
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);
  
  // Calculate subsequent EMA values
  for (let i = period; i < prices.length; i++) {
    const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }
  return ema;
}

function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  
  // Align lengths
  const minLength = Math.min(emaFast.length, emaSlow.length);
  const fast = emaFast.slice(emaFast.length - minLength);
  const slow = emaSlow.slice(emaSlow.length - minLength);
  
  // Calculate MACD line (DIF)
  const dif = [];
  for (let i = 0; i < minLength; i++) {
    dif.push(fast[i] - slow[i]);
  }
  
  // Calculate Signal line (DEA) - EMA of DIF
  const signal = calculateEMA(dif, signalPeriod);
  
  // Calculate Histogram (MACD)
  const macdLength = Math.min(dif.length, signal.length);
  const macd = [];
  for (let i = 0; i < macdLength; i++) {
    const difIndex = dif.length - macdLength + i;
    const signalIndex = signal.length - macdLength + i;
    macd.push((dif[difIndex] - signal[signalIndex]) * 2);
  }
  
  return {
    macd: macd,
    signal: signal.slice(signal.length - macdLength),
  };
}

// Export activeTrades map for admin access
router.getActiveTrades = () => activeTrades;

module.exports = router;
