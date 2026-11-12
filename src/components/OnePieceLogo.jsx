import React from 'react';

export default function OnePieceLogo({ size = 180, className = '', glowing = true }) {
  return (
    <div 
      className={`one-piece-logo-container ${className}`} 
      style={{ 
        width: size, 
        height: size, 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <svg 
        viewBox="0 0 200 200" 
        width="100%" 
        height="100%" 
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Haki Crimson & Gold Gradients */}
          <radialGradient id="hakiGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff2a5f" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ff2a5f" stopOpacity="0" />
          </radialGradient>
          
          <linearGradient id="strawHatGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <linearGradient id="hatRibbonRed" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#ff2a5f" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>

          <linearGradient id="boneWhite" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>

          <filter id="sharinganGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="hakiAura" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Haki Halo */}
        {glowing && (
          <circle 
            cx="100" 
            cy="100" 
            r="88" 
            fill="url(#hakiGlow)" 
            className="haki-pulse-orb"
          />
        )}

        {/* Rotating Celestial Subspace Ring */}
        <circle 
          cx="100" 
          cy="100" 
          r="92" 
          fill="none" 
          stroke="rgba(255, 42, 95, 0.4)" 
          strokeWidth="1.5" 
          strokeDasharray="14 8 4 8"
          className="kamui-spin-ring"
        />
        <circle 
          cx="100" 
          cy="100" 
          r="82" 
          fill="none" 
          stroke="rgba(234, 179, 8, 0.3)" 
          strokeWidth="1" 
          strokeDasharray="6 6"
          className="kamui-reverse-ring"
        />

        {/* Crossbones (Behind Skull) */}
        {/* Bone 1: Top-Left to Bottom-Right */}
        <g stroke="url(#boneWhite)" strokeWidth="12" strokeLinecap="round">
          <line x1="38" y1="42" x2="162" y2="158" />
        </g>
        {/* Bone 1 Ends */}
        <circle cx="36" cy="36" r="8" fill="url(#boneWhite)" />
        <circle cx="44" cy="44" r="8" fill="url(#boneWhite)" />
        <circle cx="164" cy="164" r="8" fill="url(#boneWhite)" />
        <circle cx="156" cy="156" r="8" fill="url(#boneWhite)" />

        {/* Bone 2: Bottom-Left to Top-Right */}
        <g stroke="url(#boneWhite)" strokeWidth="12" strokeLinecap="round">
          <line x1="38" y1="158" x2="162" y2="42" />
        </g>
        {/* Bone 2 Ends */}
        <circle cx="36" cy="164" r="8" fill="url(#boneWhite)" />
        <circle cx="44" cy="156" r="8" fill="url(#boneWhite)" />
        <circle cx="164" cy="36" r="8" fill="url(#boneWhite)" />
        <circle cx="156" cy="44" r="8" fill="url(#boneWhite)" />

        {/* Central Skull Head */}
        <path 
          d="M 64 88 C 64 56, 136 56, 136 88 C 136 102, 130 114, 122 120 L 122 136 C 122 142, 116 146, 110 146 L 90 146 C 84 146, 78 142, 78 136 L 78 120 C 70 114, 64 102, 64 88 Z" 
          fill="url(#boneWhite)" 
          stroke="#090a0f" 
          strokeWidth="3.5"
        />

        {/* Skull Teeth Grid */}
        <g stroke="#090a0f" strokeWidth="2.5" strokeLinecap="round">
          <line x1="84" y1="130" x2="84" y2="142" />
          <line x1="92" y1="130" x2="92" y2="142" />
          <line x1="100" y1="130" x2="100" y2="142" />
          <line x1="108" y1="130" x2="108" y2="142" />
          <line x1="116" y1="130" x2="116" y2="142" />
          <line x1="80" y1="136" x2="120" y2="136" />
        </g>

        {/* Left Eye: Iconic Deep Pirate Eye Socket */}
        <circle cx="82" cy="94" r="11" fill="#090a0f" />

        {/* Right Eye: Professor D Obito Sharingan Eye! */}
        <circle cx="118" cy="94" r="11" fill="#090a0f" />
        {/* Glowing Sharingan Iris */}
        <circle cx="118" cy="94" r="9" fill="#ff2a5f" filter="url(#sharinganGlow)" />
        <circle cx="118" cy="94" r="3.5" fill="#000000" />
        {/* Tomoe markings in the eye */}
        <circle cx="118" cy="88" r="1.5" fill="#000000" />
        <circle cx="113" cy="97" r="1.5" fill="#000000" />
        <circle cx="123" cy="97" r="1.5" fill="#000000" />

        {/* Inverted Triangle Nose */}
        <path d="M 97 108 L 103 108 L 100 115 Z" fill="#090a0f" />

        {/* Iconic Straw Hat - Crown & Brim */}
        {/* Straw Hat Crown (Dome) */}
        <path 
          d="M 68 74 C 68 40, 132 40, 132 74 Z" 
          fill="url(#strawHatGold)" 
          stroke="#090a0f" 
          strokeWidth="3.5"
        />

        {/* Red Ribbon on Straw Hat */}
        <path 
          d="M 69 68 C 82 64, 118 64, 131 68 L 132 74 C 118 70, 82 70, 68 74 Z" 
          fill="url(#hatRibbonRed)" 
          stroke="#090a0f" 
          strokeWidth="1.5"
        />

        {/* Wide Straw Hat Curved Brim */}
        <path 
          d="M 32 75 C 65 62, 135 62, 168 75 C 172 77, 168 83, 150 82 C 118 77, 82 77, 50 82 C 32 83, 28 77, 32 75 Z" 
          fill="url(#strawHatGold)" 
          stroke="#090a0f" 
          strokeWidth="3.5"
        />

        {/* Conqueror's Haki Lightning Sparks */}
        <path 
          d="M 28 65 L 18 52 L 32 50 L 22 36" 
          stroke="#ff2a5f" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
          filter="url(#sharinganGlow)"
          className="haki-spark-1"
        />
        <path 
          d="M 172 65 L 182 52 L 168 50 L 178 36" 
          stroke="#eab308" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
          filter="url(#sharinganGlow)"
          className="haki-spark-2"
        />
      </svg>
    </div>
  );
}
