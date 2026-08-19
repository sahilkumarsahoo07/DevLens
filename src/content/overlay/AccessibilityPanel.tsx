import React, { useState, useEffect } from 'react';
import { A11yReport } from '../../shared/types';
import { runAccessibilityAudit } from '../../shared/utils/accessibilityUtils';
import { Accessibility, X, AlertTriangle, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface AccessibilityPanelProps {
  onClose: () => void;
  onHighlightElement?: (selector: string) => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  onClose,
  onHighlightElement
}) => {
  const [report, setReport] = useState<A11yReport | null>(null);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all');

  const runAudit = () => {
    setReport(runAccessibilityAudit());
  };

  useEffect(() => {
    runAudit();
  }, []);

  if (!report) return null;

  const filteredIssues = report.issues.filter(
    (issue) => filter === 'all' || issue.type === filter
  );

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
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          <Accessibility size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Accessibility Checker</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={runAudit}
            title="Re-run audit"
            style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Score Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <div
            onClick={() => setFilter('all')}
            style={{
              background: 'var(--dl-bg)',
              padding: '8px',
              borderRadius: '6px',
              textAlign: 'center',
              cursor: 'pointer',
              border: filter === 'all' ? '1px solid var(--dl-primary)' : '1px solid transparent'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)' }}>SCORE</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--dl-success)' }}>
              {report.summary.pass}%
            </div>
          </div>

          <div
            onClick={() => setFilter('error')}
            style={{
              background: 'var(--dl-bg)',
              padding: '8px',
              borderRadius: '6px',
              textAlign: 'center',
              cursor: 'pointer',
              border: filter === 'error' ? '1px solid var(--dl-danger)' : '1px solid transparent'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)' }}>ERRORS</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--dl-danger)' }}>
              {report.summary.error}
            </div>
          </div>

          <div
            onClick={() => setFilter('warning')}
            style={{
              background: 'var(--dl-bg)',
              padding: '8px',
              borderRadius: '6px',
              textAlign: 'center',
              cursor: 'pointer',
              border: filter === 'warning' ? '1px solid var(--dl-warning)' : '1px solid transparent'
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)' }}>WARNINGS</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--dl-warning)' }}>
              {report.summary.warning}
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {filteredIssues.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--dl-text-muted)',
                fontSize: '12px'
              }}
            >
              <CheckCircle size={24} style={{ color: 'var(--dl-success)', marginBottom: '8px' }} />
              <div>No accessibility issues found for this filter!</div>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onHighlightElement?.(issue.elementSelector)}
                style={{
                  background: 'var(--dl-bg)',
                  border: `1px solid ${issue.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {issue.type === 'error' ? (
                    <AlertCircle size={14} style={{ color: 'var(--dl-danger)' }} />
                  ) : (
                    <AlertTriangle size={14} style={{ color: 'var(--dl-warning)' }} />
                  )}
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>{issue.category}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      background: 'var(--dl-bg-surface)',
                      padding: '2px 4px',
                      borderRadius: '3px',
                      marginLeft: 'auto'
                    }}
                  >
                    &lt;{issue.elementTag}&gt;
                  </span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dl-text)', marginBottom: '4px' }}>
                  {issue.problem}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', marginBottom: '6px' }}>
                  <strong>Why it matters:</strong> {issue.whyItMatters}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--dl-primary)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '4px 6px',
                    borderRadius: '4px'
                  }}
                >
                  💡 <strong>Suggested Fix:</strong> {issue.suggestedFix}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
