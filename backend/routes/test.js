const express = require('express');
const router = express.Router();
const Test = require('../schemas/test');
const { processDeposit, getTatumMode } = require('../services/wallet_service');
const User = require('../schemas/user');

// GET /api/test - Get all test items
router.get('/', async (req, res, next) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    const query = status ? { status } : {};
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tests = await Test.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Test.countDocuments(query);
    
    res.json({
      success: true,
      data: tests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/test/:id - Get single test item
router.get('/:id', async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test item not found'
      });
    }
    
    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    next(error);
  }
});

// POST /api/test - Create new test item
router.post('/', async (req, res, next) => {
  try {
    const test = new Test(req.body);
    const savedTest = await test.save();
    
    res.status(201).json({
      success: true,
      message: 'Test item created successfully',
      data: savedTest
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    next(error);
  }
});

// PUT /api/test/:id - Update test item
router.put('/:id', async (req, res, next) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Test item updated successfully',
      data: test
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    next(error);
  }
});

// DELETE /api/test/:id - Delete test item
router.delete('/:id', async (req, res, next) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Test item deleted successfully',
      data: test
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }
    next(error);
  }
});

// POST /api/test/deposit - Simulate a USDT deposit (TEST MODE ONLY)
router.post('/deposit', async (req, res, next) => {
  try {
    const mode = getTatumMode();
    if (mode !== 'test') {
      return res.status(403).json({
        success: false,
        error: 'Test deposit endpoint only available in test mode'
      });
    }

    const { userId, amount } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'userId and amount are required'
      });
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deposit amount'
      });
    }

    // Find user to get their deposit address
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const depositAddress = user.wallet?.tronTest?.address;
    if (!depositAddress) {
      return res.status(400).json({
        success: false,
        error: 'User does not have a test deposit address'
      });
    }

    // Simulate a deposit with a fake transaction hash
    const fakeTxHash = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await processDeposit({
      address: depositAddress,
      txHash: fakeTxHash,
      amount: depositAmount,
      chain: 'TRON_TESTNET',
      token: 'USDT',
      contractAddress: process.env.TATUM_TRON_USDT_CONTRACT_TEST,
    });

    if (result?.ignored) {
      return res.status(200).json({
        success: true,
        ignored: true,
        reason: result.reason,
        message: 'Deposit was ignored'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test deposit processed successfully',
      data: {
        userId,
        amount: depositAmount,
        txHash: fakeTxHash,
        swept: result?.swept || false,
        depositAddress,
      }
    });
  } catch (error) {
    console.error('[TEST DEPOSIT] Error:', error);
    next(error);
  }
});

module.exports = router;
