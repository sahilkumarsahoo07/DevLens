import React, { useState, useEffect } from 'react';
import { ScreenshotMode, ScreenshotFormat, ScreenshotHistoryItem } from '../../shared/types';
import { getScreenshotHistory, addScreenshotHistory, removeScreenshotHistoryItem, clearScreenshotHistory } from '../../shared/utils/storageUtils';
import { Camera, Maximize2, Crop, Square, X, Download, Copy, Check, History, Trash2 } from 'lucide-react';

interface ScreenshotModalProps {
  onClose: () => void;
  onTriggerCapture: (mode: ScreenshotMode, format: ScreenshotFormat) => void;
  capturedDataUrl: string | null;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  onClose,
  onTriggerCapture,
  capturedDataUrl
}) => {
  const [mode, setMode] = useState<ScreenshotMode>('visible');
  const [format, setFormat] = useState<ScreenshotFormat>('png');
  const [history, setHistory] = useState<ScreenshotHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(capturedDataUrl);

  useEffect(() => {
    getScreenshotHistory().then(setHistory);
  }, []);

  useEffect(() => {
    if (capturedDataUrl) {
      setPreviewUrl(capturedDataUrl);
      const newItem: ScreenshotHistoryItem = {
        id: `shot-${Date.now()}`,
        dataUrl: capturedDataUrl,
        mode,
        format,
        dimensions: { width: window.innerWidth, height: window.innerHeight },
        timestamp: Date.now(),
        filename: `devlens-shot-${Date.now()}.${format}`
      };
      addScreenshotHistory(newItem).then(() => {
        getScreenshotHistory().then(setHistory);
      });
    }
  }, [capturedDataUrl]);


  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  const handleCopyClipboard = async (dataUrl: string) => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      alert('Copying image to clipboard failed in this context.');
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await removeScreenshotHistoryItem(id);
    setHistory(updated);
    if (history.find((h) => h.id === id)?.dataUrl === previewUrl) {
      setPreviewUrl(updated.length > 0 ? updated[0].dataUrl : null);
    }
  };

  const handleClearAll = async () => {
    await clearScreenshotHistory();
    setHistory([]);
    setPreviewUrl(null);
  };

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '400px'
      }}
    >
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          <Camera size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Screenshot Toolkit</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Modes Grid */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', marginBottom: '6px' }}>
            CAPTURE MODE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[
              { id: 'visible', label: 'Visible Area', icon: <Camera size={14} /> },
              { id: 'full', label: 'Full Page', icon: <Maximize2 size={14} /> },
              { id: 'area', label: 'Area Selection', icon: <Crop size={14} /> },
              { id: 'element', label: 'Element Capture', icon: <Square size={14} /> }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  const targetMode = m.id as ScreenshotMode;
                  setMode(targetMode);
                  onTriggerCapture(targetMode, format);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: mode === m.id ? '1px solid var(--dl-primary)' : '1px solid var(--dl-border)',
                  background: mode === m.id ? 'var(--dl-primary)' : 'var(--dl-bg)',
                  color: mode === m.id ? '#ffffff' : 'var(--dl-text)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)' }}>FORMAT:</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--dl-border)',
                  background: format === fmt ? 'var(--dl-primary)' : 'var(--dl-bg)',
                  color: format === fmt ? '#ffffff' : 'var(--dl-text)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Section */}
        {previewUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)' }}>LATEST PREVIEW</div>
            <div
              style={{
                border: '1px solid var(--dl-border)',
                borderRadius: '6px',
                overflow: 'hidden',
                maxHeight: '160px',
                background: 'var(--dl-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img src={previewUrl} alt="Screenshot Preview" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="devlens-btn devlens-btn-secondary"
                onClick={() => handleCopyClipboard(previewUrl)}
                style={{ flex: 1 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
              <button
                className="devlens-btn devlens-btn-primary"
                onClick={() => handleDownload(previewUrl, `devlens-${Date.now()}.${format}`)}
                style={{ flex: 1 }}
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        )}

        {/* Screenshot History with Delete X buttons */}
        {history.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <History size={12} /> RECENT SCREENSHOTS
              </span>
              <button
                onClick={handleClearAll}
                style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                title="Clear all screenshot history"
              >
                <Trash2 size={10} /> Clear
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    cursor: 'pointer'
                  }}
                  onClick={() => setPreviewUrl(item.dataUrl)}
                >
                  <img
                    src={item.dataUrl}
                    alt={item.filename}
                    style={{
                      width: '64px',
                      height: '44px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: previewUrl === item.dataUrl ? '2px solid var(--dl-primary)' : '1px solid var(--dl-border)',
                      display: 'block'
                    }}
                  />
                  {/* Delete X Button on Thumbnail */}
                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    title="Remove Screenshot"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      zIndex: 10
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

