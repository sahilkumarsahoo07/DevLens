import React, { useState, useEffect } from 'react';
import { ActiveTool, ScreenshotHistoryItem, PickedColorHistory } from '../shared/types';
import { getScreenshotHistory, getColorHistory, getSettings, saveSettings } from '../shared/utils/storageUtils';
import { DevLensLogo } from '../shared/components/DevLensLogo';
import {
  Camera,
  Image as ImageIcon,
  Palette,
  MousePointerClick,
  Type,
  Ruler,
  Settings,
  Activity,
  RotateCw,
  AlertTriangle,
  Radio,
  Copy,
  Check,
  Zap,
  Code2,
  Linkedin,
  Instagram,
  Sun,
  Moon,
  Gauge,
  Database
} from 'lucide-react';

export const PopupApp: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [recentScreenshot, setRecentScreenshot] = useState<ScreenshotHistoryItem | null>(null);
  const [recentColor, setRecentColor] = useState<PickedColorHistory | null>(null);
  const [isRestrictedTab, setIsRestrictedTab] = useState(false);
  const [copiedColor, setCopiedColor] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      if (s.theme === 'dark' || s.theme === 'light') {
        setTheme(s.theme);
      }
    });

    getScreenshotHistory().then((shots) => {
      if (shots.length > 0) setRecentScreenshot(shots[0]);
    });
    getColorHistory().then((colors) => {
      if (colors.length > 0) setRecentColor(colors[0]);
    });

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (tab?.url) {
          if (
            tab.url.startsWith('chrome://') ||
            tab.url.startsWith('edge://') ||
            tab.url.startsWith('about:') ||
            tab.url.includes('chrome.google.com/webstore')
          ) {
            setIsRestrictedTab(true);
          }
        }
      });
    }

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

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    saveSettings({ theme: nextTheme });
  };

  const triggerToolOnActiveTab = async (tool: ActiveTool) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_TOOLBAR',
            payload: { tool }
          });
        } catch {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise((res) => setTimeout(res, 120));
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_TOOLBAR',
              payload: { tool }
            });
          } catch (e) {
            console.warn('[DevLens Popup] Secondary dispatch failed:', e);
          }
        }
        window.close();
      }
    }
  };

  const reloadActiveTab = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.reload(tab.id);
        window.close();
      }
    }
  };

  const openSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
  };

  const copyColorHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(true);
    setTimeout(() => setCopiedColor(false), 1500);
  };

  const isLight = theme === 'light';

  // Dynamic Theme Colors
  const styles = {
    bg: isLight ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' : 'linear-gradient(180deg, #0b1120 0%, #0f172a 100%)',
    text: isLight ? '#0f172a' : '#f8fafc',
    subtext: isLight ? '#64748b' : '#94a3b8',
    cardBg: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
    cardBorder: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
    cardShadow: isLight ? '0 4px 12px rgba(0,0,0,0.05)' : '0 4px 12px rgba(0,0,0,0.25)',
    toolBtnBg: isLight ? '#ffffff' : 'rgba(30, 41, 59, 0.7)',
    toolBtnBorder: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
    toolBtnHoverBg: isLight ? '#f1f5f9' : 'rgba(51, 65, 85, 0.9)',
    toolBtnText: isLight ? '#1e293b' : '#f1f5f9',
    iconBtnBg: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
    iconBtnBorder: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
    iconBtnColor: isLight ? '#475569' : '#94a3b8'
  };

  return (
    <div
      style={{
        width: '360px',
        padding: '16px',
        background: styles.bg,
        color: styles.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxSizing: 'border-box'
      }}
    >
      {/* Header with Logo & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '10px',
              background: isLight ? 'rgba(244, 114, 182, 0.1)' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: isLight ? '1px solid rgba(244, 114, 182, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <DevLensLogo size={22} showText={false} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.3px', color: styles.text }}>
              DevLens
            </div>
            <div style={{ fontSize: '11px', color: styles.subtext, fontWeight: 500 }}>Web Developer Suite</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: isRestrictedTab ? '#d97706' : '#059669',
              background: isRestrictedTab ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: isRestrictedTab ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              padding: '3px 8px',
              borderRadius: '20px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isRestrictedTab ? '#f59e0b' : '#10b981',
                boxShadow: isRestrictedTab ? '0 0 6px #f59e0b' : '0 0 6px #10b981'
              }}
            />
            {isRestrictedTab ? 'Restricted' : 'Active'}
          </span> */}

          <button
            onClick={toggleTheme}
            style={{
              background: styles.iconBtnBg,
              border: styles.iconBtnBorder,
              borderRadius: '8px',
              padding: '6px',
              color: styles.iconBtnColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} mode`}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            onClick={openSettings}
            style={{
              background: styles.iconBtnBg,
              border: styles.iconBtnBorder,
              borderRadius: '8px',
              padding: '6px',
              color: styles.iconBtnColor,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            title="DevLens Options"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Restricted Tab Notice */}
      {isRestrictedTab ? (
        <div
          style={{
            background: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.1)',
            border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '12px',
            lineHeight: 1.5,
            color: styles.text
          }}
        >
          <div style={{ fontWeight: 700, color: '#d97706', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Restricted Webpage
          </div>
          Chrome policy prevents running content scripts on internal <code>chrome://</code> pages or Web Store.
          <div style={{ marginTop: '8px', color: styles.subtext, fontSize: '11px' }}>
            👉 Open any website (e.g. <code>google.com</code> or <code>localhost</code>) to launch DevLens.
          </div>
        </div>
      ) : (
        <>
          {/* Main Hero Launch Button */}
          <button
            onClick={() => triggerToolOnActiveTab(null)}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.35)';
            }}
          >
            <Zap size={16} fill="#ffffff" /> Toggle DevLens Floating Toolbar
          </button>

          {/* Quick Launch Tools Grid */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: styles.subtext, marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              QUICK TOOL LAUNCH
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'inspect', name: 'Element Inspector', icon: MousePointerClick, color: isLight ? '#0284c7' : '#38bdf8' },
                { id: 'color', name: 'Color Picker', icon: Palette, color: isLight ? '#db2777' : '#ec4899' },
                { id: 'typography', name: 'Font Inspector', icon: Type, color: isLight ? '#9333ea' : '#a855f7' },
                { id: 'perf-hud', name: 'Web Vitals HUD', icon: Gauge, color: isLight ? '#059669' : '#10b981' },
                { id: 'storage', name: 'Storage & Cookies', icon: Database, color: isLight ? '#7c3aed' : '#8b5cf6' },
                { id: 'image-inspector', name: 'Asset & Image Inspector', icon: ImageIcon, color: isLight ? '#0284c7' : '#38bdf8' },
                { id: 'screenshot', name: 'Screenshot Tool', icon: Camera, color: isLight ? '#059669' : '#34d399' },
                { id: 'measure', name: 'Measure Distance', icon: Ruler, color: isLight ? '#d97706' : '#fbbf24' },
                { id: 'network', name: 'API Inspector', icon: Radio, color: isLight ? '#2563eb' : '#60a5fa' }
              ].map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => triggerToolOnActiveTab(tool.id as ActiveTool)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background: styles.toolBtnBg,
                      border: styles.toolBtnBorder,
                      borderRadius: '8px',
                      color: styles.toolBtnText,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = styles.toolBtnHoverBg;
                      e.currentTarget.style.borderColor = tool.color;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = styles.toolBtnBg;
                      e.currentTarget.style.borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <IconComponent size={14} style={{ color: tool.color, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts & Reload */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={reloadActiveTab}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: styles.subtext,
                fontSize: '11px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = styles.text;
                e.currentTarget.style.borderColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = styles.subtext;
                e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)';
              }}
              title="Reload tab to inject content scripts if newly installed"
            >
              <RotateCw size={12} /> Reload Active Tab
            </button>
          </div>

          {/* Glassmorphic Recent Activity Card */}
          <div
            style={{
              background: styles.cardBg,
              border: styles.cardBorder,
              borderRadius: '10px',
              padding: '12px',
              boxShadow: styles.cardShadow
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: styles.subtext, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              <Activity size={12} style={{ color: isLight ? '#0284c7' : '#38bdf8' }} /> RECENT ACTIVITY
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              {recentColor ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: styles.subtext, fontWeight: 500 }}>Last Picked Color:</span>
                  <button
                    onClick={() => copyColorHex(recentColor.color.hex)}
                    style={{
                      background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      color: styles.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                    title="Click to copy HEX"
                  >
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        background: recentColor.color.hex,
                        boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                      }}
                    />
                    {recentColor.color.hex}
                    {copiedColor ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} style={{ color: styles.subtext }} />}
                  </button>
                </div>
              ) : (
                <div style={{ color: styles.subtext, fontSize: '11px' }}>No color history yet</div>
              )}

              {recentScreenshot ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: styles.subtext, fontWeight: 500 }}>Last Screenshot:</span>
                  <span style={{ fontSize: '10px', color: isLight ? '#059669' : '#34d399', background: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(52, 211, 153, 0.15)', padding: '2px 6px', borderRadius: '4px', border: isLight ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(52, 211, 153, 0.3)' }}>
                    {recentScreenshot.mode} ({recentScreenshot.format})
                  </span>
                </div>
              ) : (
                <div style={{ color: styles.subtext, fontSize: '11px' }}>No screenshot captured yet</div>
              )}
            </div>
          </div>

          {/* Developer Credit Footer Card */}
          <div
            style={{
              background: styles.cardBg,
              border: styles.cardBorder,
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: styles.cardShadow
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Code2 size={14} style={{ color: isLight ? '#0284c7' : '#38bdf8' }} />
                <span style={{ fontSize: '12px', color: styles.subtext, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Developed by <strong style={{ color: styles.text, fontWeight: 700 }}>Sahil Kumar</strong>
                </span>
              </div>
              <span style={{ fontSize: '10px', color: styles.subtext, fontWeight: 600, background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>DevLens Suite</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href="https://in.linkedin.com/in/sahil-kumar-sahoo"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: isLight ? '#e0f2fe' : 'rgba(10, 102, 194, 0.18)',
                  border: isLight ? '1px solid #bae6fd' : '1px solid rgba(10, 102, 194, 0.4)',
                  color: isLight ? '#0284c7' : '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#bae6fd' : 'rgba(10, 102, 194, 0.35)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? '#e0f2fe' : 'rgba(10, 102, 194, 0.18)')}
              >
                <Linkedin size={12} /> LinkedIn
              </a>

              <a
                href="https://www.instagram.com/sahil_kumar_016/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: isLight ? '#fce7f3' : 'rgba(225, 48, 108, 0.18)',
                  border: isLight ? '1px solid #fbcfe8' : '1px solid rgba(225, 48, 108, 0.4)',
                  color: isLight ? '#db2777' : '#f472b6',
                  fontSize: '11px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isLight ? '#fbcfe8' : 'rgba(225, 48, 108, 0.35)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = isLight ? '#fce7f3' : 'rgba(225, 48, 108, 0.18)')}
              >
                <Instagram size={12} /> Instagram
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
