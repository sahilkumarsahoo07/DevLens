import React, { useState, useEffect } from 'react';
import { PageAnalysisData } from '../../shared/types';
import { analyzePage } from '../../shared/utils/pageAnalyzer';
import {
  BarChart2,
  X,
  Globe,
  Cpu,
  Zap,
  Search,
  Type,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Share2
} from 'lucide-react';

interface PageAnalyzerPanelProps {
  onClose: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // Green
  if (score >= 50) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

export const PageAnalyzerPanel: React.FC<PageAnalyzerPanelProps> = ({ onClose }) => {
  const [data, setData] = useState<PageAnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<'lighthouse' | 'stack' | 'performance' | 'seo'>('lighthouse');

  useEffect(() => {
    setData(analyzePage());
  }, []);

  if (!data) return null;

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '420px',
        maxHeight: 'calc(100vh - 100px)'
      }}
    >
      {/* Header */}
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          <BarChart2 size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Page Tech & Overview Analyzer</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Page Meta Header Banner */}
        <div
          style={{
            background: 'var(--dl-bg)',
            border: '1px solid var(--dl-border)',
            padding: '10px 12px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--dl-text)', lineHeight: 1.3 }}>
            {data.title || 'Untitled Page'}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--dl-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <Globe size={12} style={{ color: 'var(--dl-primary)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.url}</span>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--dl-border)', paddingBottom: '6px', gap: '4px' }}>
          {[
            { id: 'lighthouse', label: 'Lighthouse', icon: ShieldCheck },
            { id: 'stack', label: 'Tech Stack', icon: Cpu },
            { id: 'performance', label: 'Performance', icon: Zap },
            { id: 'seo', label: 'SEO & Meta', icon: Search }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'var(--dl-primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--dl-text-muted)',
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={12} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 0: LIGHTHOUSE AUDIT SCORES & CORE WEB VITALS */}
        {activeTab === 'lighthouse' && data.lighthouse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              LIGHTHOUSE AUDIT SCORES
            </div>

            {/* 4 Score Gauges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
              {[
                { label: 'Performance', score: data.lighthouse.performance },
                { label: 'Accessibility', score: data.lighthouse.accessibility },
                { label: 'Best Practices', score: data.lighthouse.bestPractices },
                { label: 'SEO Audit', score: data.lighthouse.seo }
              ].map((item) => {
                const color = getScoreColor(item.score);
                return (
                  <div
                    key={item.label}
                    style={{
                      background: 'var(--dl-bg)',
                      border: `1.5px solid ${color}`,
                      borderRadius: '8px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: `${color}15`,
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '14px'
                      }}
                    >
                      {item.score}
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--dl-text)', textAlign: 'center' }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Core Web Vitals Breakdown */}
            {data.webVitals && (
              <div style={{ borderTop: '1px solid var(--dl-border)', paddingTop: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  CORE WEB VITALS METRICS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                  <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dl-text-muted)' }}>First Contentful Paint (FCP):</span>
                    <strong style={{ color: data.webVitals.fcpMs < 1800 ? '#10b981' : '#f59e0b' }}>
                      {data.webVitals.fcpMs} ms
                    </strong>
                  </div>
                  <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dl-text-muted)' }}>Largest Contentful Paint (LCP):</span>
                    <strong style={{ color: data.webVitals.lcpMs < 2500 ? '#10b981' : '#f59e0b' }}>
                      {data.webVitals.lcpMs} ms
                    </strong>
                  </div>
                  <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dl-text-muted)' }}>Total Blocking Time (TBT):</span>
                    <strong style={{ color: data.webVitals.tbtMs < 200 ? '#10b981' : '#f59e0b' }}>
                      {data.webVitals.tbtMs} ms
                    </strong>
                  </div>
                  <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dl-text-muted)' }}>Time to First Byte (TTFB):</span>
                    <strong style={{ color: '#10b981' }}>{data.webVitals.ttfbMs} ms</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: TECH STACK */}
        {activeTab === 'stack' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              DETECTED FRAMEWORKS & LIBRARIES ({data.technologies.length})
            </div>

            {data.technologies.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', fontStyle: 'italic', padding: '10px', background: 'var(--dl-bg)', borderRadius: '6px' }}>
                No standard public client-side framework detected. Standard HTML/CSS rendering.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {data.technologies.map((tech) => (
                  <div
                    key={tech.name}
                    style={{
                      background: 'var(--dl-bg)',
                      border: '1px solid var(--dl-border)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--dl-text)' }}>{tech.name}</span>
                    <span style={{ fontSize: '9px', color: 'var(--dl-primary)', fontWeight: 600 }}>{tech.category}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Loaded Fonts */}
            {data.fonts.length > 0 && (
              <div style={{ borderTop: '1px solid var(--dl-border)', paddingTop: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Type size={12} /> ACTIVE WEBPAGE FONTS ({data.fonts.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {data.fonts.map((f) => (
                    <span
                      key={f}
                      style={{
                        background: 'var(--dl-bg)',
                        border: '1px solid var(--dl-border)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--dl-text)'
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOM & PERFORMANCE */}
        {activeTab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Overview Counters Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <div style={{ background: 'var(--dl-bg)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>DOM NODES</div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--dl-primary)' }}>{data.domCount}</div>
              </div>
              <div style={{ background: 'var(--dl-bg)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>SCRIPTS</div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--dl-accent)' }}>{data.scriptCount}</div>
              </div>
              <div style={{ background: 'var(--dl-bg)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>IMAGES/SVG</div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#10b981' }}>{data.imageCount}</div>
              </div>
            </div>

            {/* Performance Stats */}
            {data.performance && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                <div style={{ background: 'var(--dl-bg)', padding: '8px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>Load Time:</span>
                  <strong style={{ color: '#10b981' }}>{data.performance.loadTimeMs} ms</strong>
                </div>
                <div style={{ background: 'var(--dl-bg)', padding: '8px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>DOM Interactive:</span>
                  <strong>{data.performance.domInteractiveMs} ms</strong>
                </div>
                <div style={{ background: 'var(--dl-bg)', padding: '8px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>Max DOM Depth:</span>
                  <strong>{data.performance.domDepth} levels</strong>
                </div>
                {data.performance.jsHeapMb !== undefined && (
                  <div style={{ background: 'var(--dl-bg)', padding: '8px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--dl-text-muted)' }}>JS Heap Memory:</span>
                    <strong>{data.performance.jsHeapMb} MB</strong>
                  </div>
                )}
              </div>
            )}

            {/* Additional Resource Counts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
              <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--dl-text-muted)' }}>Stylesheets: </span>
                <strong>{data.stylesheetCount}</strong>
              </div>
              <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--dl-text-muted)' }}>iFrames: </span>
                <strong>{data.iframeCount}</strong>
              </div>
              <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--dl-text-muted)' }}>Viewport Size: </span>
                <strong>{data.viewport}</strong>
              </div>
              <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px' }}>
                <span style={{ color: 'var(--dl-text-muted)' }}>Protocol: </span>
                <strong>{data.performance?.protocol || 'h2'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADVANCED SEO & SOCIAL META */}
        {activeTab === 'seo' && data.seo && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
            {/* Meta Title */}
            <div style={{ background: 'var(--dl-bg)', border: '1px solid var(--dl-border)', padding: '8px 10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>META TITLE ({data.seo.metaTitle.length} chars)</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dl-text)', marginTop: '2px' }}>
                {data.seo.metaTitle || <span style={{ color: '#ef4444' }}>Missing Meta Title</span>}
              </div>
            </div>

            {/* Meta Description */}
            <div style={{ background: 'var(--dl-bg)', border: '1px solid var(--dl-border)', padding: '8px 10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>META DESCRIPTION ({data.seo.metaDescription.length} chars)</div>
              <div style={{ fontSize: '11px', color: data.seo.metaDescription ? 'var(--dl-text)' : '#ef4444', marginTop: '2px' }}>
                {data.seo.metaDescription || 'Missing meta description attribute'}
              </div>
            </div>

            {/* Open Graph & Twitter Cards */}
            <div style={{ borderTop: '1px solid var(--dl-border)', paddingTop: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Share2 size={12} /> OPEN GRAPH & SOCIAL METADATA
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>og:image:</span>
                  <strong>{data.seo.ogImage ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />}</strong>
                </div>
                <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>twitter:card:</span>
                  <strong>{data.seo.twitterCard || <span style={{ color: '#f59e0b' }}>not specified</span>}</strong>
                </div>
                <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>Canonical URL:</span>
                  <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', whiteSpace: 'nowrap' }}>
                    {data.seo.canonicalUrl || <span style={{ color: '#ef4444' }}>Missing</span>}
                  </strong>
                </div>
                <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>Robots Meta:</span>
                  <strong>{data.seo.robots || 'index, follow (default)'}</strong>
                </div>
                <div style={{ background: 'var(--dl-bg)', padding: '6px 8px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>Schema.org JSON-LD:</span>
                  <strong>{data.seo.hasSchemaOrg ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <AlertTriangle size={14} style={{ color: '#f59e0b' }} />}</strong>
                </div>
              </div>
            </div>

            {/* Headings Hierarchy */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
              <div style={{ background: 'var(--dl-bg)', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)' }}>H1 TAGS</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: data.seo.h1Count === 1 ? '#10b981' : '#f59e0b' }}>
                  {data.seo.h1Count} {data.seo.h1Count === 1 ? '✓' : ''}
                </div>
              </div>
              <div style={{ background: 'var(--dl-bg)', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)' }}>H2 TAGS</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--dl-primary)' }}>{data.seo.h2Count}</div>
              </div>
              <div style={{ background: 'var(--dl-bg)', padding: '6px', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', color: 'var(--dl-text-muted)' }}>H3 TAGS</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--dl-accent)' }}>{data.seo.h3Count}</div>
              </div>
            </div>

            {/* Images without Alt attributes */}
            <div style={{ background: 'var(--dl-bg)', border: '1px solid var(--dl-border)', padding: '8px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'var(--dl-text)' }}>Images missing ALT text:</span>
              <span style={{ fontWeight: 700, fontSize: '12px', color: data.seo.missingAltCount > 0 ? '#f59e0b' : '#10b981' }}>
                {data.seo.missingAltCount} of {data.seo.totalImages} images
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
