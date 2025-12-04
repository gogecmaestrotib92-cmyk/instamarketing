/**
 * ASSET SERVICE
 * ==============
 * Utility for saving assets to the Asset Hub.
 * Use this service in all future features that generate content.
 * 
 * Usage:
 *   import { saveAssetToHub } from '../services/assetService';
 *   
 *   saveAssetToHub({
 *     type: 'video',  // 'video', 'image', 'audio', 'template'
 *     name: 'My Video',
 *     url: 'https://...',
 *     source: 'BusinessVideo',
 *     metadata: { ... }
 *   });
 */

/**
 * Save an asset to the Asset Hub (localStorage)
 * @param {object} asset - Asset to save
 * @param {string} asset.type - 'video', 'image', 'audio', 'template'
 * @param {string} asset.name - Display name for the asset
 * @param {string} asset.url - URL to the asset
 * @param {string} [asset.thumbnail] - Optional thumbnail URL (for videos)
 * @param {string} [asset.caption] - Optional caption/description
 * @param {string[]} [asset.tags] - Optional tags for filtering
 * @param {string} asset.source - Source feature (e.g., 'BusinessVideo', 'BusinessImage')
 * @param {object} [asset.metadata] - Optional additional metadata
 * @returns {object} The saved asset with generated id and timestamp
 */
export const saveAssetToHub = (asset) => {
  try {
    const existingAssets = JSON.parse(localStorage.getItem('assetHub') || '[]');
    
    const newAsset = {
      id: Date.now().toString(),
      type: asset.type || 'video',
      name: asset.name || 'Untitled Asset',
      url: asset.url,
      thumbnail: asset.thumbnail || null,
      caption: asset.caption || '',
      tags: asset.tags || [],
      createdAt: new Date().toISOString(),
      source: asset.source || 'Unknown',
      metadata: asset.metadata || {}
    };
    
    // Add to beginning of array (newest first)
    existingAssets.unshift(newAsset);
    
    // Save back to localStorage
    localStorage.setItem('assetHub', JSON.stringify(existingAssets));
    
    console.log(`✅ Asset saved to Asset Hub: ${newAsset.name} (${newAsset.type})`);
    return newAsset;
    
  } catch (error) {
    console.error('❌ Failed to save asset to Asset Hub:', error);
    throw error;
  }
};

/**
 * Save a video asset to the Asset Hub
 * Convenience method with video-specific defaults
 */
export const saveVideoToHub = ({ name, url, caption, tags = [], source, metadata = {} }) => {
  return saveAssetToHub({
    type: 'video',
    name: name || 'Generated Video',
    url,
    caption,
    tags,
    source,
    metadata
  });
};

/**
 * Save an image asset to the Asset Hub
 * Convenience method with image-specific defaults
 */
export const saveImageToHub = ({ name, url, caption, tags = [], source, metadata = {} }) => {
  return saveAssetToHub({
    type: 'image',
    name: name || 'Generated Image',
    url,
    caption,
    tags,
    source,
    metadata
  });
};

/**
 * Get all assets from the Asset Hub
 * @param {string} [type] - Optional filter by type
 * @returns {array} Array of assets
 */
export const getAssetsFromHub = (type = null) => {
  try {
    const assets = JSON.parse(localStorage.getItem('assetHub') || '[]');
    if (type) {
      return assets.filter(asset => asset.type === type);
    }
    return assets;
  } catch (error) {
    console.error('Failed to get assets from hub:', error);
    return [];
  }
};

/**
 * Delete an asset from the Asset Hub
 * @param {string} assetId - ID of the asset to delete
 * @returns {boolean} True if deleted successfully
 */
export const deleteAssetFromHub = (assetId) => {
  try {
    const assets = JSON.parse(localStorage.getItem('assetHub') || '[]');
    const filtered = assets.filter(a => a.id !== assetId);
    localStorage.setItem('assetHub', JSON.stringify(filtered));
    console.log(`Asset ${assetId} deleted from Asset Hub`);
    return true;
  } catch (error) {
    console.error('Failed to delete asset:', error);
    return false;
  }
};

const assetService = {
  saveAssetToHub,
  saveVideoToHub,
  saveImageToHub,
  getAssetsFromHub,
  deleteAssetFromHub
};

export default assetService;
