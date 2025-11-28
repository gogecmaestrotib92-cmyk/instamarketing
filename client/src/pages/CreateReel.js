import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { reelsAPI } from '../services/api';
import { 
  FiUpload, 
  FiX, 
  FiCalendar, 
  FiHash,
  FiSend,
  FiSave,
  FiArrowLeft,
  FiFilm
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import './CreateContent.css';

const CreateReel = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    caption: '',
    hashtags: '',
    scheduledFor: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const onDropVideo = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
    }
  }, []);

  const onDropCover = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setCoverImage(Object.assign(file, {
        preview: URL.createObjectURL(file)
      }));
    }
  }, []);

  const { getRootProps: getVideoProps, getInputProps: getVideoInput } = useDropzone({
    onDrop: onDropVideo,
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm'] },
    maxFiles: 1
  });

  const { getRootProps: getCoverProps, getInputProps: getCoverInput } = useDropzone({
    onDrop: onDropCover,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1
  });

  const handleSubmit = async (publish = false) => {
    if (!videoFile) {
      toast.error('Please add a video');
      return;
    }

    setLoading(true);
    if (publish) setPublishing(true);

    try {
      const data = new FormData();
      data.append('caption', formData.caption);
      data.append('hashtags', JSON.stringify(
        formData.hashtags.split(',').map(h => h.trim()).filter(h => h)
      ));
      data.append('video', videoFile);
      
      if (coverImage) {
        data.append('coverImage', coverImage);
      }
      
      if (formData.scheduledFor && !publish) {
        data.append('scheduledFor', formData.scheduledFor);
      }

      const response = await reelsAPI.create(data);
      toast.success('Reel created successfully!');

      if (publish) {
        await reelsAPI.publish(response.data.reel._id);
        toast.success('Reel published to Instagram!');
      }

      navigate('/reels');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save reel');
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  };

  return (
    <main className="create-content-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/reels')} aria-label="Back to reels">
          <FiArrowLeft aria-hidden="true" /> Back
        </button>
        <h1>Create New Reel</h1>
      </header>

      <div className="create-content-grid">
        {/* Video Upload */}
        <section className="card" aria-labelledby="video-heading">
          <h3 id="video-heading" className="card-title">Video</h3>
          
          {!videoFile ? (
            <div 
              {...getVideoProps()} 
              className="dropzone"
              role="button"
              aria-label="Upload video area"
              tabIndex={0}
            >
              <input {...getVideoInput()} />
              <FiFilm className="dropzone-icon" aria-hidden="true" />
              <p>Drag & drop your video here</p>
              <span>MP4, MOV, AVI, WebM - Max 60 seconds</span>
            </div>
          ) : (
            <div className="video-preview">
              <video src={videoFile.preview} controls aria-label="Video preview" />
              <button className="remove-video" onClick={() => setVideoFile(null)} aria-label="Remove video">
                <FiX aria-hidden="true" /> Remove
              </button>
            </div>
          )}

          <h4 style={{ marginTop: 24, marginBottom: 12 }}>Cover Image (Optional)</h4>
          
          {!coverImage ? (
            <div 
              {...getCoverProps()} 
              className="dropzone small"
              role="button"
              aria-label="Upload cover image area"
              tabIndex={0}
            >
              <input {...getCoverInput()} />
              <FiUpload className="dropzone-icon small" aria-hidden="true" />
              <p>Add cover image</p>
            </div>
          ) : (
            <div className="cover-preview">
              <img src={coverImage.preview} alt="Cover preview" />
              <button className="remove-media" onClick={() => setCoverImage(null)} aria-label="Remove cover image">
                <FiX aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        {/* Reel Details */}
        <section className="card" aria-labelledby="details-heading">
          <h3 id="details-heading" className="card-title">Reel Details</h3>

          <div className="form-group">
            <label htmlFor="caption" className="label">Caption</label>
            <textarea
              id="caption"
              className="input textarea"
              placeholder="Write your caption..."
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              maxLength={2200}
            />
            <span className="char-count" aria-live="polite">{formData.caption.length}/2200</span>
          </div>

          <div className="form-group">
            <label htmlFor="hashtags" className="label">
              <FiHash aria-hidden="true" /> Hashtags
            </label>
            <input
              id="hashtags"
              type="text"
              className="input"
              placeholder="reels, viral, trending (comma separated)"
              value={formData.hashtags}
              onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="scheduledFor" className="label">
              <FiCalendar aria-hidden="true" /> Schedule (Optional)
            </label>
            <input
              id="scheduledFor"
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
              aria-busy={loading}
            >
              <FiSave aria-hidden="true" /> {formData.scheduledFor ? 'Schedule' : 'Save Draft'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => handleSubmit(true)}
              disabled={loading || publishing}
              aria-busy={publishing}
            >
              <FiSend aria-hidden="true" /> {publishing ? 'Publishing...' : 'Publish Now'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CreateReel;
