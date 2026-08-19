import React, { useState, useRef, useEffect } from 'react';
import { ActiveTool } from '../../shared/types';
import { DevLensLogo } from '../../shared/components/DevLensLogo';
import {
  GripVertical,
  MousePointerClick,
  Type,
  Palette,
  Square,
  LayoutGrid,
  Ruler,
  Smartphone,
  Accessibility,
  BarChart2,
  Camera,
  Video,
  Image as ImageIcon,
  Radio,
  Sun,
  Moon,
  X,
  Command,
  Gauge,
  Database
} from 'lucide-react';

interface ToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  onOpenCommandPalette: () => void;
  onClose: () => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  onOpenCommandPalette,
  onClose,
  theme,
  setTheme
}) => {
  // Initialize toolbar at top-middle of the screen
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    // Estimated toolbar width is around 680px
    const initialX = Math.max(10, Math.round((screenW - 680) / 2));
    return { x: initialX, y: 20 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 20,
    initialY: 20
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.max(10, dragRef.current.initialX + deltaX),
        y: Math.max(10, dragRef.current.initialY + deltaY)
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const tools: { id: ActiveTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'inspect', label: 'Inspect Element', icon: <MousePointerClick size={16} />, shortcut: 'Alt+Shift+I' },
    { id: 'typography', label: 'Font Inspector', icon: <Type size={16} />, shortcut: 'Alt+Shift+F' },
    { id: 'color', label: 'Color Picker', icon: <Palette size={16} />, shortcut: 'Alt+Shift+C' },
    { id: 'box-model', label: 'Box Model', icon: <Square size={16} />, shortcut: '' },
    { id: 'layout', label: 'Layout Inspector', icon: <LayoutGrid size={16} />, shortcut: '' },
    { id: 'measure', label: 'Pixel Measurement', icon: <Ruler size={16} />, shortcut: 'Alt+Shift+M' },
    { id: 'responsive', label: 'Responsive', icon: <Smartphone size={16} />, shortcut: 'Alt+Shift+R' },
    { id: 'network', label: 'API & Network Inspector', icon: <Radio size={16} />, shortcut: 'Alt+Shift+N' },
    { id: 'storage', label: 'Storage & Cookies', icon: <Database size={16} />, shortcut: '' },
    { id: 'image-inspector', label: 'Image & Asset Inspector', icon: <ImageIcon size={16} />, shortcut: '' },
    { id: 'perf-hud', label: 'Core Web Vitals HUD', icon: <Gauge size={16} />, shortcut: '' },
    { id: 'a11y', label: 'Accessibility', icon: <Accessibility size={16} />, shortcut: 'Alt+Shift+A' },
    { id: 'page-analyzer', label: 'Page Analyzer', icon: <BarChart2 size={16} />, shortcut: '' },
    { id: 'screenshot', label: 'Screenshot', icon: <Camera size={16} />, shortcut: 'Alt+Shift+S' },
    { id: 'video-recorder', label: 'Screen & Video Recorder', icon: <Video size={16} />, shortcut: 'Alt+Shift+V' }
  ];


  return (
    <div
      className="devlens-toolbar"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="devlens-toolbar-drag-handle" onMouseDown={handleMouseDown} title="Drag toolbar">
        <GripVertical size={16} />
      </div>

      <div style={{ paddingRight: '4px', display: 'flex', alignItems: 'center' }}>
        <DevLensLogo size={18} showText={true} />
      </div>

      <div className="devlens-divider" />

      {tools.map((t) => (
        <button
          key={t.id}
          className={`devlens-tool-btn ${activeTool === t.id ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === t.id ? null : t.id)}
          title={`${t.label} ${t.shortcut ? `(${t.shortcut})` : ''}`}
        >
          {t.icon}
        </button>
      ))}

      <div className="devlens-divider" />

      <button
        className="devlens-tool-btn"
        onClick={onOpenCommandPalette}
        title="Command Palette (Ctrl+K)"
      >
        <Command size={16} />
      </button>

      <button
        className="devlens-tool-btn"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <button
        className="devlens-tool-btn"
        onClick={onClose}
        title="Close DevLens (Escape)"
        style={{ color: 'var(--dl-danger)' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
