import React, { useState, useEffect } from 'react';
import OnePieceLogo from './OnePieceLogo';
import { playChime, playKamuiWarp } from '../utils/audio';
import { FastForward, Shield, Sparkles } from 'lucide-react';

export default function OnePieceLoadingScreen({ onLoadingComplete, companyConfig = {} }) {
  const [progress, setProgress] = useState(0);
  const leaderName = companyConfig.leader || 'Professor D Obito';
  const systemName = companyConfig.name || 'KAMUI ERP';
  const [currentStepText, setCurrentStepText] = useState("Awakening Conqueror's Haki...");
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const steps = [
      { at: 18, text: "Channeling Ancient Conqueror's Haki..." },
      { at: 38, text: "Deciphering the Will of D Poneglyph Cipher..." },
      { at: 62, text: `Aligning Subspace Telemetry with ${systemName} Grand Fleet...` },
      { at: 85, text: `Authenticating Supreme Mastermind: ${leaderName}...` },
      { at: 100, text: "Grand Line Synchronization Complete. Access Granted!" }
    ];

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = Math.min(100, prev + Math.floor(Math.random() * 6) + 3);
        
        // Update status text
        const matchedStep = steps.find(s => next >= s.at && prev < s.at);
        if (matchedStep) {
          setCurrentStepText(matchedStep.text);
          playChime();
        }

        if (next >= 100) {
          clearInterval(interval);
          playKamuiWarp();
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              onLoadingComplete();
            }, 600);
          }, 700);
          return 100;
        }
        return next;
      });
    }, 110);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  const handleSkip = () => {
    playKamuiWarp();
    setProgress(100);
    setCurrentStepText("Grand Line Synchronization Complete. Access Granted!");
    setIsFadingOut(true);
    setTimeout(() => {
      onLoadingComplete();
    }, 400);
  };

  return (
    <div 
      className={`one-piece-loading-screen ${isFadingOut ? 'fade-out' : ''}`}
      id="one-piece-loading-page"
    >
      {/* Background Ambience & Lighting */}
      <div className="loading-bg-ambient"></div>
      
      {/* Top Banner */}
      <div className="loading-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="brand-pulse-dot"></span>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-crimson-light)', letterSpacing: '1px' }}>
            CRIMSON PROTOCOL // GRAND FLEET TELEMETRY
          </span>
        </div>

        <button 
          id="skip-loading-btn"
          className="btn-secondary"
          onClick={handleSkip}
          style={{ fontSize: '11px', padding: '5px 12px', borderRadius: 'var(--radius-full)' }}
        >
          <span>Skip Sequence</span>
          <FastForward size={13} />
        </button>
      </div>

      {/* Main Centerpiece */}
      <div className="loading-center-content">
        {/* Animated One Piece Straw Hat Skull Logo */}
        <div className="logo-glow-wrapper">
          <OnePieceLogo size={220} glowing={true} />
        </div>

        {/* Title & Will of D Tagline */}
        <div className="loading-titles">
          <div className="will-of-d-badge">
            <Sparkles size={13} color="#eab308" />
            <span>THE WILL OF D // PIRATE KING EMBLEM</span>
            <Sparkles size={13} color="#eab308" />
          </div>

          <h1 className="loading-main-title">
            {systemName} <span style={{ color: 'var(--accent-crimson)' }}>SYSTEM</span>
          </h1>

          <p className="loading-subtitle">
            "Inherited Will, the Swell of the Age, and the Dreams of its People... These are things that shall never be stopped."
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="loading-progress-container">
          <div className="loading-status-row">
            <span className="loading-status-text">
              {currentStepText}
            </span>
            <span className="loading-percentage">
              {progress}%
            </span>
          </div>

          <div className="loading-progress-track">
            <div 
              className="loading-progress-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="progress-glow-head"></div>
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="loading-footer-meta">
          <span>COMMANDER: <strong style={{ color: '#ffffff' }}>{leaderName.toUpperCase()}</strong></span>
          <span>•</span>
          <span>SECTOR: <strong>COMMAND SANCTUARY</strong></span>
        </div>
      </div>
    </div>
  );
}
