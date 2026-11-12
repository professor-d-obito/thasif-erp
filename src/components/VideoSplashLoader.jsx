import React, { useState, useEffect, useRef } from 'react';
import { FastForward, Volume2, VolumeX, Upload, Sparkles, RefreshCw, Eye } from 'lucide-react';
import { playChime, playKamuiWarp } from '../utils/audio';

// Default high-tech anime/cyber cinematic video loop (public sample MP4)
// Fallback video options that load smoothly across all modern browsers
const DEFAULT_SPLASH_VIDEOS = [
  'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-tunnel-with-lights-41551-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-cyber-city-with-holographic-elements-42284-large.mp4'
];

export default function VideoSplashLoader({ 
  onLoadingComplete, 
  companyConfig = {},
  splashVideoUrl = '',
  onSwitchToAnimeScreen
}) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [activeVideoSrc, setActiveVideoSrc] = useState(() => {
    return splashVideoUrl || 
      localStorage.getItem('kamui_erp_splash_video_v1') || 
      DEFAULT_SPLASH_VIDEOS[0];
  });

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-play enforcement on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Autoplay error handled:', err);
      });
    }
  }, [activeVideoSrc]);

  // Video progress updater
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setVideoDuration(total);
      setVideoProgress((current / total) * 100);
    }
  };

  // Video playback ends -> seamless fallback to system dashboard
  const handleVideoEnded = () => {
    playKamuiWarp();
    setIsFadingOut(true);
    setTimeout(() => {
      onLoadingComplete();
    }, 600);
  };

  // Explicit Skip control
  const handleSkip = () => {
    playKamuiWarp();
    setIsFadingOut(true);
    setTimeout(() => {
      onLoadingComplete();
    }, 400);
  };

  // Toggle Mute / Unmute
  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !videoRef.current.muted;
      videoRef.current.muted = nextMute;
      setIsMuted(nextMute);
      playChime();
    }
  };

  // User-uploaded video handling with strict size & MIME validation
  const handleVideoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB limit
    if (file.size > MAX_VIDEO_SIZE) {
      alert('Security Limit: Uploaded video exceeds the 15MB maximum file size limit.');
      return;
    }

    const validExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!file.type.startsWith('video/') || !hasValidExt) {
      alert('Security Validation: Please upload a valid video file (.mp4, .webm, .ogg, .mov).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setActiveVideoSrc(dataUrl);
      setHasError(false);
      try {
        localStorage.setItem('kamui_erp_splash_video_v1', dataUrl);
      } catch (storageErr) {
        console.warn('Video file too large for localStorage, active for this session:', storageErr);
      }
      playChime();
    };
    reader.readAsDataURL(file);
  };

  // Graceful fallback if video fails to load
  const handleVideoError = () => {
    setHasError(true);
    // If external video failed, switch to fallback or prompt
    if (activeVideoSrc !== DEFAULT_SPLASH_VIDEOS[1]) {
      setActiveVideoSrc(DEFAULT_SPLASH_VIDEOS[1]);
    }
  };

  const systemName = companyConfig.name || 'KAMUI ERP';
  const leaderName = companyConfig.leader || 'Professor D Obito';

  return (
    <div 
      className={`video-splash-screen ${isFadingOut ? 'fade-out' : ''}`}
      id="video-splash-loader-root"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: '#07080c',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.04)' : 'scale(1)'
      }}
    >
      {/* 2.1 Video Container Covering Full Viewport (object-fit: cover) */}
      <video
        ref={videoRef}
        id="splash-video-element"
        src={activeVideoSrc}
        autoPlay
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 1,
          filter: 'brightness(0.9) contrast(1.1)'
        }}
      />

      {/* Cinematic Vignette Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(10, 11, 16, 0.25) 0%, rgba(5, 6, 10, 0.85) 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />

      {/* Top Controls Bar */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
        }}
      >
        {/* Brand Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span 
            style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              background: 'var(--accent-crimson, #ff2a5f)',
              boxShadow: '0 0 12px var(--accent-crimson, #ff2a5f)'
            }}
          ></span>
          <div>
            <div style={{ 
              fontSize: '11px', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--accent-crimson-light, #ff7597)', 
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 700
            }}>
              {systemName} // CINEMATIC VIDEO SPLASH
            </div>
            <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800 }}>
              Grand Mastermind Protocol
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Audio Mute/Unmute */}
          <button
            id="splash-video-mute-toggle"
            onClick={toggleMute}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              background: 'rgba(20, 22, 32, 0.75)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: 'var(--radius-full, 999px)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '12px'
            }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={15} color="#f87171" /> : <Volume2 size={15} color="#34d399" />}
            <span>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          {/* Upload Custom Video */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="video/*" 
            style={{ display: 'none' }}
            onChange={handleVideoUpload}
          />
          <button
            id="splash-upload-custom-video-btn"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              background: 'rgba(20, 22, 32, 0.75)',
              backdropFilter: 'blur(10px)',
              borderColor: 'rgba(168, 85, 247, 0.4)',
              color: '#ffffff',
              borderRadius: 'var(--radius-full, 999px)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '12px'
            }}
            title="Upload custom video file (MP4/WebM) to store in assets"
          >
            <Upload size={14} color="#c084fc" />
            <span>Upload Video</span>
          </button>

          {/* Switch to One Piece Straw Hat screen if preferred */}
          {onSwitchToAnimeScreen && (
            <button
              id="splash-switch-to-strawhat-btn"
              onClick={onSwitchToAnimeScreen}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                background: 'rgba(20, 22, 32, 0.75)',
                backdropFilter: 'blur(10px)',
                borderColor: 'rgba(234, 179, 8, 0.4)',
                color: '#eab308',
                borderRadius: 'var(--radius-full, 999px)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '12px'
              }}
              title="Switch to Straw Hat Pirate Animation"
            >
              <Sparkles size={14} />
              <span>Straw Hat Mode</span>
            </button>
          )}

          {/* 2.1 Explicit Skip Control */}
          <button
            id="skip-video-splash-btn"
            onClick={handleSkip}
            className="btn-primary"
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full, 999px)',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 0 20px rgba(255, 42, 95, 0.4)'
            }}
          >
            <span>Skip Video</span>
            <FastForward size={14} />
          </button>
        </div>
      </div>

      {/* Centerpiece HUD */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '700px',
          margin: '0 auto',
          padding: '0 20px',
          textShadow: '0 2px 20px rgba(0,0,0,0.9)'
        }}
      >
        <div 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid rgba(255, 42, 95, 0.3)',
            marginBottom: 16,
            backdropFilter: 'blur(12px)'
          }}
        >
          <Sparkles size={14} color="#ff2a5f" />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ff2a5f', letterSpacing: '1px', fontWeight: 700 }}>
            DIMENSIONAL VIDEO STREAM // INITIALIZING
          </span>
        </div>

        <h1 
          style={{ 
            fontSize: '44px', 
            fontWeight: 900, 
            fontFamily: 'var(--font-display)', 
            color: '#ffffff',
            letterSpacing: '2px',
            margin: '0 0 10px 0'
          }}
        >
          {systemName}
        </h1>

        <p 
          style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.85)', 
            lineHeight: 1.6,
            margin: '0 0 20px 0'
          }}
        >
          Synchronizing tactical telemetries for Commander <strong>{leaderName}</strong>. 
          Auto-play enabled with standard video format support.
        </p>

        {hasError && (
          <div style={{ fontSize: '12px', color: '#f87171', background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: '6px', display: 'inline-block' }}>
            External stream re-routed to high-availability backup channel.
          </div>
        )}
      </div>

      {/* Bottom Timeline & Telemetry Bar */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px 32px 32px 32px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)'
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Progress Tracker Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            <span>VIDEO TELEMETRY STREAM</span>
            <span>
              {Math.floor(currentTime)}s / {Math.floor(videoDuration || 0)}s ({Math.round(videoProgress)}%)
            </span>
          </div>

          <div 
            style={{
              width: '100%',
              height: 5,
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 999,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div 
              style={{
                width: `${videoProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-purple, #8b5cf6) 0%, var(--accent-crimson, #ff2a5f) 100%)',
                boxShadow: '0 0 10px var(--accent-crimson, #ff2a5f)',
                transition: 'width 0.15s linear'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
            <span>AUTOPLAY: MUTED (BY DEFAULT)</span>
            <span>SKIP ANYTIME OR FALLBACK UPON VIDEO COMPLETION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
