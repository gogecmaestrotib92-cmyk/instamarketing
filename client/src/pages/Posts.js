import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api, { postsAPI } from '../services/api';
import { 
  FiPlus, 
  FiImage, 
  FiEdit2, 
  FiTrash2, 
  FiSend,
  FiClock,
  FiCheck,
  FiX,
  FiHeart,
  FiMessageCircle,
  FiUpload,
  FiZap,
  FiLoader,
  FiDownload,
  FiCopy
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import './Posts.css';

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({});
  
  // AI Image Generator State
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  
  // File Upload State
  const [showUploader, setShowUploader] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await postsAPI.getAll(params);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await postsAPI.publish(id);
      toast.success('Post published successfully!');
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to publish post');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await postsAPI.delete(id);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-default', icon: FiEdit2, label: 'Draft' },
      scheduled: { class: 'badge-warning', icon: FiClock, label: 'Scheduled' },
      publishing: { class: 'badge-info', icon: FiClock, label: 'Publishing' },
      published: { class: 'badge-success', icon: FiCheck, label: 'Published' },
      failed: { class: 'badge-error', icon: FiX, label: 'Failed' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`badge ${badge.class}`}>
        <badge.icon /> {badge.label}
      </span>
    );
  };

  // AI Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    setGeneratingImage(true);
    setGeneratedImage(null);
    
    try {
      // Build enhanced prompt with style
      const stylePrompts = {
        photorealistic: 'photorealistic, professional photography, high quality, 4K, detailed',
        aesthetic: 'aesthetic, beautiful, artistic, Instagram-worthy, trendy',
        minimalist: 'minimalist, clean, simple, modern, elegant',
        vibrant: 'vibrant colors, bold, eye-catching, dynamic, energetic',
        cinematic: 'cinematic, dramatic lighting, movie-like, atmospheric',
        vintage: 'vintage, retro, nostalgic, film grain, warm tones'
      };
      
      const fullPrompt = `${imagePrompt}. ${stylePrompts[imageStyle] || stylePrompts.photorealistic}. No text or words in the image.`;
      
      const response = await api.post('/ai/image/generate', {
        prompt: fullPrompt,
        aspectRatio: aspectRatio,
        outputQuality: 95
      });
      
      if (response.data.success && response.data.imageUrl) {
        setGeneratedImage(response.data.imageUrl);
        toast.success('Image generated successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  // Copy image URL
  const handleCopyImageUrl = () => {
    if (generatedImage) {
      navigator.clipboard.writeText(generatedImage);
      toast.success('Image URL copied!');
    }
  };

  // Download generated image
  const handleDownloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-${Date.now()}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  // Use generated image in new post
  const handleUseInPost = () => {
    if (generatedImage) {
      // Store in sessionStorage for the create post page
      sessionStorage.setItem('pendingPostImage', generatedImage);
      window.location.href = '/posts/create';
    }
  };

  // File Upload handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFiles = async (files) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.files) {
        setUploadedFiles(prev => [...prev, ...response.data.files]);
        toast.success(`${validFiles.length} file(s) uploaded!`);
      }
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveUploadedFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUseUploadedFiles = () => {
    if (uploadedFiles.length > 0) {
      sessionStorage.setItem('pendingPostFiles', JSON.stringify(uploadedFiles));
      window.location.href = '/posts/create';
    }
  };

  return (
    <main className="posts-page">
      <SEO 
        title="Instagram Posts"
        description="Create, manage and optimize Instagram posts. AI assistant for writing captions, hashtag selection and performance analytics for each post."
        keywords="instagram posts, post creation, content management, instagram feed, post optimization"
        url="/posts"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Posts', url: '/posts' }
        ]}
        noindex={true}
      />
      <header className="page-header">
        <div>
          <h1>Posts</h1>
          <p className="page-subtitle">Manage and schedule your Instagram posts</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => { setShowUploader(true); setShowImageGenerator(false); }}
          >
            <FiUpload aria-hidden="true" /> Upload Files
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => { setShowImageGenerator(true); setShowUploader(false); }}
          >
            <FiZap aria-hidden="true" /> AI Image
          </button>
          <Link to="/posts/create" className="btn btn-primary" aria-label="Create new post">
            <FiPlus aria-hidden="true" /> Create Post
          </Link>
        </div>
      </header>

      {/* AI Image Generator Panel */}
      {showImageGenerator && (
        <section className="ai-panel">
          <div className="ai-panel-header">
            <h2><FiZap /> AI Image Generator</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowImageGenerator(false)}>
              <FiX />
            </button>
          </div>
          <p className="ai-panel-description">Generate stunning images with AI using Flux Schnell</p>
          
          <div className="ai-generator-content">
            <div className="ai-input-section">
              <div className="form-group">
                <label>Describe your image</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="A beautiful sunset over mountains with golden light..."
                  rows={3}
                />
              </div>
              
              <div className="ai-options">
                <div className="form-group">
                  <label>Style</label>
                  <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)}>
                    <option value="photorealistic">📷 Photorealistic</option>
                    <option value="aesthetic">✨ Aesthetic</option>
                    <option value="minimalist">🎯 Minimalist</option>
                    <option value="vibrant">🌈 Vibrant</option>
                    <option value="cinematic">🎬 Cinematic</option>
                    <option value="vintage">📼 Vintage</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Aspect Ratio</label>
                  <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                    <option value="1:1">1:1 Square (Feed)</option>
                    <option value="4:5">4:5 Portrait (Feed)</option>
                    <option value="9:16">9:16 Story/Reel</option>
                    <option value="16:9">16:9 Landscape</option>
                  </select>
                </div>
              </div>
              
              <button 
                className="btn btn-primary btn-generate"
                onClick={handleGenerateImage}
                disabled={generatingImage || !imagePrompt.trim()}
              >
                {generatingImage ? (
                  <>
                    <FiLoader className="spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FiZap /> Generate Image
                  </>
                )}
              </button>
            </div>
            
            <div className="ai-preview-section">
              {generatedImage ? (
                <div className="generated-image-container">
                  <img src={generatedImage} alt="AI Generated" />
                  <div className="generated-image-actions">
                    <button className="btn btn-ghost btn-sm" onClick={handleDownloadImage}>
                      <FiDownload /> Download
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleCopyImageUrl}>
                      <FiCopy /> Copy URL
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleUseInPost}>
                      <FiPlus /> Use in Post
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ai-preview-placeholder">
                  <FiImage />
                  <span>Your generated image will appear here</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* File Upload Panel */}
      {showUploader && (
        <section className="ai-panel">
          <div className="ai-panel-header">
            <h2><FiUpload /> Upload Files</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowUploader(false)}>
              <FiX />
            </button>
          </div>
          <p className="ai-panel-description">Upload images or videos for your posts</p>
          
          <div 
            className={`upload-dropzone ${uploading ? 'uploading' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {uploading ? (
              <>
                <FiLoader className="spin upload-icon" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FiUpload className="upload-icon" />
                <span>Drag & drop files here or click to browse</span>
                <small>Supports images and videos up to 50MB</small>
              </>
            )}
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              <h4>Uploaded Files ({uploadedFiles.length})</h4>
              <div className="uploaded-files-grid">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="uploaded-file-item">
                    <img src={file.url || file.thumbnail} alt={`Upload ${index + 1}`} />
                    <button 
                      className="remove-file-btn"
                      onClick={(e) => { e.stopPropagation(); handleRemoveUploadedFile(index); }}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" onClick={handleUseUploadedFiles}>
                <FiPlus /> Create Post with Files
              </button>
            </div>
          )}
        </section>
      )}

      {/* Filters */}
      <nav className="filters" aria-label="Post filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'draft', label: 'Drafts' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'published', label: 'Published' },
          { key: 'failed', label: 'Failed' }
        ].map(status => (
          <button
            key={status.key}
            className={`filter-btn ${filter === status.key ? 'active' : ''}`}
            onClick={() => setFilter(status.key)}
            aria-current={filter === status.key ? 'page' : undefined}
          >
            {status.label}
          </button>
        ))}
      </nav>

      {/* Posts Grid */}
      {loading ? (
        <div className="loading-container" aria-label="Loading posts">
          <div className="spinner" aria-hidden="true"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state-large">
          <FiImage className="empty-icon" aria-hidden="true" />
          <h3>No posts</h3>
          <p>Create your first post to get started</p>
          <Link to="/posts/create" className="btn btn-primary">
            <FiPlus aria-hidden="true" /> Create Post
          </Link>
        </div>
      ) : (
        <section className="posts-grid" aria-label="Post list">
          {posts.map(post => (
            <article key={post._id} className="post-card">
              <figure className="post-media">
                {post.media?.[0] ? (
                  <img 
                    src={post.media[0].url} 
                    alt={post.caption ? `Preview for post: ${post.caption.substring(0, 20)}...` : "Post preview"} 
                    onError={(e) => e.target.src = '/placeholder-image.png'}
                  />
                ) : (
                  <div className="no-media" aria-label="No image">
                    <FiImage aria-hidden="true" />
                  </div>
                )}
                {post.media?.length > 1 && (
                  <figcaption className="media-count">{post.media.length} images</figcaption>
                )}
              </figure>
              
              <div className="post-content">
                <header className="post-header">
                  {getStatusBadge(post.status)}
                  <span className="post-type">{post.type}</span>
                </header>
                
                <p className="post-caption">
                  {post.caption?.substring(0, 100) || 'No caption'}
                  {post.caption?.length > 100 ? '...' : ''}
                </p>

                {post.status === 'published' && (
                  <div className="post-metrics" aria-label="Post metrics">
                    <span aria-label={`${post.metrics?.likes || 0} likes`}><FiHeart aria-hidden="true" /> {post.metrics?.likes || 0}</span>
                    <span aria-label={`${post.metrics?.comments || 0} comments`}><FiMessageCircle aria-hidden="true" /> {post.metrics?.comments || 0}</span>
                  </div>
                )}

                {post.scheduledFor && post.status === 'scheduled' && (
                  <p className="post-scheduled">
                    <FiClock aria-hidden="true" /> <time dateTime={post.scheduledFor}>{new Date(post.scheduledFor).toLocaleString()}</time>
                  </p>
                )}

                <footer className="post-actions">
                  {['draft', 'scheduled'].includes(post.status) && (
                    <>
                      <Link to={`/posts/edit/${post._id}`} className="btn btn-ghost btn-sm" aria-label={`Edit post ${post.caption?.substring(0, 10)}`}>
                        <FiEdit2 aria-hidden="true" /> Edit
                      </Link>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePublish(post._id)}
                        aria-label={`Publish now ${post.caption?.substring(0, 10)}`}
                      >
                        <FiSend aria-hidden="true" /> Publish
                      </button>
                    </>
                  )}
                  <button 
                    className="btn btn-ghost btn-sm danger"
                    onClick={() => handleDelete(post._id)}
                    aria-label={`Delete post ${post.caption?.substring(0, 10)}`}
                  >
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </footer>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <nav className="pagination" aria-label="Page navigation">
          <span>Page {pagination.page} of {pagination.pages}</span>
        </nav>
      )}
    </main>
  );
};

export default Posts;
