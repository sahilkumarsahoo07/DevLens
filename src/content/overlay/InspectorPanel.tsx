import React, { useState } from 'react';
import { ElementData } from '../../shared/types';
import { formatCssMap } from '../../shared/utils/cssUtils';
import { cssToTailwind } from '../../shared/utils/tailwindUtils';
import { X, Copy, Check, MousePointer } from 'lucide-react';

interface InspectorPanelProps {
  elementData: ElementData | null;
  onClose: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ elementData, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'styles' | 'box-model' | 'tailwind'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formattedCSS = elementData ? formatCssMap(elementData.computedStyles) : '';
  const tailwindClasses = elementData
    ? cssToTailwind(
        elementData.computedStyles,
        elementData.typography,
        elementData.boxModel,
        elementData.layout
      )
    : '';

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '380px',
        maxHeight: 'calc(100vh - 100px)'
      }}
    >
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          {elementData ? (
            <>
              <span style={{ color: 'var(--dl-primary)', fontFamily: 'monospace' }}>
                &lt;{elementData.tagName}&gt;
              </span>
              {elementData.id && <span style={{ color: 'var(--dl-accent)' }}>#{elementData.id}</span>}
            </>
          ) : (
            <span>Element Inspector</span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Active Guide Banner */}
      <div style={{ padding: '10px 14px 0 14px' }}>
        <div className="devlens-active-banner">
          <MousePointer size={18} style={{ color: 'var(--dl-primary)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--dl-primary)', marginBottom: '2px' }}>
              Inspector Tool Active
            </div>
            <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', lineHeight: '1.3' }}>
              Hover over any element on the webpage and click to inspect its HTML, CSS styles, Box Model, and Tailwind classes.
            </div>
          </div>
        </div>
      </div>

      {elementData ? (
        <>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--dl-border)',
              background: 'var(--dl-bg)',
              marginTop: '10px'
            }}
          >
            {(['overview', 'styles', 'box-model', 'tailwind'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: 'none',
                  background: activeTab === tab ? 'var(--dl-bg-surface)' : 'transparent',
                  color: activeTab === tab ? 'var(--dl-primary)' : 'var(--dl-text-muted)',
                  borderBottom: activeTab === tab ? '2px solid var(--dl-primary)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="devlens-panel-body">
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', marginBottom: '4px' }}>
                    SELECTOR
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--dl-bg)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {elementData.selector}
                    </span>
                    <button
                      className="devlens-btn devlens-btn-secondary"
                      onClick={() => copyToClipboard(elementData.selector, 'selector')}
                      style={{ padding: '2px 6px' }}
                    >
                      {copiedKey === 'selector' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', marginBottom: '4px' }}>
                    XPATH
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--dl-bg)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px'
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {elementData.xpath}
                    </span>
                    <button
                      className="devlens-btn devlens-btn-secondary"
                      onClick={() => copyToClipboard(elementData.xpath, 'xpath')}
                      style={{ padding: '2px 6px' }}
                    >
                      {copiedKey === 'xpath' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'var(--dl-bg)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)' }}>DIMENSIONS</div>
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>
                      {elementData.rect.width} × {elementData.rect.height} px
                    </div>
                  </div>
                  <div style={{ background: 'var(--dl-bg)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)' }}>POSITION</div>
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>
                      X: {elementData.rect.x} | Y: {elementData.rect.y}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', marginBottom: '4px' }}>
                    OUTER HTML
                  </div>
                  <div className="devlens-code-block">{elementData.outerHTML}</div>
                  <button
                    className="devlens-btn devlens-btn-secondary"
                    onClick={() => copyToClipboard(elementData.outerHTML, 'html')}
                    style={{ marginTop: '6px', width: '100%' }}
                  >
                    {copiedKey === 'html' ? <Check size={14} /> : <Copy size={14} />} Copy HTML
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'styles' && (
              <div>
                <div className="devlens-code-block">{formattedCSS}</div>
                <button
                  className="devlens-btn devlens-btn-primary"
                  onClick={() => copyToClipboard(formattedCSS, 'css')}
                  style={{ marginTop: '10px', width: '100%' }}
                >
                  {copiedKey === 'css' ? <Check size={14} /> : <Copy size={14} />} Copy Formatted CSS
                </button>
              </div>
            )}

            {activeTab === 'box-model' && (
              <div className="devlens-box-model-container">
                <div className="box-margin">
                  <div style={{ fontSize: '10px', color: 'var(--dl-warning)', fontWeight: 600 }}>MARGIN</div>
                  <div style={{ fontSize: '10px' }}>{elementData.boxModel.marginTop}</div>
                  <div className="box-border">
                    <div style={{ fontSize: '10px', color: 'var(--dl-accent)', fontWeight: 600 }}>BORDER</div>
                    <div style={{ fontSize: '10px' }}>{elementData.boxModel.borderTopWidth}</div>
                    <div className="box-padding">
                      <div style={{ fontSize: '10px', color: 'var(--dl-success)', fontWeight: 600 }}>PADDING</div>
                      <div style={{ fontSize: '10px' }}>{elementData.boxModel.paddingTop}</div>
                      <div className="box-content">
                        {elementData.boxModel.width} × {elementData.boxModel.height}
                      </div>
                      <div style={{ fontSize: '10px' }}>{elementData.boxModel.paddingBottom}</div>
                    </div>
                    <div style={{ fontSize: '10px' }}>{elementData.boxModel.borderBottomWidth}</div>
                  </div>
                  <div style={{ fontSize: '10px' }}>{elementData.boxModel.marginBottom}</div>
                </div>
              </div>
            )}

            {activeTab === 'tailwind' && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', marginBottom: '6px' }}>
                  TAILWIND EQUIVALENT CLASSES
                </div>
                <div className="devlens-code-block" style={{ color: '#38bdf8' }}>
                  {tailwindClasses}
                </div>
                <button
                  className="devlens-btn devlens-btn-primary"
                  onClick={() => copyToClipboard(tailwindClasses, 'tailwind')}
                  style={{ marginTop: '10px', width: '100%' }}
                >
                  {copiedKey === 'tailwind' ? <Check size={14} /> : <Copy size={14} />} Copy Tailwind
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--dl-text-muted)', fontSize: '12px' }}>
          Click any element on the webpage to view its properties and CSS styles.
        </div>
      )}
    </div>
  );
};

