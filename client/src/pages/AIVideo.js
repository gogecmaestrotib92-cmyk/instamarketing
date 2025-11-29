import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiDownload, 
  FiInstagram,
  FiLoader,
  FiSave
} from 'react-icons/fi';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import SEO from '../components/SEO';
import NewVideoForm from '../components/NewVideoForm';
import SavedVideosPanel from '../components/SavedVideosPanel';
import MusicModal from '../components/MusicModalV2';
import TextModal from '../components/TextModal';
import api from '../services/api';
import './AIVideo.css';

const AIVideo = () => {
  const [activeTab, setActiveTab] = useState('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio] = useState('9:16'); // Always 9:16 for TikTok/Reels
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [myVideos, setMyVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Music and Text states
  const [musicConfig, setMusicConfig] = useState(null);
  const [textConfig, setTextConfig] = useState(null);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);

  useEffect(() => {
    fetchMyVideos();
  }, []);

  const fetchMyVideos = async () => {
    try {
      // Load from localStorage first (for saved videos)
      const savedVideos = JSON.parse(localStorage.getItem('myAIVideos') || '[]');
      setMyVideos(savedVideos);
      
      // Also try to fetch from API (if server is available)
      try {
        const response = await api.get('/ai-video/my-videos');
        if (response.data.videos && response.data.videos.length > 0) {
          // Merge API videos with local (avoiding duplicates)
          const apiVideos = response.data.videos;
          const allVideos = [...savedVideos];
          apiVideos.forEach(v => {
            if (!allVideos.find(sv => sv._id === v._id)) {
              allVideos.push(v);
            }
          });
          setMyVideos(allVideos);
        }
      } catch (apiError) {
        // API not available, use localStorage only
        console.log('Using localStorage for videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const saveVideoToLocal = (video) => {
    const savedVideos = JSON.parse(localStorage.getItem('myAIVideos') || '[]');
    const newVideo = {
      _id: video.id || Date.now().toString(),
      videoUrl: video.videoUrl,
      prompt: video.prompt || prompt,
      duration: video.duration || duration,
      aspectRatio: video.aspectRatio || aspectRatio,
      type: activeTab === 'text-to-video' ? 'Text-to-Video' : 'Image-to-Video',
      createdAt: new Date().toISOString(),
      postedToInstagram: false
    };
    
    // Check if video already saved
    if (savedVideos.find(v => v.videoUrl === newVideo.videoUrl)) {
      toast.info('Video is already saved');
      return;
    }
    
    savedVideos.unshift(newVideo);
    localStorage.setItem('myAIVideos', JSON.stringify(savedVideos));
    setMyVideos(savedVideos);
    toast.success('✅ Video saved to My Videos!');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Loading status messages for different stages
  const getStatusMessage = (progress) => {
    if (progress < 10) return 'Initializing AI model...';
    if (progress < 25) return 'Processing your prompt...';
    if (progress < 50) return 'Generating video frames...';
    if (progress < 75) return 'Rendering video...';
    if (progress < 90) return 'Finalizing video...';
    return 'Almost done...';
  };

  // Poll for video generation status
  const pollVideoStatus = async (predictionId, toastId, config = {}) => {
    const maxAttempts = 60; // 5 minutes max (5s intervals)
    let attempts = 0;

    // Reset progress
    setLoadingProgress(5);
    setLoadingStatus('Initializing AI model...');

    while (attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        // Pass config with each poll (serverless is stateless)
        const statusResponse = await api.post(`/ai-video/status`, {
          id: predictionId,
          ...config
        });
        const { status, video, error } = statusResponse.data;

        if (status === 'completed' && video?.videoUrl) {
          setLoadingProgress(100);
          setLoadingStatus('Complete!');
          toast.update(toastId, {
            render: '🎬 Video generated successfully!',
            type: 'success',
            isLoading: false,
            autoClose: 5000
          });
          setGeneratedVideo(video);
          setLoading(false);
          setLoadingProgress(0);
          setLoadingStatus('');
          fetchMyVideos();
          
          // If Shotstack is processing enhanced version, poll for it
          if (video.shotstackJobId) {
            pollForEnhancedVideo(video.shotstackJobId, video);
          }
          return;
        } else if (status === 'failed') {
          toast.update(toastId, {
            render: error || 'Video generation failed',
            type: 'error',
            isLoading: false,
            autoClose: 5000
          });
          setLoading(false);
          setLoadingProgress(0);
          setLoadingStatus('');
          return;
        }
        
        // Still processing - update progress
        attempts++;
        // Simulate progress (max 95% until done)
        const simulatedProgress = Math.min(95, Math.round((attempts / maxAttempts) * 100));
        setLoadingProgress(simulatedProgress);
        setLoadingStatus(getStatusMessage(simulatedProgress));
        
        const timeElapsed = attempts * 5;
        toast.update(toastId, {
          render: `⏳ ${getStatusMessage(simulatedProgress)} (${timeElapsed}s)`,
          type: 'info',
          isLoading: true
        });

      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling unless it's a critical error
        attempts++;
      }
    }

    // Timeout
    toast.update(toastId, {
      render: 'Video generation timed out. Please try again.',
      type: 'error',
      isLoading: false,
      autoClose: 5000
    });
    setLoading(false);
    setLoadingProgress(0);
    setLoadingStatus('');
  };

  // Poll for enhanced video from Shotstack (music + text)
  const pollForEnhancedVideo = async (jobId, originalVideo) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    
    // Show a toast that enhanced video is processing
    const enhanceToastId = toast.info('🎵 Adding music & text in background...', {
      autoClose: false,
      hideProgressBar: true
    });

    while (attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        
        const response = await api.get(`/render-video/status/${jobId}`);
        const { status, url, error } = response.data;

        if (status === 'done' && url) {
          // Update the video with enhanced version
          setGeneratedVideo(prev => ({
            ...prev,
            videoUrl: url,
            enhanced: true
          }));
          
          toast.update(enhanceToastId, {
            render: '✨ Video enhanced with music & text!',
            type: 'success',
            autoClose: 5000
          });
          
          // Refresh video list
          fetchMyVideos();
          return;
        } else if (status === 'failed') {
          console.error('Enhanced video failed:', error);
          toast.update(enhanceToastId, {
            render: '⚠️ Music/text processing failed. Using original video.',
            type: 'warning',
            autoClose: 5000
          });
          return;
        }
        
        attempts++;
      } catch (error) {
        console.error('Enhanced video poll error:', error);
        attempts++;
      }
    }

    // Timeout - dismiss the toast
    toast.dismiss(enhanceToastId);
    console.log('Enhanced video polling timed out');
  };

  const handleGenerate = async () => {
    if (activeTab === 'text-to-video' && !prompt.trim()) {
      toast.error('Enter a prompt for the video');
      return;
    }

    if (activeTab === 'image-to-video' && !imageFile) {
      toast.error('Select an image to animate');
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    setLoadingStatus('Starting...');
    setGeneratedVideo(null);

    const toastId = toast.loading('🎬 Starting video generation... (takes 2-3 minutes)');

    try {
      let response;

      if (activeTab === 'text-to-video') {
        response = await api.post('/ai-video/text-to-video', {
          prompt,
          duration,
          aspectRatio,
          musicConfig,
          textConfig
        });
      } else {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('prompt', prompt);
        formData.append('duration', duration);
        formData.append('aspectRatio', aspectRatio);
        if (musicConfig) formData.append('musicConfig', JSON.stringify(musicConfig));
        if (textConfig) formData.append('textConfig', JSON.stringify(textConfig));

        response = await api.post('/ai-video/image-to-video', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Check if we got a prediction ID (async generation) or immediate result
      if (response.data.predictionId && response.data.status === 'processing') {
        // Start polling for status - pass config for serverless processing
        pollVideoStatus(response.data.predictionId, toastId, {
          prompt,
          duration,
          aspectRatio,
          musicConfig,
          textConfig
        });
      } else if (response.data.video?.videoUrl) {
        // Immediate result (shouldn't happen with current setup, but handle it)
        toast.update(toastId, {
          render: '🎬 Video generated successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 5000
        });
        setGeneratedVideo(response.data.video);
        setLoading(false);
        setLoadingProgress(0);
        setLoadingStatus('');
        fetchMyVideos();
      } else {
        toast.update(toastId, {
          render: 'Unexpected response from server',
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
        setLoading(false);
        setLoadingProgress(0);
        setLoadingStatus('');
      }

    } catch (error) {
      console.error('Generation error:', error);
      const errorMsg = error.response?.data?.error || 'Error generating video';
      
      // Check if payment is required
      if (errorMsg.includes('Payment') || errorMsg.includes('payment') || errorMsg.includes('402') || errorMsg.includes('billing')) {
        toast.update(toastId, {
          render: (
            <div>
              <strong>💳 Payment Required</strong>
              <p style={{fontSize: '12px', marginTop: '5px'}}>
                Add a payment method at <a href="https://replicate.com/account/billing" target="_blank" rel="noopener noreferrer" style={{color: '#00ff88'}}>replicate.com/account/billing</a>
                <br/>Cost: ~$0.01-0.05 per video
              </p>
            </div>
          ),
          type: 'error',
          isLoading: false,
          autoClose: 10000
        });
      } else {
        toast.update(toastId, {
          render: errorMsg,
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
      }
      setLoading(false);
      setLoadingProgress(0);
      setLoadingStatus('');
    }
  };

  const handlePostToInstagram = async (videoId) => {
    const video = myVideos.find(v => v._id === videoId);
    if (!video) return;

    const caption = window.prompt('Enter caption for Instagram Reel:');
    if (!caption) return;

    const toastId = toast.loading('Posting to Instagram... (this may take a minute)');

    try {
      await api.post(`/ai-video/${videoId}/post-to-instagram`, {
        caption,
        hashtags: ['ai', 'reels', 'viral'],
        videoUrl: video.videoUrl // Send URL in case it's not in DB
      });
      
      toast.update(toastId, { 
        render: '🎉 Video posted to Instagram!', 
        type: 'success', 
        isLoading: false, 
        autoClose: 5000 
      });
      
      fetchMyVideos();
    } catch (error) {
      console.error('Post error:', error);
      toast.update(toastId, { 
        render: error.response?.data?.error || 'Error posting', 
        type: 'error', 
        isLoading: false, 
        autoClose: 5000 
      });
    }
  };

  const handleDeleteVideo = (videoId) => {
    // Delete from localStorage
    const savedVideos = JSON.parse(localStorage.getItem('myAIVideos') || '[]');
    const updatedVideos = savedVideos.filter(v => v._id !== videoId && v.id !== videoId);
    localStorage.setItem('myAIVideos', JSON.stringify(updatedVideos));
    
    // Update state
    setMyVideos(updatedVideos);
    toast.success('🗑️ Video deleted!');
    
    // Also try to delete from API (optional, won't fail if not found)
    api.delete(`/ai-video/${videoId}`).catch(() => {});
  };

  return (
    <main className="ai-video-page">
      <SEO 
        title="AI Video Generator"
        description="Generate stunning AI videos for Instagram Reels with Runway ML Gen-3"
        noindex={true}
      />

      <header className="page-header">
        <div>
          <h1><FaWandMagicSparkles aria-hidden="true" /> AI Video Generator</h1>
          <p className="page-subtitle">Create amazing AI videos for Instagram Reels</p>
        </div>
      </header>

      <div className="ai-video-container">
        {/* Generator Section - Left Side */}
        <section className="generator-section" aria-labelledby="generator-heading">
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
            onMusicClick={() => setIsMusicOpen(true)}
            onTextClick={() => setIsTextOpen(true)}
            hasMusicConfig={!!musicConfig}
            hasTextConfig={!!textConfig}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onImageRemove={() => { setImageFile(null); setImagePreview(null); }}
          />

          {/* Generated Video Preview */}
          {generatedVideo && (
            <article className="card generated-preview" aria-label="Generated video">
              <div className="card-header">
                <h3>✨ Generated Video</h3>
              </div>
              <div className="video-preview">
                <video 
                  src={generatedVideo.videoUrl} 
                  controls 
                  autoPlay 
                  loop
                  className={`aspect-${aspectRatio.replace(':', '-')}`}
                  aria-label="Preview of generated video"
                />
              </div>
              <div className="video-actions">
                <a 
                  href={generatedVideo.videoUrl} 
                  download 
                  className="btn btn-secondary"
                >
                  <FiDownload aria-hidden="true" /> Download
                </a>
                <button 
                  className="btn btn-success"
                  onClick={() => saveVideoToLocal(generatedVideo)}
                >
                  <FiSave aria-hidden="true" /> Save
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePostToInstagram(generatedVideo.id)}
                >
                  <FiInstagram aria-hidden="true" /> Post to Instagram
                </button>
              </div>
            </article>
          )}
        </section>

        {/* My Videos Section - Right Side */}
        <section className="my-videos-section" aria-labelledby="my-videos-heading">
          {loadingVideos ? (
            <div className="loading-placeholder" aria-label="Loading videos">
              <FiLoader className="spinner" aria-hidden="true" />
            </div>
          ) : (
            <SavedVideosPanel 
              videos={myVideos.map(video => ({
                id: video._id,
                title: video.prompt || 'AI Video',
                durationSeconds: video.duration || 5,
                createdAt: new Date(video.createdAt).toLocaleDateString('en-US'),
                thumbnailUrl: null,
                videoUrl: video.videoUrl
              }))}
              onDeleteVideo={handleDeleteVideo}
            />
          )}
        </section>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div 
          className="video-modal-overlay" 
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="video-modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="video-modal-close" 
              onClick={() => setSelectedVideo(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="video-modal-header">
              <h3 id="modal-title">{selectedVideo.type}</h3>
              <span className="video-date">{new Date(selectedVideo.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="video-modal-player">
              <video 
                src={selectedVideo.videoUrl} 
                controls 
                autoPlay 
                className={`aspect-${selectedVideo.aspectRatio?.replace(':', '-') || '9-16'}`}
                aria-label="Video player"
              />
            </div>
            <div className="video-modal-details">
              <p className="video-prompt-full">{selectedVideo.prompt}</p>
              <div className="video-actions">
                <a 
                  href={selectedVideo.videoUrl} 
                  download 
                  className="btn btn-secondary"
                >
                  <FiDownload aria-hidden="true" /> Download
                </a>
                <button 
                  className="btn btn-primary"
                  onClick={() => handlePostToInstagram(selectedVideo._id)}
                >
                  <FiInstagram aria-hidden="true" /> Post to Instagram
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Music Modal */}
      <MusicModal
        open={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        onApply={(config, track) => {
          // Include the track URL in the config so backend can use it
          setMusicConfig({
            ...config,
            url: track?.url || null,
            trackName: track?.name || null
          });
          setIsMusicOpen(false);
        }}
        initialConfig={musicConfig}
        initialTrack={null}
      />

      {/* Text Modal */}
      <TextModal
        open={isTextOpen}
        durationSeconds={duration}
        initialConfig={textConfig}
        onApply={(config) => {
          setTextConfig(config);
        }}
        onClose={() => setIsTextOpen(false)}
      />
    </main>
  );
};

export default AIVideo;
