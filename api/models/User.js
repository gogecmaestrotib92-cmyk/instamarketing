const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  instagram: {
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    businessAccountId: String,
    username: String,
    profilePicture: String,
    followersCount: Number,
    connected: { type: Boolean, default: false }
  },
  facebook: {
    accessToken: String,
    pageId: String,
    pageName: String,
    connected: { type: Boolean, default: false }
  },
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free'
  },
  planExpiry: Date,
  usage: {
    postsThisMonth: { type: Number, default: 0 },
    reelsThisMonth: { type: Number, default: 0 },
    adsCreated: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.instagram?.accessToken;
  delete obj.instagram?.refreshToken;
  delete obj.facebook?.accessToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
