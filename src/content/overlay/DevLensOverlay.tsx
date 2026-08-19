import React, { useState, useEffect } from 'react';
import { ActiveTool, ElementData, ScreenshotMode, ScreenshotFormat } from '../../shared/types';
import { extractElementData } from '../../shared/utils/domUtils';
import { getSettings, saveSettings } from '../../shared/utils/storageUtils';
import { Toolbar } from './Toolbar';
import { CommandPalette } from './CommandPalette';
import { InspectorPanel } from './InspectorPanel';
import { TypographyInspector } from './TypographyInspector';
import { ColorPickerOverlay } from './ColorPickerOverlay';
import { MeasurementOverlay } from './MeasurementOverlay';
import { ScreenshotModal } from './ScreenshotModal';
import { ResponsiveModal } from './ResponsiveModal';
import { AccessibilityPanel } from './AccessibilityPanel';
import { PageAnalyzerPanel } from './PageAnalyzerPanel';
import { AIPanel } from './AIPanel';
import { BoxModelPanel } from './BoxModelPanel';
import { LayoutInspectorPanel } from './LayoutInspectorPanel';
import { NetworkInspectorPanel } from './NetworkInspectorPanel';
import { PerformanceHudPanel } from './PerformanceHudPanel';
import { StorageInspectorPanel } from './StorageInspectorPanel';
import { ImageInspectorPanel } from './ImageInspectorPanel';
import { VideoRecorderModal } from './VideoRecorderModal';

interface DevLensOverlayProps {
  initialTool?: ActiveTool;
  onCloseExtension?: () => void;
}

