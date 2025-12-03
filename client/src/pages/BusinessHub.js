import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, 
  FiSave, 
  FiBriefcase, 
  FiTarget, 
  FiUsers, 
  FiMessageCircle,
  FiGlobe,
  FiInstagram,
  FiCheckCircle,
  FiTrash2,
  FiPlus,
  FiTag,
  FiHash,
  FiImage,
  FiZap,
  FiDownload,
  FiLoader,
  FiCheck,
  FiX,
  FiExternalLink
} from 'react-icons/fi';
import './BusinessHub.css';

const BusinessHub = () => {
  const navigate = useNavigate();
  
  // Load saved business info from localStorage
  const [businessInfo, setBusinessInfo] = useState(() => {
    const saved = localStorage.getItem('businessInfo');
    return saved ? JSON.parse(saved) : {
      businessName: '',
      industry: '',
      description: '',
      targetAudience: '',
      brandVoice: 'professional',
      brandColors: [],
      keywords: [],
      competitors: '',
      uniqueSellingPoints: '',
      instagramHandle: '',
      website: '',
      products: [],
      brandImages: [] // New: images collected from website
    };
  });
  
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [newKeyword, setNewKeyword] = useState('');
  const [newColor, setNewColor] = useState('#8b5cf6');
  const [newProduct, setNewProduct] = useState({ name: '', description: '' });
  
  // Fetch Website states
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [selectedImages, setSelectedImages] = useState(new Set());

  // Brand voice options
  const brandVoices = [
    { id: 'professional', label: 'Professional', emoji: '💼', description: 'Formal, trustworthy, expert' },
    { id: 'friendly', label: 'Friendly', emoji: '😊', description: 'Warm, approachable, casual' },
    { id: 'bold', label: 'Bold', emoji: '🔥', description: 'Confident, edgy, provocative' },
    { id: 'luxurious', label: 'Luxurious', emoji: '✨', description: 'Elegant, premium, exclusive' },
    { id: 'playful', label: 'Playful', emoji: '🎉', description: 'Fun, witty, energetic' },
    { id: 'inspiring', label: 'Inspiring', emoji: '💪', description: 'Motivational, uplifting' },
    { id: 'educational', label: 'Educational', emoji: '📚', description: 'Informative, helpful, clear' },
    { id: 'minimalist', label: 'Minimalist', emoji: '⚪', description: 'Simple, clean, understated' }
  ];

  // Industry options
  const industries = [
    'E-Commerce / Retail',
    'Fashion & Apparel',
    'Beauty & Cosmetics',
    'Health & Fitness',
    'Food & Beverage',
    'Technology',
    'Real Estate',
    'Finance & Investing',
    'Education & Coaching',
    'Travel & Hospitality',
    'Entertainment',
    'Home & Living',
    'Automotive',
    'B2B / Services',
    'Non-Profit',
    'Other'
  ];

  // Save business info to localStorage
  const handleSave = () => {
    localStorage.setItem('businessInfo', JSON.stringify(businessInfo));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Update field
  const updateField = (field, value) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  // Add keyword
  const addKeyword = () => {
    if (newKeyword.trim() && !businessInfo.keywords.includes(newKeyword.trim())) {
      setBusinessInfo(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  // Remove keyword
  const removeKeyword = (keyword) => {
    setBusinessInfo(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  // Add color
  const addColor = () => {
    if (!businessInfo.brandColors.includes(newColor)) {
      setBusinessInfo(prev => ({
        ...prev,
        brandColors: [...prev.brandColors, newColor]
      }));
    }
  };

  // Remove color
  const removeColor = (color) => {
    setBusinessInfo(prev => ({
      ...prev,
      brandColors: prev.brandColors.filter(c => c !== color)
    }));
  };

  // Add product
  const addProduct = () => {
    if (newProduct.name.trim()) {
      setBusinessInfo(prev => ({
        ...prev,
        products: [...prev.products, { ...newProduct, id: Date.now() }]
      }));
      setNewProduct({ name: '', description: '' });
    }
  };

  // Remove product
  const removeProduct = (id) => {
    setBusinessInfo(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  // ===== Fetch Website Functions =====
  
  // Fetch website data
  const handleFetchWebsite = async () => {
    if (!fetchUrl.trim()) {
      setFetchError('Please enter a website URL');
      return;
    }

    setFetching(true);
    setFetchError('');
    setFetchedData(null);
    setSelectedImages(new Set());

    try {
      const response = await fetch('/api/ai/fetch-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fetchUrl.trim() })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch website');
      }

      setFetchedData(result.data);
      
      // Auto-select featured images
      const featured = new Set();
      result.data.images?.forEach((img, idx) => {
        if (img.featured || idx < 3) {
          featured.add(img.url);
        }
      });
      setSelectedImages(featured);

    } catch (error) {
      setFetchError(error.message);
    } finally {
      setFetching(false);
    }
  };

  // Apply fetched data to business info
  const applyFetchedData = (field, value) => {
    if (value) {
      updateField(field, value);
    }
  };

  // Apply all fetched data
  const applyAllFetchedData = () => {
    if (!fetchedData) return;

    const updates = {};
    
    if (fetchedData.businessName && !businessInfo.businessName) {
      updates.businessName = fetchedData.businessName;
    }
    if (fetchedData.description && !businessInfo.description) {
      updates.description = fetchedData.description;
    }
    if (fetchedData.instagramHandle && !businessInfo.instagramHandle) {
      updates.instagramHandle = fetchedData.instagramHandle;
    }
    if (fetchedData.url && !businessInfo.website) {
      updates.website = fetchedData.url;
    }
    if (fetchedData.keywords?.length > 0 && businessInfo.keywords.length === 0) {
      updates.keywords = fetchedData.keywords.slice(0, 10);
    }

    setBusinessInfo(prev => ({ ...prev, ...updates }));
  };

  // Toggle image selection
  const toggleImageSelection = (imageUrl) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl);
      } else {
        newSet.add(imageUrl);
      }
      return newSet;
    });
  };

  // Save selected images to brand images
  const saveSelectedImages = () => {
    const newImages = Array.from(selectedImages).map(url => ({
      url,
      addedAt: new Date().toISOString(),
      source: fetchedData?.domain || 'website'
    }));

    setBusinessInfo(prev => ({
      ...prev,
      brandImages: [...(prev.brandImages || []), ...newImages]
    }));

    // Clear selection
    setSelectedImages(new Set());
    setFetchedData(null);
    setFetchUrl('');
    
    // Switch to brand tab to show saved images
    setActiveTab('brand');
  };

  // Remove brand image
  const removeBrandImage = (url) => {
    setBusinessInfo(prev => ({
      ...prev,
      brandImages: (prev.brandImages || []).filter(img => img.url !== url)
    }));
  };

  // Calculate profile completeness
  const getCompleteness = () => {
    const fields = [
      businessInfo.businessName,
      businessInfo.industry,
      businessInfo.description,
      businessInfo.targetAudience,
      businessInfo.brandVoice,
      businessInfo.keywords.length > 0,
      businessInfo.uniqueSellingPoints
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const completeness = getCompleteness();

  return (
    <div className="business-hub-page">
      <div className="business-hub-container">
        {/* Header */}
        <div className="hub-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <div className="hub-title">
            <h1>Business Hub</h1>
            <p>Your business profile powers AI suggestions across all tools</p>
          </div>
          <button 
            className={`save-btn ${saved ? 'saved' : ''}`}
            onClick={handleSave}
          >
            {saved ? <><FiCheckCircle /> Saved!</> : <><FiSave /> Save</>}
          </button>
        </div>

        {/* Completeness Bar */}
        <div className="completeness-card">
          <div className="completeness-header">
            <span className="completeness-label">Profile Completeness</span>
            <span className="completeness-value">{completeness}%</span>
          </div>
          <div className="completeness-bar">
            <div 
              className="completeness-fill" 
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="completeness-hint">
            {completeness < 50 && '💡 Add more info to get better AI suggestions'}
            {completeness >= 50 && completeness < 80 && '🎯 Good start! Keep adding details'}
            {completeness >= 80 && '✨ Excellent! Your AI suggestions will be highly personalized'}
          </p>
        </div>

        {/* Tabs */}
        <div className="hub-tabs">
          <button 
            className={`hub-tab ${activeTab === 'fetch' ? 'active' : ''}`}
            onClick={() => setActiveTab('fetch')}
          >
            <FiDownload /> Fetch Website
          </button>
          <button 
            className={`hub-tab ${activeTab === 'basics' ? 'active' : ''}`}
            onClick={() => setActiveTab('basics')}
          >
            <FiBriefcase /> Basics
          </button>
          <button 
            className={`hub-tab ${activeTab === 'brand' ? 'active' : ''}`}
            onClick={() => setActiveTab('brand')}
          >
            <FiImage /> Brand
          </button>
          <button 
            className={`hub-tab ${activeTab === 'audience' ? 'active' : ''}`}
            onClick={() => setActiveTab('audience')}
          >
            <FiUsers /> Audience
          </button>
          <button 
            className={`hub-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <FiTag /> Products
          </button>
        </div>

        {/* Tab Content */}
        <div className="hub-content">
          {/* Fetch Website Tab */}
          {activeTab === 'fetch' && (
            <div className="tab-content">
              <div className="fetch-intro">
                <h3>🌐 Auto-Fill from Website</h3>
                <p>Enter your business website and we'll extract public information to help fill your profile.</p>
              </div>

              <div className="form-group">
                <label>
                  <FiGlobe /> Website URL
                </label>
                <div className="fetch-input-row">
                  <input
                    type="text"
                    placeholder="https://yourbusiness.com"
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFetchWebsite()}
                  />
                  <button 
                    className="fetch-btn" 
                    onClick={handleFetchWebsite}
                    disabled={fetching}
                  >
                    {fetching ? (
                      <><FiLoader className="spin" /> Fetching...</>
                    ) : (
                      <><FiDownload /> Fetch</>
                    )}
                  </button>
                </div>
                {fetchError && (
                  <div className="fetch-error">
                    <FiX /> {fetchError}
                  </div>
                )}
              </div>

              {/* Fetched Data Results */}
              {fetchedData && (
                <div className="fetched-results">
                  <div className="fetched-header">
                    <h4>✅ Data Found from {fetchedData.domain}</h4>
                    <button className="apply-all-btn" onClick={applyAllFetchedData}>
                      <FiZap /> Apply All Empty Fields
                    </button>
                  </div>

                  {/* Business Info Found */}
                  <div className="fetched-section">
                    <h5>Business Information</h5>
                    
                    {fetchedData.businessName && (
                      <div className="fetched-item">
                        <div className="fetched-label">Business Name</div>
                        <div className="fetched-value">{fetchedData.businessName}</div>
                        <button 
                          className="apply-btn"
                          onClick={() => applyFetchedData('businessName', fetchedData.businessName)}
                        >
                          <FiCheck /> Use
                        </button>
                      </div>
                    )}

                    {fetchedData.description && (
                      <div className="fetched-item">
                        <div className="fetched-label">Description</div>
                        <div className="fetched-value">{fetchedData.description.slice(0, 150)}...</div>
                        <button 
                          className="apply-btn"
                          onClick={() => applyFetchedData('description', fetchedData.description)}
                        >
                          <FiCheck /> Use
                        </button>
                      </div>
                    )}

                    {fetchedData.instagramHandle && (
                      <div className="fetched-item">
                        <div className="fetched-label">Instagram</div>
                        <div className="fetched-value">{fetchedData.instagramHandle}</div>
                        <button 
                          className="apply-btn"
                          onClick={() => applyFetchedData('instagramHandle', fetchedData.instagramHandle)}
                        >
                          <FiCheck /> Use
                        </button>
                      </div>
                    )}

                    {fetchedData.email && (
                      <div className="fetched-item">
                        <div className="fetched-label">Email</div>
                        <div className="fetched-value">{fetchedData.email}</div>
                      </div>
                    )}

                    {fetchedData.keywords?.length > 0 && (
                      <div className="fetched-item">
                        <div className="fetched-label">Keywords</div>
                        <div className="fetched-value fetched-keywords">
                          {fetchedData.keywords.slice(0, 5).map(k => (
                            <span key={k} className="keyword-badge">{k}</span>
                          ))}
                        </div>
                        <button 
                          className="apply-btn"
                          onClick={() => {
                            setBusinessInfo(prev => ({
                              ...prev,
                              keywords: [...new Set([...prev.keywords, ...fetchedData.keywords.slice(0, 10)])]
                            }));
                          }}
                        >
                          <FiCheck /> Add
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Images Found */}
                  {fetchedData.images?.length > 0 && (
                    <div className="fetched-section">
                      <h5>
                        <FiImage /> Images Found ({fetchedData.images.length})
                        <span className="selected-count">
                          {selectedImages.size} selected
                        </span>
                      </h5>
                      <p className="section-hint">Select images to save to your brand library for creating ads</p>
                      
                      <div className="fetched-images-grid">
                        {fetchedData.images.map((img, idx) => (
                          <div 
                            key={idx}
                            className={`fetched-image-card ${selectedImages.has(img.url) ? 'selected' : ''}`}
                            onClick={() => toggleImageSelection(img.url)}
                          >
                            <img 
                              src={img.url} 
                              alt={img.alt || 'Website image'} 
                              onError={(e) => e.target.style.display = 'none'}
                            />
                            <div className="image-overlay">
                              {selectedImages.has(img.url) ? (
                                <FiCheckCircle className="check-icon" />
                              ) : (
                                <FiPlus className="plus-icon" />
                              )}
                            </div>
                            {img.featured && <span className="featured-badge">Featured</span>}
                          </div>
                        ))}
                      </div>

                      {selectedImages.size > 0 && (
                        <button className="save-images-btn" onClick={saveSelectedImages}>
                          <FiSave /> Save {selectedImages.size} Image{selectedImages.size > 1 ? 's' : ''} to Brand Library
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tips */}
              <div className="fetch-tips">
                <h4>💡 Tips</h4>
                <ul>
                  <li>Enter your main website URL (home page works best)</li>
                  <li>We extract public information like business name, description, and images</li>
                  <li>Select images to add to your brand library for creating personalized ads</li>
                  <li>All data is saved locally - only you can see it</li>
                </ul>
              </div>
            </div>
          )}

          {/* Basics Tab */}
          {activeTab === 'basics' && (
            <div className="tab-content">
              <div className="form-group">
                <label>
                  <FiBriefcase /> Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Acme Inc."
                  value={businessInfo.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>
                  <FiTarget /> Industry
                </label>
                <select
                  value={businessInfo.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                >
                  <option value="">Select your industry...</option>
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FiMessageCircle /> Business Description
                </label>
                <textarea
                  placeholder="Describe what your business does, your mission, and what makes you unique..."
                  rows={4}
                  value={businessInfo.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <FiInstagram /> Instagram Handle
                  </label>
                  <input
                    type="text"
                    placeholder="@yourbusiness"
                    value={businessInfo.instagramHandle}
                    onChange={(e) => updateField('instagramHandle', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FiGlobe /> Website
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourbusiness.com"
                    value={businessInfo.website}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FiZap /> Unique Selling Points
                </label>
                <textarea
                  placeholder="What makes your business different? What's your competitive advantage?"
                  rows={3}
                  value={businessInfo.uniqueSellingPoints}
                  onChange={(e) => updateField('uniqueSellingPoints', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Brand Tab */}
          {activeTab === 'brand' && (
            <div className="tab-content">
              <div className="form-group">
                <label>Brand Voice</label>
                <p className="field-hint">How should your content sound?</p>
                <div className="voice-grid">
                  {brandVoices.map(voice => (
                    <button
                      key={voice.id}
                      className={`voice-option ${businessInfo.brandVoice === voice.id ? 'active' : ''}`}
                      onClick={() => updateField('brandVoice', voice.id)}
                    >
                      <span className="voice-emoji">{voice.emoji}</span>
                      <span className="voice-label">{voice.label}</span>
                      <span className="voice-desc">{voice.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Brand Colors</label>
                <p className="field-hint">Add your brand colors for AI-generated visuals</p>
                <div className="color-input-row">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="color-picker"
                  />
                  <span className="color-hex">{newColor}</span>
                  <button className="add-btn" onClick={addColor}>
                    <FiPlus /> Add
                  </button>
                </div>
                <div className="color-tags">
                  {businessInfo.brandColors.map(color => (
                    <div 
                      key={color} 
                      className="color-tag"
                      style={{ backgroundColor: color }}
                    >
                      <span>{color}</span>
                      <button onClick={() => removeColor(color)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  {businessInfo.brandColors.length === 0 && (
                    <span className="empty-hint">No colors added yet</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FiHash /> Keywords & Hashtags
                </label>
                <p className="field-hint">Key terms related to your business</p>
                <div className="keyword-input-row">
                  <input
                    type="text"
                    placeholder="Add a keyword..."
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <button className="add-btn" onClick={addKeyword}>
                    <FiPlus /> Add
                  </button>
                </div>
                <div className="keyword-tags">
                  {businessInfo.keywords.map(keyword => (
                    <span key={keyword} className="keyword-tag">
                      #{keyword}
                      <button onClick={() => removeKeyword(keyword)}>×</button>
                    </span>
                  ))}
                  {businessInfo.keywords.length === 0 && (
                    <span className="empty-hint">No keywords added yet</span>
                  )}
                </div>
              </div>

              {/* Brand Images Section */}
              <div className="form-group">
                <label>
                  <FiImage /> Brand Images
                </label>
                <p className="field-hint">
                  Images from your website for creating ads. 
                  <button 
                    className="fetch-link" 
                    onClick={() => setActiveTab('fetch')}
                  >
                    Fetch from website →
                  </button>
                </p>
                
                {businessInfo.brandImages?.length > 0 ? (
                  <div className="brand-images-grid">
                    {businessInfo.brandImages.map((img, idx) => (
                      <div key={idx} className="brand-image-card">
                        <img 
                          src={img.url} 
                          alt="Brand" 
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        <button 
                          className="remove-image-btn"
                          onClick={() => removeBrandImage(img.url)}
                        >
                          <FiTrash2 />
                        </button>
                        <span className="image-source">{img.source}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-images">
                    <FiImage />
                    <p>No brand images saved</p>
                    <button onClick={() => setActiveTab('fetch')}>
                      <FiDownload /> Fetch from Website
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audience Tab */}
          {activeTab === 'audience' && (
            <div className="tab-content">
              <div className="form-group">
                <label>
                  <FiUsers /> Target Audience
                </label>
                <p className="field-hint">Describe your ideal customer</p>
                <textarea
                  placeholder="e.g., Women aged 25-45 interested in sustainable fashion, eco-conscious consumers, busy professionals..."
                  rows={4}
                  value={businessInfo.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>
                  <FiTarget /> Competitors
                </label>
                <p className="field-hint">Who are your main competitors? (helps AI understand your market)</p>
                <textarea
                  placeholder="List your main competitors and what they do differently..."
                  rows={3}
                  value={businessInfo.competitors}
                  onChange={(e) => updateField('competitors', e.target.value)}
                />
              </div>

              <div className="audience-tips">
                <h4>💡 Tips for Better AI Suggestions</h4>
                <ul>
                  <li>Be specific about demographics (age, location, interests)</li>
                  <li>Mention pain points your audience has</li>
                  <li>Include what motivates them to buy</li>
                  <li>Note their preferred content style</li>
                </ul>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="tab-content">
              <div className="form-group">
                <label>
                  <FiTag /> Products / Services
                </label>
                <p className="field-hint">Add your main products or services for personalized suggestions</p>
                
                <div className="product-input-card">
                  <input
                    type="text"
                    placeholder="Product/Service name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Brief description (optional)"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <button className="add-product-btn" onClick={addProduct}>
                    <FiPlus /> Add Product
                  </button>
                </div>
              </div>

              <div className="products-list">
                {businessInfo.products.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      {product.description && <p>{product.description}</p>}
                    </div>
                    <button 
                      className="remove-product-btn"
                      onClick={() => removeProduct(product.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                {businessInfo.products.length === 0 && (
                  <div className="empty-products">
                    <FiTag />
                    <p>No products added yet</p>
                    <span>Add your products to get personalized content ideas</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="how-it-works">
          <h3>🚀 How Business Hub Works</h3>
          <div className="how-cards">
            <div className="how-card">
              <span className="how-num">1</span>
              <h4>Fill Your Profile</h4>
              <p>Add your business details, brand voice, and target audience</p>
            </div>
            <div className="how-card">
              <span className="how-num">2</span>
              <h4>Use AI Advice</h4>
              <p>Click "AI Advice" in any creation tool</p>
            </div>
            <div className="how-card">
              <span className="how-num">3</span>
              <h4>Get Personalized Ideas</h4>
              <p>AI uses your profile to suggest relevant content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessHub;
