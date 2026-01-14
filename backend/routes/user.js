const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const User = require('../schemas/user');

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
      // Return existing user without creating notification
      return res.status(200).json({
        success: true,
        message: 'User already exists',
        data: existingUser,
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
      data: savedUser,
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

router.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log(`[USER GET] Fetching user: ${userId}`);

    const user = await User.findOne({ userId: userId })
      .populate('counselor', 'userId nickname email avatar')
      .select('-__v');

    if (!user) {
      console.log(`[USER GET] ❌ User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    console.log(`[USER GET] ✅ User found: ${user.userId}, Email: ${user.email}`);
    res.json({
      success: true,
      data: user,
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
        referralCode: user.referralCode,
        referrals: user.referrals,
      },
    });
  } catch (error) {
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
      data: user.activities,
    });
  } catch (error) {
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

    // Sort by createdAt descending (newest first)
    const sortedNotifications = user.notifications.sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    res.json({
      success: true,
      data: sortedNotifications,
    });
  } catch (error) {
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
    const user = await User.findOne({ userId: req.params.userId })
      .populate('strategies.strategyId')
      .select('strategies');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.strategies,
    });
  } catch (error) {
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

    res.json({
      success: true,
      data: user.wallet,
    });
  } catch (error) {
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
