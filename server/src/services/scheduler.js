const cron = require('node-cron');
const ScheduledItem = require('../models/ScheduledItem');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const User = require('../models/User');
const { publishPost, publishReel } = require('./instagram');

/**
 * Initialize the scheduler
 * Runs every minute to check for scheduled content
 */
const initScheduler = () => {
  console.log('📅 Initializing content scheduler...');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await processScheduledItems();
  });

  // Run metrics update every hour
  cron.schedule('0 * * * *', async () => {
    await updateMetrics();
  });

  console.log('✅ Scheduler initialized');
};

/**
 * Process scheduled items that are due
 */
const processScheduledItems = async () => {
  try {
    const now = new Date();
    
    // Find items that are due
    const dueItems = await ScheduledItem.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    }).limit(10); // Process 10 at a time

    if (dueItems.length === 0) return;

    console.log(`📤 Processing ${dueItems.length} scheduled items...`);

    for (const item of dueItems) {
      await processItem(item);
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
};

/**
 * Process a single scheduled item
 */
const processItem = async (item) => {
  try {
    // Mark as processing
    item.status = 'processing';
    item.attempts += 1;
    item.lastAttempt = new Date();
    await item.save();

    // Get user
    const user = await User.findById(item.user);
    if (!user || !user.instagram?.connected) {
      item.status = 'failed';
      item.errorMessage = 'User not found or Instagram not connected';
      await item.save();
      return;
    }

    let result;
    let content;

    // Publish based on content type
    if (item.contentType === 'post') {
      content = await Post.findById(item.contentId);
      if (!content) {
        item.status = 'failed';
        item.errorMessage = 'Post not found';
        await item.save();
        return;
      }

      content.status = 'publishing';
      await content.save();

      result = await publishPost(content, user);

      if (result.success) {
        content.status = 'published';
        content.instagramPostId = result.postId;
        content.instagramPermalink = result.permalink;
        content.publishedAt = new Date();
      } else {
        content.status = 'failed';
        content.errorMessage = result.error;
      }
      await content.save();

    } else if (item.contentType === 'reel') {
      content = await Reel.findById(item.contentId);
      if (!content) {
        item.status = 'failed';
        item.errorMessage = 'Reel not found';
        await item.save();
        return;
      }

      content.status = 'publishing';
      await content.save();

      result = await publishReel(content, user);

      if (result.success) {
        content.status = 'published';
        content.instagramReelId = result.reelId;
        content.instagramPermalink = result.permalink;
        content.publishedAt = new Date();
      } else {
        content.status = 'failed';
        content.errorMessage = result.error;
      }
      await content.save();
    }

    // Update scheduled item status
    if (result?.success) {
      item.status = 'completed';
      item.completedAt = new Date();
      console.log(`✅ Published ${item.contentType}: ${item.contentId}`);
    } else {
      // Check if we should retry
      if (item.attempts < item.maxAttempts) {
        item.status = 'pending';
        // Add 5 minute delay before retry
        item.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
      } else {
        item.status = 'failed';
        item.errorMessage = result?.error || 'Max retry attempts reached';
      }
      console.log(`❌ Failed to publish ${item.contentType}: ${item.contentId} - ${result?.error}`);
    }

    await item.save();

    // Handle recurring schedule
    if (result?.success && item.recurring?.enabled) {
      await createNextRecurringItem(item);
    }

  } catch (error) {
    console.error(`Error processing item ${item._id}:`, error);
    item.status = 'failed';
    item.errorMessage = error.message;
    await item.save();
  }
};

/**
 * Create next occurrence for recurring schedule
 */
const createNextRecurringItem = async (item) => {
  const nextDate = calculateNextDate(item);
  
  if (!nextDate || (item.recurring.endDate && nextDate > item.recurring.endDate)) {
    return; // No more occurrences
  }

  // Clone the content
  let newContent;
  if (item.contentType === 'post') {
    const original = await Post.findById(item.contentId);
    newContent = new Post({
      ...original.toObject(),
      _id: undefined,
      status: 'scheduled',
      scheduledFor: nextDate,
      instagramPostId: undefined,
      instagramPermalink: undefined,
      publishedAt: undefined,
      metrics: {}
    });
  } else if (item.contentType === 'reel') {
    const original = await Reel.findById(item.contentId);
    newContent = new Reel({
      ...original.toObject(),
      _id: undefined,
      status: 'scheduled',
      scheduledFor: nextDate,
      instagramReelId: undefined,
      instagramPermalink: undefined,
      publishedAt: undefined,
      metrics: {}
    });
  }

  await newContent.save();

  // Create new scheduled item
  const newScheduledItem = new ScheduledItem({
    user: item.user,
    contentType: item.contentType,
    contentId: newContent._id,
    scheduledFor: nextDate,
    timezone: item.timezone,
    recurring: item.recurring
  });

  await newScheduledItem.save();
  console.log(`📅 Created next recurring item for ${nextDate}`);
};

/**
 * Calculate next date based on recurring settings
 */
const calculateNextDate = (item) => {
  const current = new Date(item.scheduledFor);
  
  switch (item.recurring.frequency) {
    case 'daily':
      current.setDate(current.getDate() + 1);
      break;
    case 'weekly':
      // Find next scheduled day of week
      if (item.recurring.daysOfWeek?.length > 0) {
        const currentDay = current.getDay();
        const sortedDays = [...item.recurring.daysOfWeek].sort((a, b) => a - b);
        const nextDay = sortedDays.find(d => d > currentDay) || sortedDays[0];
        const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
        current.setDate(current.getDate() + daysToAdd);
      } else {
        current.setDate(current.getDate() + 7);
      }
      break;
    case 'monthly':
      current.setMonth(current.getMonth() + 1);
      break;
    default:
      return null;
  }

  return current;
};

/**
 * Update metrics for published content
 */
const updateMetrics = async () => {
  // This would fetch updated metrics from Instagram API
  // Implementation depends on your rate limiting strategy
  console.log('📊 Updating content metrics...');
  // TODO: Implement metrics update
};

module.exports = {
  initScheduler,
  processScheduledItems
};
