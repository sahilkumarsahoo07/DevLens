import React, { useState, useEffect } from 'react';
import { DevLensSettings } from '../shared/types';
import { getSettings, saveSettings } from '../shared/utils/storageUtils';
import { DevLensLogo } from '../shared/components/DevLensLogo';
import {
  Sliders,
  Sun,
  Camera,
  Search,
  Keyboard,
  Bot,
  ShieldCheck,
  Check,
  Code2,
  Linkedin,
  Instagram
} from 'lucide-react';

export const OptionsApp: React.FC = () => {
  const [settings, setSettings] = useState<DevLensSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'appearance' | 'screenshot' | 'inspector' | 'shortcuts' | 'ai' | 'privacy'>('appearance');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  if (!settings) return null;

  const handleSave = async (updated: Partial<DevLensSettings>) => {
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    await saveSettings(newSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: <Sun size={16} /> },
    { id: 'screenshot', label: 'Screenshot', icon: <Camera size={16} /> },
    { id: 'inspector', label: 'Inspector', icon: <Search size={16} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} /> },
    { id: 'ai', label: 'AI Assistant', icon: <Bot size={16} /> },
    { id: 'privacy', label: 'Privacy & Data', icon: <ShieldCheck size={16} /> }
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DevLensLogo size={36} showText={false} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>DevLens Settings & Preferences</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Customize your browser toolkit behavior</p>
          </div>
        </div>

        {savedSuccess && (
          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={16} /> Preferences Saved!
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'appearance' | 'screenshot' | 'inspector' | 'shortcuts' | 'ai' | 'privacy')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === tab.id ? '#2563eb' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Sidebar Developer Credit Card */}
          <div
            style={{
              marginTop: '20px',
              padding: '14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={16} style={{ color: '#38bdf8' }} />
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Developed by</div>
                <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 700 }}>Sahil Kumar</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <a
                href="https://in.linkedin.com/in/sahil-kumar-sahoo"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'rgba(10, 102, 194, 0.2)',
                  border: '1px solid rgba(10, 102, 194, 0.4)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <Linkedin size={13} /> LinkedIn Profile
              </a>

              <a
                href="https://www.instagram.com/sahil_kumar_016/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'rgba(225, 48, 108, 0.2)',
                  border: '1px solid rgba(225, 48, 108, 0.4)',
                  color: '#f472b6',
                  fontSize: '11px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <Instagram size={13} /> Instagram (@sahil_kumar_016)
              </a>
            </div>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="devlens-panel" style={{ position: 'relative', width: '100%' }}>
          <div className="devlens-panel-header">
            <div className="devlens-panel-title" style={{ textTransform: 'capitalize' }}>
              <Sliders size={16} style={{ color: '#2563eb' }} />
              <span>{activeTab} Settings</span>
            </div>
          </div>

          <div className="devlens-panel-body" style={{ padding: '20px' }}>
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                    THEME MODE
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleSave({ theme: t })}
                        className={`devlens-btn ${settings.theme === t ? 'devlens-btn-primary' : 'devlens-btn-secondary'}`}
                        style={{ textTransform: 'capitalize', padding: '8px 16px' }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'screenshot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                    DEFAULT FORMAT
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => handleSave({ screenshotFormat: fmt })}
                        className={`devlens-btn ${settings.screenshotFormat === fmt ? 'devlens-btn-primary' : 'devlens-btn-secondary'}`}
                        style={{ textTransform: 'uppercase', padding: '8px 16px' }}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                    FILENAME PREFIX
                  </label>
                  <input
                    type="text"
                    className="devlens-input"
                    value={settings.filenamePrefix}
                    onChange={(e) => handleSave({ filenamePrefix: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeTab === 'inspector' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showDimensionsOnHover}
                    onChange={(e) => handleSave({ showDimensionsOnHover: e.target.checked })}
                  />
                  <span>Show element dimensions badge on mouse hover</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showCSSInInspector}
                    onChange={(e) => handleSave({ showCSSInInspector: e.target.checked })}
                  />
                  <span>Show computed CSS properties in inspector</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.showSelectorsInInspector}
                    onChange={(e) => handleSave({ showSelectorsInInspector: e.target.checked })}
                  />
                  <span>Show CSS unique selector paths</span>
                </label>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Shortcuts can also be customized directly in Chrome at <code>chrome://extensions/shortcuts</code>
                </p>
                {[
                  { key: 'Alt + Shift + D', desc: 'Toggle DevLens Toolbar' },
                  { key: 'Alt + Shift + I', desc: 'Element Inspector' },
                  { key: 'Alt + Shift + F', desc: 'Typography Inspector' },
                  { key: 'Alt + Shift + C', desc: 'Color Picker' },
                  { key: 'Alt + Shift + S', desc: 'Visible Screenshot' },
                  { key: 'Alt + Shift + M', desc: 'Measurement Ruler' },
                  { key: 'Alt + Shift + R', desc: 'Responsive Tester' },
                  { key: 'Alt + Shift + A', desc: 'Accessibility Auditor' },
                  { key: 'Ctrl/Cmd + K', desc: 'Command Palette Overlay' },
                  { key: 'Escape', desc: 'Close Active Tool / Extension' }
                ].map((sc) => (
                  <div
                    key={sc.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#0f172a',
                      padding: '8px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    <span>{sc.desc}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8' }}>{sc.key}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                    AI PROVIDER
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleSave({ aiProvider: 'mock' })}
                      className={`devlens-btn ${settings.aiProvider === 'mock' ? 'devlens-btn-primary' : 'devlens-btn-secondary'}`}
                    >
                      Mock Offline Provider
                    </button>
                    <button
                      onClick={() => handleSave({ aiProvider: 'openai' })}
                      className={`devlens-btn ${settings.aiProvider === 'openai' ? 'devlens-btn-primary' : 'devlens-btn-secondary'}`}
                    >
                      OpenAI API
                    </button>
                  </div>
                </div>

                {settings.aiProvider === 'openai' && (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        OPENAI API KEY
                      </label>
                      <input
                        type="password"
                        className="devlens-input"
                        placeholder="sk-..."
                        value={settings.aiApiKey}
                        onChange={(e) => handleSave({ aiApiKey: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        COMPLETIONS ENDPOINT
                      </label>
                      <input
                        type="text"
                        className="devlens-input"
                        value={settings.aiEndpoint}
                        onChange={(e) => handleSave({ aiEndpoint: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'privacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', lineHeight: 1.6 }}>
                <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#10b981' }}>100% Privacy Preserving Architecture</h3>
                  <p style={{ margin: 0, color: '#94a3b8' }}>
                    DevLens runs completely client-side inside your browser. No browsing history, page contents, DOM data, or captured screenshots are collected or sent to external servers unless you explicitly ask the AI assistant while using your own configured API key.
                  </p>
                </div>

                <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px' }}>Permissions Explanation</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8' }}>
                    <li><strong>activeTab:</strong> Allows inspecting element styles and capturing screenshots on the tab you trigger DevLens on.</li>
                    <li><strong>storage:</strong> Stores your local settings, screenshot history, and recent picked color palette locally.</li>
                    <li><strong>scripting:</strong> Injects the floating DevLens toolbar overlay into the active page when requested.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
