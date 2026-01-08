const express = require('express');
const router = express.Router();
const Test = require('../schemas/test');

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

module.exports = router;
