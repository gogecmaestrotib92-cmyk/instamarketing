import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { postsAPI } from '../services/api';
import { 
  FiUpload, 
  FiX, 
  FiCalendar, 
  FiHash,
  FiSend,
  FiSave,
  FiArrowLeft
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import './CreateContent.css';

const CreatePost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    caption: '',
    hashtags: '',
    type: 'image',
    scheduledFor: ''
  });
  const [files, setFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await postsAPI.getOne(id);
      const post = response.data.post;
      setFormData({
        caption: post.caption || '',
        hashtags: post.hashtags?.join(', ') || '',
        type: post.type || 'image',
        scheduledFor: post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : ''
      });
      setExistingMedia(post.media || []);
    } catch (error) {
      toast.error('Failed to fetch post');
      navigate('/posts');
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxFiles: 10
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index) => {
    setExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (publish = false) => {
    if (files.length === 0 && existingMedia.length === 0) {
      toast.error('Please add at least one image or video');
      return;
    }

    setLoading(true);
    if (publish) setPublishing(true);

    try {
      const data = new FormData();
      data.append('caption', formData.caption);
      data.append('type', formData.type);
      data.append('hashtags', JSON.stringify(
        formData.hashtags.split(',').map(h => h.trim()).filter(h => h)
      ));
      
      if (formData.scheduledFor && !publish) {
        data.append('scheduledFor', formData.scheduledFor);
      }

      files.forEach(file => {
        data.append('media', file);
      });

      let response;
      if (isEditing) {
        response = await postsAPI.update(id, data);
        toast.success('Post updated successfully!');
      } else {
        response = await postsAPI.create(data);
        toast.success('Post created successfully!');
      }

      if (publish) {
        await postsAPI.publish(response.data.post._id);
        toast.success('Post published to Instagram!');
      }

      navigate('/posts');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save post');
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  };

  return (
    <div className="create-content-page">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/posts')}>
          <FiArrowLeft /> Back
        </button>
        <h1>{isEditing ? 'Edit Post' : 'Create New Post'}</h1>
      </div>

      <div className="create-content-grid">
        {/* Media Upload */}
        <div className="card">
          <h3 className="card-title">Media</h3>
          
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <FiUpload className="dropzone-icon" />
            <p>Drag & drop images or videos here</p>
            <span>or click to browse</span>
          </div>

          {/* Preview */}
          {(existingMedia.length > 0 || files.length > 0) && (
            <div className="media-preview-grid">
              {existingMedia.map((media, index) => (
                <div key={`existing-${index}`} className="media-preview-item">
                  <img src={media.url} alt="" />
                  <button 
                    className="remove-media" 
                    onClick={() => removeExistingMedia(index)}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              {files.map((file, index) => (
                <div key={`new-${index}`} className="media-preview-item">
                  {file.type.startsWith('video') ? (
                    <video src={file.preview} />
                  ) : (
                    <img src={file.preview} alt="" />
                  )}
                  <button className="remove-media" onClick={() => removeFile(index)}>
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Details */}
        <div className="card">
          <h3 className="card-title">Post Details</h3>

          <div className="form-group">
            <label className="label">Caption</label>
            <textarea
              className="input textarea"
              placeholder="Write your caption..."
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              maxLength={2200}
            />
            <span className="char-count">{formData.caption.length}/2200</span>
          </div>

          <div className="form-group">
            <label className="label">
              <FiHash /> Hashtags
            </label>
            <input
              type="text"
              className="input"
              placeholder="fitness, motivation, workout (comma separated)"
              value={formData.hashtags}
              onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="label">Post Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="image">Single Image</option>
              <option value="carousel">Carousel (Multiple Images)</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">
              <FiCalendar /> Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              className="input"
              value={formData.scheduledFor}
              onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="form-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => handleSubmit(false)}
              disabled={loading}
            >
              <FiSave /> {formData.scheduledFor ? 'Schedule' : 'Save Draft'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => handleSubmit(true)}
              disabled={loading || publishing}
            >
              <FiSend /> {publishing ? 'Publishing...' : 'Publish Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
