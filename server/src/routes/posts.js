const express = require('express');
const path = require('path');
const axios = require('axios');
const Post = require('../models/Post');
const ScheduledItem = require('../models/ScheduledItem');
const { auth } = require('../middleware/auth');
const { publishPost } = require('../services/instagram');
const { uploadToCloudinary } = require('../services/cloudinary');
const upload = require('../services/upload');

const router = express.Router();

// TEST ENDPOINT - Publish a test post to Instagram (no auth required)
router.post('/test-publish', async (req, res) => {
  try {
    const { image_url, caption } = req.body;
    
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !igAccountId) {
      return res.status(400).json({ error: 'Instagram credentials not configured' });
    }

    // Use a default test image if none provided
    const testImageUrl = image_url || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
    const testCaption = caption || 'Test post from InstaMarketing app! 🚀 #test #automation';

    console.log('Creating media container...');
    console.log('Image URL:', testImageUrl);
    console.log('Caption:', testCaption);
    console.log('Token:', accessToken.substring(0, 20) + '...');
    console.log('Account ID:', igAccountId);

    // Step 1: Create media container
    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media`,
      null,
      {
        params: {
          image_url: testImageUrl,
          caption: testCaption,
          access_token: accessToken
        }
      }
    );

    console.log('Container response:', containerResponse.data);
    const containerId = containerResponse.data.id;

    // Step 2: Publish the container
    console.log('Publishing container:', containerId);
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: accessToken
        }
      }
    );

    console.log('Publish response:', publishResponse.data);

    res.json({
      success: true,
      message: 'Post published successfully!',
      data: {
        containerId,
        postId: publishResponse.data.id
      }
    });

  } catch (error) {
    console.error('Test publish error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data
    });
  }
});

// Get all posts for user
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.userId };
    if (status) query.status = status;

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.userId });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new post
router.post('/', auth, upload.array('media', 10), async (req, res) => {
  try {
    const { caption, hashtags, type, scheduledFor, location } = req.body;

    // Process uploaded files
    const media = req.files?.map((file, index) => ({
      localPath: file.path,
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('video') ? 'video' : 'image',
      order: index
    })) || [];

    const post = new Post({
      user: req.userId,
      type: type || 'image',
      caption,
      hashtags: hashtags ? JSON.parse(hashtags) : [],
      media,
      location: location ? JSON.parse(location) : undefined,
      status: 'draft'
    });

    // If scheduled
    if (scheduledFor) {
      post.scheduledFor = new Date(scheduledFor);
      post.isScheduled = true;
      post.status = 'scheduled';

      // Create scheduled item
      const scheduledItem = new ScheduledItem({
        user: req.userId,
        contentType: 'post',
        contentId: post._id,
        scheduledFor: post.scheduledFor
      });
      await scheduledItem.save();
    }

    await post.save();

    res.status(201).json({ 
      message: 'Post created successfully',
      post 
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', auth, upload.array('media', 10), async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.userId });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Can only edit draft or scheduled posts
    if (!['draft', 'scheduled'].includes(post.status)) {
      return res.status(400).json({ error: 'Cannot edit published or processing post' });
    }

    const { caption, hashtags, type, scheduledFor, location } = req.body;

    if (caption !== undefined) post.caption = caption;
    if (type) post.type = type;
    if (hashtags) post.hashtags = JSON.parse(hashtags);
    if (location) post.location = JSON.parse(location);

    // Handle new media files
    if (req.files?.length > 0) {
      const newMedia = req.files.map((file, index) => ({
        localPath: file.path,
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
        order: post.media.length + index
      }));
      post.media.push(...newMedia);
    }

    // Handle schedule changes
    if (scheduledFor) {
      post.scheduledFor = new Date(scheduledFor);
      post.isScheduled = true;
      post.status = 'scheduled';

      // Update or create scheduled item
      await ScheduledItem.findOneAndUpdate(
        { contentType: 'post', contentId: post._id },
        { scheduledFor: post.scheduledFor, status: 'pending' },
        { upsert: true }
      );
    }

    await post.save();

    res.json({ 
      message: 'Post updated successfully',
      post 
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Publish post immediately
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.userId });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.status === 'published') {
      return res.status(400).json({ error: 'Post is already published' });
    }

    // Check if user has Instagram connected
    if (!req.user.instagram?.connected) {
      return res.status(400).json({ error: 'Please connect your Instagram account first' });
    }

    post.status = 'publishing';
    await post.save();

    // Upload media to Cloudinary for public URLs
    console.log('Uploading media to Cloudinary...');
    const uploadedMedia = [];
    for (const media of post.media) {
      // Get the local file path
      const localPath = media.localPath || path.join(__dirname, '../../', media.url);
      console.log('Uploading file:', localPath);
      
      const cloudinaryResult = await uploadToCloudinary(localPath, {
        folder: 'instamarketing/posts',
        resource_type: media.type === 'video' ? 'video' : 'image'
      });
      
      if (cloudinaryResult.success) {
        uploadedMedia.push({
          ...media,
          url: cloudinaryResult.url,
          cloudinaryPublicId: cloudinaryResult.publicId,
          type: media.type
        });
        console.log('Uploaded to Cloudinary:', cloudinaryResult.url);
      } else {
        console.error('Cloudinary upload failed:', cloudinaryResult.error);
        post.status = 'failed';
        post.errorMessage = `Failed to upload media: ${cloudinaryResult.error}`;
        await post.save();
        return res.status(500).json({ error: post.errorMessage });
      }
    }

    // Update post with Cloudinary URLs
    post.media = uploadedMedia;
    await post.save();

    // Publish to Instagram
    console.log('Publishing to Instagram...');
    const result = await publishPost(post, req.user);

    if (result.success) {
      post.status = 'published';
      post.instagramPostId = result.postId;
      post.instagramPermalink = result.permalink;
      post.publishedAt = new Date();
    } else {
      post.status = 'failed';
      post.errorMessage = result.error;
    }

    await post.save();

    res.json({ 
      message: result.success ? 'Post published successfully' : 'Failed to publish post',
      post,
      success: result.success
    });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, user: req.userId });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Delete associated scheduled item
    await ScheduledItem.deleteOne({ contentType: 'post', contentId: post._id });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
