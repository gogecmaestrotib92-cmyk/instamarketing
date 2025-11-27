const express = require('express');
const ScheduledItem = require('../models/ScheduledItem');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all scheduled items
router.get('/', auth, async (req, res) => {
  try {
    const { status, contentType, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const query = { user: req.userId };
    if (status) query.status = status;
    if (contentType) query.contentType = contentType;
    
    // Date range filter
    if (startDate || endDate) {
      query.scheduledFor = {};
      if (startDate) query.scheduledFor.$gte = new Date(startDate);
      if (endDate) query.scheduledFor.$lte = new Date(endDate);
    }

    const items = await ScheduledItem.find(query)
      .sort({ scheduledFor: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Populate content details
    const populatedItems = await Promise.all(items.map(async (item) => {
      let content;
      if (item.contentType === 'post') {
        content = await Post.findById(item.contentId).select('caption type media status');
      } else if (item.contentType === 'reel') {
        content = await Reel.findById(item.contentId).select('caption video coverImage status');
      }
      return {
        ...item.toObject(),
        content
      };
    }));

    const total = await ScheduledItem.countDocuments(query);

    res.json({
      items: populatedItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Get calendar view (grouped by date)
router.get('/calendar', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()) - 1, 1);
    const endDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth() + 1, 0, 23, 59, 59);

    const items = await ScheduledItem.find({
      user: req.userId,
      scheduledFor: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'completed'] }
    }).sort({ scheduledFor: 1 });

    // Group by date
    const calendar = {};
    
    for (const item of items) {
      const dateKey = item.scheduledFor.toISOString().split('T')[0];
      
      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }

      let content;
      if (item.contentType === 'post') {
        content = await Post.findById(item.contentId).select('caption type media status');
      } else if (item.contentType === 'reel') {
        content = await Reel.findById(item.contentId).select('caption video status');
      }

      calendar[dateKey].push({
        ...item.toObject(),
        content
      });
    }

    res.json({
      calendar,
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear()
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});

// Update scheduled item
router.put('/:id', auth, async (req, res) => {
  try {
    const { scheduledFor, timezone } = req.body;

    const item = await ScheduledItem.findOne({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!item) {
      return res.status(404).json({ error: 'Scheduled item not found' });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({ error: 'Can only update pending items' });
    }

    if (scheduledFor) {
      item.scheduledFor = new Date(scheduledFor);
      
      // Update the content's scheduledFor as well
      if (item.contentType === 'post') {
        await Post.findByIdAndUpdate(item.contentId, { scheduledFor: item.scheduledFor });
      } else if (item.contentType === 'reel') {
        await Reel.findByIdAndUpdate(item.contentId, { scheduledFor: item.scheduledFor });
      }
    }
    
    if (timezone) {
      item.timezone = timezone;
    }

    await item.save();

    res.json({ 
      message: 'Schedule updated',
      item 
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

// Cancel scheduled item
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const item = await ScheduledItem.findOne({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!item) {
      return res.status(404).json({ error: 'Scheduled item not found' });
    }

    if (item.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending items' });
    }

    item.status = 'cancelled';
    await item.save();

    // Update content status
    if (item.contentType === 'post') {
      await Post.findByIdAndUpdate(item.contentId, { 
        status: 'draft',
        isScheduled: false 
      });
    } else if (item.contentType === 'reel') {
      await Reel.findByIdAndUpdate(item.contentId, { 
        status: 'draft',
        isScheduled: false 
      });
    }

    res.json({ 
      message: 'Schedule cancelled',
      item 
    });
  } catch (error) {
    console.error('Cancel schedule error:', error);
    res.status(500).json({ error: 'Failed to cancel schedule' });
  }
});

// Delete scheduled item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await ScheduledItem.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.userId 
    });

    if (!item) {
      return res.status(404).json({ error: 'Scheduled item not found' });
    }

    res.json({ message: 'Scheduled item deleted' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete scheduled item' });
  }
});

module.exports = router;
