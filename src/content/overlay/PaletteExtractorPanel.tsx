import React, { useState, useEffect } from 'react';
import { Palette, Check, Sliders, X, Sparkles, Code } from 'lucide-react';

interface PaletteExtractorPanelProps {
  onClose: () => void;
}

interface ColorSwatch {
  hex: string;
  count: number;
  type: 'bg' | 'text' | 'accent' | 'border';
}

export const PaletteExtractorPanel: React.FC<PaletteExtractorPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'palette' | 'css-editor'>('palette');
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Live CSS Editor State
  const [selectedTarget, setSelectedTarget] = useState<HTMLElement | null>(null);
  const [cssProps, setCssProps] = useState({
    fontSize: '16px',
    color: '#000000',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    padding: '8px',
    opacity: '1'
  });
  const [copiedCss, setCopiedCss] = useState(false);

  // Scan webpage colors
  useEffect(() => {
    const colorMap: Record<string, { count: number; type: 'bg' | 'text' | 'accent' | 'border' }> = {};

    const rgbToHex = (rgbStr: string): string | null => {
      const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
      if (!match) return null;
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
      if (a === 0) return null; // Transparent

      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    };

    const elements = Array.from(document.querySelectorAll('*')).slice(0, 300);
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);

      const bgHex = rgbToHex(style.backgroundColor);
      if (bgHex && bgHex !== '#FFFFFF' && bgHex !== '#000000') {
        colorMap[bgHex] = { count: (colorMap[bgHex]?.count || 0) + 1, type: 'bg' };
      }

      const textHex = rgbToHex(style.color);
      if (textHex) {
        colorMap[textHex] = { count: (colorMap[textHex]?.count || 0) + 1, type: 'text' };
      }

      const borderHex = rgbToHex(style.borderColor);
      if (borderHex && style.borderWidth !== '0px') {
        colorMap[borderHex] = { count: (colorMap[borderHex]?.count || 0) + 1, type: 'border' };
      }
    });

    const list: ColorSwatch[] = Object.entries(colorMap)
      .map(([hex, info]) => ({ hex, count: info.count, type: info.type }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);

    setSwatches(list);
  }, []);

  // Element picker for Live CSS Editor
  const handleSelectElementToEdit = () => {
    const handlePick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('#devlens-root')) return;

      e.preventDefault();
      e.stopPropagation();

      setSelectedTarget(target);
      const style = window.getComputedStyle(target);
      setCssProps({
        fontSize: style.fontSize,
        color: rgbToHexStr(style.color),
        backgroundColor: rgbToHexStr(style.backgroundColor),
        borderRadius: style.borderRadius,
        padding: style.padding,
        opacity: style.opacity
      });

      window.removeEventListener('click', handlePick, true);
    };

    window.addEventListener('click', handlePick, true);
  };

  const rgbToHexStr = (rgbStr: string): string => {
    const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#3b82f6';
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const applyLiveStyle = (key: string, value: string) => {
    setCssProps((prev) => ({ ...prev, [key]: value }));
    if (selectedTarget) {
      (selectedTarget.style as any)[key] = value;
    }
  };

  const copySwatchHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const copyCssRules = () => {
    const cssText = `font-size: ${cssProps.fontSize};\ncolor: ${cssProps.color};\nbackground-color: ${cssProps.backgroundColor};\nborder-radius: ${cssProps.borderRadius};\npadding: ${cssProps.padding};\nopacity: ${cssProps.opacity};`;
    navigator.clipboard.writeText(cssText);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 1500);
  };

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '440px',
        maxHeight: '85vh',
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        border: '1px solid var(--dl-border)',
        borderRadius: '12px'
      }}
    >
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          <Palette size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Color Palette & Live CSS Editor</span>
        </div>
        <button onClick={onClose} className="devlens-tool-btn" title="Close">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--dl-border)', background: 'var(--dl-bg-card)' }}>
        <button
          onClick={() => setActiveTab('palette')}
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '12px',
            fontWeight: 600,
            color: activeTab === 'palette' ? 'var(--dl-primary)' : 'var(--dl-text-muted)',
            borderBottom: activeTab === 'palette' ? '2px solid var(--dl-primary)' : 'none',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={14} /> Color Palette Scanner
        </button>

        <button
          onClick={() => setActiveTab('css-editor')}
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '12px',
            fontWeight: 600,
            color: activeTab === 'css-editor' ? 'var(--dl-primary)' : 'var(--dl-text-muted)',
            borderBottom: activeTab === 'css-editor' ? '2px solid var(--dl-primary)' : 'none',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Sliders size={14} /> Live CSS Editor
        </button>
      </div>

      <div className="devlens-panel-body">
        {activeTab === 'palette' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11px',
                color: 'var(--dl-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} style={{ color: 'var(--dl-primary)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--dl-primary)' }}>Color Palette Extractor</strong>
                <div style={{ color: 'var(--dl-text-muted)', fontSize: '10px', marginTop: '1px' }}>
                  Auto-scanned current webpage for background, text & accent swatches. Click any color box to copy HEX code!
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', fontWeight: 600, marginTop: '2px' }}>
              Discovered {swatches.length} Page Color Swatches:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {swatches.map((swatch, idx) => (
                <button
                  key={idx}
                  onClick={() => copySwatchHex(swatch.hex)}
                  style={{
                    background: 'var(--dl-bg)',
                    border: '1px solid var(--dl-border)',
                    borderRadius: '8px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  title="Click to copy HEX"
                >
                  <div
                    style={{
                      width: '100%',
                      height: '32px',
                      borderRadius: '6px',
                      background: swatch.hex,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  />
                  <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--dl-text)' }}>
                    {copiedHex === swatch.hex ? <Check size={11} style={{ color: '#10b981' }} /> : swatch.hex}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11px',
                color: 'var(--dl-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sliders size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#10b981' }}>Live Element Style Inspector</strong>
                <div style={{ color: 'var(--dl-text-muted)', fontSize: '10px', marginTop: '1px' }}>
                  Pick any element on the live webpage to tweak colors, font size, background & borders in real-time.
                </div>
              </div>
            </div>

            <button
              onClick={handleSelectElementToEdit}
              className="devlens-btn devlens-btn-primary"
              style={{ width: '100%', padding: '10px', fontWeight: 600 }}
            >
              🎯 Step 1: Click Here, Then Select Webpage Element
            </button>

            {selectedTarget ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dl-text-muted)' }}>
                  Editing: <code style={{ color: 'var(--dl-primary)' }}>&lt;{selectedTarget.tagName.toLowerCase()}&gt;</code>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dl-text-muted)' }}>Text Color</label>
                    <input
                      type="color"
                      value={cssProps.color}
                      onChange={(e) => applyLiveStyle('color', e.target.value)}
                      style={{ width: '100%', height: '32px', border: '1px solid var(--dl-border)', borderRadius: '6px', cursor: 'pointer' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dl-text-muted)' }}>Background</label>
                    <input
                      type="color"
                      value={cssProps.backgroundColor}
                      onChange={(e) => applyLiveStyle('backgroundColor', e.target.value)}
                      style={{ width: '100%', height: '32px', border: '1px solid var(--dl-border)', borderRadius: '6px', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dl-text-muted)' }}>Font Size: {cssProps.fontSize}</label>
                  <input
                    type="text"
                    className="devlens-input"
                    value={cssProps.fontSize}
                    onChange={(e) => applyLiveStyle('fontSize', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dl-text-muted)' }}>Border Radius: {cssProps.borderRadius}</label>
                  <input
                    type="text"
                    className="devlens-input"
                    value={cssProps.borderRadius}
                    onChange={(e) => applyLiveStyle('borderRadius', e.target.value)}
                  />
                </div>

                <button onClick={copyCssRules} className="devlens-btn devlens-btn-secondary" style={{ width: '100%' }}>
                  {copiedCss ? <Check size={14} style={{ color: '#10b981' }} /> : <Code size={14} />} Copy Modified CSS Rules
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--dl-text-muted)', padding: '20px', fontSize: '12px' }}>
                👉 Click the button above, then click any text or element on the webpage to tweak its CSS live!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
