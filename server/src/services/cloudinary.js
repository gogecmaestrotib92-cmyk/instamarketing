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
  
  // Determine if we need to mute original video
  const hasMusic = !!options.audioPublicId;
  const hasSounds = options.soundEffects && options.soundEffects.length > 0;
  
  // Add audio overlay if provided (mute original video first, then add audio)
  if (hasMusic) {
    console.log('🎵 Adding audio overlay with public ID:', options.audioPublicId);
    // Mute original video audio
    transformations.push('ac_none');
    // Add audio overlay - replace slashes with colons for public ID
    const audioId = options.audioPublicId.replace(/\//g, ':');
    // Apply volume if specified
    const volume = options.musicVolume !== undefined ? Math.round(options.musicVolume * 100) : 100;
    const audioTransform = `l_video:${audioId}/e_volume:${volume}/fl_layer_apply`;
    console.log('🎵 Audio transform:', audioTransform);
    transformations.push(audioTransform);
  } else if (hasSounds) {
    // If no music but we have sound effects, mute original so sounds are audible
    transformations.push('ac_none');
    console.log('🎵 No music, muting original for sound effects');
  } else {
    console.log('🎵 No audio public ID provided');
  }
  
  // Add sound effects as additional audio layers
  if (hasSounds) {
    console.log('🔊 Adding', options.soundEffects.length, 'sound effect(s)...');
    for (const effect of options.soundEffects) {
      const effectId = effect.publicId.replace(/\//g, ':');
      // Use l_video for audio files (Cloudinary stores audio as video resource type)
      // so_ is start offset in seconds
      const startOffset = effect.startTime > 0 ? `/so_${Math.round(effect.startTime)}` : '';
      const effectTransform = `l_video:${effectId}${startOffset}/e_volume:150/fl_layer_apply`;
      console.log('🔊 Sound effect transform:', effect.name, '->', effectTransform);
      transformations.push(effectTransform);
    }
  }
  
  // Add text overlays
  textOverlays.forEach((overlay, index) => {
    if (!overlay.text) return;
    
    // Encode text for URL - need to double-escape special characters
    // Replace spaces with %20, and escape % signs for Cloudinary
    let encodedText = overlay.text
      .replace(/%/g, '%25')  // Escape percent signs first
      .replace(/,/g, '%252C') // Double-escape commas
      .replace(/\//g, '%252F') // Double-escape slashes
      .replace(/\n/g, '%250A'); // Newlines
    encodedText = encodeURIComponent(encodedText)
      .replace(/%25/g, '%'); // Restore single-escaped percent signs
    
    // Map 9-position grid to Cloudinary gravity
    const positionToGravity = {
      'top-left': 'north_west',
      'top-center': 'north',
      'top-right': 'north_east',
      'center-left': 'west',
      'center': 'center',
      'center-right': 'east',
      'bottom-left': 'south_west',
      'bottom-center': 'south',
      'bottom-right': 'south_east',
      // Legacy support
      'middle-left': 'west',
      'middle-right': 'east',
      'top': 'north',
      'middle': 'center',
      'bottom': 'south'
    };
    
    // Determine gravity (position) - default to south (bottom-center)
    const position = overlay.position || 'bottom-center';
    const gravity = positionToGravity[position];
    
    // IMPORTANT: If position not found in map, log error and use south
    if (!gravity) {
      console.error(`❌ Unknown position "${position}" - defaulting to south`);
    }
    const finalGravity = gravity || 'south';
    
    console.log(`📍 Text overlay: "${overlay.text?.substring(0, 15)}..."`);
    console.log(`   Position received: "${position}"`);
    console.log(`   Gravity mapped: "${finalGravity}"`);
    console.log(`   OffsetX: ${overlay.offsetX || 0}, OffsetY: ${overlay.offsetY || 0}`);
    
    // Get font size (default 42)
    const fontSize = overlay.fontSize || overlay.style?.fontSize || 42;
    
    // Get user offsets (default 0)
    const userOffsetX = overlay.offsetX || 0;
    const userOffsetY = overlay.offsetY || 0;
    
    // Calculate precise base offsets for each position
    // These values match the preview CSS for pixel-perfect accuracy
    let baseX = 0;
    let baseY = 0;
    
    // Vertical positioning based on finalGravity
    if (finalGravity.includes('north')) {
      baseY = 40; // 40px from top edge
    } else if (finalGravity.includes('south')) {
      baseY = 100; // 100px from bottom edge (above controls)
    }
    // Center vertical has no base offset
    
    // Horizontal positioning based on finalGravity
    if (finalGravity.includes('west')) {
      baseX = 40; // 40px from left edge
    } else if (finalGravity.includes('east')) {
      baseX = 40; // 40px from right edge
    }
    // Center horizontal has no base offset
    
    // Final offsets = base + user adjustment
    const xOffset = baseX + userOffsetX;
    const yOffset = baseY + userOffsetY;
    
    // Build text overlay transformation for VIDEO
    // For Cloudinary videos, we need to use a specific format
    // The overlay syntax for videos: l_text:font_size:text/fl_layer_apply,g_gravity,y_offset
    
    // First, create the text layer
    let textTransform = `l_text:Montserrat_${fontSize}_bold:${encodedText}`;
    
    // Add text styling (color and background)
    textTransform += `,co_white,b_rgb:00000080`;
    
    // Close with fl_layer_apply AND positioning
    // For videos, gravity and position go AFTER fl_layer_apply
    textTransform += `/fl_layer_apply,g_${finalGravity}`;
    
    // Add offsets
    if (xOffset !== 0) {
      textTransform += `,x_${xOffset}`;
    }
    if (yOffset !== 0) {
      textTransform += `,y_${yOffset}`;
    }
    
    console.log(`   Full transform: ${textTransform}`);
    
    transformations.push(textTransform);
  });
  
  // If no transformations, return original
  if (transformations.length === 0) {
    return videoUrl;
  }
  
  // Build new URL with transformations
  const transformString = transformations.join('/');
  
  // Add cache-busting timestamp to force regeneration
  const cacheBuster = Date.now();
  const newUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${transformString}/${publicIdWithExt}?_cb=${cacheBuster}`;
  
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
