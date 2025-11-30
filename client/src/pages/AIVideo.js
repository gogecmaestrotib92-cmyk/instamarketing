import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiDownload, FiSave, FiEdit3 } from 'react-icons/fi';
import SEO from '../components/SEO';
import NewVideoForm from '../components/NewVideoForm';
import api from '../services/api';
import './AIVideo.css';

const AIVideo = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio] = useState('9:16');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getStatusMessage = (progress) => {
    if (progress < 10) return 'Initializing...';
    if (progress < 25) return 'Processing prompt...';
    if (progress < 50) return 'Generating frames...';
    if (progress < 75) return 'Rendering...';
    if (progress < 90) return 'Finalizing...';
    return 'Almost done...';
  };

  const pollVideoStatus = async (predictionId, toastId, config = {}) => {
    const maxAttempts = 120;
    let attempts = 0;
    setLoadingProgress(5);
    setLoadingStatus('Initializing...');

    while (attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000));
        const statusResponse = await api.post(`/ai-video/status`, { id: predictionId, ...config });
        const { status, video, error } = statusResponse.data;

        if (status === 'completed' && video?.videoUrl) {
          setLoadingProgress(100);
          toast.update(toastId, { render: 'Video ready', type: 'success', isLoading: false, autoClose: 3000 });
          setGeneratedVideo(video);
          setLoading(false);
          setLoadingProgress(0);
          setLoadingStatus('');
          return;
        } else if (status === 'failed') {
          toast.update(toastId, { render: error || 'Generation failed', type: 'error', isLoading: false, autoClose: 5000 });
          setLoading(false);
          setLoadingProgress(0);
          setLoadingStatus('');
          return;
        }
        
        attempts++;
        const simulatedProgress = Math.min(95, Math.round((attempts / maxAttempts) * 100));
        setLoadingProgress(simulatedProgress);
        setLoadingStatus(getStatusMessage(simulatedProgress));
        toast.update(toastId, { render: `${getStatusMessage(simulatedProgress)}`, type: 'info', isLoading: true });
      } catch (error) {
        attempts++;
      }
    }

    toast.update(toastId, { render: 'Timed out', type: 'error', isLoading: false, autoClose: 5000 });
    setLoading(false);
    setLoadingProgress(0);
    setLoadingStatus('');
  };

  const handleGenerate = async () => {
    if (activeTab === 'text-to-video' && !prompt.trim()) {
      toast.error('Enter a prompt');
      return;
    }
    if (activeTab === 'image-to-video' && !imageFile) {
      toast.error('Select an image');
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setGeneratedVideo(null);
    const toastId = toast.loading('Starting generation...');

    try {
      let response;
      if (activeTab === 'text-to-video') {
        response = await api.post('/ai-video/text-to-video', { prompt, duration, aspectRatio });
      } else {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('prompt', prompt);
        formData.append('duration', duration);
        formData.append('aspectRatio', aspectRatio);
        response = await api.post('/ai-video/image-to-video', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      if (response.data.predictionId && response.data.status === 'processing') {
        pollVideoStatus(response.data.predictionId, toastId, { prompt, duration, aspectRatio });
      } else if (response.data.video?.videoUrl) {
        toast.update(toastId, { render: 'Video ready', type: 'success', isLoading: false, autoClose: 3000 });
        setGeneratedVideo(response.data.video);
        setLoading(false);
      } else {
        toast.update(toastId, { render: 'Unexpected response', type: 'error', isLoading: false, autoClose: 5000 });
        setLoading(false);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Generation error';
      toast.update(toastId, { render: errorMsg, type: 'error', isLoading: false, autoClose: 5000 });
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const handleSaveVideo = () => {
    if (!generatedVideo) return;
    
    const savedVideos = JSON.parse(localStorage.getItem('aiVideos') || '[]');
    const newVideo = {
      id: Date.now(),
      ...generatedVideo,
      prompt,
      duration,
      createdAt: new Date().toISOString()
    };
    savedVideos.unshift(newVideo);
    localStorage.setItem('aiVideos', JSON.stringify(savedVideos));
    toast.success('Video saved');
  };

  const handleDownload = () => {
    if (!generatedVideo?.videoUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedVideo.videoUrl;
    link.download = `ai-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditVideo = () => {
    if (!generatedVideo) return;
    // Save video to localStorage first
    const savedVideos = JSON.parse(localStorage.getItem('aiVideos') || '[]');
    const videoExists = savedVideos.find(v => v.videoUrl === generatedVideo.videoUrl);
    if (!videoExists) {
      const newVideo = {
        id: Date.now(),
        ...generatedVideo,
        prompt,
        duration,
        createdAt: new Date().toISOString()
      };
      savedVideos.unshift(newVideo);
      localStorage.setItem('aiVideos', JSON.stringify(savedVideos));
    }
    // Navigate to edit page
    navigate('/app/ai-video/edit', { state: { video: generatedVideo } });
  };

  return (
    <main className="ai-video-page">
      <SEO title="AI Video" description="Generate AI videos" noindex={true} />
      
      <NewVideoForm
        activeTab={activeTab}
        onTabChange={setActiveTab}
        prompt={prompt}
        onPromptChange={setPrompt}
        duration={duration}
        onDurationChange={setDuration}
        loading={loading}
        loadingProgress={loadingProgress}
        loadingStatus={loadingStatus}
        onGenerate={handleGenerate}
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onImageRemove={() => { setImageFile(null); setImagePreview(null); }}
      />

      {generatedVideo && (
        <div className="result">
          <video src={generatedVideo.videoUrl} controls autoPlay loop />
          <div className="result-actions">
            <button className="result-btn" onClick={handleSaveVideo}>
              <FiSave /> Save
            </button>
            <button className="result-btn" onClick={handleDownload}>
              <FiDownload /> Download
            </button>
            <button className="result-btn result-btn--primary" onClick={handleEditVideo}>
              <FiEdit3 /> Edit
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default AIVideo;
