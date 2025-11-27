const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const reelRoutes = require('./routes/reels');
const campaignRoutes = require('./routes/campaigns');
const analyticsRoutes = require('./routes/analytics');
const scheduleRoutes = require('./routes/schedule');
const mediaRoutes = require('./routes/media');
const aiVideoRoutes = require('./routes/ai-video');
const aiRoutes = require('./routes/ai');
const advancedVideoRoutes = require('./routes/advancedVideo');

// Import scheduler
const { initScheduler } = require('./services/scheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/ai-video', aiVideoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/video', advancedVideoRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instamarketing';
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit in development - allow running without DB for testing
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

// Start server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    initScheduler();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
  });
}

// Export for Vercel
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