export const DevLensOverlay: React.FC<DevLensOverlayProps> = ({
  initialTool = null,
  onCloseExtension
}) => {
  const [activeTool, setActiveTool] = useState<ActiveTool>(initialTool);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [hoveredRect, setHoveredRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    tagName: string;
    classList: string[];
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
  } | null>(null);

  const [selectedElementData, setSelectedElementData] = useState<ElementData | null>(null);
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);
  const [boxModelData, setBoxModelData] = useState<any>(null);
  const [isResponsiveSimulatorActive, setIsResponsiveSimulatorActive] = useState(false);

  // Load theme preference & listen for global storage changes
  useEffect(() => {
    getSettings().then((s) => setTheme(s.theme === 'dark' ? 'dark' : 'light'));

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      const listener = (changes: any, areaName: string) => {
        if (areaName === 'local' && changes.devlens_settings?.newValue) {
          const newTheme = changes.devlens_settings.newValue.theme;
          if (newTheme === 'dark' || newTheme === 'light') {
            setTheme(newTheme);
          }
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    saveSettings({ theme: newTheme });
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
        } else if (activeTool) {
          setActiveTool(null);
          setHoveredRect(null);
        } else {
          onCloseExtension?.();
        }
        return;
      }

      if (e.altKey && e.shiftKey) {
        const key = e.key.toUpperCase();
        if (key === 'S') {
          e.preventDefault();
          setActiveTool('screenshot');
        } else if (key === 'C') {
          e.preventDefault();
          setActiveTool('color');
        } else if (key === 'F') {
          e.preventDefault();
          setActiveTool('typography');
        } else if (key === 'I') {
          e.preventDefault();
          setActiveTool('inspect');
        } else if (key === 'M') {
          e.preventDefault();
          setActiveTool('measure');
        } else if (key === 'R') {
          e.preventDefault();
          setActiveTool('responsive');
        } else if (key === 'A') {
          e.preventDefault();
          setActiveTool('a11y');
        } else if (key === 'N') {
          e.preventDefault();
          setActiveTool('network');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, isCommandPaletteOpen, onCloseExtension]);

  const [isBoxModelLocked, setIsBoxModelLocked] = useState(false);

  // Mouse inspector hover & click logic
  useEffect(() => {
    if (
      activeTool !== 'inspect' &&
      activeTool !== 'typography' &&
      activeTool !== 'box-model' &&
      !isSelectingElementMode
    ) {
      setHoveredRect(null);
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('#devlens-root')) return;

      if (activeTool === 'box-model' && isBoxModelLocked) {
        return; // Don't override boxModelData if locked!
      }

      const rect = target.getBoundingClientRect();
      const style = window.getComputedStyle(target);

      setHoveredRect({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        tagName: target.tagName.toLowerCase(),
        classList: Array.from(target.classList),
        fontFamily: style.fontFamily.split(',')[0].replace(/["']/g, ''),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color
      });

      if (activeTool === 'box-model') {
        setBoxModelData({
          targetElement: target,
          tagName: target.tagName.toLowerCase(),
          className: target.className ? String(target.className) : '',
          id: target.id || '',
          width: rect.width,
          height: rect.height,
          marginTop: style.marginTop,
          marginRight: style.marginRight,
          marginBottom: style.marginBottom,
          marginLeft: style.marginLeft,
          borderTopWidth: style.borderTopWidth,
          borderRightWidth: style.borderRightWidth,
          borderBottomWidth: style.borderBottomWidth,
          borderLeftWidth: style.borderLeftWidth,
          borderStyle: style.borderTopStyle || style.borderStyle || 'none',
          borderColor: style.borderTopColor || style.borderColor || 'transparent',
          paddingTop: style.paddingTop,
          paddingRight: style.paddingRight,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft,
          boxSizing: style.boxSizing,
          display: style.display,
          position: style.position,
          overflow: style.overflow,
          zIndex: style.zIndex
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('#devlens-root')) return;

      e.preventDefault();
      e.stopPropagation();

      if (activeTool === 'box-model') {
        setIsBoxModelLocked((prev) => !prev);
        const rect = target.getBoundingClientRect();
        const style = window.getComputedStyle(target);
        setBoxModelData({
          targetElement: target,
          tagName: target.tagName.toLowerCase(),
          className: target.className ? String(target.className) : '',
          id: target.id || '',
          width: rect.width,
          height: rect.height,
          marginTop: style.marginTop,
          marginRight: style.marginRight,
          marginBottom: style.marginBottom,
          marginLeft: style.marginLeft,
          borderTopWidth: style.borderTopWidth,
          borderRightWidth: style.borderRightWidth,
          borderBottomWidth: style.borderBottomWidth,
          borderLeftWidth: style.borderLeftWidth,
          borderStyle: style.borderTopStyle || style.borderStyle || 'none',
          borderColor: style.borderTopColor || style.borderColor || 'transparent',
          paddingTop: style.paddingTop,
          paddingRight: style.paddingRight,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft,
          boxSizing: style.boxSizing,
          display: style.display,
          position: style.position,
          overflow: style.overflow,
          zIndex: style.zIndex
        });
        return;
      }

      const data = extractElementData(target);
      setSelectedElementData(data);
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('click', handleClick, true);
    };
  }, [activeTool, isBoxModelLocked]);

  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [areaRect, setAreaRect] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [isSelectingElementMode, setIsSelectingElementMode] = useState(false);

const isExtensionValid = (): boolean => {
  try {
    return typeof chrome !== 'undefined' && Boolean(chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
};

  const performCleanCapture = async (format: ScreenshotFormat): Promise<string> => {
    const devlensRoot = document.getElementById('devlens-root');
    if (devlensRoot) {
      devlensRoot.style.display = 'none';
      void devlensRoot.offsetWidth; // Force DOM layout repaint
    }

    // Double RAF + timeout ensures Chrome GPU renderer flushes hidden state completely
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150))));

    let resultUrl = '';

    if (isExtensionValid()) {
      try {
        resultUrl = await new Promise<string>((resolve) => {
          try {
            chrome.runtime.sendMessage(
              { type: 'CAPTURE_VISIBLE_TAB', payload: { format } },
              (res) => {
                if (!isExtensionValid() || !res?.dataUrl) {
                  resolve('');
                } else {
                  resolve(res.dataUrl);
                }
              }
            );
          } catch {
            resolve('');
          }
        });
      } catch {
        resultUrl = '';
      }
    }

    // Fallback if Chrome extension messaging is blocked, invalidated, or returned empty
    if (!resultUrl) {
      const { captureDomAsDataUrl } = await import('../../shared/utils/screenshotUtils');
      resultUrl = await captureDomAsDataUrl(format);
    }

    if (resultUrl && format === 'webp') {
      const { convertDataUrlFormat } = await import('../../shared/utils/screenshotUtils');
      resultUrl = await convertDataUrlFormat(resultUrl, 'webp');
    }

    if (devlensRoot) {
      devlensRoot.style.display = '';
    }

    return resultUrl;
  };

  const performFullPageCapture = async (format: ScreenshotFormat): Promise<string> => {
    const devlensRoot = document.getElementById('devlens-root');
    if (devlensRoot) {
      devlensRoot.style.display = 'none';
      void devlensRoot.offsetWidth;
    }

    // Preserve original scroll position and smooth scroll behavior
    const originalScrollX = window.scrollX || window.pageXOffset || 0;
    const originalScrollY = window.scrollY || window.pageYOffset || 0;
    const originalHtmlScrollBehavior = document.documentElement.style.scrollBehavior;
    const originalBodyScrollBehavior = document.body.style.scrollBehavior;

    // Force instant scrolling behavior across host page
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';

    // Calculate document dimensions
    const totalWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
      document.documentElement.clientWidth,
      window.innerWidth
    );
    const totalHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.clientHeight,
      window.innerHeight
    );
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const dpr = window.devicePixelRatio || 1;
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = Math.round(totalWidth * dpr);
    fullCanvas.height = Math.round(totalHeight * dpr);
    const ctx = fullCanvas.getContext('2d');

    if (!ctx) {
      document.documentElement.style.scrollBehavior = originalHtmlScrollBehavior;
      document.body.style.scrollBehavior = originalBodyScrollBehavior;
      if (devlensRoot) devlensRoot.style.display = '';
      return performCleanCapture(format);
    }

    // Default white background fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, fullCanvas.width, fullCanvas.height);

    const ySteps = Math.max(1, Math.ceil(totalHeight / viewportHeight));

    // Force scroll to top (0,0) first
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200))));

    // Collect all fixed & sticky elements to prevent duplicated navbar/header glitching during page scroll
    const stickyOrFixedElements: { el: HTMLElement; originalVisibility: string }[] = [];
    try {
      document.querySelectorAll('*').forEach((node) => {
        if (node instanceof HTMLElement && node.id !== 'devlens-root' && !node.closest('#devlens-root')) {
          const pos = window.getComputedStyle(node).position;
          if (pos === 'fixed' || pos === 'sticky') {
            stickyOrFixedElements.push({
              el: node,
              originalVisibility: node.style.visibility
            });
          }
        }
      });
    } catch (_) {}

    try {
      for (let i = 0; i < ySteps; i++) {
        // Calculate yPos cleanly: last step lands precisely at totalHeight - viewportHeight
        const yPos = i === ySteps - 1 ? Math.max(0, totalHeight - viewportHeight) : i * viewportHeight;

        // Hide sticky/fixed headers on scroll steps after top slice (i > 0) to avoid repeating navbars
        if (i > 0) {
          stickyOrFixedElements.forEach(({ el }) => {
            el.style.visibility = 'hidden';
          });
        } else {
          stickyOrFixedElements.forEach(({ el, originalVisibility }) => {
            el.style.visibility = originalVisibility;
          });
        }

        window.scrollTo(0, yPos);
        document.documentElement.scrollTop = yPos;
        document.body.scrollTop = yPos;

        // Wait 180ms for layout repaint & image loading
        await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 180)));

        let sliceUrl = '';
        if (isExtensionValid()) {
          try {
            sliceUrl = await new Promise<string>((resolve) => {
              try {
                chrome.runtime.sendMessage(
                  { type: 'CAPTURE_VISIBLE_TAB', payload: { format } },
                  (res) => {
                    if (!isExtensionValid() || !res?.dataUrl) {
                      resolve('');
                    } else {
                      resolve(res.dataUrl);
                    }
                  }
                );
              } catch {
                resolve('');
              }
            });
          } catch {
            sliceUrl = '';
          }
        }

        if (sliceUrl) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(
                img,
                0,
                0,
                img.width,
                img.height,
                0,
                Math.round(yPos * dpr),
                Math.round(viewportWidth * dpr),
                Math.round(viewportHeight * dpr)
              );
              resolve();
            };
            img.onerror = () => resolve();
            img.src = sliceUrl;
          });
        }
      }
    } finally {
      // Always restore original visibility of fixed/sticky elements
      stickyOrFixedElements.forEach(({ el, originalVisibility }) => {
        el.style.visibility = originalVisibility;
      });

      // Restore scroll position & behaviors
      window.scrollTo(originalScrollX, originalScrollY);
      document.documentElement.scrollTop = originalScrollY;
      document.body.scrollTop = originalScrollY;
      document.documentElement.style.scrollBehavior = originalHtmlScrollBehavior;
      document.body.style.scrollBehavior = originalBodyScrollBehavior;

      if (devlensRoot) {
        devlensRoot.style.display = '';
      }
    }

    return fullCanvas.toDataURL(`image/${format}`);
  };

  const handleTriggerCapture = async (mode: ScreenshotMode, format: ScreenshotFormat) => {
    setCapturedScreenshot(null);

    if (mode === 'area') {
      setIsSelectingArea(true);
      return;
    }

    if (mode === 'element') {
      setIsSelectingElementMode(true);
      return;
    }

    if (mode === 'full') {
      const fullUrl = await performFullPageCapture(format);
      if (fullUrl) {
        setCapturedScreenshot(fullUrl);
      }
      return;
    }

    // Default visible area capture
    const rawDataUrl = await performCleanCapture(format);
    if (rawDataUrl) {
      setCapturedScreenshot(rawDataUrl);
    }
  };

  // Handle Area Drag Selection Mouse Events
  const handleAreaMouseDown = (e: React.MouseEvent) => {
    setAreaRect({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handleAreaMouseMove = (e: React.MouseEvent) => {
    if (!areaRect) return;
    setAreaRect({
      ...areaRect,
      currentX: e.clientX,
      currentY: e.clientY
    });
  };

  const handleAreaMouseUp = async () => {
    if (!areaRect) return;

    const x = Math.min(areaRect.startX, areaRect.currentX);
    const y = Math.min(areaRect.startY, areaRect.currentY);
    const width = Math.abs(areaRect.currentX - areaRect.startX);
    const height = Math.abs(areaRect.currentY - areaRect.startY);

    setIsSelectingArea(false);
    setAreaRect(null);

    if (width > 10 && height > 10) {
      const rawDataUrl = await performCleanCapture('png');
      if (rawDataUrl) {
        const { cropDataUrl } = await import('../../shared/utils/screenshotUtils');
        const cropped = await cropDataUrl(rawDataUrl, { x, y, width, height }, 'png');
        setCapturedScreenshot(cropped);
      }
    }
  };

  // Element Selection Capture Listener
  useEffect(() => {
    if (!isSelectingElementMode) return;

    const handleElementClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest('#devlens-root')) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = target.getBoundingClientRect();
      setIsSelectingElementMode(false);

      const rawDataUrl = await performCleanCapture('png');
      if (rawDataUrl) {
        const { cropDataUrl } = await import('../../shared/utils/screenshotUtils');
        const cropped = await cropDataUrl(
          rawDataUrl,
          { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          'png'
        );
        setCapturedScreenshot(cropped);
      }
    };

    window.addEventListener('click', handleElementClick, true);
    return () => window.removeEventListener('click', handleElementClick, true);
  }, [isSelectingElementMode]);

  const handleSelectCommand = (tool: ActiveTool | 'full-screenshot' | 'open-settings' | 'clear') => {
    if (tool === 'full-screenshot') {
      setActiveTool('screenshot');
      handleTriggerCapture('full', 'png');
    } else if (tool === 'open-settings') {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        alert('DevLens Settings Page can be opened from extension options.');
      }
    } else if (tool === 'clear') {
      setActiveTool(null);
    } else if (tool) {
      setActiveTool(tool);
    }
  };

  const [isVideoRecordingActive, setIsVideoRecordingActive] = useState(false);

  return (
    <div className={`devlens-theme-root ${theme === 'light' ? 'devlens-theme-light' : ''}`}>
      {/* Floating Extension Toolbar (Hidden while Responsive Viewport Simulator or Video Recording is active) */}
      {!isResponsiveSimulatorActive && !isVideoRecordingActive && (
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onClose={() => onCloseExtension?.()}
          theme={theme}
          setTheme={handleSetTheme}
        />
      )}

      {/* Hover Highlight & Dimensions Badge Overlay */}
      {hoveredRect && (activeTool === 'inspect' || activeTool === 'typography') && (
        <>
          <div
            style={{
              position: 'fixed',
              left: `${hoveredRect.x}px`,
              top: `${hoveredRect.y}px`,
              width: `${hoveredRect.width}px`,
              height: `${hoveredRect.height}px`,
              border: activeTool === 'typography' ? '2px dashed var(--dl-accent)' : '2px solid var(--dl-primary)',
              background: activeTool === 'typography' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              pointerEvents: 'none',
              zIndex: 2147483640,
              boxSizing: 'border-box'
            }}
          />
          <div
            style={{
              position: 'fixed',
              left: `${hoveredRect.x}px`,
              top: `${Math.max(4, hoveredRect.y - 32)}px`,
              background: activeTool === 'typography' ? 'var(--dl-accent)' : 'var(--dl-primary)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--dl-font)',
              pointerEvents: 'none',
              zIndex: 2147483641,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {activeTool === 'typography' ? (
              <>
                <span style={{ fontWeight: 700 }}>{hoveredRect.fontFamily}</span>
                <span style={{ opacity: 0.8 }}>{hoveredRect.fontSize} / {hoveredRect.fontWeight}</span>
                {hoveredRect.color && (
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: hoveredRect.color,
                      border: '1px solid #fff',
                      display: 'inline-block'
                    }}
                  />
                )}
              </>
            ) : (
              <>
                <span style={{ fontFamily: 'monospace' }}>&lt;{hoveredRect.tagName}&gt;</span>
                {hoveredRect.classList.length > 0 && <span>.{hoveredRect.classList[0]}</span>}
                <span style={{ opacity: 0.8 }}>
                  | {Math.round(hoveredRect.width)} × {Math.round(hoveredRect.height)} px
                </span>
              </>
            )}
          </div>
        </>
      )}

      {/* Element Capture Hover Box */}
      {hoveredRect && isSelectingElementMode && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredRect.x}px`,
            top: `${hoveredRect.y}px`,
            width: `${hoveredRect.width}px`,
            height: `${hoveredRect.height}px`,
            border: '2px solid var(--dl-primary)',
            background: 'rgba(59, 130, 246, 0.25)',
            pointerEvents: 'none',
            zIndex: 2147483645
          }}
        />
      )}

      {/* Floating Prompt Banner for Area or Element Capture Modes */}
      {(isSelectingArea || isSelectingElementMode) && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--dl-primary)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>
            {isSelectingArea
              ? '✂️ Click and drag a box on screen to capture custom area'
              : '🎯 Click any element on the page to capture its screenshot'}
          </span>
          <button
            onClick={() => {
              setIsSelectingArea(false);
              setIsSelectingElementMode(false);
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Interactive Drag Area Selection Overlay */}
      {isSelectingArea && (
        <div
          onMouseDown={handleAreaMouseDown}
          onMouseMove={handleAreaMouseMove}
          onMouseUp={handleAreaMouseUp}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            cursor: 'crosshair',
            zIndex: 2147483646,
            background: 'rgba(0, 0, 0, 0.2)',
            pointerEvents: 'auto'
          }}
        >
          {areaRect && (
            <div
              style={{
                position: 'fixed',
                left: `${Math.min(areaRect.startX, areaRect.currentX)}px`,
                top: `${Math.min(areaRect.startY, areaRect.currentY)}px`,
                width: `${Math.abs(areaRect.currentX - areaRect.startX)}px`,
                height: `${Math.abs(areaRect.currentY - areaRect.startY)}px`,
                border: '2px dashed var(--dl-primary)',
                background: 'rgba(59, 130, 246, 0.2)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-24px',
                  left: '0',
                  background: 'var(--dl-primary)',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                {Math.abs(areaRect.currentX - areaRect.startX)} × {Math.abs(areaRect.currentY - areaRect.startY)} px
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Tool Panels */}
      {activeTool === 'inspect' && (
        <InspectorPanel elementData={selectedElementData} onClose={() => setActiveTool(null)} />
      )}

      {activeTool === 'typography' && (
        <TypographyInspector
          typography={selectedElementData?.typography || null}
          onClose={() => setActiveTool(null)}
        />
      )}

      {activeTool === 'color' && <ColorPickerOverlay onClose={() => setActiveTool(null)} />}

      {activeTool === 'measure' && <MeasurementOverlay onClose={() => setActiveTool(null)} />}

      {activeTool === 'screenshot' && (
        <ScreenshotModal
          onClose={() => setActiveTool(null)}
          onTriggerCapture={handleTriggerCapture}
          capturedDataUrl={capturedScreenshot}
        />
      )}

      {activeTool === 'responsive' && (
        <ResponsiveModal
          onClose={() => {
            setActiveTool(null);
            setIsResponsiveSimulatorActive(false);
          }}
          onSimulatorToggle={setIsResponsiveSimulatorActive}
        />
      )}

      {activeTool === 'a11y' && <AccessibilityPanel onClose={() => setActiveTool(null)} />}

      {activeTool === 'page-analyzer' && <PageAnalyzerPanel onClose={() => setActiveTool(null)} />}

      {activeTool === 'box-model' && (
        <BoxModelPanel
          data={boxModelData}
          isLocked={isBoxModelLocked}
          onToggleLock={() => setIsBoxModelLocked((prev) => !prev)}
          onClose={() => {
            setIsBoxModelLocked(false);
            setActiveTool(null);
          }}
        />
      )}

      {activeTool === 'layout' && (
        <LayoutInspectorPanel onClose={() => setActiveTool(null)} />
      )}

      {activeTool === 'network' && (
        <NetworkInspectorPanel onClose={() => setActiveTool(null)} />
      )}

      {activeTool === 'perf-hud' && (
        <PerformanceHudPanel onClose={() => setActiveTool(null)} />
      )}

      {activeTool === 'storage' && (
        <StorageInspectorPanel onClose={() => setActiveTool(null)} />
      )}

      {activeTool === 'image-inspector' && (
        <ImageInspectorPanel onClose={() => setActiveTool(null)} />
      )}

      {activeTool === 'video-recorder' && (
        <VideoRecorderModal
          isOpen={true}
          onClose={() => {
            setIsVideoRecordingActive(false);
            setActiveTool(null);
          }}
          onRecordingStateChange={setIsVideoRecordingActive}
        />
      )}

      {activeTool === 'ai' && (
        <AIPanel elementData={selectedElementData} onClose={() => setActiveTool(null)} />
      )}

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectCommand={handleSelectCommand}
      />
    </div>
  );
};
