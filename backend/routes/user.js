const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const User = require('../schemas/user');
const { ensureUserTronWallet, getTatumMode } = require('../services/wallet_service');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const profilePhotosDir = path.join(uploadsDir, 'user-profile-photos');
if (!fs.existsSync(profilePhotosDir)) {
  fs.mkdirSync(profilePhotosDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePhotosDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.params.userId || uniqueSuffix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { userId, email, nickname } = req.body;

    console.log(`[USER CREATE] Attempting to create user: ${userId}, ${email}`);

    if (!userId || !email) {
      console.log(`[USER CREATE] ❌ Missing required fields: userId=${!!userId}, email=${!!email}`);
      return res.status(400).json({
        success: false,
        error: 'User ID and email are required',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ userId }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      console.log(`[USER CREATE] ✅ User already exists: ${existingUser.userId}`);
      // Try to ensure wallet (non-blocking)
      ensureUserTronWallet(existingUser.userId).catch((walletError) => {
        console.error('[USER CREATE] ❌ Failed to ensure TRON wallet:', walletError.message);
      });
      // Return existing user without creating notification
      return res.status(200).json({
        success: true,
        message: 'User already exists',
        data: _sanitizeWalletForMode(existingUser),
      });
    }

    const userData = {
      userId,
      email: email.toLowerCase(),
    };

    if (nickname) {
      userData.nickname = nickname;
    }

    console.log(`[USER CREATE] Creating new user with data:`, userData);
    const user = new User(userData);
    const savedUser = await user.save();

    // Create permanent TRON wallet address for USDT deposits
    try {
      await ensureUserTronWallet(savedUser.userId);
    } catch (walletError) {
      console.error('[USER CREATE] ❌ Failed to create TRON wallet:', walletError.message);
    }

    // Add welcome notification for new user
    savedUser.notifications.push({
      title: 'Welcome to AlgoBot! 🎉',
      message: 'Thank you for joining us. Start exploring our trading strategies and features.',
      type: 'success',
      read: false,
      createdAt: new Date(),
    });
    await savedUser.save();

    console.log(`[USER CREATE] ✅ User created successfully: ${savedUser.userId}, Referral: ${savedUser.referralCode}, Wallet: ${savedUser.wallet?.walletId}`);
    console.log(`[USER CREATE] ✅ Welcome notification added`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: _sanitizeWalletForMode(savedUser),
    });
  } catch (error) {
    console.error(`[USER CREATE] ❌ Error creating user:`, error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(e => e.message),
      });
    }
    if (error.code === 11000) {
      console.log(`[USER CREATE] ✅ User already exists (duplicate key)`);
      const existingUser = await User.findOne({
        $or: [{ userId: req.body.userId }, { email: req.body.email?.toLowerCase() }],
      });
      return res.status(200).json({
        success: true,
        message: 'User already exists',
        data: existingUser,
      });
    }
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    console.log(`[USERS GET ALL] Fetching all users`);

    const users = await User.find({})
      .select('-__v -activities -notifications -strategies -wallet.transactions -referrals -kyc')
      .sort({ createdAt: -1 });

    console.log(`[USERS GET ALL] ✅ Found ${users.length} users`);
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(`[USERS GET ALL] ❌ Error fetching users:`, error);
    next(error);
  }
});

router.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    // Only log in debug mode to reduce spam
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[USER GET] Fetching user: ${userId}`);
    }

    let user;
    try {
      // Try to populate counselor if it exists
      user = await User.findOne({ userId: userId })
        .populate('counselor', 'userId nickname email avatar')
        .select('-__v');
    } catch (populateError) {
      // If populate fails (e.g., counselor model doesn't exist), try without populate
      console.log(`[USER GET] Populate failed, fetching without populate: ${populateError.message}`);
      user = await User.findOne({ userId: userId })
        .select('-__v');
    }

    if (user) {
      // Ensure wallet exists for existing users (non-blocking)
      ensureUserTronWallet(user.userId).catch((walletError) => {
        console.error('[USER GET] ❌ Failed to ensure TRON wallet:', walletError.message);
        // Don't throw - allow user fetch to continue
      });
    }

    if (!user) {
      console.log(`[USER GET] ❌ User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Only log in debug mode
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[USER GET] ✅ User found: ${user.userId}, Email: ${user.email}`);
    }
    
    res.json({
      success: true,
      data: _sanitizeWalletForMode(user),
    });
  } catch (error) {
    console.error(`[USER GET] ❌ Error fetching user:`, error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }
    next(error);
  }
});

router.put('/:userId', async (req, res, next) => {
  try {
    const { nickname, location, language } = req.body;
    const updateData = {};

    if (nickname !== undefined) updateData.nickname = nickname;
    if (location !== undefined) updateData.location = location;
    if (language !== undefined) updateData.language = language;

    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update user data
    if (nickname !== undefined) user.nickname = nickname;
    if (location !== undefined) user.location = location;
    if (language !== undefined) user.language = language;

    await user.save();

    // Add notification for profile update
    const hasChanges = nickname !== undefined || location !== undefined || language !== undefined;
    if (hasChanges) {
      user.notifications.push({
        title: 'Profile Updated',
        message: 'Your profile has been successfully updated.',
        type: 'info',
        read: false,
        createdAt: new Date(),
      });
      await user.save();
      console.log(`[USER UPDATE] ✅ Profile update notification added`);
    }

    const updatedUser = await User.findOne({ userId: req.params.userId })
      .populate('counselor', 'userId nickname email avatar');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(e => e.message),
      });
    }
    next(error);
  }
});

router.post('/:userId/avatar', upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const originalPath = req.file.path;
    const optimizedPath = originalPath.replace(path.extname(originalPath), '-optimized.jpg');

    await sharp(originalPath)
      .resize(400, 400, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    if (user.avatar && fs.existsSync(user.avatar)) {
      try {
        fs.unlinkSync(user.avatar);
        const originalAvatar = user.avatar.replace('-optimized.jpg', path.extname(user.avatar));
        if (fs.existsSync(originalAvatar)) {
          fs.unlinkSync(originalAvatar);
        }
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }

    fs.unlinkSync(originalPath);

    const avatarUrl = `/uploads/user-profile-photos/${path.basename(optimizedPath)}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: avatarUrl,
      },
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

