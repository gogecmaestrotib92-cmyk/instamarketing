/**
 * Asset Hub Service
 * Centralized management for all generated content
 */

const STORAGE_KEY = 'assetHub';

// Generate unique ID
const generateId = () => {
  return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get all assets
export const getAssets = () => {
  try {
    const savedAssets = localStorage.getItem(STORAGE_KEY);
    return savedAssets ? JSON.parse(savedAssets) : [];
  } catch (e) {
    console.error('Failed to load assets:', e);
    return [];
  }
};

// Save assets to storage
const saveAssets = (assets) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    return true;
  } catch (e) {
    console.error('Failed to save assets:', e);
    return false;
  }
};

// Add new asset
export const addAsset = (assetData) => {
  const assets = getAssets();
  
  const newAsset = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...assetData
  };
  
  assets.unshift(newAsset); // Add to beginning
  saveAssets(assets);
  
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('assetHubUpdated', { detail: newAsset }));
  
  return newAsset;
};

// Add image asset
export const addImageAsset = (imageUrl, metadata = {}) => {
  return addAsset({
    type: 'image',
    url: imageUrl,
    name: metadata.name || `Image ${new Date().toLocaleDateString()}`,
    caption: metadata.caption || '',
    prompt: metadata.prompt || '',
    aspectRatio: metadata.aspectRatio || '1:1',
    postType: metadata.postType || '',
    tags: metadata.tags || ['ai-generated', 'image'],
    source: metadata.source || 'business-image'
  });
};

// Add video asset
export const addVideoAsset = (videoUrl, metadata = {}) => {
  return addAsset({
    type: 'video',
    url: videoUrl,
    name: metadata.name || `Video ${new Date().toLocaleDateString()}`,
    caption: metadata.caption || '',
    prompt: metadata.prompt || '',
    duration: metadata.duration || 0,
    aspectRatio: metadata.aspectRatio || '9:16',
    tags: metadata.tags || ['ai-generated', 'video'],
    source: metadata.source || 'video-generator'
  });
};

// Add carousel asset
export const addCarouselAsset = (images, metadata = {}) => {
  return addAsset({
    type: 'carousel',
    images: images,
    url: images[0], // First image as thumbnail
    name: metadata.name || `Carousel ${new Date().toLocaleDateString()}`,
    caption: metadata.caption || '',
    tags: metadata.tags || ['ai-generated', 'carousel'],
    source: metadata.source || 'carousel-generator'
  });
};

// Delete asset
export const deleteAsset = (assetId) => {
  const assets = getAssets();
  const newAssets = assets.filter(a => a.id !== assetId);
  saveAssets(newAssets);
  window.dispatchEvent(new CustomEvent('assetHubUpdated'));
  return true;
};

// Delete multiple assets
export const deleteAssets = (assetIds) => {
  const assets = getAssets();
  const newAssets = assets.filter(a => !assetIds.includes(a.id));
  saveAssets(newAssets);
  window.dispatchEvent(new CustomEvent('assetHubUpdated'));
  return true;
};

// Update asset
export const updateAsset = (assetId, updates) => {
  const assets = getAssets();
  const index = assets.findIndex(a => a.id === assetId);
  
  if (index !== -1) {
    assets[index] = { ...assets[index], ...updates, updatedAt: new Date().toISOString() };
    saveAssets(assets);
    window.dispatchEvent(new CustomEvent('assetHubUpdated'));
    return assets[index];
  }
  
  return null;
};

// Get asset by ID
export const getAsset = (assetId) => {
  const assets = getAssets();
  return assets.find(a => a.id === assetId);
};

// Get assets by type
export const getAssetsByType = (type) => {
  const assets = getAssets();
  return assets.filter(a => a.type === type);
};

// Get assets by source
export const getAssetsBySource = (source) => {
  const assets = getAssets();
  return assets.filter(a => a.source === source);
};

// Generate shareable link (mock - in production would create actual share link)
export const generateShareLink = (assetId) => {
  const asset = getAsset(assetId);
  if (!asset) return null;
  
  // In production, this would create a short URL or public link
  // For now, return the direct URL
  return asset.url;
};

// Download asset
export const downloadAsset = async (asset) => {
  try {
    const response = await fetch(asset.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Determine extension
    const ext = asset.type === 'video' ? 'mp4' : 'webp';
    a.download = `${asset.name || 'asset'}-${Date.now()}.${ext}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    // Fallback: open in new tab
    window.open(asset.url, '_blank');
    return false;
  }
};

// Export service
const assetHubService = {
  getAssets,
  addAsset,
  addImageAsset,
  addVideoAsset,
  addCarouselAsset,
  deleteAsset,
  deleteAssets,
  updateAsset,
  getAsset,
  getAssetsByType,
  getAssetsBySource,
  generateShareLink,
  downloadAsset
};

export default assetHubService;
