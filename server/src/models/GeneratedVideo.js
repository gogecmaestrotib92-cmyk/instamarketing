const mongoose = require('mongoose');

const generatedVideoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text-to-video', 'image-to-video'],
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  sourceImageUrl: {
    type: String  // For image-to-video
  },
  videoUrl: {
    type: String,
    required: true
  },
  cloudinaryUrl: {
    type: String
  },
  duration: {
    type: Number,
    default: 5
  },
  aspectRatio: {
    type: String,
    enum: ['16:9', '9:16', '1:1'],
    default: '16:9'
  },
  runwayTaskId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  postedToInstagram: {
    type: Boolean,
    default: false
  },
  instagramPostId: {
    type: String
  },
  metadata: {
    model: String,
    seed: Number,
    generationTime: Number
  }
}, {
  timestamps: true
});

// Index for faster queries
generatedVideoSchema.index({ user: 1, createdAt: -1 });
generatedVideoSchema.index({ status: 1 });

module.exports = mongoose.model('GeneratedVideo', generatedVideoSchema);
