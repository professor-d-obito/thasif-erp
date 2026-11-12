import React, { useState, useEffect, useRef } from 'react';
import { FastForward, Volume2, VolumeX, Sparkles, RefreshCw, X, ShieldCheck, Zap } from 'lucide-react';
import { playChime, playKamuiWarp, playSuccess } from '../utils/audio';

const DEFAULT_FALLBACK_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-futuristic-tunnel-with-lights-41551-large.mp4';

export default function CustomizableSplashLoader({
  onLoadingComplete,
  companyConfig = {},
  isPreviewMode = false,
  onClosePreview = () => {}
}) {
  const splashConfig = companyConfig.splashConfig || {
    mediaType: 'video',
    mediaUrl: DEFAULT_FALLBACK_VIDEO,
    title: companyConfig.name || 'NEXUS CLOUD ERP',
    subtitle: companyConfig.subtitle || 'Autonomous Enterprise Operating Matrix',
    logoUrl: companyConfig.logoUrl || '/anime/obito_avatar.jpg',
    duration: 3.5,
    accentColor: '#ff2a5f',
    showProgressBar: true,
    showSteps: true,
    allowSkip: true,
    soundEnabled: true,
    loadingSteps: [
      'Initializing Core Engine...',
      'Validating RBAC Security Tokens...',
      'Synchronizing Ledger Balances...',
      'Deploying Command Workspaces...'
    ]
  };

  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [videoHasEnded, setVideoHasEnded] = useState(false);

  const videoRef = useRef(null);
  const steps = splashConfig.loadingSteps && splashConfig.loadingSteps.length > 0 
    ? splashConfig.loadingSteps 
    : ['Initializing System Matrix...', 'Authenticating Security Clearance...', 'Ready'];

  const durationMs = Math.max(1500, (splashConfig.duration || 3.5) * 1000);
  const accentColor = splashConfig.accentColor || '#ff2a5f';

  // Handle Video Autoplay
  useEffect(() => {
    if (splashConfig.mediaType === 'video' && videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(err => {
        console.warn('Video splash autoplay prevented, user interaction required:', err);
      });
    }
  }, [splashConfig.mediaUrl, splashConfig.mediaType, isMuted]);

  // Timed progress bar and step updates
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);

      const stepIndex = Math.min(steps.length - 1, Math.floor((pct / 100) * steps.length));
      setCurrentStepIdx(stepIndex);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        handleFinish();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationMs, steps.length]);

  const handleFinish = () => {
    if (splashConfig.soundEnabled) {
      playKamuiWarp();
    }
    setIsFadingOut(true);
    setTimeout(() => {
      if (isPreviewMode) {
        onClosePreview();
      } else if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 500);
  };

  const handleSkip = () => {
    playChime();
    setIsFadingOut(true);
    setTimeout(() => {
      if (isPreviewMode) {
        onClosePreview();
      } else if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, 300);
  };

  const toggleMute = () => {
    playChime();
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  return (
    <div 
      className={`splash-fullscreen-container ${isFadingOut ? 'splash-fade-out' : ''}`}
      id="customizable-splash-loader-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: isPreviewMode ? 999999 : 99999,
        background: '#07080c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)',
        transition: 'opacity 0.5s ease'
      }}
    >
      {/* Background Media: Video OR Image OR Particles */}
      {splashConfig.mediaType === 'video' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
          <video
            ref={videoRef}
            src={splashConfig.mediaUrl || DEFAULT_FALLBACK_VIDEO}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onEnded={() => setVideoHasEnded(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.65) contrast(1.15) saturate(1.2)'
            }}
          />
          {/* Subtle gradient vignette */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(10, 11, 18, 0.45) 0%, rgba(7, 8, 12, 0.95) 100%)'
          }} />
        </div>
      )}

      {splashConfig.mediaType === 'image' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
          <img
            src={splashConfig.mediaUrl || companyConfig.bannerUrl || '/anime/kamui_banner.jpg'}
            alt="Splash Background"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.55) contrast(1.15) saturate(1.1)',
              transform: 'scale(1.05)',
              animation: 'subtleZoom 20s infinite alternate ease-in-out'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, rgba(10, 11, 18, 0.5) 0%, rgba(7, 8, 12, 0.96) 100%)'
          }} />
        </div>
      )}

      {(splashConfig.mediaType === 'particles' || splashConfig.mediaType === 'cyber') && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'radial-gradient(circle at 50% 30%, #171026 0%, #08090f 100%)'
        }}>
          {/* Cyber grid lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255, 42, 95, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 42, 95, 0.08) 1px, transparent 1px)`,
            backgroundSize: '45px 45px',
            transform: 'perspective(500px) rotateX(40deg) translateY(-20%)',
            opacity: 0.7
          }} />
        </div>
      )}

      {/* Top Controls Bar */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 24,
        right: 24,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0,0,0,0.65)',
            border: `1px solid ${accentColor}55`,
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.5px'
          }}>
            <Zap size={12} color={accentColor} />
            {isPreviewMode ? 'SUPER ADMIN SPLASH PREVIEW' : 'STARTUP ERP ENGINE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {splashConfig.mediaType === 'video' && (
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              style={{
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s'
              }}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} color={accentColor} />}
            </button>
          )}

          {splashConfig.allowSkip && (
            <button
              id="splash-skip-btn"
              onClick={handleSkip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(0,0,0,0.65)',
                border: `1px solid ${accentColor}66`,
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
                boxShadow: `0 0 14px ${accentColor}33`
              }}
            >
              <span>Skip Intro</span>
              <FastForward size={14} color={accentColor} />
            </button>
          )}

          {isPreviewMode && (
            <button
              onClick={onClosePreview}
              title="Close Live Preview"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#ef4444',
                border: 'none',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <X size={14} />
              <span>Exit Preview</span>
            </button>
          )}
        </div>
      </div>

      {/* Center Brand Glass Portal */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 620,
          padding: '36px 32px',
          background: 'rgba(13, 15, 24, 0.72)',
          border: `1px solid rgba(255, 255, 255, 0.12)`,
          borderRadius: '24px',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px ${accentColor}25`,
          backdropFilter: 'blur(20px)',
          animation: 'fadeInUp 0.6s ease'
        }}
      >
        {/* Logo / Emblem */}
        <div 
          style={{
            position: 'relative',
            width: 86,
            height: 86,
            marginBottom: 20,
            borderRadius: '22px',
            padding: 3,
            background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
            boxShadow: `0 0 30px ${accentColor}66`
          }}
        >
          <img
            src={splashConfig.logoUrl || companyConfig.logoUrl || '/anime/obito_avatar.jpg'}
            alt="Brand Logo"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '19px',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: -6,
            right: -6,
            background: '#10b981',
            borderRadius: '50%',
            width: 18,
            height: 18,
            border: '3px solid #0b0d14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} />
        </div>

        {/* System Title */}
        <h1 
          id="splash-system-title"
          style={{
            fontSize: '32px',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
            color: '#ffffff',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            margin: '0 0 8px 0',
            textShadow: `0 0 20px ${accentColor}88`
          }}
        >
          {splashConfig.title || companyConfig.name || 'NEXUS CLOUD ERP'}
        </h1>

        {/* Subtitle / Tagline */}
        <p 
          id="splash-system-subtitle"
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #94a3b8)',
            maxWidth: 480,
            lineHeight: 1.5,
            margin: '0 0 26px 0'
          }}
        >
          {splashConfig.subtitle || companyConfig.subtitle || 'Subspace Strategic Resource & Operations Architecture'}
        </p>

        {/* Progress Bar & Sequence */}
        {splashConfig.showProgressBar && (
          <div style={{ width: '100%', maxWidth: 440 }}>
            {/* Dynamic Step Text */}
            {splashConfig.showSteps && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#e2e8f0',
                marginBottom: 8,
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-block',
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: accentColor,
                    boxShadow: `0 0 8px ${accentColor}`
                  }} />
                  {steps[currentStepIdx]}
                </span>
                <span style={{ fontWeight: 700, color: accentColor }}>
                  {Math.round(progress)}%
                </span>
              </div>
            )}

            {/* Glowing Progress Track */}
            <div style={{
              width: '100%',
              height: 7,
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 999,
              overflow: 'hidden',
              padding: 1,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${accentColor}, #8b5cf6, #38bdf8)`,
                borderRadius: 999,
                boxShadow: `0 0 12px ${accentColor}`,
                transition: 'width 0.08s linear'
              }} />
            </div>
          </div>
        )}

        {/* Live Admin Tag */}
        <div style={{
          marginTop: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: '11px',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'var(--font-mono)'
        }}>
          <span>STATUS: ONLINE</span>
          <span>•</span>
          <span>ROLE: {companyConfig.leader || 'Professor D Obito'}</span>
          <span>•</span>
          <span>CIPHER: 256-BIT QUANTUM</span>
        </div>
      </div>
    </div>
  );
}
