const mongoose = require('mongoose');

const scheduledItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Reference to the content
  contentType: {
    type: String,
    enum: ['post', 'reel', 'story'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  // Schedule timing
  scheduledFor: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  // Recurring schedule
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    daysOfWeek: [Number], // 0-6 for Sunday-Saturday
    endDate: Date
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Execution details
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  lastAttempt: Date,
  completedAt: Date,
  errorMessage: String,
  // Notifications
  notifyOnSuccess: { type: Boolean, default: true },
  notifyOnFailure: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Index for efficient scheduler queries
scheduledItemSchema.index({ scheduledFor: 1, status: 1 });
scheduledItemSchema.index({ user: 1, scheduledFor: 1 });

module.exports = mongoose.model('ScheduledItem', scheduledItemSchema);
