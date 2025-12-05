const mongoose = require('mongoose');

/**
 * AutoPilotDraft Model
 * Stores generated content for preview/approval before posting
 */

// Media item schema (for carousel/multi-image posts)
const MediaItemSchema = new mongoose.Schema({
  url: { type: String, required: true },
  thumbnail: String, // Low-res preview for videos
  type: { type: String, enum: ['image', 'video'], required: true },
  width: Number,
  height: Number,
  duration: Number, // For videos
  order: { type: Number, default: 0 }
}, { _id: false });

// Caption schema with hashtags
const CaptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  hashtags: [String],
  callToAction: String,
  mentions: [String]
}, { _id: false });

const AutoPilotDraftSchema = new mongoose.Schema({
  user: {
    type: String,  // Changed from ObjectId to String to support anonymous/demo users
    required: true
  },
  
  // Content type
  contentType: {
    type: String,
    enum: ['single_image', 'carousel', 'reel', 'voiceover_video'],
    required: true
  },
  
  // Topic used for generation
  topic: {
    type: String,
    required: true
  },
  
  // Generated content
  media: [MediaItemSchema],
  
  // Caption
  caption: CaptionSchema,
  
  // Brand details used
  brandDetails: {
    brandName: String,
    brandDescription: String,
    targetAudience: String,
    brandTone: String,
    callToAction: String,
    hashtags: String
  },
  
  // AutoPilot config reference
  autoPilotConfigId: String,
  
  // Preview-specific fields
  preview: {
    // Low-res video URL for reels (360-480p)
    lowResVideoUrl: String,
    // Thumbnail/poster image
    thumbnailUrl: String,
    // Generated at (for expiry)
    generatedAt: { type: Date, default: Date.now }
  },
  
  // Status flow: pending_review -> approved/rejected -> scheduled/posted
  status: {
    type: String,
    enum: ['generating', 'pending_review', 'approved', 'rejected', 'scheduled', 'posted', 'failed'],
    default: 'generating'
  },
  
  // Scheduling info
  scheduledFor: Date,
  
  // Posting result
  postResult: {
    instagramId: String,
    postedAt: Date,
    permalink: String,
    error: String
  },
  
  // Regeneration tracking
  regenerationCount: { type: Number, default: 0 },
  maxRegenerations: { type: Number, default: 3 },
  
  // User feedback on rejection
  rejectionReason: String,
  
  // Generation metadata
  generationMetadata: {
    model: String,
    prompt: String,
    seed: Number,
    processingTime: Number
  }
}, {
  timestamps: true
});

// Indexes
AutoPilotDraftSchema.index({ user: 1, status: 1 });
AutoPilotDraftSchema.index({ user: 1, createdAt: -1 });
AutoPilotDraftSchema.index({ status: 1, scheduledFor: 1 });

// Virtual for display name
AutoPilotDraftSchema.virtual('displayType').get(function() {
  const types = {
    single_image: 'Single Image',
    carousel: 'Carousel',
    reel: 'Reel',
    voiceover_video: 'Voiceover Video'
  };
  return types[this.contentType] || this.contentType;
});

// Method to approve draft
AutoPilotDraftSchema.methods.approve = function(scheduledFor = null) {
  this.status = scheduledFor ? 'scheduled' : 'approved';
  this.scheduledFor = scheduledFor;
  return this.save();
};

// Method to reject draft
AutoPilotDraftSchema.methods.reject = function(reason = '') {
  this.status = 'rejected';
  this.rejectionReason = reason;
  return this.save();
};

// Method to check if can regenerate
AutoPilotDraftSchema.methods.canRegenerate = function() {
  return this.regenerationCount < this.maxRegenerations;
};

// Static method to get pending drafts for user
AutoPilotDraftSchema.statics.getPendingForUser = function(userId) {
  return this.find({ 
    user: userId, 
    status: 'pending_review' 
  }).sort({ createdAt: -1 });
};

// Static method to get all drafts for user
AutoPilotDraftSchema.statics.getAllForUser = function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('AutoPilotDraft', AutoPilotDraftSchema);
