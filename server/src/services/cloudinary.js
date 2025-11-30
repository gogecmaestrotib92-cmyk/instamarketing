const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {object} options - Upload options
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'instamarketing',
      resource_type: 'auto', // auto-detect image/video
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array<string>} filePaths - Array of local file paths
 * @param {object} options - Upload options
 * @returns {Promise<Array>} - Array of upload results
 */
const uploadMultipleToCloudinary = async (filePaths, options = {}) => {
  const results = [];
  
  for (const filePath of filePaths) {
    const result = await uploadToCloudinary(filePath, options);
    results.push(result);
  }
  
  return results;
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<object>}
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload from buffer (for files in memory)
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Upload options
 * @returns {Promise<object>}
 */
const uploadBufferToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'instamarketing',
      resource_type: 'auto',
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          resolve({
            success: false,
            error: error.message
          });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Generate video URL with text overlay and optional audio using Cloudinary transformations
 * @param {string} videoUrl - Original video URL (must be Cloudinary URL)
 * @param {Array} textOverlays - Array of {text, position, start, end}
 * @param {object} options - Additional options including audioUrl, audioPublicId
 * @returns {string} - Transformed video URL
 */
const generateVideoWithTextOverlay = (videoUrl, textOverlays = [], options = {}) => {
  // Extract public ID from Cloudinary URL
  // URL format: https://res.cloudinary.com/{cloud}/video/upload/{...}/{public_id}.mp4
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  if (!videoUrl.includes('cloudinary.com')) {
    console.warn('Video URL is not a Cloudinary URL, cannot add text overlay via URL');
    return videoUrl;
  }
  
  // Parse the URL to get the public ID
  const urlParts = videoUrl.split('/upload/');
  if (urlParts.length !== 2) {
    return videoUrl;
  }
  
  const afterUpload = urlParts[1];
  // Remove version and get public ID with extension
  const publicIdWithExt = afterUpload.replace(/^v\d+\//, '');
  const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension
  
  // Build transformation array
  const transformations = [];
  
  // Add audio overlay if provided (mute original video first, then add audio)
  if (options.audioPublicId) {
    // Mute original video audio
    transformations.push('ac_none');
    // Add audio overlay - replace slashes with colons for public ID
    const audioId = options.audioPublicId.replace(/\//g, ':');
    // Apply volume if specified
    const volume = options.musicVolume !== undefined ? Math.round(options.musicVolume * 100) : 100;
    transformations.push(`l_audio:${audioId}/e_volume:${volume}/fl_layer_apply`);
  }
  
  // Add text overlays
  textOverlays.forEach((overlay, index) => {
    if (!overlay.text) return;
    
    // Encode text for URL (replace spaces with %20, etc)
    const encodedText = encodeURIComponent(overlay.text).replace(/%20/g, '%20');
    
    // Determine gravity (position)
    let gravity = 'south'; // default bottom
    if (overlay.position === 'top') gravity = 'north';
    else if (overlay.position === 'center' || overlay.position === 'middle') gravity = 'center';
    
    // Build text overlay transformation
    // l_text: font_size_style:text
    const textTransform = `l_text:Montserrat_48_bold:${encodedText},co_white,g_${gravity},y_100,b_rgb:00000080/fl_layer_apply`;
    
    transformations.push(textTransform);
  });
  
  // If no transformations, return original
  if (transformations.length === 0) {
    return videoUrl;
  }
  
  // Build new URL with transformations
  const transformString = transformations.join('/');
  const newUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${transformString}/${publicIdWithExt}`;
  
  console.log('📹 Generated Cloudinary video with text overlay:', newUrl);
  return newUrl;
};

/**
 * Create video with text overlay using Cloudinary's eager transformation
 * This creates a new video file with the text baked in
 * @param {string} publicId - Cloudinary public ID of the video
 * @param {Array} textOverlays - Array of {text, position}
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Result with new video URL
 */
const createVideoWithTextOverlay = async (publicId, textOverlays = [], options = {}) => {
  try {
    if (!textOverlays || textOverlays.length === 0) {
      return {
        success: false,
        error: 'No text overlays provided'
      };
    }
    
    // Build transformation array for text overlays
    const overlayTransformations = textOverlays.map((overlay) => {
      if (!overlay.text) return null;
      
      let gravity = 'south';
      let y = 100;
      if (overlay.position === 'top') {
        gravity = 'north';
        y = 100;
      } else if (overlay.position === 'center' || overlay.position === 'middle') {
        gravity = 'center';
        y = 0;
      }
      
      return {
        overlay: {
          font_family: 'Montserrat',
          font_size: 48,
          font_weight: 'bold',
          text: overlay.text
        },
        gravity: gravity,
        y: y,
        color: 'white',
        background: 'rgb:00000080'
      };
    }).filter(Boolean);
    
    // Use explicit API to create a new rendition
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      resource_type: 'video',
      eager: [
        {
          transformation: overlayTransformations,
          format: 'mp4'
        }
      ],
      eager_async: false // Wait for transformation to complete
    });
    
    if (result.eager && result.eager[0]) {
      return {
        success: true,
        url: result.eager[0].secure_url,
        publicId: result.public_id,
        width: result.eager[0].width,
        height: result.eager[0].height
      };
    }
    
    return {
      success: false,
      error: 'Failed to generate eager transformation'
    };
  } catch (error) {
    console.error('Cloudinary video overlay error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  uploadBufferToCloudinary,
  generateVideoWithTextOverlay,
  createVideoWithTextOverlay
};
