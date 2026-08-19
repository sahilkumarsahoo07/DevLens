import React, { useState, useEffect } from 'react';
import { ColorInfo, PickedColorHistory } from '../../shared/types';
import { parseColor, getContrastRatio, extractPageColors } from '../../shared/utils/colorUtils';
import { getColorHistory, addColorHistory } from '../../shared/utils/storageUtils';
import { Palette, X, Copy, Check, Eye, CheckCircle } from 'lucide-react';

interface ColorPickerOverlayProps {
  onClose: () => void;
}

export const ColorPickerOverlay: React.FC<ColorPickerOverlayProps> = ({ onClose }) => {
  const [currentColor, setCurrentColor] = useState<ColorInfo | null>(
    parseColor('#2563EB')
  );
  const [bgColor] = useState<ColorInfo | null>(
    parseColor('#FFFFFF')
  );
  const [history, setHistory] = useState<PickedColorHistory[]>([]);
  const [pageColors, setPageColors] = useState<ColorInfo[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [autoCopyMessage, setAutoCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    getColorHistory().then(setHistory);
    setPageColors(extractPageColors(12));
  }, []);

  const triggerAutoCopyHex = (hexCode: string) => {
    navigator.clipboard.writeText(hexCode);
    setCopiedKey('HEX');
    setAutoCopyMessage(`HEX ${hexCode.toUpperCase()} copied to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
      setAutoCopyMessage(null);
    }, 2000);
  };

  const handlePickNativeColor = async () => {
    const win = window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } };
    if (win.EyeDropper) {
      try {
        const eyeDropper = new win.EyeDropper();
        const result = await eyeDropper.open();
        const parsed = parseColor(result.sRGBHex);
        if (parsed) {
          setCurrentColor(parsed);
          const historyItem: PickedColorHistory = { color: parsed, timestamp: Date.now() };
          await addColorHistory(historyItem);
          setHistory((prev) => [historyItem, ...prev]);

          // Automatically copy HEX code to clipboard as requested
          triggerAutoCopyHex(parsed.hex);
        }
      } catch (e) {
        console.warn('EyeDropper canceled or unsupported', e);
      }
    } else {
      alert('Native EyeDropper API is not supported in this browser version.');
    }
  };

  const selectColor = (c: ColorInfo) => {
    setCurrentColor(c);
    triggerAutoCopyHex(c.hex);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const contrast = currentColor && bgColor ? getContrastRatio(currentColor, bgColor) : null;

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '360px'
      }}
    >
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          <Palette size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Color Picker & Contrast Checker</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Auto Copy Confirmation Toast Banner */}
        {autoCopyMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--dl-success)',
              color: 'var(--dl-success)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle size={14} /> {autoCopyMessage}
          </div>
        )}

        {/* EyeDropper Button & Color Preview */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: currentColor?.hex || '#2563eb',
              border: '2px solid var(--dl-border)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1 }}>
            <button
              className="devlens-btn devlens-btn-primary"
              onClick={handlePickNativeColor}
              style={{ width: '100%', padding: '8px' }}
            >
              <Eye size={16} /> Pick Color (Auto-Copies HEX)
            </button>
          </div>
        </div>

        {/* Color Formats */}
        {currentColor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'HEX', val: currentColor.hex },
              { label: 'RGB', val: currentColor.rgb },
              { label: 'HSL', val: currentColor.hsl }
            ].map((fmt) => (
              <div
                key={fmt.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--dl-bg)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: 'var(--dl-text-muted)', fontWeight: 600, fontSize: '10px' }}>
                  {fmt.label}
                </span>
                <span style={{ fontWeight: fmt.label === 'HEX' ? 700 : 400 }}>{fmt.val}</span>
                <button
                  className="devlens-btn devlens-btn-secondary"
                  onClick={() => copyToClipboard(fmt.val, fmt.label)}
                  style={{ padding: '2px 6px' }}
                >
                  {copiedKey === fmt.label ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* WCAG Contrast Checker Section */}
        {contrast && currentColor && bgColor && (
          <div style={{ background: 'var(--dl-bg)', padding: '10px', borderRadius: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dl-text-muted)' }}>
                WCAG CONTRAST RATIO
              </span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dl-primary)' }}>
                {contrast.ratio} : 1
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
              <div
                style={{
                  padding: '4px 6px',
                  borderRadius: '4px',
                  background: contrast.wcagAA ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: contrast.wcagAA ? 'var(--dl-success)' : 'var(--dl-danger)',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                AA Normal ({contrast.wcagAA ? 'PASS' : 'FAIL'})
              </div>
              <div
                style={{
                  padding: '4px 6px',
                  borderRadius: '4px',
                  background: contrast.wcagAALarge ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: contrast.wcagAALarge ? 'var(--dl-success)' : 'var(--dl-danger)',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                AA Large ({contrast.wcagAALarge ? 'PASS' : 'FAIL'})
              </div>
              <div
                style={{
                  padding: '4px 6px',
                  borderRadius: '4px',
                  background: contrast.wcagAAA ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: contrast.wcagAAA ? 'var(--dl-success)' : 'var(--dl-danger)',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                AAA Normal ({contrast.wcagAAA ? 'PASS' : 'FAIL'})
              </div>
              <div
                style={{
                  padding: '4px 6px',
                  borderRadius: '4px',
                  background: contrast.wcagAAALarge ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: contrast.wcagAAALarge ? 'var(--dl-success)' : 'var(--dl-danger)',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                AAA Large ({contrast.wcagAAALarge ? 'PASS' : 'FAIL'})
              </div>
            </div>
          </div>
        )}

        {/* Page Color Palette Extraction */}
        {pageColors.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', marginBottom: '6px' }}>
              PAGE EXTRACTED PALETTE (CLICK TO COPY HEX)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {pageColors.map((c) => (
                <div
                  key={c.hex}
                  onClick={() => selectColor(c)}
                  title={`Click to copy ${c.hex}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: c.hex,
                    cursor: 'pointer',
                    border: '1px solid var(--dl-border)'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', marginBottom: '6px' }}>
              RECENTLY PICKED COLORS (CLICK TO COPY HEX)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  onClick={() => selectColor(h.color)}
                  title={`Click to copy ${h.color.hex}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: h.color.hex,
                    cursor: 'pointer',
                    border: '1px solid var(--dl-border)'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
