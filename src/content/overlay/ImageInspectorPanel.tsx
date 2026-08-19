import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  X,
  Download,
  Copy,
  Check,
  Search,
  AlertTriangle,
  Eye,
  RefreshCw
} from 'lucide-react';

export interface ImageAssetItem {
  id: string;
  src: string;
  alt: string;
  type: 'img' | 'background' | 'svg' | 'canvas';
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  format: string;
  element: HTMLElement;
  hasAlt: boolean;
}

interface ImageInspectorPanelProps {
  onClose: () => void;
}

export const ImageInspectorPanel: React.FC<ImageInspectorPanelProps> = ({ onClose }) => {
  const [images, setImages] = useState<ImageAssetItem[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'missing-alt' | 'img' | 'background' | 'svg'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<ImageAssetItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<ImageAssetItem | null>(null);
  const [, setScrollTick] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectImage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredImages = images.filter((img) => {
    if (filterType === 'missing-alt' && img.hasAlt) return false;
    if (filterType === 'img' && img.type !== 'img') return false;
    if (filterType === 'background' && img.type !== 'background') return false;
    if (filterType === 'svg' && img.type !== 'svg') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return img.src.toLowerCase().includes(q) || img.alt.toLowerCase().includes(q) || img.format.toLowerCase().includes(q);
    }
    return true;
  });

  const missingAltCount = images.filter((img) => img.type === 'img' && !img.hasAlt).length;

  const handleSelectAll = () => {
    if (filteredImages.length > 0 && selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map((i) => i.id)));
    }
  };

  const handleDownloadSelected = () => {
    const itemsToDownload = selectedIds.size > 0
      ? filteredImages.filter((img) => selectedIds.has(img.id))
      : filteredImages;

    itemsToDownload.forEach((img, idx) => {
      setTimeout(() => {
        handleDownload(img);
      }, idx * 250);
    });
  };

  const scanImages = () => {
    setIsScanning(true);
    const discovered: ImageAssetItem[] = [];
    const seenUrls = new Set<string>();
    let idCounter = 1;

    // 1. Scan standard <img> elements
    const imgElements = document.querySelectorAll('img');
    imgElements.forEach((img) => {
      if (img.closest('#devlens-root')) return;
      const src = img.src || img.getAttribute('data-src') || '';
      if (!src) return;

      const alt = img.alt || '';
      const naturalWidth = img.naturalWidth || 0;
      const naturalHeight = img.naturalHeight || 0;
      const rect = img.getBoundingClientRect();
      const extMatch = src.match(/\.(png|jpe?g|webp|gif|svg|avif)/i);
      const format = extMatch ? extMatch[1].toUpperCase() : src.startsWith('data:image/svg') ? 'SVG' : src.startsWith('data:') ? 'DATA' : 'IMAGE';

      discovered.push({
        id: `img-${idCounter++}`,
        src,
        alt,
        type: 'img',
        naturalWidth,
        naturalHeight,
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        format,
        element: img,
        hasAlt: Boolean(alt.trim())
      });
      seenUrls.add(src);
    });

    // 2. Scan background-image CSS properties across elements
    const allNodes = document.querySelectorAll('*');
    allNodes.forEach((node) => {
      if (node.closest('#devlens-root') || !(node instanceof HTMLElement)) return;
      const style = window.getComputedStyle(node);
      const bgImage = style.backgroundImage;

      if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
        const matches = bgImage.match(/url\((['"]?)(.*?)\1\)/g);
        if (matches) {
          matches.forEach((m) => {
            const rawUrl = m.replace(/^url\((['"]?)/, '').replace(/(['"]?)\)$/, '');
            if (rawUrl && !seenUrls.has(rawUrl) && !rawUrl.startsWith('data:image/svg+xml')) {
              try {
                const absUrl = new URL(rawUrl, window.location.href).href;
                const rect = node.getBoundingClientRect();
                const extMatch = absUrl.match(/\.(png|jpe?g|webp|gif|svg|avif)/i);
                const format = extMatch ? extMatch[1].toUpperCase() : 'BG-IMG';

                discovered.push({
                  id: `img-${idCounter++}`,
                  src: absUrl,
                  alt: 'CSS Background Image',
                  type: 'background',
                  naturalWidth: Math.round(rect.width),
                  naturalHeight: Math.round(rect.height),
                  renderedWidth: Math.round(rect.width),
                  renderedHeight: Math.round(rect.height),
                  format,
                  element: node,
                  hasAlt: true
                });
                seenUrls.add(absUrl);
              } catch (_) {}
            }
          });
        }
      }
    });

    // 3. Scan inline SVG elements
    const svgs = document.querySelectorAll('svg');
    svgs.forEach((svg) => {
      if (svg.closest('#devlens-root')) return;
      const rect = svg.getBoundingClientRect();
      const titleEl = svg.querySelector('title');
      const alt = titleEl ? titleEl.textContent || '' : svg.getAttribute('aria-label') || '';
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const src = URL.createObjectURL(svgBlob);

      discovered.push({
        id: `img-${idCounter++}`,
        src,
        alt: alt || 'Inline SVG Vector',
        type: 'svg',
        naturalWidth: Math.round(rect.width),
        naturalHeight: Math.round(rect.height),
        renderedWidth: Math.round(rect.width),
        renderedHeight: Math.round(rect.height),
        format: 'SVG',
        element: svg as unknown as HTMLElement,
        hasAlt: Boolean(alt.trim())
      });
    });

    setImages(discovered);
    setIsScanning(false);
  };

  useEffect(() => {
    scanImages();

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('#devlens-root')) return;

      if (target.tagName.toLowerCase() === 'img') {
        const img = target as HTMLImageElement;
        const rect = img.getBoundingClientRect();
        const extMatch = img.src.match(/\.(png|jpe?g|webp|gif|svg|avif)/i);
        const format = extMatch ? extMatch[1].toUpperCase() : 'IMAGE';
        setHoveredImage({
          id: 'hover-img',
          src: img.src,
          alt: img.alt || '',
          type: 'img',
          naturalWidth: img.naturalWidth || 0,
          naturalHeight: img.naturalHeight || 0,
          renderedWidth: Math.round(rect.width),
          renderedHeight: Math.round(rect.height),
          format,
          element: img,
          hasAlt: Boolean((img.alt || '').trim())
        });
      } else {
        const style = window.getComputedStyle(target);
        if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.includes('url(')) {
          const rect = target.getBoundingClientRect();
          setHoveredImage({
            id: 'hover-bg',
            src: style.backgroundImage.replace(/^url\((['"]?)/, '').replace(/(['"]?)\)$/, ''),
            alt: 'CSS Background Image',
            type: 'background',
            naturalWidth: Math.round(rect.width),
            naturalHeight: Math.round(rect.height),
            renderedWidth: Math.round(rect.width),
            renderedHeight: Math.round(rect.height),
            format: 'BG-IMG',
            element: target,
            hasAlt: true
          });
        }
      }
    };

    const handleScrollOrResize = () => {
      setScrollTick((prev) => prev + 1);
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  const handleHighlightElement = (el: HTMLElement) => {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const originalOutline = el.style.outline;
    const originalTransition = el.style.transition;
    el.style.transition = 'all 0.2s ease';
    el.style.outline = '4px solid #3b82f6';
    el.style.outlineOffset = '2px';

    setTimeout(() => {
      el.style.outline = originalOutline;
      el.style.transition = originalTransition;
    }, 2000);
  };

  const handleDownload = async (img: ImageAssetItem) => {
    const filename = `asset-${img.type}-${Date.now()}.${img.format.toLowerCase()}`;

    // Stage 1: Try Chrome Extension Background Downloads API (Bypasses CORS completely!)
    if (chrome.runtime?.sendMessage) {
      try {
        const response = await new Promise<{ success?: boolean }>((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: 'DOWNLOAD_ASSET',
              payload: { url: img.src, filename }
            },
            (res) => resolve(res || {})
          );
        });
        if (response && response.success) return;
      } catch (_) {}
    }

    // Stage 2: Fetch Blob & Blob URL download trigger
    try {
      const res = await fetch(img.src);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      return;
    } catch (_) {}

    // Stage 3: Canvas redraw to blob fallback for CORS restricted images
    try {
      const imageElement = new Image();
      imageElement.crossOrigin = 'anonymous';
      imageElement.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth || imageElement.width || 300;
        canvas.height = imageElement.naturalHeight || imageElement.height || 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(imageElement, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
            }
          });
        }
      };
      imageElement.src = img.src;
    } catch (_) {}
  };

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '520px',
        maxHeight: 'calc(100vh - 90px)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          <ImageIcon size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Image & Asset Inspector ({images.length})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={scanImages}
            title="Rescan Page Images"
            style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={isScanning ? 'spin' : ''} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="devlens-panel-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Stats & Download All Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--dl-bg)',
            border: '1px solid var(--dl-border)',
            borderRadius: '8px',
            padding: '10px 12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={filteredImages.length > 0 && selectedIds.size === filteredImages.length}
                onChange={handleSelectAll}
                style={{ accentColor: 'var(--dl-primary)', cursor: 'pointer', width: '14px', height: '14px' }}
              />
              <span>Select All ({filteredImages.length})</span>
            </label>
            {selectedIds.size > 0 && (
              <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--dl-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                {selectedIds.size} Selected
              </span>
            )}
            {missingAltCount > 0 && (
              <div style={{ color: '#eab308', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} />
                <span>{missingAltCount} Missing ALT</span>
              </div>
            )}
          </div>
          <button
            onClick={handleDownloadSelected}
            className="devlens-btn devlens-btn-primary"
            style={{ fontSize: '11px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={13} /> {selectedIds.size > 0 ? `Download Selected (${selectedIds.size})` : `Download All (${filteredImages.length})`}
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--dl-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by file URL, ALT text, or format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 30px',
              borderRadius: '6px',
              border: '1px solid var(--dl-border)',
              background: 'var(--dl-bg)',
              color: 'var(--dl-text)',
              fontSize: '11px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${images.length})` },
            { id: 'missing-alt', label: `⚠️ Missing Alt (${missingAltCount})` },
            { id: 'img', label: `IMG (${images.filter((i) => i.type === 'img').length})` },
            { id: 'background', label: `BG Image (${images.filter((i) => i.type === 'background').length})` },
            { id: 'svg', label: `SVG (${images.filter((i) => i.type === 'svg').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: filterType === tab.id ? '1px solid var(--dl-primary)' : '1px solid var(--dl-border)',
                background: filterType === tab.id ? 'var(--dl-primary)' : 'var(--dl-bg)',
                color: filterType === tab.id ? '#ffffff' : 'var(--dl-text-muted)',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Images Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {filteredImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--dl-text-muted)', fontSize: '12px' }}>
              No image assets found matching search criteria.
            </div>
          ) : (
            filteredImages.map((img) => (
              <div
                key={img.id}
                onMouseEnter={() => setHoveredImage(img)}
                onMouseLeave={() => setHoveredImage(null)}
                style={{
                  background: selectedIds.has(img.id) ? 'rgba(59, 130, 246, 0.08)' : 'var(--dl-bg)',
                  border: selectedIds.has(img.id) ? '1px solid var(--dl-primary)' : hoveredImage?.id === img.id ? '1px solid var(--dl-primary)' : '1px solid var(--dl-border)',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Select Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(img.id)}
                  onChange={() => toggleSelectImage(img.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ accentColor: 'var(--dl-primary)', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                  title="Select image for download"
                />
                {/* Thumbnail Preview */}
                <div
                  onClick={() => setSelectedPreview(img)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '6px',
                    border: '1px solid var(--dl-border)',
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Click to view full preview"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: '3px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--dl-primary)'
                      }}
                    >
                      {img.format}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--dl-text-muted)' }}>
                      {img.naturalWidth > 0 ? `${img.naturalWidth}×${img.naturalHeight} px` : 'Vector'}
                      {img.renderedWidth > 0 && ` (Rendered: ${img.renderedWidth}×${img.renderedHeight} px)`}
                    </span>
                  </div>

                  {/* ALT text box */}
                  <div style={{ fontSize: '11px', color: 'var(--dl-text)', wordBreak: 'break-all' }}>
                    {img.type === 'img' && !img.hasAlt ? (
                      <span style={{ color: '#eab308', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={11} /> Missing Alt Text
                      </span>
                    ) : (
                      <span>
                        <strong style={{ color: 'var(--dl-text-muted)', fontSize: '10px' }}>ALT: </strong>
                        {img.alt || 'None'}
                      </span>
                    )}
                  </div>

                  {/* URL Snippet */}
                  <div
                    style={{
                      fontSize: '9px',
                      color: 'var(--dl-text-muted)',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {img.src}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleHighlightElement(img.element)}
                    title="Highlight and Scroll to Image on Webpage"
                    style={{
                      background: 'var(--dl-bg-card)',
                      border: '1px solid var(--dl-border)',
                      borderRadius: '4px',
                      padding: '5px',
                      color: 'var(--dl-text)',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(img.id, img.src)}
                    title="Copy Image URL"
                    style={{
                      background: 'var(--dl-bg-card)',
                      border: '1px solid var(--dl-border)',
                      borderRadius: '4px',
                      padding: '5px',
                      color: copiedId === img.id ? '#10b981' : 'var(--dl-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedId === img.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={() => handleDownload(img)}
                    title="Download Image File"
                    style={{
                      background: 'var(--dl-primary)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px',
                      color: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Preview Overlay */}
      {selectedPreview && (
        <div
          onClick={() => setSelectedPreview(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.75)',
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--dl-bg-card)',
              border: '1px solid var(--dl-border)',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '80vw',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedPreview(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ overflow: 'auto', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
              <img src={selectedPreview.src} alt={selectedPreview.alt} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--dl-text)' }}>
                  {selectedPreview.naturalWidth}×{selectedPreview.naturalHeight} px ({selectedPreview.format})
                </strong>
                <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)' }}>ALT: {selectedPreview.alt || 'None'}</div>
              </div>
              <button
                onClick={() => handleDownload(selectedPreview)}
                className="devlens-btn devlens-btn-primary"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Download Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Webpage Floating Hover Overlay & Tooltip */}
      {hoveredImage && hoveredImage.element && (
        (() => {
          const rect = hoveredImage.element.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return null;
          // Hide overlay if element has scrolled off-screen
          if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
            return null;
          }

          // Calculate smart tooltip positioning to avoid toolbar collision and panel overlap
          let tooltipTop = rect.top - 52;
          if (rect.top < 85) {
            tooltipTop = rect.bottom + 52 < window.innerHeight ? rect.bottom + 8 : rect.top + 10;
          }
          const tooltipLeft = Math.max(10, Math.min(window.innerWidth - 550, rect.left));

          return (
            <React.Fragment>
              {/* Highlight Box - zIndex 2147483500 ensures it stays UNDER DevLens panels/toolbars */}
              <div
                style={{
                  position: 'fixed',
                  left: `${rect.left}px`,
                  top: `${rect.top}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  border: '2px solid #38bdf8',
                  background: 'rgba(56, 189, 248, 0.08)',
                  boxShadow: '0 0 0 1px rgba(56, 189, 248, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)',
                  pointerEvents: 'none',
                  zIndex: 2147483500,
                  borderRadius: '6px',
                  transition: 'all 0.1s ease'
                }}
              />

              {/* Info Tooltip */}
              <div
                style={{
                  position: 'fixed',
                  left: `${tooltipLeft}px`,
                  top: `${tooltipTop}px`,
                  background: 'rgba(15, 23, 42, 0.92)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)',
                  zIndex: 2147483501,
                  fontSize: '11px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  pointerEvents: 'none',
                  maxWidth: '400px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <span style={{ color: '#38bdf8' }}>
                      📐 {hoveredImage.naturalWidth > 0 ? `${hoveredImage.naturalWidth}×${hoveredImage.naturalHeight} px` : 'Vector'}
                    </span>
                    <span style={{ opacity: 0.75, fontSize: '10px' }}>
                      (Rendered: {hoveredImage.renderedWidth}×{hoveredImage.renderedHeight} px)
                    </span>
                    <span style={{ background: '#3b82f6', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 700 }}>
                      {hoveredImage.format}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: hoveredImage.hasAlt ? '#cbd5e1' : '#f59e0b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hoveredImage.hasAlt ? `🏷️ ALT: "${hoveredImage.alt}"` : '⚠️ Missing Alt Text'}
                  </div>
                </div>

                {/* 1-Click Download Button on Hover Tooltip */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(hoveredImage);
                  }}
                  style={{
                    pointerEvents: 'auto',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 9px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title="Download this image directly"
                >
                  <Download size={13} /> Download
                </button>
              </div>
            </React.Fragment>
          );
        })()
      )}
    </div>
  );
};
