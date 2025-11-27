const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Get Instagram Business Account ID
 */
const getInstagramAccountId = async (user) => {
  try {
    const response = await axios.get(
      `${GRAPH_API_URL}/${user.facebook.pageId}`,
      {
        params: {
          fields: 'instagram_business_account',
          access_token: user.facebook.accessToken
        }
      }
    );
    return response.data.instagram_business_account?.id;
  } catch (error) {
    console.error('Error getting Instagram account ID:', error.response?.data || error.message);
    return null;
  }
};

/**
 * Publish a post to Instagram
 */
const publishPost = async (post, user) => {
  try {
    // Use environment token as fallback (most reliable for development)
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || user.instagram?.accessToken || user.facebook?.accessToken;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || user.instagram?.businessAccountId;

    console.log('Using access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NONE');
    console.log('Using account ID:', igAccountId);

    if (!accessToken || !igAccountId) {
      return { success: false, error: 'Instagram not properly connected' };
    }

    let mediaContainerId;

    if (post.type === 'carousel' && post.media.length > 1) {
      // Create carousel container
      const childMediaIds = [];
      
      for (const media of post.media) {
        const mediaUrl = getPublicMediaUrl(media);
        const isVideo = media.type === 'video';
        
        const childResponse = await axios.post(
          `${GRAPH_API_URL}/${igAccountId}/media`,
          {
            [isVideo ? 'video_url' : 'image_url']: mediaUrl,
            is_carousel_item: true,
            access_token: accessToken
          }
        );
        childMediaIds.push(childResponse.data.id);
      }

      // Create carousel container
      const carouselResponse = await axios.post(
        `${GRAPH_API_URL}/${igAccountId}/media`,
        {
          media_type: 'CAROUSEL',
          children: childMediaIds.join(','),
          caption: formatCaption(post.caption, post.hashtags),
          access_token: accessToken
        }
      );
      mediaContainerId = carouselResponse.data.id;
    } else {
      // Single image or video post
      const media = post.media[0];
      const mediaUrl = getPublicMediaUrl(media);
      const isVideo = media.type === 'video';

      const containerResponse = await axios.post(
        `${GRAPH_API_URL}/${igAccountId}/media`,
        {
          [isVideo ? 'video_url' : 'image_url']: mediaUrl,
          caption: formatCaption(post.caption, post.hashtags),
          access_token: accessToken
        }
      );
      mediaContainerId = containerResponse.data.id;
    }

    // Wait for media to be ready (for videos)
    if (post.media.some(m => m.type === 'video')) {
      await waitForMediaReady(igAccountId, mediaContainerId, accessToken);
    }

    // Publish the media
    const publishResponse = await axios.post(
      `${GRAPH_API_URL}/${igAccountId}/media_publish`,
      {
        creation_id: mediaContainerId,
        access_token: accessToken
      }
    );

    // Get permalink
    const mediaDetails = await axios.get(
      `${GRAPH_API_URL}/${publishResponse.data.id}`,
      {
        params: {
          fields: 'permalink',
          access_token: accessToken
        }
      }
    );

    return {
      success: true,
      postId: publishResponse.data.id,
      permalink: mediaDetails.data.permalink
    };
  } catch (error) {
    console.error('Error publishing post:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Publish a reel to Instagram
 */
const publishReel = async (reel, user) => {
  try {
    // Use environment token as fallback (most reliable for development)
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || user.instagram?.accessToken || user.facebook?.accessToken;
    const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || user.instagram?.businessAccountId;

    if (!accessToken || !igAccountId) {
      return { success: false, error: 'Instagram not properly connected' };
    }

    const videoUrl = getPublicMediaUrl(reel.video);

    // Create reel container
    const containerParams = {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: formatCaption(reel.caption, reel.hashtags),
      access_token: accessToken
    };

    // Add cover image if provided
    if (reel.coverImage?.url) {
      containerParams.cover_url = getPublicMediaUrl(reel.coverImage);
    }

    const containerResponse = await axios.post(
      `${GRAPH_API_URL}/${igAccountId}/media`,
      containerParams
    );

    const mediaContainerId = containerResponse.data.id;

    // Wait for video processing
    await waitForMediaReady(igAccountId, mediaContainerId, accessToken);

    // Publish the reel
    const publishResponse = await axios.post(
      `${GRAPH_API_URL}/${igAccountId}/media_publish`,
      {
        creation_id: mediaContainerId,
        access_token: accessToken
      }
    );

    // Get permalink
    const mediaDetails = await axios.get(
      `${GRAPH_API_URL}/${publishResponse.data.id}`,
      {
        params: {
          fields: 'permalink',
          access_token: accessToken
        }
      }
    );

    return {
      success: true,
      reelId: publishResponse.data.id,
      permalink: mediaDetails.data.permalink
    };
  } catch (error) {
    console.error('Error publishing reel:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
};

/**
 * Wait for media container to be ready
 */
const waitForMediaReady = async (igAccountId, containerId, accessToken, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(
      `${GRAPH_API_URL}/${containerId}`,
      {
        params: {
          fields: 'status_code',
          access_token: accessToken
        }
      }
    );

    const status = response.data.status_code;
    
    if (status === 'FINISHED') {
      return true;
    } else if (status === 'ERROR') {
      throw new Error('Media processing failed');
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Media processing timeout');
};

/**
 * Get account insights
 */
const getAccountInsights = async (user) => {
  try {
    const accessToken = user.instagram.accessToken || user.facebook.accessToken;
    const igAccountId = user.instagram.businessAccountId;

    const response = await axios.get(
      `${GRAPH_API_URL}/${igAccountId}/insights`,
      {
        params: {
          metric: 'impressions,reach,follower_count,profile_views',
          period: 'day',
          access_token: accessToken
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting account insights:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get media insights
 */
const getMediaInsights = async (mediaId, user) => {
  try {
    const accessToken = user.instagram.accessToken || user.facebook.accessToken;

    const response = await axios.get(
      `${GRAPH_API_URL}/${mediaId}/insights`,
      {
        params: {
          metric: 'impressions,reach,engagement,saved,shares',
          access_token: accessToken
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting media insights:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Format caption with hashtags
 */
const formatCaption = (caption, hashtags = []) => {
  let fullCaption = caption || '';
  
  if (hashtags.length > 0) {
    const hashtagString = hashtags.map(tag => 
      tag.startsWith('#') ? tag : `#${tag}`
    ).join(' ');
    
    fullCaption = fullCaption ? `${fullCaption}\n\n${hashtagString}` : hashtagString;
  }

  return fullCaption;
};

/**
 * Get public URL for media
 * In production, this should return a publicly accessible URL
 */
const getPublicMediaUrl = (media) => {
  // If already a full URL, return as-is
  if (media.url?.startsWith('http')) {
    return media.url;
  }
  
  // In production, you'd need to:
  // 1. Upload to a CDN or cloud storage (S3, Cloudinary, etc.)
  // 2. Return the public URL
  
  // For development/demo, return the local URL
  // Note: Instagram API requires publicly accessible URLs
  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5000';
  return `${baseUrl}${media.url}`;
};

module.exports = {
  publishPost,
  publishReel,
  getAccountInsights,
  getMediaInsights,
  getInstagramAccountId
};
