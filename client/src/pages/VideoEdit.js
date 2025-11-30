import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SEO from '../components/SEO';
import { 
  FiPlay, FiPause, FiTrash2, FiVideo, FiMusic, FiType, 
  FiVolume2, FiVolumeX, FiDownload, FiSave, FiInstagram, FiX, FiCheck,
  FiChevronLeft, FiChevronRight, FiChevronDown, FiLoader, FiPlus, FiSearch, FiZap
} from 'react-icons/fi';
import './VideoEdit.css';

const VideoEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const audioPreviewRef = useRef(null);
  const musicAudioRef = useRef(null); // For synced music playback
  
  // Video library state
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoVolume, setVideoVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  
  // Editing state
  const [activePanel, setActivePanel] = useState('music');
  const [musicTrack, setMusicTrack] = useState(null);
  const [musicVolume, setMusicVolume] = useState(70);
  const [subtitles, setSubtitles] = useState([]);
  const [textOverlays, setTextOverlays] = useState([]);
  const [soundEffects, setSoundEffects] = useState([]);
  
  // Render state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendered, setIsRendered] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [renderJobId, setRenderJobId] = useState(null);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState(null);
  
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Audio preview state
  const [playingPreviewId, setPlayingPreviewId] = useState(null);
  
  // Mobile video picker modal
  const [showMobileVideoPicker, setShowMobileVideoPicker] = useState(false);

  // Filtered videos based on search
  const filteredVideos = videos.filter(video => 
    video.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    formatDate(video.createdAt).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Music library with actual audio files
  const musicLibrary = [
    { id: 1, name: 'Comic Humor', duration: '1:08', mood: 'funny', icon: '😂', audioUrl: '/music/comic-humor-memes-tiktok-music-357342.mp3' },
    { id: 2, name: 'D3ath', duration: '1:49', mood: 'intense', icon: '💀', audioUrl: '/music/d3ath-202001.mp3' },
    { id: 3, name: 'Hold Me Tight', duration: '4:05', mood: 'emotional', icon: '💕', audioUrl: '/music/hold-me-tight-278286.mp3' },
    { id: 4, name: 'Phonk TikTok', duration: '2:03', mood: 'viral', icon: '🔥', audioUrl: '/music/phonk-tiktok-instagram-youtube-music-303287.mp3' },
    { id: 5, name: 'Play House', duration: '3:57', mood: 'energetic', icon: '🏠', audioUrl: '/music/play-house-thousand-sounds-official-audio-382805.mp3' },
    { id: 6, name: 'Rap Beat', duration: '1:05', mood: 'hip-hop', icon: '🎤', audioUrl: '/music/rap-beat-183034.mp3' },
    { id: 7, name: 'Viral Energy', duration: '2:32', mood: 'trendy', icon: '⚡', audioUrl: '/music/viral-energy-pop-fashion-sports-dubstep-promo-reels-312770.mp3' },
    { id: 8, name: 'YouTube Background', duration: '4:06', mood: 'chill', icon: '🎶', audioUrl: '/music/youtube-background-music-409205.mp3' },
  ];

  // Sound effects library
  const soundsLibrary = [
    { id: 1, name: 'Whoosh', icon: '💨', type: 'whoosh' },
    { id: 2, name: 'Pop', icon: '💥', type: 'pop' },
    { id: 3, name: 'Ding', icon: '🔔', type: 'ding' },
    { id: 4, name: 'Swoosh', icon: '✨', type: 'swoosh' },
    { id: 5, name: 'Click', icon: '👆', type: 'click' },
  ];

  // Text styles
  const textStyles = [
    { id: 'modern', name: 'Modern', preview: 'Aa' },
    { id: 'bold', name: 'Bold', preview: 'Aa' },
    { id: 'minimal', name: 'Minimal', preview: 'Aa' },
    { id: 'neon', name: 'Neon', preview: 'Aa' },
  ];

  useEffect(() => {
    // Load saved videos from localStorage
    const savedVideos = JSON.parse(localStorage.getItem('aiVideos') || '[]');
    
    // Filter out videos with invalid URLs
    const normalizedVideos = savedVideos
      .map(v => ({
        ...v,
        url: v.url || v.videoUrl
      }))
      .filter(v => {
        const videoUrl = v.url || v.videoUrl;
        
        // Filter out blob URLs as they are session-specific
        if (videoUrl && videoUrl.startsWith('blob:')) {
          console.log('Removing invalid blob URL video:', v.id);
          return false;
        }
        
        // Filter out empty or invalid URLs
        if (!videoUrl || videoUrl === 'undefined' || videoUrl === 'null') {
          console.log('Removing video with invalid URL:', v.id);
          return false;
        }
        
        // Keep only videos with http/https URLs
        if (!videoUrl.startsWith('http')) {
          console.log('Removing video with non-http URL:', v.id, videoUrl);
          return false;
        }
        
        return true;
      });
    
    // Update localStorage to remove invalid videos
    if (normalizedVideos.length !== savedVideos.length) {
      console.log(`Cleaned up ${savedVideos.length - normalizedVideos.length} invalid videos`);
      localStorage.setItem('aiVideos', JSON.stringify(normalizedVideos));
    }
    
    setVideos(normalizedVideos);
    
    // Check if video was passed from navigation
    if (location.state?.video) {
      // Normalize video object to ensure 'url' property exists
      const navVideo = location.state.video;
      const videoUrl = navVideo.url || navVideo.videoUrl;
      
      // Check if it's a valid URL
      if (!videoUrl || videoUrl.startsWith('blob:') || !videoUrl.startsWith('http')) {
        console.warn('Cannot use invalid URL from navigation:', videoUrl);
        // Try to select first valid video instead
        if (normalizedVideos.length > 0) {
          setSelectedVideo(normalizedVideos[0]);
        }
      } else {
        const normalizedVideo = {
          ...navVideo,
          url: videoUrl
        };
        console.log('Setting selected video from navigation:', normalizedVideo.url);
        setSelectedVideo(normalizedVideo);
      }
    } else if (normalizedVideos.length > 0) {
      // Auto-select first video if available
      console.log('Auto-selecting first video:', normalizedVideos[0].url);
      setSelectedVideo(normalizedVideos[0]);
    }
  }, [location.state]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl) {
      const handleTimeUpdate = () => {
        setCurrentTime(videoEl.currentTime);
        // Sync music audio time if playing
        if (musicAudioRef.current && musicTrack && isPlaying) {
          const timeDiff = Math.abs(musicAudioRef.current.currentTime - videoEl.currentTime);
          if (timeDiff > 0.3) { // Resync if drifted more than 0.3s
            musicAudioRef.current.currentTime = videoEl.currentTime;
          }
        }
      };
      const handleLoadedMetadata = () => setDuration(videoEl.duration || 5);
      const handleEnded = () => {
        setIsPlaying(false);
        // Stop music too
        if (musicAudioRef.current) {
          musicAudioRef.current.pause();
          musicAudioRef.current.currentTime = 0;
        }
      };
      
      videoEl.addEventListener('timeupdate', handleTimeUpdate);
      videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.addEventListener('ended', handleEnded);
      
      return () => {
        videoEl.removeEventListener('timeupdate', handleTimeUpdate);
        videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoEl.removeEventListener('ended', handleEnded);
      };
    }
  }, [selectedVideo, musicTrack, isPlaying]);
  
  // Effect to load music audio when music track changes
  useEffect(() => {
    if (musicTrack?.audioUrl) {
      // Create or update audio element
      if (!musicAudioRef.current) {
        musicAudioRef.current = new Audio();
      }
      musicAudioRef.current.src = musicTrack.audioUrl;
      musicAudioRef.current.load();
    } else if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicTrack]);
  
  // Effect to update music volume
  useEffect(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        // Pause music too
        if (musicAudioRef.current) {
          musicAudioRef.current.pause();
        }
      } else {
        videoRef.current.play();
        // Play music synced with video
        if (musicAudioRef.current && musicTrack) {
          musicAudioRef.current.currentTime = videoRef.current.currentTime;
          musicAudioRef.current.play().catch(e => console.log('Music play error:', e));
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (value) => {
    setVideoVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value / 100;
    }
    if (value > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  // Handle selecting video from mobile picker
  const handleSelectVideoFromPicker = (video) => {
    setSelectedVideo({ ...video, url: video.url || video.videoUrl });
    setShowMobileVideoPicker(false);
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      // Sync music audio time
      if (musicAudioRef.current && musicTrack) {
        musicAudioRef.current.currentTime = newTime;
      }
    }
  };

  const selectMusic = (track) => {
    setMusicTrack(track);
    toast.success(`Added: ${track.name}`);
  };

  const addTextOverlay = () => {
    const newText = {
      id: Date.now(),
      text: 'Your text here',
      position: 'center',
      style: 'modern',
      startTime: 0, // Start from beginning for visibility
      endTime: Math.max(duration || 5, 3) // Full video or at least 3 seconds
    };
    console.log('Adding text overlay:', newText);
    setTextOverlays(prev => [...prev, newText]);
    toast.success('Text added! Edit it in the panel below.');
  };

  const addSubtitle = () => {
    const newSubtitle = {
      id: Date.now(),
      text: 'Subtitle text',
      startTime: 0, // Start from beginning
      endTime: Math.max(duration || 5, 2) // Full video or at least 2 seconds
    };
    console.log('Adding subtitle:', newSubtitle);
    setSubtitles(prev => [...prev, newSubtitle]);
    toast.success('Subtitle added! Edit it in the panel below.');
  };

  const addSoundEffect = (sound) => {
    const newEffect = {
      ...sound,
      instanceId: Date.now(),
      time: currentTime
    };
    setSoundEffects([...soundEffects, newEffect]);
    toast.success(`Added: ${sound.name}`);
  };

  const handleRender = async () => {
    if (!selectedVideo) {
      toast.error('Please select a video first');
      return;
    }
    
    setIsRendering(true);
    setRenderProgress(0);
    setRenderedVideoUrl(null);
    
    try {
      // Build subtitles array for backend - include both subtitles AND text overlays
      const subtitlesData = [
        // Regular subtitles
        ...subtitles.map(sub => ({
          text: sub.text,
          start: sub.startTime,
          end: sub.endTime,
          position: 'bottom'
        })),
        // Text overlays (converted to subtitle format for Shotstack)
        ...textOverlays.map(overlay => ({
          text: overlay.text,
          start: overlay.startTime,
          end: overlay.endTime,
          position: overlay.position || 'center',
          style: overlay.style || 'blockbuster'
        }))
      ];
      
      console.log('=== RENDER DEBUG ===');
      console.log('Text overlays state:', textOverlays);
      console.log('Subtitles state:', subtitles);
      console.log('Combined subtitlesData:', subtitlesData);
      console.log('Video URL:', selectedVideo.url || selectedVideo.videoUrl);
      console.log('Duration:', duration);
      
      if (subtitlesData.length === 0) {
        console.warn('No text or subtitles to render!');
      }
      
      // Get the audio URL - need to upload to cloud if it's a local file
      let audioUrl = null;
      if (musicTrack?.audioUrl) {
        const localAudioPath = musicTrack.audioUrl;
        
        // Check if it's a local path that needs to be uploaded
        if (localAudioPath.startsWith('/music/') || localAudioPath.startsWith('/')) {
          toast.info('Uploading music to cloud...');
          setRenderProgress(3);
          
          try {
            // Fetch the local audio file
            const audioResponse = await fetch(localAudioPath);
            if (!audioResponse.ok) throw new Error('Failed to fetch audio file');
            const audioBlob = await audioResponse.blob();
            
            // Upload to server (which will upload to Cloudinary)
            const formData = new FormData();
            formData.append('audio', audioBlob, localAudioPath.split('/').pop());
            
            const uploadRes = await fetch('/api/ai/upload-audio', {
              method: 'POST',
              body: formData
            });
            
            const uploadResult = await uploadRes.json();
            
            if (uploadResult.success && uploadResult.url) {
              audioUrl = uploadResult.url;
              toast.success('Music uploaded!');
              setRenderProgress(8);
            } else {
              console.warn('Audio upload failed, continuing without music:', uploadResult.error);
              toast.warning('Continuing without music');
            }
          } catch (audioError) {
            console.warn('Audio upload error, continuing without music:', audioError);
            toast.warning('Continuing without music');
          }
        } else if (localAudioPath.startsWith('http')) {
          // Already a cloud URL
          audioUrl = localAudioPath;
        }
      }
      
      // Get video URL - upload to cloud if it's a blob or local
      let videoUrl = selectedVideo.url || selectedVideo.videoUrl;
      
      // Check if already a cloud URL (Cloudinary, etc)
      const isCloudUrl = videoUrl.startsWith('https://res.cloudinary.com') || 
                         videoUrl.startsWith('https://replicate.delivery') ||
                         (videoUrl.startsWith('http') && !videoUrl.includes('localhost'));
      
      if (videoUrl.startsWith('blob:')) {
        toast.info('Uploading video to cloud...');
        setRenderProgress(5);
        
        // Fetch the blob and upload it
        try {
          const blobResponse = await fetch(videoUrl);
          const blob = await blobResponse.blob();
          
          // Check file size - Vercel has ~4.5MB limit
          const fileSizeMB = blob.size / (1024 * 1024);
          console.log('Video blob size:', fileSizeMB.toFixed(2) + 'MB');
          
          if (fileSizeMB > 50) {
            toast.error('Video is too large (max 50MB). Please use a smaller video.');
            setIsRendering(false);
            return;
          }
          
          const formData = new FormData();
          formData.append('video', blob, 'video.mp4');
          
          const uploadRes = await fetch('/api/ai/upload-video', {
            method: 'POST',
            body: formData
          });
          
          // Check for 413 payload too large
          if (uploadRes.status === 413) {
            toast.error('Video is too large to upload. Try a smaller video (< 4MB for production).');
            setIsRendering(false);
            return;
          }
          
          const uploadResult = await uploadRes.json();
          
          if (uploadResult.success && uploadResult.url) {
            videoUrl = uploadResult.url;
            toast.success('Video uploaded!');
            setRenderProgress(15);
          } else {
            throw new Error(uploadResult.error || 'Video upload failed');
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          // Check if it's a network error from 413
          if (uploadError.message.includes('413') || uploadError.message.includes('payload')) {
            toast.error('Video is too large. Please use a smaller video or one already uploaded to cloud.');
          } else {
            toast.error('Failed to upload video: ' + uploadError.message);
          }
          setIsRendering(false);
          return;
        }
      } else if (!isCloudUrl && videoUrl.startsWith('http')) {
        // Local server URL, might need to re-upload
        console.log('Video URL is local server, using directly:', videoUrl);
        // For localhost URLs, we can use them directly in dev but not in production
        if (videoUrl.includes('localhost') && window.location.hostname !== 'localhost') {
          toast.error('Local video URLs cannot be used in production. Please upload the video first.');
          setIsRendering(false);
          return;
        }
      } else if (isCloudUrl) {
        console.log('Using existing cloud URL:', videoUrl);
        setRenderProgress(15);
      }
      
      // Step 1: Submit render job
      const response = await fetch('/api/ai/shotstack/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          audioUrl,
          subtitles: subtitlesData,
          options: {
            duration: duration || 5,
            musicVolume: musicVolume / 100,
            videoVolume: isMuted ? 0 : videoVolume / 100
          }
        })
      });
      
      const result = await response.json();
      
      if (!result.success || !result.jobId) {
        throw new Error(result.error || 'Failed to start render');
      }
      
      setRenderJobId(result.jobId);
      setRenderProgress(20);
      toast.info('Render started! This may take a minute...');
      
      // Step 2: Poll for completion
      let attempts = 0;
      const maxAttempts = 60;
      
      const pollInterval = setInterval(async () => {
        attempts++;
        
        try {
          const statusRes = await fetch(`/api/ai/shotstack/status/${result.jobId}`);
          const status = await statusRes.json();
          
          if (status.status === 'done' && status.url) {
            clearInterval(pollInterval);
            setRenderProgress(100);
            setIsRendering(false);
            setIsRendered(true);
            setRenderedVideoUrl(status.url);
            toast.success('Video rendered successfully!');
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsRendering(false);
            toast.error('Render failed: ' + (status.error || 'Unknown error'));
          } else {
            // Update progress
            setRenderProgress(Math.min(20 + (status.progress || 0) * 0.8, 95));
          }
          
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setIsRendering(false);
            toast.error('Render timed out. Please try again.');
          }
        } catch (pollError) {
          console.error('Poll error:', pollError);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Render error:', error);
      setIsRendering(false);
      toast.error('Render failed: ' + error.message);
    }
  };

  const handleSaveVideo = () => {
    if (!selectedVideo) return;
    
    const editedVideo = {
      ...selectedVideo,
      // Save the rendered video URL if available
      url: renderedVideoUrl || selectedVideo.url,
      videoUrl: renderedVideoUrl || selectedVideo.videoUrl,
      renderedUrl: renderedVideoUrl,
      musicTrack,
      textOverlays,
      subtitles,
      soundEffects,
      editedAt: new Date().toISOString(),
      isRendered: !!renderedVideoUrl
    };
    
    const updatedVideos = videos.map(v => 
      v.id === selectedVideo.id ? editedVideo : v
    );
    
    setVideos(updatedVideos);
    setSelectedVideo(editedVideo);
    localStorage.setItem('aiVideos', JSON.stringify(updatedVideos));
    toast.success('Video saved successfully!');
  };

  const handlePostToInstagram = () => {
    toast.info('Instagram posting coming soon!');
  };

  const handleDeleteVideo = (videoId) => {
    const updatedVideos = videos.filter(v => v.id !== videoId);
    setVideos(updatedVideos);
    localStorage.setItem('aiVideos', JSON.stringify(updatedVideos));
    
    if (selectedVideo?.id === videoId) {
      setSelectedVideo(updatedVideos[0] || null);
    }
    toast.success('Video deleted');
  };

  const handleDownload = async () => {
    // Prefer rendered video URL if available
    const downloadUrl = renderedVideoUrl || selectedVideo?.url || selectedVideo?.videoUrl;
    if (!downloadUrl) {
      toast.error('No video available to download');
      return;
    }
    
    try {
      toast.info('Preparing download...');
      
      // For cross-origin URLs (like Shotstack CDN), we need to fetch as blob
      if (downloadUrl.startsWith('http') && !downloadUrl.startsWith(window.location.origin)) {
        // Fetch the video as a blob
        const response = await fetch(downloadUrl);
        if (!response.ok) throw new Error('Failed to fetch video');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `video-${selectedVideo?.id || Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL after a short delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        // For local/same-origin URLs, direct download works
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `video-${selectedVideo?.id || Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(downloadUrl, '_blank');
      toast.info('Video opened in new tab - right-click to save');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Audio preview functions using Web Audio API
  const audioContextRef = useRef(null);
  
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Generate different sounds based on type
  const playGeneratedSound = (type, isMusic = false) => {
    const ctx = getAudioContext();
    const duration = isMusic ? 3 : 0.5;
    
    // Sound configurations
    const soundConfigs = {
      // Music types
      upbeat: { freq: 440, type: 'square', pattern: [1, 0.8, 1, 0.6, 1, 0.8] },
      chill: { freq: 220, type: 'sine', pattern: [0.5, 0.6, 0.5, 0.4] },
      epic: { freq: 150, type: 'sawtooth', pattern: [0.3, 0.5, 0.7, 1, 0.7, 0.5] },
      lofi: { freq: 330, type: 'triangle', pattern: [0.4, 0.5, 0.4, 0.3] },
      pop: { freq: 392, type: 'square', pattern: [1, 0.5, 0.8, 0.5, 1, 0.5] },
      acoustic: { freq: 294, type: 'triangle', pattern: [0.6, 0.8, 0.6, 0.5, 0.7] },
      // Sound effect types
      whoosh: { freq: 800, type: 'sawtooth', sweep: true, sweepEnd: 200 },
      ding: { freq: 880, type: 'sine', decay: true },
      swoosh: { freq: 600, type: 'triangle', sweep: true, sweepEnd: 100 },
      click: { freq: 1000, type: 'square', short: true },
    };

    const config = soundConfigs[type] || soundConfigs.ding;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.freq, ctx.currentTime);
    
    // Apply effects based on config
    if (config.sweep) {
      oscillator.frequency.exponentialRampToValueAtTime(config.sweepEnd, ctx.currentTime + duration);
    }
    
    if (config.short) {
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    } else if (config.decay) {
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    } else if (isMusic && config.pattern) {
      // Create rhythm pattern for music
      const stepDuration = duration / config.pattern.length;
      config.pattern.forEach((vol, i) => {
        gainNode.gain.setValueAtTime(vol * 0.3, ctx.currentTime + i * stepDuration);
      });
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime + duration);
    } else {
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    }
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    
    return { oscillator, duration };
  };

  const playPreview = (id, audioUrlOrType, isMusic = false) => {
    if (playingPreviewId === id) {
      // Stop current preview
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }
      setPlayingPreviewId(null);
    } else {
      // Stop any existing audio
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }
      
      setPlayingPreviewId(id);
      
      try {
        if (isMusic && audioUrlOrType.startsWith('/')) {
          // Play actual audio file for music
          const audio = new Audio(audioUrlOrType);
          audioPreviewRef.current = audio;
          audio.volume = 0.7;
          
          audio.onended = () => {
            setPlayingPreviewId(prev => prev === id ? null : prev);
          };
          
          audio.onerror = () => {
            console.log('Audio load error');
            toast.error('Could not load audio');
            setPlayingPreviewId(null);
          };
          
          audio.play().catch(e => {
            console.log('Audio play error:', e);
            toast.error('Could not play audio');
            setPlayingPreviewId(null);
          });
        } else {
          // Use generated sounds for sound effects
          const { duration } = playGeneratedSound(audioUrlOrType, isMusic);
          
          // Auto-stop after duration
          setTimeout(() => {
            setPlayingPreviewId(prev => prev === id ? null : prev);
          }, duration * 1000);
        }
      } catch (e) {
        console.log('Audio error:', e);
        toast.error('Could not play audio');
        setPlayingPreviewId(null);
      }
    }
  };

  // Handle video file upload
  const handleFileUpload = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      const newVideo = {
        id: Date.now(),
        url,
        prompt: file.name,
        createdAt: new Date().toISOString(),
        duration: 5
      };
      const updated = [newVideo, ...videos];
      setVideos(updated);
      setSelectedVideo(newVideo);
      localStorage.setItem('aiVideos', JSON.stringify(updated));
    }
  };

  return (
    <main className="video-edit-page">
      <SEO title="Edit Videos" description="Edit your AI generated videos" noindex={true} />
      
      <div className="edit-studio">
        {/* Video Library Sidebar - LEFT PANEL */}
        <aside className={`video-library ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="library-header">
            {!sidebarCollapsed && <h2>Project</h2>}
            <button 
              className="collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
          </div>
          
          {!sidebarCollapsed && (
            <>
              {/* Search Bar */}
              <div className="library-search">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Find my videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Generate New Button */}
              <button 
                className="generate-new-btn"
                onClick={() => navigate('/app/ai-video')}
              >
                <FiZap /> Generate New Video
              </button>

              {/* Video Count */}
              <div className="video-count">
                <span>{filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Video List */}
              <div className="video-list">
                {filteredVideos.length === 0 ? (
                  <div className="empty-library">
                    <FiVideo />
                    <p>{searchQuery ? 'No videos found' : 'No videos yet'}</p>
                    <span className="empty-hint">
                      {searchQuery ? 'Try a different search' : 'Generate your first video'}
                    </span>
                  </div>
                ) : (
                  filteredVideos.map((video) => (
                    <div 
                      key={video.id} 
                      className={`video-item ${selectedVideo?.id === video.id ? 'active' : ''}`}
                      onClick={() => setSelectedVideo({ ...video, url: video.url || video.videoUrl })}
                    >
                      <div className="video-thumb">
                        {(video.url || video.videoUrl) ? (
                          <video 
                            src={video.url || video.videoUrl} 
                            muted 
                            playsInline 
                            preload="metadata"
                            onError={(e) => {
                              // Hide broken video thumbnails
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <FiVideo />
                        )}
                        <span className="video-duration-badge">
                          {video.duration || '5'}s
                        </span>
                      </div>
                      <div className="video-meta">
                        <p className="video-title">{video.prompt?.slice(0, 40) || 'AI Video'}</p>
                        <span className="video-date">{formatDate(video.createdAt)}</span>
                      </div>
                      <div className="video-item-actions">
                        <button 
                          className="add-to-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideo({ ...video, url: video.url || video.videoUrl });
                            toast.success('Video added to preview');
                          }}
                          title="Add to preview"
                        >
                          <FiPlus />
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(video.id);
                          }}
                          title="Delete video"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>

        {/* CENTER PANEL - Hero Video Preview */}
        <div className="editor-main">
          {/* Mobile Add Video Button - only shows on mobile */}
          <div className="mobile-add-video-header">
            <button 
              className="mobile-add-video-btn"
              onClick={() => setShowMobileVideoPicker(true)}
            >
              <FiPlus /> Add Video
            </button>
            {selectedVideo && (
              <span className="mobile-video-indicator">
                {selectedVideo.prompt?.slice(0, 20) || 'Video selected'}...
              </span>
            )}
          </div>

          <div className="hero-preview-wrapper">
            {/* Glow Frame Container */}
            <div className="preview-glow-frame">
              {/* 9:16 Aspect Ratio Container */}
              <div className="preview-container-9-16">
                {selectedVideo && (selectedVideo.url || selectedVideo.videoUrl) ? (
                  <video 
                    ref={videoRef}
                    src={selectedVideo.url || selectedVideo.videoUrl}
                    className="preview-video-hero"
                    onClick={togglePlay}
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    onError={(e) => {
                      const videoUrl = selectedVideo.url || selectedVideo.videoUrl;
                      const errorCode = e.target.error?.code;
                      const errorMsg = e.target.error?.message || 'Unknown error';
                      
                      console.error('Video load error:', { 
                        code: errorCode, 
                        message: errorMsg, 
                        url: videoUrl 
                      });
                      
                      // Error codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
                      // Remove video if it's a format error, decode error, or invalid source
                      if (errorCode === 4 || errorCode === 3 || videoUrl?.startsWith('blob:')) {
                        toast.error('Video format not supported or expired. Removing from library.');
                        
                        // Remove the invalid video from the list
                        const updatedVideos = videos.filter(v => v.id !== selectedVideo.id);
                        setVideos(updatedVideos);
                        localStorage.setItem('aiVideos', JSON.stringify(updatedVideos));
                        
                        // Select another video if available
                        if (updatedVideos.length > 0) {
                          setSelectedVideo(updatedVideos[0]);
                        } else {
                          setSelectedVideo(null);
                        }
                      } else if (errorCode === 2) {
                        toast.error('Network error loading video. Check your connection.');
                      } else {
                        toast.error('Failed to load video: ' + errorMsg);
                      }
                    }}
                    onLoadedData={() => {
                      console.log('Video loaded successfully:', selectedVideo.url || selectedVideo.videoUrl);
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration || 5);
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration || 5);
                      }
                    }}
                  />
                ) : (
                  <div className="preview-empty-state">
                    <div className="empty-icon-wrapper">
                      <FiVideo />
                    </div>
                    <h3>No Video Selected</h3>
                    <p>Choose from your saved videos or upload a new file</p>
                    <div className="empty-state-actions">
                      {videos.length > 0 && (
                        <button 
                          className="empty-state-btn primary"
                          onClick={() => setShowMobileVideoPicker(true)}
                        >
                          <FiVideo /> Add Video
                        </button>
                      )}
                      <label className="empty-state-btn outline">
                        <FiPlus /> Upload File
                        <input 
                          type="file" 
                          accept="video/*" 
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              const newVideo = {
                                id: Date.now(),
                                url,
                                prompt: file.name,
                                createdAt: new Date().toISOString(),
                                duration: 5
                              };
                              const updated = [newVideo, ...videos];
                              setVideos(updated);
                              setSelectedVideo(newVideo);
                              localStorage.setItem('aiVideos', JSON.stringify(updated));
                            }
                          }}
                        />
                      </label>
                      <button 
                        className="empty-state-btn secondary"
                        onClick={() => navigate('/app/ai-video')}
                      >
                        <FiZap /> Generate New
                      </button>
                    </div>
                  </div>
                )}
                    
                {/* Text Overlays - Always visible for editing, with opacity based on timing */}
                {selectedVideo && textOverlays.map(overlay => {
                  const isActive = currentTime >= overlay.startTime && currentTime <= overlay.endTime;
                  return (
                    <div 
                      key={overlay.id} 
                      className={`preview-text-overlay position-${overlay.position} style-${overlay.style} ${isActive ? 'active' : 'inactive'}`}
                      style={{ opacity: isActive ? 1 : 0.4 }}
                    >
                      {overlay.text}
                    </div>
                  );
                })}

                {/* Subtitles - Always visible for editing */}
                {selectedVideo && subtitles.map(sub => {
                  const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
                  return (
                    <div 
                      key={sub.id} 
                      className={`preview-subtitle ${isActive ? 'active' : 'inactive'}`}
                      style={{ opacity: isActive ? 1 : 0.4 }}
                    >
                      {sub.text}
                    </div>
                  );
                })}

                {/* Play button overlay */}
                {selectedVideo && (
                  <div className="hero-play-overlay" onClick={togglePlay}>
                    <div className="hero-play-btn">
                      {isPlaying ? <FiPause /> : <FiPlay />}
                    </div>
                  </div>
                )}

                {/* Music indicator */}
                {musicTrack && (
                  <div className="hero-music-badge">
                    <FiMusic /> {musicTrack.name}
                  </div>
                )}
              </div>
            </div>

            {/* Playback Controls Bar */}
            <div className="playback-controls-bar">
              <div className="controls-left">
                <button className="play-pause-btn" onClick={togglePlay} disabled={!selectedVideo}>
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </button>
                <span className="time-display-hero">
                  {formatTime(currentTime)} / {formatTime(duration || 5)}
                </span>
                
                {/* Add New Video Button */}
                <label className="add-new-video-btn" title="Add new video">
                  <FiPlus />
                  <input 
                    type="file" 
                    accept="video/*" 
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                </label>
              </div>

              <div className="controls-right">
                {/* Playback Speed */}
                <div className="speed-control">
                  <button 
                    className="speed-btn" 
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  >
                    {playbackSpeed}x <FiChevronDown />
                  </button>
                  {showSpeedMenu && (
                    <div className="speed-dropdown">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button 
                          key={speed}
                          className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                          onClick={() => {
                            handlePlaybackSpeedChange(speed);
                            setShowSpeedMenu(false);
                          }}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Volume Control */}
                <div className="volume-control">
                  <button className="volume-btn" onClick={toggleMute}>
                    {isMuted || videoVolume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : videoVolume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="volume-slider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scrubber Timeline Section - Apple Style */}
          <div className="scrubber-timeline-section">
            <div className="scrubber-timeline-header">
              <span className="timeline-label">Timeline</span>
              <span className="timeline-duration">{formatTime(duration || 5)}</span>
            </div>
            
            {/* Timeline Ruler */}
            <div className="timeline-ruler">
              {[...Array(11)].map((_, i) => (
                <div key={i} className="ruler-mark">
                  <span>{formatTime((duration || 5) * (i / 10))}</span>
                </div>
              ))}
            </div>
            
            {/* Main Timeline Track */}
            <div className="timeline-track-modern" onClick={selectedVideo ? handleSeek : undefined}>
              {/* Progress overlay */}
              <div 
                className="timeline-progress-modern" 
                style={{ width: `${(currentTime / (duration || 5)) * 100}%` }}
              />
              
              {/* Playhead */}
              <div 
                className="timeline-playhead-modern"
                style={{ left: `${(currentTime / (duration || 5)) * 100}%` }}
              >
                <div className="playhead-handle" />
              </div>

              {/* Video Clip Chip */}
              {selectedVideo && (
                <div className="timeline-chip video-chip">
                  <div className="chip-icon"><FiVideo /></div>
                  <span className="chip-label">Video</span>
                  <div className="chip-resize-handle left" />
                  <div className="chip-resize-handle right" />
                </div>
              )}
              
              {/* Music Clip Chip */}
              {musicTrack && (
                <div className="timeline-chip music-chip">
                  <div className="chip-icon"><FiMusic /></div>
                  <span className="chip-label">{musicTrack.name}</span>
                  <div className="chip-resize-handle left" />
                  <div className="chip-resize-handle right" />
                </div>
              )}
              
              {/* Text Overlay Chips */}
              {textOverlays.map(overlay => (
                <div 
                  key={overlay.id}
                  className="timeline-chip text-chip"
                  style={{ 
                    left: `${(overlay.startTime / (duration || 5)) * 100}%`,
                    width: `${((overlay.endTime - overlay.startTime) / (duration || 5)) * 100}%`
                  }}
                >
                  <div className="chip-icon"><FiType /></div>
                  <span className="chip-label">{overlay.text.slice(0, 10)}</span>
                  <div className="chip-resize-handle left" />
                  <div className="chip-resize-handle right" />
                </div>
              ))}

              {/* Subtitle Chips */}
              {subtitles.map(sub => (
                <div 
                  key={sub.id}
                  className="timeline-chip subtitle-chip"
                  style={{ 
                    left: `${(sub.startTime / (duration || 5)) * 100}%`,
                    width: `${((sub.endTime - sub.startTime) / (duration || 5)) * 100}%`
                  }}
                >
                  <div className="chip-icon"><FiType /></div>
                  <span className="chip-label">Sub</span>
                  <div className="chip-resize-handle left" />
                  <div className="chip-resize-handle right" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Editing Tools Card */}
        <aside className="editing-tools-card">
            <div className="tools-card-header">
              <h3>Edit Tools</h3>
            </div>
            
            <div className="tool-tabs-container">
              <div className="tool-tabs">
                <button 
                  className={`tool-tab ${activePanel === 'music' ? 'active' : ''}`}
                  onClick={() => setActivePanel('music')}
                >
                  <FiMusic />
                  <span>Music</span>
                </button>
                <button 
                  className={`tool-tab ${activePanel === 'sounds' ? 'active' : ''}`}
                  onClick={() => setActivePanel('sounds')}
                >
                  <FiVolume2 />
                  <span>Sounds</span>
                </button>
                <button 
                  className={`tool-tab ${activePanel === 'text' ? 'active' : ''}`}
                  onClick={() => setActivePanel('text')}
                >
                  <FiType />
                  <span>Text</span>
                </button>
                <button 
                  className={`tool-tab ${activePanel === 'subtitles' ? 'active' : ''}`}
                  onClick={() => setActivePanel('subtitles')}
                >
                  <FiType />
                  <span>Subtitles</span>
                </button>
                <button 
                  className={`tool-tab ${activePanel === 'styles' ? 'active' : ''}`}
                  onClick={() => setActivePanel('styles')}
                >
                  <FiZap />
                  <span>Styles</span>
                </button>
              </div>
            </div>

            <div className="tool-panel-content">
              {/* Music Panel */}
              {activePanel === 'music' && (
                <div className="panel-content">
                  {musicTrack && (
                    <div className="selected-music">
                      <div className="music-info">
                        <span className="music-icon">{musicTrack.icon}</span>
                        <span>{musicTrack.name}</span>
                      </div>
                      <div className="volume-slider">
                        <FiVolume2 />
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                        />
                        <span>{musicVolume}%</span>
                      </div>
                      <button className="remove-music" onClick={() => setMusicTrack(null)}>
                        <FiX />
                      </button>
                    </div>
                  )}
                  <div className="music-grid">
                    {musicLibrary.map(track => (
                      <div 
                        key={track.id}
                        className={`music-card ${musicTrack?.id === track.id ? 'selected' : ''}`}
                      >
                        <button 
                          className={`music-preview-btn ${playingPreviewId === `music-${track.id}` ? 'playing' : ''}`}
                          onClick={() => playPreview(`music-${track.id}`, track.audioUrl, true)}
                          title={playingPreviewId === `music-${track.id}` ? 'Stop preview' : 'Preview'}
                        >
                          {playingPreviewId === `music-${track.id}` ? <FiPause /> : <FiPlay />}
                        </button>
                        <div className="music-info-col" onClick={() => { selectMusic(track); }}>
                          <span className="music-icon">{track.icon}</span>
                          <span className="music-name">{track.name}</span>
                          <span className="music-mood">{track.mood}</span>
                        </div>
                        <button 
                          className="music-add-btn"
                          onClick={() => { selectMusic(track); }}
                          title="Add to timeline"
                        >
                          <FiPlus />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sounds Panel */}
              {activePanel === 'sounds' && (
                <div className="panel-content">
                  <div className="sounds-grid">
                    {soundsLibrary.map(sound => (
                      <div 
                        key={sound.id}
                        className="sound-card"
                      >
                        <button 
                          className={`sound-preview-btn ${playingPreviewId === `sound-${sound.id}` ? 'playing' : ''}`}
                          onClick={() => playPreview(`sound-${sound.id}`, sound.type, false)}
                          title={playingPreviewId === `sound-${sound.id}` ? 'Stop preview' : 'Preview'}
                        >
                          {playingPreviewId === `sound-${sound.id}` ? <FiPause /> : <FiPlay />}
                        </button>
                        <div className="sound-info" onClick={() => { addSoundEffect(sound); }}>
                          <span className="sound-icon">{sound.icon}</span>
                          <span className="sound-name">{sound.name}</span>
                        </div>
                        <button 
                          className="sound-add-btn"
                          onClick={() => { addSoundEffect(sound); }}
                          title="Add to timeline"
                        >
                          <FiPlus />
                        </button>
                      </div>
                    ))}
                  </div>
                  {soundEffects.length > 0 && (
                    <div className="added-sounds">
                      <h4>Added Effects</h4>
                      {soundEffects.map(effect => (
                        <div key={effect.instanceId} className="sound-item">
                          <span>{effect.icon} {effect.name}</span>
                          <span className="sound-time">@ {formatTime(effect.time)}</span>
                          <button onClick={() => setSoundEffects(soundEffects.filter(s => s.instanceId !== effect.instanceId))}>
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Text Panel */}
              {activePanel === 'text' && (
                <div className="panel-content">
                  <button className="add-element-btn" onClick={addTextOverlay}>
                    <FiPlus /> Add Text
                  </button>
                  <div className="text-styles">
                    {textStyles.map(style => (
                      <button key={style.id} className="style-btn">
                        <span className={`style-preview style-${style.id}`}>{style.preview}</span>
                        <span>{style.name}</span>
                      </button>
                    ))}
                  </div>
                  {textOverlays.length > 0 && (
                    <div className="text-list">
                      {textOverlays.map(overlay => (
                        <div key={overlay.id} className="text-item">
                          <input 
                            type="text" 
                            value={overlay.text}
                            onChange={(e) => {
                              setTextOverlays(textOverlays.map(t => 
                                t.id === overlay.id ? { ...t, text: e.target.value } : t
                              ));
                            }}
                          />
                          <select 
                            value={overlay.position}
                            onChange={(e) => {
                              setTextOverlays(textOverlays.map(t => 
                                t.id === overlay.id ? { ...t, position: e.target.value } : t
                              ));
                            }}
                          >
                            <option value="top">Top</option>
                            <option value="center">Center</option>
                            <option value="bottom">Bottom</option>
                          </select>
                          <button onClick={() => setTextOverlays(textOverlays.filter(t => t.id !== overlay.id))}>
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtitles Panel */}
              {activePanel === 'subtitles' && (
                <div className="panel-content">
                  <button className="add-element-btn" onClick={addSubtitle}>
                    <FiPlus /> Add Subtitle
                  </button>
                  {subtitles.length > 0 && (
                    <div className="subtitle-list">
                      {subtitles.map(sub => (
                        <div key={sub.id} className="subtitle-item">
                          <input 
                            type="text" 
                            value={sub.text}
                            onChange={(e) => {
                              setSubtitles(subtitles.map(s => 
                                s.id === sub.id ? { ...s, text: e.target.value } : s
                              ));
                            }}
                          />
                          <span className="sub-time">
                            {formatTime(sub.startTime)} - {formatTime(sub.endTime)}
                          </span>
                          <button onClick={() => setSubtitles(subtitles.filter(s => s.id !== sub.id))}>
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Styles Panel */}
              {activePanel === 'styles' && (
                <div className="panel-content">
                  <div className="styles-section">
                    <h4 className="section-label">Video Filters</h4>
                    <div className="filter-grid">
                      <button className="filter-btn active">
                        <div className="filter-preview original"></div>
                        <span>Original</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview cinematic"></div>
                        <span>Cinematic</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview vintage"></div>
                        <span>Vintage</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview noir"></div>
                        <span>B&W</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview warm"></div>
                        <span>Warm</span>
                      </button>
                      <button className="filter-btn">
                        <div className="filter-preview cool"></div>
                        <span>Cool</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="styles-section">
                    <h4 className="section-label">Adjustments</h4>
                    <div className="adjustment-controls">
                      <div className="adjustment-row">
                        <span>Brightness</span>
                        <input type="range" min="-100" max="100" defaultValue="0" />
                        <span className="adj-value">0</span>
                      </div>
                      <div className="adjustment-row">
                        <span>Contrast</span>
                        <input type="range" min="-100" max="100" defaultValue="0" />
                        <span className="adj-value">0</span>
                      </div>
                      <div className="adjustment-row">
                        <span>Saturation</span>
                        <input type="range" min="-100" max="100" defaultValue="0" />
                        <span className="adj-value">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="tools-action-bar">
              {!isRendered ? (
                <button 
                  className="render-btn"
                  onClick={handleRender}
                  disabled={isRendering || !selectedVideo}
                >
                  {isRendering ? (
                    <>
                      <FiLoader className="spin" /> Rendering {Math.round(renderProgress)}%
                    </>
                  ) : (
                    <>
                      <FiCheck /> Render Video
                    </>
                  )}
                </button>
              ) : (
                <div className="export-actions">
                  <button className="action-btn save" onClick={handleSaveVideo}>
                    <FiSave /> Save
                  </button>
                  <button className="action-btn download" onClick={handleDownload}>
                    <FiDownload /> Download
                  </button>
                  <button className="action-btn instagram" onClick={handlePostToInstagram}>
                    <FiInstagram /> Post
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Mobile Video Picker Modal */}
        {showMobileVideoPicker && (
          <div className="mobile-video-picker-overlay" onClick={() => setShowMobileVideoPicker(false)}>
            <div className="mobile-video-picker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="picker-header">
                <h3>Select Video</h3>
                <button className="picker-close" onClick={() => setShowMobileVideoPicker(false)}>
                  <FiX />
                </button>
              </div>
              <div className="picker-videos-grid">
                {videos.length > 0 ? (
                  videos.map((video) => (
                    <div 
                      key={video.id} 
                      className={`picker-video-card ${selectedVideo?.id === video.id ? 'selected' : ''}`}
                    >
                      <div 
                        className="picker-video-thumbnail"
                        onClick={() => handleSelectVideoFromPicker(video)}
                      >
                        <video 
                          src={video.url || video.videoUrl} 
                          muted 
                          playsInline
                          preload="metadata"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="picker-play-icon"><FiPlay /></div>
                      </div>
                      <div className="picker-video-info">
                        <span className="picker-video-title">{video.prompt?.slice(0, 25) || 'Untitled'}...</span>
                        <span className="picker-video-date">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="picker-video-actions">
                        <button 
                          className="picker-add-btn"
                          onClick={() => handleSelectVideoFromPicker(video)}
                          title="Add to preview"
                        >
                          <FiPlus /> Add
                        </button>
                        <button 
                          className="picker-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVideo(video.id);
                          }}
                          title="Delete video"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="picker-empty">
                    <FiVideo />
                    <p>No videos yet</p>
                    <button onClick={() => { setShowMobileVideoPicker(false); navigate('/app/ai-video'); }}>
                      Generate Your First Video
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  };
  
  export default VideoEdit;