router.get('/:userId/referrals', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select('referrals referralCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode || null,
        referrals: user.referrals || [],
      },
    });
  } catch (error) {
    console.error(`[REFERRALS GET] ❌ Error fetching referrals:`, error);
    next(error);
  }
});

router.get('/:userId/activities', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select('activities');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.activities || [],
    });
  } catch (error) {
    console.error(`[ACTIVITIES GET] ❌ Error fetching activities:`, error);
    next(error);
  }
});

router.get('/:userId/notifications', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select('notifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Sort by createdAt descending (newest first), handle null/undefined dates
    const sortedNotifications = (user.notifications || []).sort((a, b) => {
      const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json({
      success: true,
      data: sortedNotifications,
    });
  } catch (error) {
    console.error(`[NOTIFICATIONS GET] ❌ Error fetching notifications:`, error);
    next(error);
  }
});

router.post('/:userId/notifications', async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    console.log(`[NOTIFICATION CREATE] Creating notification for user: ${req.params.userId}`);

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Title and message are required',
      });
    }

    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const notification = {
      title,
      message,
      type: type || 'info',
      read: false,
      createdAt: new Date(),
    };

    user.notifications.push(notification);
    await user.save();

    console.log(`[NOTIFICATION CREATE] ✅ Notification created: ${title}`);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    });
  } catch (error) {
    console.error(`[NOTIFICATION CREATE] ❌ Error:`, error);
    next(error);
  }
});

router.put('/:userId/notifications/:notificationId/read', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const notification = user.notifications.id(req.params.notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    notification.read = true;
    await user.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId/notifications/:notificationId', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.notifications.pull(req.params.notificationId);
    await user.save();

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:userId/notifications/clear-all', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.notifications = [];
    await user.save();

    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:userId/strategies', async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const StrategyModelExists = mongoose.models && mongoose.models.Strategy;
    
    let user;
    
    if (StrategyModelExists) {
      // Try to populate if Strategy model exists
      try {
        user = await User.findOne({ userId: req.params.userId })
          .populate('strategies.strategyId')
          .select('strategies');
      } catch (populateError) {
        // If populate fails, fall back to non-populated query
        console.log(`[STRATEGIES GET] Populate failed, using non-populated query: ${populateError.message}`);
        user = await User.findOne({ userId: req.params.userId })
          .select('strategies');
      }
    } else {
      // Strategy model doesn't exist, just get strategies without populate
      user = await User.findOne({ userId: req.params.userId })
        .select('strategies');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.strategies || [],
    });
  } catch (error) {
    console.error(`[STRATEGIES GET] ❌ Error fetching strategies:`, error);
    next(error);
  }
});

router.get('/:userId/wallet', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select('wallet');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Ensure wallet structure exists
    const walletData = user.wallet || {
      walletId: null,
      balances: [],
      transactions: [],
    };

    // Ensure arrays exist
    if (!walletData.balances) walletData.balances = [];
    if (!walletData.transactions) walletData.transactions = [];

    res.json({
      success: true,
      data: walletData,
    });
  } catch (error) {
    console.error(`[WALLET GET] ❌ Error fetching wallet:`, error);
    next(error);
  }
});

// Recover missing deposits for current user
router.post('/:userId/wallet/recover-deposits', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { recoverMissingDeposits } = require('../services/deposit_recovery_service');
    
    const result = await recoverMissingDeposits(userId);
    
    res.json({
      success: true,
      message: 'Deposit recovery completed',
      result,
    });
  } catch (error) {
    console.error(`[WALLET RECOVER] ❌ Error recovering deposits:`, error);
    next(error);
  }
});

router.get('/:userId/permissions', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select('subscription');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        plan: user.subscription.plan,
        permissions: user.subscription.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:userId/kyc', async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select('kyc');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.kyc,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

function _sanitizeWalletForMode(user) {
  if (!user) return user;
  const mode = getTatumMode();
  const walletKey = mode === 'production' ? 'tronProd' : 'tronTest';
  const data = typeof user.toObject === 'function' ? user.toObject() : user;

  if (data.wallet) {
    data.wallet.tron = data.wallet[walletKey] || { address: null, createdAt: null };
    delete data.wallet.tronTest;
    delete data.wallet.tronProd;
  }

  return data;
}
