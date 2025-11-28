const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = new User({
      email,
      password,
      name,
      company
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, company } = req.body;
    
    const user = req.user;
    if (name) user.name = name;
    if (company !== undefined) user.company = company;
    
    await user.save();
    
    res.json({ 
      message: 'Profile updated',
      user: user.toJSON() 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = req.user;
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Connect Instagram account (OAuth callback handler)
router.post('/connect/instagram', auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${req.headers.origin || 'http://localhost:3000'}/auth/instagram/callback`;

    // Step 1: Exchange code for short-lived access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code
      }
    });

    const shortLivedToken = tokenResponse.data.access_token;

    // Step 2: Exchange for long-lived token
    const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken
      }
    });

    const longLivedToken = longLivedResponse.data.access_token;

    // Step 3: Get user's Facebook Pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: longLivedToken
      }
    });

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      return res.status(400).json({ 
        error: 'No Facebook Pages found. You need a Facebook Page connected to your Instagram Business account.' 
      });
    }

    // Use the first page (you could let user select if multiple)
    const page = pagesResponse.data.data[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;

    // Step 4: Get Instagram Business Account connected to the page
    const igAccountResponse = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: 'instagram_business_account',
        access_token: pageAccessToken
      }
    });

    if (!igAccountResponse.data.instagram_business_account) {
      return res.status(400).json({ 
        error: 'No Instagram Business Account connected to this Facebook Page. Please connect your Instagram account to your Facebook Page first.' 
      });
    }

    const instagramAccountId = igAccountResponse.data.instagram_business_account.id;

    // Step 5: Get Instagram account info
    const igInfoResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccountId}`, {
      params: {
        fields: 'username,name,profile_picture_url,followers_count,media_count',
        access_token: pageAccessToken
      }
    });

    // Save to user
    const user = req.user;
    user.instagramAccessToken = pageAccessToken;
    user.instagramAccountId = instagramAccountId;
    user.instagramUsername = igInfoResponse.data.username;
    user.facebookPageId = pageId;

    await user.save();

    res.json({ 
      message: 'Instagram account connected successfully!',
      user: user.toJSON(),
      instagram: {
        username: igInfoResponse.data.username,
        name: igInfoResponse.data.name,
        profilePicture: igInfoResponse.data.profile_picture_url,
        followers: igInfoResponse.data.followers_count,
        mediaCount: igInfoResponse.data.media_count
      }
    });
  } catch (error) {
    console.error('Instagram connect error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to connect Instagram account';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Disconnect Instagram account
router.post('/disconnect/instagram', auth, async (req, res) => {
  try {
    const user = req.user;
    user.instagram = {
      connected: false
    };

    await user.save();

    res.json({ 
      message: 'Instagram account disconnected',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Instagram disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Instagram account' });
  }
});

// Connect Instagram using access token directly (from Meta Developer Console)
router.post('/connect/instagram/token', auth, async (req, res) => {
  try {
    const { accessToken, businessAccountId } = req.body;

    // Use provided values or fall back to environment variables
    const token = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = businessAccountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!token || !accountId) {
      return res.status(400).json({ 
        error: 'Access token and business account ID are required' 
      });
    }

    // Verify the token by fetching account info
    const igInfoResponse = await axios.get(`https://graph.instagram.com/v18.0/${accountId}`, {
      params: {
        fields: 'username,name,profile_picture_url,followers_count,media_count,account_type',
        access_token: token
      }
    });

    // Save to user
    const user = req.user;
    user.instagram = {
      accessToken: token,
      businessAccountId: accountId,
      username: igInfoResponse.data.username,
      profilePicture: igInfoResponse.data.profile_picture_url,
      followersCount: igInfoResponse.data.followers_count,
      connected: true
    };

    await user.save();
    console.log('Instagram connected (token) for user:', user._id, 'Username:', user.instagram.username);

    res.json({ 
      message: 'Instagram account connected successfully!',
      user: user.toJSON(),
      instagram: {
        username: igInfoResponse.data.username,
        name: igInfoResponse.data.name,
        profilePicture: igInfoResponse.data.profile_picture_url,
        followers: igInfoResponse.data.followers_count,
        mediaCount: igInfoResponse.data.media_count
      }
    });
  } catch (error) {
    console.error('Instagram token connect error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to connect Instagram account';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Auto-connect Instagram using environment variables
router.post('/connect/instagram/auto', auth, async (req, res) => {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!token || !accountId) {
      return res.status(400).json({ 
        error: 'Instagram credentials not configured in environment' 
      });
    }

    // Use Facebook Graph API for Page tokens (EAA...) or Instagram Graph API for IG tokens (IGAA...)
    const apiBase = token.startsWith('IGAA') 
      ? 'https://graph.instagram.com/v18.0' 
      : 'https://graph.facebook.com/v18.0';

    // Verify the token by fetching account info
    const igInfoResponse = await axios.get(`${apiBase}/${accountId}`, {
      params: {
        fields: 'username,name,profile_picture_url,followers_count,media_count',
        access_token: token
      }
    });

    // Save to user
    const user = req.user;
    user.instagram = {
      accessToken: token,
      businessAccountId: accountId,
      username: igInfoResponse.data.username,
      profilePicture: igInfoResponse.data.profile_picture_url,
      followersCount: igInfoResponse.data.followers_count,
      connected: true
    };

    await user.save();
    console.log('Instagram connected (auto) for user:', user._id, 'Username:', user.instagram.username);

    res.json({ 
      message: 'Instagram account connected successfully!',
      user: user.toJSON(),
      instagram: {
        username: igInfoResponse.data.username,
        name: igInfoResponse.data.name,
        profilePicture: igInfoResponse.data.profile_picture_url,
        followers: igInfoResponse.data.followers_count,
        mediaCount: igInfoResponse.data.media_count
      }
    });
  } catch (error) {
    console.error('Instagram auto connect error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to connect Instagram account';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;
