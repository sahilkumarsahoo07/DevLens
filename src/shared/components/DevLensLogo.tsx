import React from 'react';

interface DevLensLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const DevLensLogo: React.FC<DevLensLogoProps> = ({
  size = 24,
  showText = true,
  className = ''
}) => {
  const logoUrl =
    typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL('icons/icon48.png')
      : 'icons/icon48.png';

  return (
    <div
      className={`devlens-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none'
      }}
    >
      <img
        src={logoUrl}
        alt="DevLens Logo"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          flexShrink: 0,
          filter: 'drop-shadow(0 2px 8px rgba(244, 114, 182, 0.4))'
        }}
      />

      {showText && (
        <span
          style={{
            fontWeight: 800,
            fontSize: `${Math.max(13, Math.round(size * 0.7))}px`,
            background: 'linear-gradient(135deg, #f472b6 0%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          DevLens
        </span>
      )}
    </div>
  );
};
