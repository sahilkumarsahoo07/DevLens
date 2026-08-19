import React, { useState, useEffect } from 'react';
import { Ruler, X, Copy, Check, Pin, Trash2, Crosshair, Box, Grid, Eye, EyeOff } from 'lucide-react';

interface MeasurementOverlayProps {
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface MeasurementPin {
  id: string;
  start: Point; // Document page coordinates
  end: Point;   // Document page coordinates
  dx: number;
  dy: number;
  distance: number;
  angle: number;
}

interface HoverElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
  tagName: string;
}

export const MeasurementOverlay: React.FC<MeasurementOverlayProps> = ({ onClose }) => {
  const [startPoint, setStartPoint] = useState<Point | null>(null); // Document page coordinates
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null); // Document page coordinates
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 }); // Viewport relative
  const [scrollPos, setScrollPos] = useState<Point>({
    x: typeof window !== 'undefined' ? window.scrollX : 0,
    y: typeof window !== 'undefined' ? window.scrollY : 0
  });
  const [hoverRect, setHoverRect] = useState<HoverElementRect | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [pins, setPins] = useState<MeasurementPin[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [unitFormat, setUnitFormat] = useState<'px' | 'rem' | 'em'>('px');

  // Blueprint Graph Grid Controls
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [gridSize, setGridSize] = useState<number>(10);
  const [gridColor, setGridColor] = useState<'red' | 'cyan' | 'emerald' | 'white'>('red');

  // Prevent native page text selection while Measurement tool is active
  useEffect(() => {
    const prevUserSelect = document.body.style.userSelect;
    const prevWebkitUserSelect = document.body.style.webkitUserSelect;

    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    const blockSelect = (e: Event) => {
      e.preventDefault();
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    };

    window.addEventListener('selectstart', blockSelect);

    return () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.webkitUserSelect = prevWebkitUserSelect;
      window.removeEventListener('selectstart', blockSelect);
    };
  }, []);

  // Track scroll position to keep document measurements attached to content
  useEffect(() => {
    const handleScroll = () => {
      setScrollPos({
        x: window.scrollX,
        y: window.scrollY
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });

      // Clear any text selection while dragging measurement box
      if (isMeasuring) {
        if (window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
      }

      // If not measuring, detect hover element box
      if (!isMeasuring) {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        if (target && !target.closest('#devlens-root')) {
          const r = target.getBoundingClientRect();
          setHoverRect({
            x: r.left,
            y: r.top,
            width: Math.round(r.width),
            height: Math.round(r.height),
            tagName: target.tagName.toLowerCase()
          });
        } else {
          setHoverRect(null);
        }
      } else if (startPoint) {
        setCurrentPoint({
          x: e.clientX + window.scrollX,
          y: e.clientY + window.scrollY
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Ignore clicks inside DevLens UI
      const target = e.target as HTMLElement;
      if (target?.closest('#devlens-root')) return;

      // Prevent native text selection trigger
      e.preventDefault();
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }

      const docX = e.clientX + window.scrollX;
      const docY = e.clientY + window.scrollY;

      if (!isMeasuring) {
        setStartPoint({ x: docX, y: docY });
        setCurrentPoint({ x: docX, y: docY });
        setIsMeasuring(true);
        setHoverRect(null);
      } else {
        // Lock measurement into a pin if box dimensions > 3px
        if (startPoint && currentPoint) {
          const dx = Math.abs(currentPoint.x - startPoint.x);
          const dy = Math.abs(currentPoint.y - startPoint.y);
          const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
          const rad = Math.atan2(currentPoint.y - startPoint.y, currentPoint.x - startPoint.x);
          const angle = Math.round((rad * 180) / Math.PI);

          if (dx > 3 || dy > 3) {
            const newPin: MeasurementPin = {
              id: `pin-${Date.now()}`,
              start: startPoint,
              end: currentPoint,
              dx,
              dy,
              distance,
              angle
            };
            setPins((prev) => [newPin, ...prev].slice(0, 5));
          }
        }
        setIsMeasuring(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };

  }, [isMeasuring, startPoint, currentPoint]);

  // Convert document coordinates to fixed viewport coordinates for SVG rendering
  const toScreen = (pt: Point | null): Point => {
    if (!pt) return { x: 0, y: 0 };
    return {
      x: pt.x - scrollPos.x,
      y: pt.y - scrollPos.y
    };
  };

  // Active measurement calculations
  const dx = startPoint && currentPoint ? Math.abs(Math.round(currentPoint.x - startPoint.x)) : 0;
  const dy = startPoint && currentPoint ? Math.abs(Math.round(currentPoint.y - startPoint.y)) : 0;
  const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
  const angleRad = startPoint && currentPoint ? Math.atan2(currentPoint.y - startPoint.y, currentPoint.x - startPoint.x) : 0;
  const angleDeg = Math.round((angleRad * 180) / Math.PI);

  const formatValue = (pxVal: number) => {
    if (unitFormat === 'rem' || unitFormat === 'em') {
      return `${(pxVal / 16).toFixed(2)} ${unitFormat}`;
    }
    return `${pxVal} px`;
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const removePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPins((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAllPins = () => {
    setPins([]);
    setStartPoint(null);
    setCurrentPoint(null);
    setIsMeasuring(false);
  };

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const activeScreenStart = toScreen(startPoint);
  const activeScreenEnd = toScreen(currentPoint);

  const boxMinX = Math.min(activeScreenStart.x, activeScreenEnd.x);
  const boxMaxX = Math.max(activeScreenStart.x, activeScreenEnd.x);
  const boxMinY = Math.min(activeScreenStart.y, activeScreenEnd.y);
  const boxMaxY = Math.max(activeScreenStart.y, activeScreenEnd.y);

  // Compute Grid Color Tokens
  const getGridColors = () => {
    switch (gridColor) {
      case 'red':
        return { minor: 'rgba(239, 68, 68, 0.18)', major: 'rgba(239, 68, 68, 0.4)', scope: '#ef4444' };
      case 'cyan':
        return { minor: 'rgba(6, 182, 212, 0.18)', major: 'rgba(6, 182, 212, 0.4)', scope: '#06b6d4' };
      case 'emerald':
        return { minor: 'rgba(16, 185, 129, 0.18)', major: 'rgba(16, 185, 129, 0.4)', scope: '#10b981' };
      case 'white':
        return { minor: 'rgba(255, 255, 255, 0.12)', major: 'rgba(255, 255, 255, 0.3)', scope: '#f8fafc' };
    }
  };

  const gridTheme = getGridColors();

  return (
    <>
      {/* Top Screen Ruler */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '20px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
          zIndex: 2147483644,
          overflow: 'hidden'
        }}
      >
        <svg width="100%" height="20">
          {Array.from({ length: Math.ceil(screenW / 10) }).map((_, i) => {
            const x = i * 10;
            const isMajor = x % 50 === 0;
            return (
              <g key={`x-${x}`}>
                <line
                  x1={x}
                  y1={20 - (isMajor ? 12 : 6)}
                  x2={x}
                  y2={20}
                  stroke={isMajor ? '#94a3b8' : '#334155'}
                  strokeWidth={isMajor ? 1.5 : 1}
                />
                {isMajor && (
                  <text x={x + 3} y={11} fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    {x}
                  </text>
                )}
              </g>
            );
          })}
          {/* Active Cursor Tracking Tick */}
          <line x1={cursorPos.x} y1={0} x2={cursorPos.x} y2={20} stroke="#3b82f6" strokeWidth={2} />
        </svg>
      </div>

      {/* Left Screen Ruler */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '20px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
          zIndex: 2147483644,
          overflow: 'hidden'
        }}
      >
        <svg width="20" height="100%">
          {Array.from({ length: Math.ceil(screenH / 10) }).map((_, i) => {
            const y = i * 10;
            const isMajor = y % 50 === 0;
            return (
              <g key={`y-${y}`}>
                <line
                  x1={20 - (isMajor ? 12 : 6)}
                  y1={y}
                  x2={20}
                  y2={y}
                  stroke={isMajor ? '#94a3b8' : '#334155'}
                  strokeWidth={isMajor ? 1.5 : 1}
                />
                {isMajor && (
                  <text
                    x={2}
                    y={y + 11}
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="monospace"
                    transform={`rotate(-90 8 ${y + 11})`}
                  >
                    {y}
                  </text>
                )}
              </g>
            );
          })}
          {/* Active Cursor Tracking Tick */}
          <line x1={0} y1={cursorPos.y} x2={20} y2={cursorPos.y} stroke="#3b82f6" strokeWidth={2} />
        </svg>
      </div>

      {/* Fullscreen SVG Canvas for Pixel Blueprint Grid & Measurement Overlays */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 2147483645
        }}
      >
        <defs>
          {/* Pixel Blueprint Graph Paper Pattern */}
          <pattern
            id="pixelBlueprintGrid"
            width={gridSize * 5}
            height={gridSize * 5}
            patternUnits="userSpaceOnUse"
          >
            {/* Minor Grid Lines */}
            <path
              d={`
                M ${gridSize} 0 L ${gridSize} ${gridSize * 5}
                M ${gridSize * 2} 0 L ${gridSize * 2} ${gridSize * 5}
                M ${gridSize * 3} 0 L ${gridSize * 3} ${gridSize * 5}
                M ${gridSize * 4} 0 L ${gridSize * 4} ${gridSize * 5}
                M 0 ${gridSize} L ${gridSize * 5} ${gridSize}
                M 0 ${gridSize * 2} L ${gridSize * 5} ${gridSize * 2}
                M 0 ${gridSize * 3} L ${gridSize * 5} ${gridSize * 3}
                M 0 ${gridSize * 4} L ${gridSize * 5} ${gridSize * 4}
              `}
              fill="none"
              stroke={gridTheme.minor}
              strokeWidth="0.75"
            />
            {/* Major Grid Lines */}
            <path
              d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`}
              fill="none"
              stroke={gridTheme.major}
              strokeWidth="1.25"
            />
          </pattern>
        </defs>

        {/* Full Screen Pixel Blueprint Grid Overlay */}
        {showGridOverlay && (
          <rect width="100%" height="100%" fill="url(#pixelBlueprintGrid)" />
        )}

        {/* Hover Element Auto Bounding Box (Before Click Drag) */}
        {!isMeasuring && hoverRect && (
          <g>
            <rect
              x={hoverRect.x}
              y={hoverRect.y}
              width={hoverRect.width}
              height={hoverRect.height}
              fill="rgba(59, 130, 246, 0.12)"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              rx="3"
            />
            {/* Top dimension label */}
            <foreignObject x={hoverRect.x + hoverRect.width / 2 - 45} y={hoverRect.y - 24} width="90" height="20">
              <div
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  textAlign: 'center',
                  lineHeight: '18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}
              >
                {hoverRect.width} × {hoverRect.height} px
              </div>
            </foreignObject>
          </g>
        )}

        {/* Render Locked Measurement Boxes (Synchronized with Page Scroll) */}
        {pins.map((pin) => {
          const pStart = toScreen(pin.start);
          const pEnd = toScreen(pin.end);

          const minX = Math.min(pStart.x, pEnd.x);
          const maxX = Math.max(pStart.x, pEnd.x);
          const minY = Math.min(pStart.y, pEnd.y);
          const maxY = Math.max(pStart.y, pEnd.y);
          const midX = (pStart.x + pEnd.x) / 2;
          const midY = (pStart.y + pEnd.y) / 2;

          return (
            <g key={pin.id} opacity={0.95}>
              {/* Bounding Box */}
              <rect
                x={minX}
                y={minY}
                width={pin.dx}
                height={pin.dy}
                fill="rgba(139, 92, 246, 0.12)"
                stroke="#8b5cf6"
                strokeWidth="2"
                rx="4"
              />

              {/* Midpoint Internal Guidelines */}
              <line x1={minX + pin.dx / 2} y1={minY} x2={minX + pin.dx / 2} y2={maxY} stroke="#8b5cf6" strokeDasharray="3,3" opacity={0.5} />
              <line x1={minX} y1={minY + pin.dy / 2} x2={maxX} y2={minY + pin.dy / 2} stroke="#8b5cf6" strokeDasharray="3,3" opacity={0.5} />

              {/* 8 Node Handles (4 Corners + 4 Midpoints) */}
              {[
                { x: minX, y: minY },
                { x: minX + pin.dx / 2, y: minY },
                { x: maxX, y: minY },
                { x: maxX, y: minY + pin.dy / 2 },
                { x: maxX, y: maxY },
                { x: minX + pin.dx / 2, y: maxY },
                { x: minX, y: maxY },
                { x: minX, y: minY + pin.dy / 2 }
              ].map((pt, i) => (
                <rect
                  key={`pin-c-${i}`}
                  x={pt.x - 4}
                  y={pt.y - 4}
                  width="8"
                  height="8"
                  fill="#8b5cf6"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  rx="1"
                />
              ))}

              {/* Top Edge Width Badge */}
              <foreignObject x={minX + pin.dx / 2 - 45} y={minY - 26} width="90" height="24">
                <div
                  style={{
                    background: '#3b82f6',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    borderRadius: '4px',
                    textAlign: 'center',
                    lineHeight: '22px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  W: {pin.dx}px
                </div>
              </foreignObject>

              {/* Right Edge Height Badge */}
              <foreignObject x={maxX + 8} y={minY + pin.dy / 2 - 12} width="90" height="24">
                <div
                  style={{
                    background: '#8b5cf6',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    borderRadius: '4px',
                    textAlign: 'center',
                    lineHeight: '22px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  H: {pin.dy}px
                </div>
              </foreignObject>

              {/* Center Dimension Pill Badge */}
              <foreignObject x={midX - 60} y={midY - 14} width="120" height="28">
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #8b5cf6',
                    borderRadius: '14px',
                    padding: '2px 8px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Pin size={11} style={{ color: '#8b5cf6' }} /> {pin.dx} × {pin.dy} px
                </div>
              </foreignObject>
            </g>
          );
        })}


        {/* Circular Target Lens Scope (+) Cursor Overlay (Matches Screenshot) */}
        {!isMeasuring && (
          <g transform={`translate(${cursorPos.x}, ${cursorPos.y})`}>
            {/* Outer dashed circle */}
            <circle r="18" fill="none" stroke={gridTheme.scope} strokeWidth="1.5" strokeDasharray="4,2" opacity={0.8} />
            {/* Inner lens circle */}
            <circle r="14" fill="rgba(239, 68, 68, 0.08)" stroke={gridTheme.scope} strokeWidth="1" opacity={0.9} />
            {/* Center + Plus sign */}
            <circle r="2" fill={gridTheme.scope} />
            <line x1="-12" y1="0" x2="-4" y2="0" stroke={gridTheme.scope} strokeWidth="1.5" />
            <line x1="4" y1="0" x2="12" y2="0" stroke={gridTheme.scope} strokeWidth="1.5" />
            <line x1="0" y1="-12" x2="0" y2="-4" stroke={gridTheme.scope} strokeWidth="1.5" />
            <line x1="0" y1="4" x2="0" y2="12" stroke={gridTheme.scope} strokeWidth="1.5" />
          </g>
        )}

        {/* Active Live Measurement Box (Dynamic Drag Box) */}
        {startPoint && currentPoint && isMeasuring && (
          <g>
            {/* Extended Screen-Wide Projection Laser Lines */}
            <line x1={0} y1={boxMinY} x2={screenW} y2={boxMinY} stroke={gridTheme.scope} strokeDasharray="3,3" opacity={0.5} />
            <line x1={boxMinX} y1={0} x2={boxMinX} y2={screenH} stroke={gridTheme.scope} strokeDasharray="3,3" opacity={0.5} />
            <line x1={0} y1={boxMaxY} x2={screenW} y2={boxMaxY} stroke={gridTheme.scope} strokeDasharray="3,3" opacity={0.5} />
            <line x1={boxMaxX} y1={0} x2={boxMaxX} y2={screenH} stroke={gridTheme.scope} strokeDasharray="3,3" opacity={0.5} />

            {/* Crisp Outer Measurement Bounding Box */}
            <rect
              x={boxMinX}
              y={boxMinY}
              width={dx}
              height={dy}
              fill="rgba(59, 130, 246, 0.14)"
              stroke="#3b82f6"
              strokeWidth="2"
              rx="4"
            />

            {/* Internal Grid Lines inside Measurement Box */}
            {dx > 60 && dy > 60 && (
              <g opacity={0.25}>
                <line x1={boxMinX + dx / 2} y1={boxMinY} x2={boxMinX + dx / 2} y2={boxMaxY} stroke="#3b82f6" strokeDasharray="2,2" />
                <line x1={boxMinX} y1={boxMinY + dy / 2} x2={boxMaxX} y2={boxMinY + dy / 2} stroke="#3b82f6" strokeDasharray="2,2" />
              </g>
            )}

            {/* 8 Square Handle Nodes (4 Corners + 4 Edge Midpoints) */}
            {[
              { x: boxMinX, y: boxMinY },                           // Top-Left
              { x: boxMinX + dx / 2, y: boxMinY },                 // Top-Mid
              { x: boxMaxX, y: boxMinY },                           // Top-Right
              { x: boxMaxX, y: boxMinY + dy / 2 },                 // Right-Mid
              { x: boxMaxX, y: boxMaxY },                           // Bottom-Right
              { x: boxMinX + dx / 2, y: boxMaxY },                 // Bottom-Mid
              { x: boxMinX, y: boxMaxY },                           // Bottom-Left
              { x: boxMinX, y: boxMinY + dy / 2 }                  // Left-Mid
            ].map((node, i) => (
              <rect
                key={`handle-${i}`}
                x={node.x - 4}
                y={node.y - 4}
                width="8"
                height="8"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="1.5"
                rx="1"
              />
            ))}

            {/* Width Metric Pill on Top Edge */}
            {dx > 25 && (
              <foreignObject
                x={boxMinX + dx / 2 - 40}
                y={boxMinY - 26}
                width="80"
                height="22"
              >
                <div
                  style={{
                    background: '#3b82f6',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    textAlign: 'center',
                    lineHeight: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  W: {dx}px
                </div>
              </foreignObject>
            )}

            {/* Height Metric Pill on Right Edge */}
            {dy > 25 && (
              <foreignObject
                x={boxMaxX + 8}
                y={boxMinY + dy / 2 - 11}
                width="80"
                height="22"
              >
                <div
                  style={{
                    background: '#8b5cf6',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    textAlign: 'center',
                    lineHeight: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  H: {dy}px
                </div>
              </foreignObject>
            )}

            {/* Main Center Dimension Box Badge */}
            {dx > 40 && dy > 30 && (
              <foreignObject
                x={boxMinX + dx / 2 - 60}
                y={boxMinY + dy / 2 - 14}
                width="120"
                height="28"
              >
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #38bdf8',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    borderRadius: '14px',
                    textAlign: 'center',
                    padding: '3px 8px',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Box size={12} style={{ color: '#38bdf8' }} /> {dx} × {dy} px
                </div>
              </foreignObject>
            )}
          </g>
        )}
      </svg>

      {/* Floating On-Cursor HUD Pill */}
      {isMeasuring && (
        <div
          style={{
            position: 'fixed',
            left: `${cursorPos.x + 22}px`,
            top: `${cursorPos.y + 22}px`,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '8px',
            padding: '6px 10px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 2147483646,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Box size={12} /> {dx} × {dy} px
          </span>
          <span style={{ color: '#ec4899', fontWeight: 700 }}>D: {distance}px</span>
        </div>
      )}

      {/* Floating Measurement Studio Control Panel */}
      <div
        className="devlens-panel"
        style={{
          right: '20px',
          top: '70px',
          width: '340px'
        }}
      >
        <div className="devlens-panel-header">
          <div className="devlens-panel-title">
            <Ruler size={16} style={{ color: 'var(--dl-primary)' }} />
            <span>Pixel Measurement Studio</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Status Instruction */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: isMeasuring ? 'rgba(59, 130, 246, 0.15)' : 'var(--dl-bg)',
              border: isMeasuring ? '1px solid var(--dl-primary)' : '1px solid var(--dl-border)',
              color: 'var(--dl-text)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Crosshair size={14} style={{ color: isMeasuring ? '#3b82f6' : 'var(--dl-text-muted)' }} />
              {isMeasuring ? 'Drawing measurement box... click to lock' : 'Click & drag anywhere to draw measurement box'}
            </span>
            {isMeasuring && (
              <span
                style={{
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                LIVE
              </span>
            )}
          </div>

          {/* Blueprint Grid Controls Bar */}
          <div style={{ background: 'var(--dl-bg)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--dl-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Grid size={12} /> PIXEL BLUEPRINT GRID
              </span>
              <button
                onClick={() => setShowGridOverlay(!showGridOverlay)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: showGridOverlay ? 'var(--dl-primary)' : 'var(--dl-bg-secondary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {showGridOverlay ? <Eye size={12} /> : <EyeOff size={12} />} {showGridOverlay ? 'Grid On' : 'Grid Off'}
              </button>
            </div>

            {showGridOverlay && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>SIZE:</span>
                  {[8, 10, 16, 24].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setGridSize(sz)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--dl-border)',
                        background: gridSize === sz ? '#3b82f6' : 'var(--dl-bg-secondary)',
                        color: '#ffffff',
                        fontSize: '9px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {sz}px
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>COLOR:</span>
                  {(['red', 'cyan', 'emerald', 'white'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setGridColor(c)}
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: gridColor === c ? '2px solid #ffffff' : '1px solid var(--dl-border)',
                        background: c === 'red' ? '#ef4444' : c === 'cyan' ? '#06b6d4' : c === 'emerald' ? '#10b981' : '#ffffff',
                        cursor: 'pointer'
                      }}
                      title={`${c} Grid`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Unit Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>UNIT SYSTEM:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['px', 'rem', 'em'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setUnitFormat(unit)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--dl-border)',
                    background: unitFormat === unit ? 'var(--dl-primary)' : 'var(--dl-bg)',
                    color: unitFormat === unit ? '#ffffff' : 'var(--dl-text)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Live Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Width */}
            <div
              style={{
                background: 'var(--dl-bg)',
                border: '1px solid var(--dl-border)',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>WIDTH (ΔX)</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#3b82f6' }}>{formatValue(dx)}</span>
                <button
                  onClick={() => handleCopy(`${dx}px`, 'dx')}
                  style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
                  title="Copy Width"
                >
                  {copiedKey === 'dx' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Height */}
            <div
              style={{
                background: 'var(--dl-bg)',
                border: '1px solid var(--dl-border)',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>HEIGHT (ΔY)</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#8b5cf6' }}>{formatValue(dy)}</span>
                <button
                  onClick={() => handleCopy(`${dy}px`, 'dy')}
                  style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
                  title="Copy Height"
                >
                  {copiedKey === 'dy' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Distance */}
            <div
              style={{
                background: 'var(--dl-bg)',
                border: '1px solid var(--dl-border)',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>DISTANCE (DIAG)</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#ec4899' }}>{formatValue(distance)}</span>
                <button
                  onClick={() => handleCopy(`${distance}px`, 'dist')}
                  style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
                  title="Copy Distance"
                >
                  {copiedKey === 'dist' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Angle */}
            <div
              style={{
                background: 'var(--dl-bg)',
                border: '1px solid var(--dl-border)',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>ANGLE (DEGREES)</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#f59e0b' }}>{angleDeg}°</span>
                <button
                  onClick={() => handleCopy(`${angleDeg}°`, 'angle')}
                  style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
                  title="Copy Angle"
                >
                  {copiedKey === 'angle' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick CSS Export Button */}
          <button
            className="devlens-btn devlens-btn-primary"
            onClick={() => handleCopy(`width: ${dx}px;\nheight: ${dy}px;`, 'css')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {copiedKey === 'css' ? <Check size={14} /> : <Copy size={14} />} Copy CSS Width & Height
          </button>

          {/* Locked Measurement Pins List */}
          {pins.length > 0 && (
            <div style={{ borderTop: '1px solid var(--dl-border)', paddingTop: '10px' }}>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--dl-text-muted)',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Pin size={12} /> LOCKED BOX MEASUREMENTS ({pins.length})
                </span>
                <button
                  onClick={clearAllPins}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--dl-text-muted)',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <Trash2 size={10} /> Clear
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {pins.map((pin, index) => (
                  <div
                    key={pin.id}
                    style={{
                      background: 'var(--dl-bg)',
                      border: '1px solid var(--dl-border)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px'
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      Box #{pins.length - index}: <span style={{ color: '#3b82f6' }}>{pin.dx}px</span> × <span style={{ color: '#8b5cf6' }}>{pin.dy}px</span>
                    </span>
                    <button
                      onClick={(e) => removePin(pin.id, e)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
