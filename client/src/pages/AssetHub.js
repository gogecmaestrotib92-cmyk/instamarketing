import React, { useState, useEffect } from 'react';
import {
  FiFolder,
  FiImage,
  FiVideo,
  FiLayers,
  FiGrid,
  FiDownload,
  FiTrash2,
  FiSearch,
  FiCalendar,
  FiEye,
  FiX,
  FiCheck,
  FiLink,
  FiSend
} from 'react-icons/fi';
import './AssetHub.css';

const AssetHub = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAsset, setPreviewAsset] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  // Load assets from localStorage (in production, would be from API)
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    try {
      const savedAssets = localStorage.getItem('assetHub');
      if (savedAssets) {
        setAssets(JSON.parse(savedAssets));
      } else {
        // Initialize with empty array
        setAssets([]);
      }
    } catch (e) {
      console.error('Failed to load assets:', e);
      setAssets([]);
    }
  };

  // Filter assets based on tab and search
  useEffect(() => {
    let filtered = [...assets];

    // Filter by type
    if (activeTab !== 'all') {
      filtered = filtered.filter(asset => asset.type === activeTab);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name?.toLowerCase().includes(query) ||
        asset.caption?.toLowerCase().includes(query) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    setFilteredAssets(filtered);
  }, [assets, activeTab, searchQuery, sortBy]);

  // Get counts by type
  const getCounts = () => {
    return {
      all: assets.length,
      image: assets.filter(a => a.type === 'image').length,
      video: assets.filter(a => a.type === 'video').length,
      carousel: assets.filter(a => a.type === 'carousel').length
    };
  };

  const counts = getCounts();

  // Toggle asset selection
  const toggleSelect = (assetId) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  // Delete selected assets
  const deleteSelected = () => {
    if (!window.confirm(`Delete ${selectedAssets.length} asset(s)?`)) return;
    
    const newAssets = assets.filter(a => !selectedAssets.includes(a.id));
    setAssets(newAssets);
    localStorage.setItem('assetHub', JSON.stringify(newAssets));
    setSelectedAssets([]);
  };

  // Delete single asset
  const deleteAsset = (assetId) => {
    if (!window.confirm('Delete this asset?')) return;
    
    const newAssets = assets.filter(a => a.id !== assetId);
    setAssets(newAssets);
    localStorage.setItem('assetHub', JSON.stringify(newAssets));
  };

  // Handle Download
  const handleDownload = async (asset) => {
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.name || `asset-${asset.id}.${asset.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Fallback to direct link
      window.open(asset.url, '_blank');
    }
  };

  // Handle Publish to Instagram
  const handlePublish = (asset) => {
    // Store asset for publishing and navigate to publish modal/page
    localStorage.setItem('publishAsset', JSON.stringify(asset));
    // For now, show alert - can integrate with Instagram API later
    alert(`Ready to publish "${asset.name || 'Asset'}" to Instagram!\n\nThis feature will connect to Instagram API.`);
  };

  // Handle Share Link
  const handleShareLink = async (asset) => {
    // Generate shareable link
    const shareUrl = asset.url;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Share link copied to clipboard!');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get asset type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return <FiImage />;
      case 'video': return <FiVideo />;
      case 'carousel': return <FiLayers />;
      default: return <FiFolder />;
    }
  };

  return (
    <div className="asset-hub-page">
      <div className="asset-hub-container">
        {/* Header */}
        <header className="page-header">
          <div className="header-content">
            <h1>
              <FiFolder className="header-icon" />
              Asset Hub
            </h1>
            <p>All your generated content in one place</p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="asset-toolbar">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="toolbar-actions">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Name</option>
            </select>

            {selectedAssets.length > 0 && (
              <button className="btn-delete-selected" onClick={deleteSelected}>
                <FiTrash2 />
                Delete ({selectedAssets.length})
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="asset-tabs">
          <button 
            className={`asset-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <FiGrid />
            All
            <span className="tab-count">{counts.all}</span>
          </button>
          <button 
            className={`asset-tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            <FiImage />
            Images
            <span className="tab-count">{counts.image}</span>
          </button>
          <button 
            className={`asset-tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <FiVideo />
            Videos
            <span className="tab-count">{counts.video}</span>
          </button>
          <button 
            className={`asset-tab ${activeTab === 'carousel' ? 'active' : ''}`}
            onClick={() => setActiveTab('carousel')}
          >
            <FiLayers />
            Carousel
            <span className="tab-count">{counts.carousel}</span>
          </button>
        </div>

        {/* Asset Grid */}
        {filteredAssets.length === 0 ? (
          <div className="empty-state">
            <FiFolder className="empty-icon" />
            <h3>No assets yet</h3>
            <p>
              {activeTab === 'all' 
                ? 'Content you generate will automatically appear here'
                : `No ${activeTab}s found`}
            </p>
          </div>
        ) : (
          <div className="assets-grid">
            {filteredAssets.map(asset => (
              <div 
                key={asset.id} 
                className={`asset-card ${selectedAssets.includes(asset.id) ? 'selected' : ''}`}
              >
                {/* Selection checkbox */}
                <button 
                  className="asset-select"
                  onClick={() => toggleSelect(asset.id)}
                >
                  {selectedAssets.includes(asset.id) ? <FiCheck /> : null}
                </button>

                {/* Preview */}
                <div className="asset-preview" onClick={() => setPreviewAsset(asset)}>
                  {asset.type === 'video' ? (
                    <>
                      {asset.thumbnail ? (
                        <img src={asset.thumbnail} alt={asset.name} className="video-thumbnail" />
                      ) : (
                        <video 
                          src={asset.url} 
                          muted 
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            // Seek to 1 second to get a better thumbnail frame
                            e.target.currentTime = 1;
                          }}
                        />
                      )}
                      <div className="video-play-icon">▶</div>
                    </>
                  ) : asset.type === 'carousel' ? (
                    <div className="carousel-preview">
                      {asset.images?.slice(0, 3).map((img, i) => (
                        <img key={i} src={img} alt="" style={{ zIndex: 3 - i }} />
                      ))}
                    </div>
                  ) : (
                    <img src={asset.url} alt={asset.name} />
                  )}
                  <div className="asset-overlay">
                    <FiEye />
                  </div>
                  <span className="asset-type-badge">
                    {getTypeIcon(asset.type)}
                  </span>
                </div>

                {/* Info */}
                <div className="asset-info">
                  <h4>{asset.name || 'Untitled'}</h4>
                  <div className="asset-meta">
                    <span><FiCalendar /> {formatDate(asset.createdAt)}</span>
                  </div>
                </div>

                {/* Actions - 3 Buttons */}
                <div className="asset-actions-row">
                  <button 
                    className="asset-action-btn download"
                    onClick={() => handleDownload(asset)}
                    title="Download"
                  >
                    <FiDownload />
                    <span>Download</span>
                  </button>
                  <button 
                    className="asset-action-btn publish"
                    onClick={() => handlePublish(asset)}
                    title="Publish to Instagram"
                  >
                    <FiSend />
                    <span>Publish</span>
                  </button>
                  <button 
                    className="asset-action-btn share"
                    onClick={() => handleShareLink(asset)}
                    title="Copy Share Link"
                  >
                    <FiLink />
                    <span>Share Link</span>
                  </button>
                </div>
                
                {/* Delete button */}
                <button 
                  className="asset-delete-btn"
                  onClick={() => deleteAsset(asset.id)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewAsset && (
          <div className="preview-modal" onClick={() => setPreviewAsset(null)}>
            <div className="preview-content" onClick={(e) => e.stopPropagation()}>
              <button className="preview-close" onClick={() => setPreviewAsset(null)}>
                <FiX />
              </button>
              
              {previewAsset.type === 'video' ? (
                <video src={previewAsset.url} controls autoPlay />
              ) : previewAsset.type === 'carousel' ? (
                <div className="preview-carousel">
                  {previewAsset.images?.map((img, i) => (
                    <img key={i} src={img} alt="" />
                  ))}
                </div>
              ) : (
                <img src={previewAsset.url} alt={previewAsset.name} />
              )}
              
              <div className="preview-info">
                <h3>{previewAsset.name || 'Untitled'}</h3>
                {previewAsset.caption && <p>{previewAsset.caption}</p>}
                <div className="preview-meta">
                  <span><FiCalendar /> {formatDate(previewAsset.createdAt)}</span>
                  <span>{previewAsset.type}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetHub;
