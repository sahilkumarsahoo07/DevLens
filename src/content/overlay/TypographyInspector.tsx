import React, { useState } from 'react';
import { TypographyData } from '../../shared/types';
import { typographyToCssString } from '../../shared/utils/cssUtils';
import { cssToTailwind } from '../../shared/utils/tailwindUtils';
import { X, Copy, Check, Type, MousePointer } from 'lucide-react';

interface TypographyInspectorProps {
  typography: TypographyData | null;
  onClose: () => void;
}

function getPreviewBackground(textColor: string, bgColor: string): string {
  // 1. If background color is specified and not transparent, use element's real background
  if (
    bgColor &&
    bgColor !== 'transparent' &&
    !bgColor.startsWith('rgba(0, 0, 0, 0)') &&
    !bgColor.startsWith('rgba(255, 255, 255, 0)')
  ) {
    return bgColor;
  }

  // 2. Check if text color is white or bright light color
  const lowerText = (textColor || '').toLowerCase();
  const isWhiteOrLightText =
    lowerText.includes('255, 255, 255') ||
    lowerText.includes('255,255,255') ||
    lowerText.includes('#fff') ||
    lowerText.includes('ffffff') ||
    lowerText.includes('245, 245, 245') ||
    lowerText.includes('240, 240, 240');

  if (isWhiteOrLightText) {
    return '#0f172a'; // Contrast dark backdrop for white text!
  }

  return 'var(--dl-bg)';
}

export const TypographyInspector: React.FC<TypographyInspectorProps> = ({
  typography,
  onClose
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyText = (str: string, type: string) => {
    navigator.clipboard.writeText(str);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  };

  const previewBg = typography ? getPreviewBackground(typography.color, typography.backgroundColor) : 'var(--dl-bg)';

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '360px',
        maxHeight: 'calc(100vh - 100px)'
      }}
    >
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          <Type size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Typography Inspector</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Active Inspection Guide Banner */}
        <div className="devlens-active-banner" style={{ alignItems: 'flex-start' }}>
          <MousePointer size={16} style={{ color: 'var(--dl-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--dl-primary)', marginBottom: '2px', lineHeight: '1.2' }}>
              Typography Mode Active
            </div>
            <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', lineHeight: '1.4' }}>
              Hover over any text or header on the webpage and click to inspect its font family, size, line-height, and color.
            </div>
          </div>
        </div>

        {typography ? (
          <>
            {/* Rendered Font Banner */}
            <div
              style={{
                background: 'var(--dl-bg)',
                padding: '12px 14px',
                borderRadius: '8px',
                borderLeft: '4px solid var(--dl-primary)',
                border: '1px solid var(--dl-border)',
                borderLeftWidth: '4px'
              }}
            >
              <div className="devlens-typo-label">ACTUAL RENDERED FONT</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dl-text)', marginTop: '2px', lineHeight: '1.3' }}>
                {typography.fontFamilyRendered}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>
                Stack: {typography.fontStack}
              </div>
            </div>

            {/* Font Properties Grid */}
            <div className="devlens-typo-grid">
              <div className="devlens-typo-card">
                <div className="devlens-typo-label">FONT SIZE</div>
                <div className="devlens-typo-value">{typography.fontSize}</div>
              </div>
              <div className="devlens-typo-card">
                <div className="devlens-typo-label">FONT WEIGHT</div>
                <div className="devlens-typo-value">{typography.fontWeight}</div>
              </div>
              <div className="devlens-typo-card">
                <div className="devlens-typo-label">LINE HEIGHT</div>
                <div className="devlens-typo-value">{typography.lineHeight}</div>
              </div>
              <div className="devlens-typo-card">
                <div className="devlens-typo-label">LETTER SPACING</div>
                <div className="devlens-typo-value">{typography.letterSpacing || 'normal'}</div>
              </div>
            </div>

            {/* Color Details Grid */}
            <div className="devlens-typo-grid">
              <div
                className="devlens-typo-card"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '10px',
                  minHeight: '52px',
                  padding: '8px 12px'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: typography.color,
                    border: '1px solid var(--dl-border)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="devlens-typo-label" style={{ marginBottom: '2px' }}>TEXT COLOR</div>
                  <div className="devlens-typo-value" style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.2' }}>
                    {typography.color}
                  </div>
                </div>
              </div>

              <div
                className="devlens-typo-card"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '10px',
                  minHeight: '52px',
                  padding: '8px 12px'
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: typography.backgroundColor,
                    border: '1px solid var(--dl-border)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="devlens-typo-label" style={{ marginBottom: '2px' }}>BG COLOR</div>
                  <div className="devlens-typo-value" style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.2' }}>
                    {typography.backgroundColor}
                  </div>
                </div>
              </div>
            </div>

            {/* Text Snippet Sample Preview */}
            {typography.textSnippet && (
              <div>
                <div className="devlens-typo-label" style={{ marginBottom: '6px' }}>
                  SAMPLE TEXT PREVIEW
                </div>
                <div
                  style={{
                    padding: '12px 14px',
                    background: previewBg,
                    borderRadius: '8px',
                    border: '1px solid var(--dl-border)',
                    fontFamily: typography.fontFamily,
                    fontSize: parseInt(typography.fontSize, 10) > 32 ? '28px' : typography.fontSize,
                    fontWeight: typography.fontWeight,
                    lineHeight: '1.3',
                    color: typography.color,
                    maxHeight: '140px',
                    overflowY: 'auto',
                    wordBreak: 'break-word'
                  }}
                >
                  {typography.textSnippet}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                className="devlens-btn devlens-btn-primary"
                onClick={() => copyText(typographyToCssString(typography), 'css')}
                style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600 }}
              >
                {copiedType === 'css' ? <Check size={15} /> : <Copy size={15} />} Copy Typography CSS
              </button>

              <button
                className="devlens-btn devlens-btn-secondary"
                onClick={() => copyText(cssToTailwind({}, typography), 'tailwind')}
                style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600 }}
              >
                {copiedType === 'tailwind' ? <Check size={15} /> : <Copy size={15} />} Copy Tailwind Equivalent
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 8px', color: 'var(--dl-text-muted)', fontSize: '12px' }}>
            Click any text on the page to display its full typography details here.
          </div>
        )}
      </div>
    </div>
  );
};
