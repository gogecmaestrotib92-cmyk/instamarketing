// Minimal test handler first
module.exports = async (req, res) => {
  // Simple test to verify function works
  if (req.url === '/api/health') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }
  
  // Try to load the full app
  try {
    const app = require('../src/index');
    const mongoose = require('mongoose');
    
    // Connect to database if not connected
    if (mongoose.connection.readyState === 0) {
      const mongoURI = process.env.MONGODB_URI;
      if (mongoURI) {
        await mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connected');
      }
    }
    
    return app(req, res);
  } catch (error) {
    console.error('Error loading app:', error);
    return res.status(500).json({ 
      error: 'Server initialization failed', 
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};
