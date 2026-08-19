import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  X,
  RotateCw,
  Sparkles,
  Sliders,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Search,
  GripVertical,
  Grid
} from 'lucide-react';

interface ResponsiveModalProps {
  onClose: () => void;
  onSimulatorToggle?: (isActive: boolean) => void;
}

interface DevicePreset {
  name: string;
  category: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
  radius: number;
  dpr: number;
  hasNotch?: boolean;
}

const DEVICE_PRESETS: DevicePreset[] = [
  // Mobile Devices
  { name: 'iPhone 16 / 15 Pro Max', category: 'mobile', width: 430, height: 932, radius: 48, dpr: 3, hasNotch: true },
  { name: 'iPhone 16 / 15 Pro', category: 'mobile', width: 393, height: 852, radius: 44, dpr: 3, hasNotch: true },
  { name: 'iPhone 14 / 13 Pro', category: 'mobile', width: 390, height: 844, radius: 40, dpr: 3, hasNotch: true },
  { name: 'iPhone SE (3rd Gen)', category: 'mobile', width: 375, height: 667, radius: 24, dpr: 2, hasNotch: false },
  { name: 'Google Pixel 8 Pro', category: 'mobile', width: 412, height: 915, radius: 40, dpr: 3.5, hasNotch: true },
  { name: 'Google Pixel 7a', category: 'mobile', width: 412, height: 915, radius: 36, dpr: 2.7, hasNotch: true },
  { name: 'Samsung Galaxy S24 Ultra', category: 'mobile', width: 412, height: 915, radius: 40, dpr: 3.5, hasNotch: true },
  { name: 'Samsung Galaxy S24', category: 'mobile', width: 360, height: 780, radius: 36, dpr: 3, hasNotch: true },
  { name: 'Galaxy Z Fold 5 (Cover)', category: 'mobile', width: 374, height: 902, radius: 32, dpr: 3, hasNotch: true },

  // Tablets & Foldables
  { name: 'Galaxy Z Fold 5 (Unfolded)', category: 'tablet', width: 904, height: 968, radius: 24, dpr: 3, hasNotch: false },
  { name: 'iPad Pro 12.9"', category: 'tablet', width: 1024, height: 1366, radius: 24, dpr: 2, hasNotch: false },
  { name: 'iPad Pro 11"', category: 'tablet', width: 834, height: 1194, radius: 24, dpr: 2, hasNotch: false },
  { name: 'iPad Air (5th Gen)', category: 'tablet', width: 820, height: 1180, radius: 20, dpr: 2, hasNotch: false },
  { name: 'iPad Mini (6th Gen)', category: 'tablet', width: 744, height: 1133, radius: 18, dpr: 2, hasNotch: false },
  { name: 'Surface Pro 9', category: 'tablet', width: 912, height: 1368, radius: 16, dpr: 2, hasNotch: false },
  { name: 'Samsung Galaxy Tab S9', category: 'tablet', width: 800, height: 1280, radius: 16, dpr: 2.5, hasNotch: false },

  // Laptops & Desktops
  { name: 'MacBook Air 13" (M2/M3)', category: 'desktop', width: 1280, height: 832, radius: 14, dpr: 2, hasNotch: false },
  { name: 'MacBook Pro 14"', category: 'desktop', width: 1512, height: 982, radius: 14, dpr: 2, hasNotch: false },
  { name: 'MacBook Pro 16"', category: 'desktop', width: 1728, height: 1117, radius: 14, dpr: 2, hasNotch: false },
  { name: 'Laptop HD (1366×768)', category: 'desktop', width: 1366, height: 768, radius: 8, dpr: 1, hasNotch: false },
  { name: 'Desktop Full HD (1080p)', category: 'desktop', width: 1920, height: 1080, radius: 8, dpr: 1, hasNotch: false },
  { name: 'Desktop 2K QHD (1440p)', category: 'desktop', width: 2560, height: 1440, radius: 6, dpr: 1, hasNotch: false },
  { name: 'Desktop 4K UHD (2160p)', category: 'desktop', width: 3840, height: 2160, radius: 4, dpr: 2, hasNotch: false },
  { name: 'UltraWide (3440×1440)', category: 'desktop', width: 3440, height: 1440, radius: 4, dpr: 1, hasNotch: false }
];

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({ onClose, onSimulatorToggle }) => {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[1]); // Default iPhone 16/15 Pro
  const [customWidth, setCustomWidth] = useState<number>(393);
  const [customHeight, setCustomHeight] = useState<number>(852);
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'mobile' | 'tablet' | 'desktop'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Top Control Bar Drag Position State
  const [topBarPos, setTopBarPos] = useState<{ x: number; y: number }>(() => {
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    return { x: Math.max(10, Math.round((screenW - 740) / 2)), y: 16 };
  });

  const [isDraggingTopBar, setIsDraggingTopBar] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const activeWidth = isLandscape ? customHeight : customWidth;
  const activeHeight = isLandscape ? customWidth : customHeight;

  // Notify parent overlay when simulator activates/deactivates
  useEffect(() => {
    onSimulatorToggle?.(isSimulatorActive);
  }, [isSimulatorActive, onSimulatorToggle]);

  // Handle Dragging for Top Bar
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDraggingTopBar(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: topBarPos.x,
      initialY: topBarPos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTopBar) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, dragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 60, dragStartRef.current.initialY + dy));
      setTopBarPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingTopBar(false);
    };

    if (isDraggingTopBar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTopBar]);

  // Auto-calculate scale to fit within browser window comfortably
  const autoScale = React.useMemo(() => {
    const availableW = window.innerWidth - 100;
    const availableH = window.innerHeight - 140;
    const scaleX = availableW / activeWidth;
    const scaleY = availableH / activeHeight;
    const fit = Math.min(scaleX, scaleY, 1);
    return Math.max(fit, 0.22);
  }, [activeWidth, activeHeight]);

  const effectiveScale = manualScale !== null ? manualScale : autoScale;

  const filteredPresets = DEVICE_PRESETS.filter((preset) => {
    const matchesCategory = categoryFilter === 'all' || preset.category === categoryFilter;
    const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase()) || `${preset.width}`.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const handleClose = () => {
    setIsSimulatorActive(false);
    onClose();
  };

  const applyPreset = (preset: DevicePreset) => {
    setSelectedDevice(preset);
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
    setManualScale(null);
    setIsSimulatorActive(true);
  };

  const reloadIframe = () => {
    setIframeKey((prev) => prev + 1);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mobile':
        return <Smartphone size={14} />;
      case 'tablet':
        return <Tablet size={14} />;
      case 'desktop':
        return <Laptop size={14} />;
      default:
        return <Monitor size={14} />;
    }
  };

  return (
    <>
      {/* Active Device Viewport Simulator */}
      {isSimulatorActive && (
        <>
          {/* Draggable Top Control Bar */}
          <div
            style={{
              position: 'fixed',
              left: `${topBarPos.x}px`,
              top: `${topBarPos.y}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '6px 14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
              zIndex: 2147483647,
              pointerEvents: 'auto',
              color: '#f8fafc',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              userSelect: 'none',
              cursor: isDraggingTopBar ? 'grabbing' : 'default'
            }}
          >
            {/* Drag Handle */}
            <div
              onMouseDown={handleDragStart}
              style={{
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
                padding: '4px 2px',
                borderRadius: '4px'
              }}
              title="Drag control bar anywhere"
            >
              <GripVertical size={16} />
            </div>

            {/* Active Device Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center' }}>
                {getCategoryIcon(selectedDevice.category)}
              </span>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>
                {selectedDevice.name}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                {activeWidth} × {activeHeight} px
              </span>
            </div>

            <div style={{ width: '1px', height: '18px', background: '#334155' }} />

            {/* Orientation Toggle */}
            <button
              onClick={() => setIsLandscape(!isLandscape)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isLandscape ? '#2563eb' : '#1e293b',
                color: '#ffffff',
                border: '1px solid #334155',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Toggle Portrait / Landscape"
            >
              <RotateCw size={13} /> {isLandscape ? 'Landscape' : 'Portrait'}
            </button>

            {/* Device Preset Selector */}
            <select
              value={selectedDevice.name}
              onChange={(e) => {
                const p = DEVICE_PRESETS.find((d) => d.name === e.target.value);
                if (p) applyPreset(p);
              }}
              style={{
                background: '#1e293b',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                maxWidth: '180px'
              }}
            >
              {DEVICE_PRESETS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.width}×{d.height})
                </option>
              ))}
            </select>

            <div style={{ width: '1px', height: '18px', background: '#334155' }} />

            {/* Scale Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setManualScale(Math.max(0.2, effectiveScale - 0.05))}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#ffffff', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                title="Zoom Out"
              >
                <ZoomOut size={12} />
              </button>
              <span style={{ fontSize: '11px', minWidth: '38px', textAlign: 'center', fontWeight: 600, color: '#cbd5e1' }}>
                {Math.round(effectiveScale * 100)}%
              </span>
              <button
                onClick={() => setManualScale(Math.min(1.5, effectiveScale + 0.05))}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#ffffff', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                title="Zoom In"
              >
                <ZoomIn size={12} />
              </button>
              <button
                onClick={() => setManualScale(null)}
                style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                title="Reset Fit to Window"
              >
                Fit
              </button>
            </div>

            {/* Grid Overlay Toggle */}
            <button
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              style={{
                background: showGridOverlay ? '#2563eb' : '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '5px 8px',
                cursor: 'pointer'
              }}
              title="Toggle Alignment Grid Overlay"
            >
              <Grid size={13} />
            </button>

            {/* Reload Iframe */}
            <button
              onClick={reloadIframe}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#ffffff', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
              title="Reload Viewport"
            >
              <RefreshCw size={13} />
            </button>

            <div style={{ width: '1px', height: '18px', background: '#334155' }} />

            {/* Exit Button */}
            <button
              onClick={handleClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <X size={14} /> Exit
            </button>
          </div>

          {/* Full Screen Device Sandbox */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: '#080c14',
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              zIndex: 2147483645,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              pointerEvents: 'auto'
            }}
          >
            {/* Device Hardware Frame */}
            <div
              style={{
                width: `${activeWidth}px`,
                height: `${activeHeight}px`,
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'center center',
                borderRadius: `${selectedDevice.radius}px`,
                boxShadow: '0 0 0 10px #1e293b, 0 0 0 12px #334155, 0 30px 90px -15px rgba(0, 0, 0, 0.95)',
                background: '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                transition: 'width 0.25s ease, height 0.25s ease, transform 0.25s ease, border-radius 0.25s ease'
              }}
            >
              {/* Hardware Notch / Dynamic Island */}
              {selectedDevice.hasNotch && !isLandscape && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: activeWidth < 400 ? '90px' : '110px',
                    height: '24px',
                    background: '#000000',
                    borderRadius: '16px',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '10px'
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a0a20', border: '1px solid #1e293b' }} />
                </div>
              )}

              {/* Optional Alignment Grid Overlay */}
              {showGridOverlay && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(to right, rgba(59, 130, 246, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.15) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    zIndex: 9,
                    pointerEvents: 'none'
                  }}
                />
              )}

              {/* Viewport Iframe */}
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={currentUrl}
                title="Responsive Viewport"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: `${selectedDevice.radius}px`,
                  background: '#ffffff'
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Control Panel Launcher Modal (Shown when simulator is inactive) */}
      {!isSimulatorActive && (
        <div
          className="devlens-panel"
          style={{
            right: '20px',
            top: '70px',
            width: '420px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto'
          }}
        >
          <div className="devlens-panel-header">
            <div className="devlens-panel-title">
              <Smartphone size={16} style={{ color: 'var(--dl-primary)' }} />
              <span>Responsive Viewport Studio ({DEVICE_PRESETS.length} Screens)</span>
            </div>
            <button
              onClick={handleClose}
              style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {/* Custom Resolution Inputs */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sliders size={12} /> CUSTOM DIMENSIONS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <div className="devlens-typo-label">WIDTH (PX)</div>
                  <input
                    type="number"
                    className="devlens-input"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 320)}
                  />
                </div>
                <div>
                  <div className="devlens-typo-label">HEIGHT (PX)</div>
                  <input
                    type="number"
                    className="devlens-input"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 568)}
                  />
                </div>
              </div>
            </div>

            <button
              className="devlens-btn devlens-btn-primary"
              onClick={() => setIsSimulatorActive(true)}
              style={{ padding: '10px', fontWeight: 700 }}
            >
              <Sparkles size={16} /> Launch Viewport Studio ({activeWidth} × {activeHeight} px)
            </button>

            {/* Search Bar & Category Filter Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--dl-bg-secondary)', padding: '4px', borderRadius: '8px' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Search size={12} style={{ position: 'absolute', left: '8px', color: 'var(--dl-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search device screens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="devlens-input"
                    style={{ paddingLeft: '26px', fontSize: '11px', height: '28px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {(['all', 'mobile', 'tablet', 'desktop'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`devlens-btn ${categoryFilter === cat ? 'devlens-btn-primary' : 'devlens-btn-secondary'}`}
                    style={{
                      textTransform: 'capitalize',
                      fontSize: '11px',
                      padding: '4px 10px',
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Device Presets Grid */}
            <div>
              <div className="devlens-typo-label" style={{ marginBottom: '6px' }}>
                DEVICE PRESETS ({filteredPresets.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
                {filteredPresets.map((p) => {
                  const isActive = selectedDevice.name === p.name;
                  return (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isActive ? '1px solid var(--dl-primary)' : '1px solid var(--dl-border)',
                        background: isActive ? 'var(--dl-primary)' : 'var(--dl-bg)',
                        color: isActive ? '#ffffff' : 'var(--dl-text)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getCategoryIcon(p.category)} {p.name}
                      </span>
                      <span style={{ opacity: 0.7, fontSize: '10px', flexShrink: 0, marginLeft: '4px' }}>{p.width}px</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
