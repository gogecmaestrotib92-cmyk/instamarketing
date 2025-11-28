const express = require('express');
const axios = require('axios');
const router = express.Router();

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

// Get Instagram profile info
router.get('/profile', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igAccountId) {
      return res.status(400).json({ 
        error: 'Instagram not connected',
        connected: false 
      });
    }

    const response = await axios.get(`${GRAPH_API_URL}/${igAccountId}`, {
      params: {
        fields: 'id,name,username,profile_picture_url,followers_count,follows_count,media_count,biography,website',
        access_token: accessToken
      }
    });

    res.json({
      connected: true,
      profile: response.data
    });
  } catch (error) {
    console.error('Instagram profile error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Instagram profile',
      message: error.response?.data?.error?.message || error.message,
      connected: false
    });
  }
});

// Get Instagram media/posts
router.get('/media', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const { limit = 12 } = req.query;

    if (!accessToken || !igAccountId) {
      return res.status(400).json({ error: 'Instagram not connected' });
    }

    const response = await axios.get(`${GRAPH_API_URL}/${igAccountId}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
        limit,
        access_token: accessToken
      }
    });

    res.json({ media: response.data.data || [] });
  } catch (error) {
    console.error('Instagram media error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Get Instagram insights
router.get('/insights', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igAccountId) {
      return res.status(400).json({ error: 'Instagram not connected' });
    }

    const response = await axios.get(`${GRAPH_API_URL}/${igAccountId}/insights`, {
      params: {
        metric: 'impressions,reach,profile_views,follower_count',
        period: 'day',
        access_token: accessToken
      }
    });

    res.json({ insights: response.data.data || [] });
  } catch (error) {
    console.error('Instagram insights error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Publish image to Instagram
router.post('/publish/image', async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igAccountId) {
      return res.status(400).json({ error: 'Instagram not connected' });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Step 1: Create media container
    const containerResponse = await axios.post(`${GRAPH_API_URL}/${igAccountId}/media`, null, {
      params: {
        image_url: imageUrl,
        caption: caption || '',
        access_token: accessToken
      }
    });

    const containerId = containerResponse.data.id;

    // Step 2: Publish the container
    const publishResponse = await axios.post(`${GRAPH_API_URL}/${igAccountId}/media_publish`, null, {
      params: {
        creation_id: containerId,
        access_token: accessToken
      }
    });

    res.json({
      success: true,
      mediaId: publishResponse.data.id,
      message: 'Image published successfully!'
    });
  } catch (error) {
    console.error('Instagram publish error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to publish image',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

// Publish video/reel to Instagram
router.post('/publish/video', async (req, res) => {
  try {
    const { videoUrl, caption, isReel = true } = req.body;
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igAccountId) {
      return res.status(400).json({ error: 'Instagram not connected' });
    }

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Step 1: Create media container for video
    const containerParams = {
      video_url: videoUrl,
      caption: caption || '',
      access_token: accessToken
    };

    if (isReel) {
      containerParams.media_type = 'REELS';
    }

    const containerResponse = await axios.post(`${GRAPH_API_URL}/${igAccountId}/media`, null, {
      params: containerParams
    });

    const containerId = containerResponse.data.id;

    // Step 2: Wait for video processing (poll status)
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await axios.get(`${GRAPH_API_URL}/${containerId}`, {
        params: {
          fields: 'status_code',
          access_token: accessToken
        }
      });
      
      status = statusResponse.data.status_code;
      attempts++;
    }

    if (status !== 'FINISHED') {
      return res.status(500).json({ 
        error: 'Video processing failed or timed out',
        status 
      });
    }

    // Step 3: Publish the container
    const publishResponse = await axios.post(`${GRAPH_API_URL}/${igAccountId}/media_publish`, null, {
      params: {
        creation_id: containerId,
        access_token: accessToken
      }
    });

    res.json({
      success: true,
      mediaId: publishResponse.data.id,
      message: isReel ? 'Reel published successfully!' : 'Video published successfully!'
    });
  } catch (error) {
    console.error('Instagram video publish error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to publish video',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

// Check connection status
router.get('/status', async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igAccountId) {
      return res.json({ connected: false });
    }

    // Verify token is still valid
    const response = await axios.get(`${GRAPH_API_URL}/${igAccountId}`, {
      params: {
        fields: 'username',
        access_token: accessToken
      }
    });

    res.json({ 
      connected: true,
      username: response.data.username
    });
  } catch (error) {
    res.json({ 
      connected: false,
      error: error.response?.data?.error?.message || 'Token expired'
    });
  }
});

module.exports = router;
