import React, { useState, useEffect, useMemo } from 'react';
import { NetworkLogItem } from '../../shared/types';
import {
  getGlobalNetworkLogs,
  clearGlobalNetworkLogs,
  isNetworkRecording,
  setNetworkRecording
} from '../../shared/utils/networkTracker';
import {
  Radio,
  X,
  Trash2,
  Pause,
  Play,
  Search,
  Copy,
  Check,
  RotateCw,
  ChevronRight
} from 'lucide-react';

interface NetworkInspectorPanelProps {
  onClose: () => void;
}

export const NetworkInspectorPanel: React.FC<NetworkInspectorPanelProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<NetworkLogItem[]>(() => getGlobalNetworkLogs());
  const [isRecording, setIsRecordingState] = useState<boolean>(() => isNetworkRecording());
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'request' | 'response' | 'curl'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    // Sync initial logs
    setLogs([...getGlobalNetworkLogs()]);

    const handleLogEvent = () => {
      setLogs([...getGlobalNetworkLogs()]);
    };

    const handleClearEvent = () => {
      setLogs([]);
      setSelectedLogId(null);
    };

    window.addEventListener('devlens:network-log', handleLogEvent);
    window.addEventListener('devlens:network-cleared', handleClearEvent);

    return () => {
      window.removeEventListener('devlens:network-log', handleLogEvent);
      window.removeEventListener('devlens:network-cleared', handleClearEvent);
    };
  }, []);

  const handleToggleRecording = () => {
    const nextState = !isRecording;
    setIsRecordingState(nextState);
    setNetworkRecording(nextState);
  };

  const handleClearLogs = () => {
    clearGlobalNetworkLogs();
  };

  const reloadPageAndTrack = () => {
    window.location.reload();
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const selectedLog = logs.find((l) => l.id === selectedLogId) || null;

  // Filtered Logs (Memoized for performance)
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === '' ||
        log.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.status.toString().includes(searchQuery);

      const matchesMethod =
        methodFilter === 'ALL' ||
        (methodFilter === 'ERRORS' ? log.status >= 400 || log.status === 0 : log.method === methodFilter);

      return matchesSearch && matchesMethod;
    });
  }, [logs, searchQuery, methodFilter]);

  const { successCount, errorCount, avgDuration } = useMemo(() => {
    const sCount = logs.filter((l) => l.status >= 200 && l.status < 300).length;
    const eCount = logs.filter((l) => l.status >= 400 || l.status === 0).length;
    const avgMs = logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + l.durationMs, 0) / logs.length) : 0;
    return { successCount: sCount, errorCount: eCount, avgDuration: avgMs };
  }, [logs]);

  const generateCurl = (item: NetworkLogItem) => {
    let curl = `curl -X ${item.method} "${item.url}"`;
    if (item.requestHeaders) {
      Object.entries(item.requestHeaders).forEach(([k, v]) => {
        curl += ` \\\n  -H "${k}: ${v}"`;
      });
    }
    if (item.requestBody) {
      curl += ` \\\n  -d '${item.requestBody}'`;
    }
    return curl;
  };

  const getMethodBadgeStyle = (m: string) => {
    switch (m) {
      case 'GET':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'POST':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'PUT':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'DELETE':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' };
    }
  };

  const getStatusBadgeStyle = (status: number) => {
    if (status >= 200 && status < 300) {
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    } else if (status >= 300 && status < 400) {
      return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
    } else if (status >= 400 || status === 0) {
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    }
    return { bg: 'var(--dl-bg-secondary)', color: 'var(--dl-text-muted)' };
  };

  const formatJsonStr = (raw: string | null | undefined) => {
    if (!raw) return 'No payload content';

    // Strip trailing truncation banner if present for parsing
    let clean = raw;
    let suffix = '';
    const truncIdx = raw.indexOf('\n\n... [Payload truncated');
    if (truncIdx !== -1) {
      clean = raw.substring(0, truncIdx);
      suffix = raw.substring(truncIdx);
    } else if (raw.length > 80000) {
      clean = raw.substring(0, 80000);
      suffix = `\n\n... [Preview capped at 80,000 chars for smooth 60 FPS UI performance. Click 'Copy' above for full payload] ...`;
    }

    // 1. Try native JSON parse & stringify
    try {
      const parsed = JSON.parse(clean);
      const formatted = JSON.stringify(parsed, null, 2);
      if (formatted.length > 80000) {
        return formatted.substring(0, 80000) + `\n\n... [Formatted preview capped for performance] ...` + suffix;
      }
      return formatted + suffix;
    } catch {
      // 2. If truncated mid-object, format with robust indenter regex
      try {
        let formatted = '';
        let indent = 0;
        let inString = false;

        for (let i = 0; i < clean.length; i++) {
          const char = clean[i];
          if (char === '"' && clean[i - 1] !== '\\') {
            inString = !inString;
            formatted += char;
          } else if (!inString) {
            if (char === '{' || char === '[') {
              indent += 2;
              formatted += char + '\n' + ' '.repeat(indent);
            } else if (char === '}' || char === ']') {
              indent = Math.max(0, indent - 2);
              formatted += '\n' + ' '.repeat(indent) + char;
            } else if (char === ',') {
              formatted += char + '\n' + ' '.repeat(indent);
            } else if (char === ':') {
              formatted += ': ';
            } else if (char !== ' ' && char !== '\n' && char !== '\r' && char !== '\t') {
              formatted += char;
            }
          } else {
            formatted += char;
          }
        }
        return formatted + suffix;
      } catch {
        return raw;
      }
    }
  };

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '540px',
        maxHeight: 'calc(100vh - 90px)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Panel Header */}
      <div className="devlens-panel-header" style={{ flexShrink: 0 }}>
        <div className="devlens-panel-title">
          <Radio size={16} style={{ color: '#10b981' }} />
          <span>API & Network Inspector</span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              background: isRecording ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isRecording ? '#10b981' : '#f59e0b',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ● {isRecording ? 'LIVE' : 'PAUSED'}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
        {/* Metric Summary Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '6px',
            background: 'var(--dl-bg)',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid var(--dl-border)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>TOTAL REQUESTS</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--dl-text)' }}>{logs.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>SUCCESS (2XX)</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>{successCount}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>ERRORS (4XX/5XX)</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>{errorCount}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>AVG LATENCY</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{avgDuration} ms</span>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div
            style={{
              flex: 1,
              minWidth: '160px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--dl-bg)',
              border: '1px solid var(--dl-border)',
              borderRadius: '6px',
              padding: '4px 8px'
            }}
          >
            <Search size={12} style={{ color: 'var(--dl-text-muted)' }} />
            <input
              type="text"
              placeholder="Filter endpoint URL or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--dl-text)',
                fontSize: '11px',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

          {/* Record Toggle */}
          <button
            onClick={handleToggleRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--dl-border)',
              background: isRecording ? 'rgba(16, 185, 129, 0.15)' : 'var(--dl-bg)',
              color: isRecording ? '#10b981' : 'var(--dl-text)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isRecording ? <Pause size={12} /> : <Play size={12} />} {isRecording ? 'Pause' : 'Record'}
          </button>

          {/* Reload Page & Track */}
          <button
            onClick={reloadPageAndTrack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--dl-border)',
              background: 'var(--dl-primary)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Reload the page to capture all initial network & API calls"
          >
            <RotateCw size={12} /> Reload & Track
          </button>

          {/* Clear Logs */}
          <button
            onClick={handleClearLogs}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--dl-border)',
              background: 'var(--dl-bg)',
              color: 'var(--dl-danger)',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Clear Network Logs"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Method Filter Pills */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'ERRORS'].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid var(--dl-border)',
                background: methodFilter === m ? 'var(--dl-primary)' : 'var(--dl-bg)',
                color: methodFilter === m ? '#ffffff' : 'var(--dl-text-muted)',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Request List */}
        <div
          style={{
            border: '1px solid var(--dl-border)',
            borderRadius: '8px',
            background: 'var(--dl-bg)',
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--dl-text-muted)', fontSize: '11px' }}>
              {logs.length === 0
                ? 'No real API calls captured yet. Perform actions on the page or click "Reload & Track".'
                : 'No requests match your current search/filter.'}
            </div>
          ) : (
            filteredLogs.map((item) => {
              const isSelected = selectedLogId === item.id;
              const mStyle = getMethodBadgeStyle(item.method);
              const sStyle = getStatusBadgeStyle(item.status);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedLogId(item.id);
                    setActiveTab('overview');
                  }}
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--dl-border)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                    {/* Method Tag */}
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 800,
                        background: mStyle.bg,
                        color: mStyle.color,
                        border: mStyle.border,
                        flexShrink: 0
                      }}
                    >
                      {item.method}
                    </span>

                    {/* Status Tag */}
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 700,
                        background: sStyle.bg,
                        color: sStyle.color,
                        flexShrink: 0
                      }}
                    >
                      {item.status || 'ERR'}
                    </span>

                    {/* URL Path */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--dl-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: 'monospace'
                      }}
                      title={item.url}
                    >
                      {item.url.replace(/^https?:\/\/[^/]+/, '') || item.url}
                    </span>
                  </div>

                  {/* Latency & Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontFamily: 'monospace' }}>
                      {item.durationMs}ms
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--dl-text-muted)' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Request Detail Drawer */}
        {selectedLog && (
          <div
            style={{
              border: '1px solid var(--dl-border)',
              borderRadius: '8px',
              background: 'var(--dl-bg)',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            {/* Drawer Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--dl-border)', paddingBottom: '6px', gap: '6px' }}>
              {(['overview', 'request', 'response', 'curl'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: activeTab === tab ? 'var(--dl-primary)' : 'transparent',
                    color: activeTab === tab ? '#ffffff' : 'var(--dl-text-muted)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>Full URL:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#38bdf8', wordBreak: 'break-all', textAlign: 'right', maxWidth: '340px' }}>
                    {selectedLog.url}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>HTTP Method:</span>
                  <span style={{ fontWeight: 700 }}>{selectedLog.method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>Status Code:</span>
                  <span style={{ fontWeight: 700, color: selectedLog.status >= 200 && selectedLog.status < 300 ? '#10b981' : '#ef4444' }}>
                    {selectedLog.status} {selectedLog.statusText}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>Response Latency:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedLog.durationMs} ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--dl-text-muted)' }}>API Type:</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#8b5cf6' }}>{selectedLog.type}</span>
                </div>
              </div>
            )}

            {/* Request Payload Tab */}
            {activeTab === 'request' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>
                    REQUEST BODY / PAYLOAD <span style={{ fontSize: '9px', opacity: 0.7 }}>(↕ drag bottom corner to resize)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(selectedLog.requestBody || '', 'req')}
                    style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                  >
                    {copiedKey === 'req' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />} Copy
                  </button>
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#38bdf8',
                    fontFamily: 'Consolas, Monaco, monospace',
                    height: '200px',
                    minHeight: '100px',
                    maxHeight: '480px',
                    resize: 'vertical',
                    overflow: 'auto',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    border: '1px solid var(--dl-border)'
                  }}
                >
                  {formatJsonStr(selectedLog.requestBody)}
                </pre>
              </div>
            )}

            {/* Response Payload Tab */}
            {activeTab === 'response' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>
                    RESPONSE BODY <span style={{ fontSize: '9px', opacity: 0.7 }}>(↕ drag bottom corner to resize)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(selectedLog.responseBody || '', 'res')}
                    style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                  >
                    {copiedKey === 'res' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />} Copy
                  </button>
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#10b981',
                    fontFamily: 'Consolas, Monaco, monospace',
                    height: '200px',
                    minHeight: '100px',
                    maxHeight: '480px',
                    resize: 'vertical',
                    overflow: 'auto',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    border: '1px solid var(--dl-border)'
                  }}
                >
                  {formatJsonStr(selectedLog.responseBody)}
                </pre>
              </div>
            )}

            {/* cURL Exporter Tab */}
            {activeTab === 'curl' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontWeight: 600 }}>
                    CURL COMMAND <span style={{ fontSize: '9px', opacity: 0.7 }}>(↕ drag bottom corner to resize)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(generateCurl(selectedLog), 'curl')}
                    style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}
                  >
                    {copiedKey === 'curl' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />} Copy cURL
                  </button>
                </div>
                <pre
                  style={{
                    background: '#090d16',
                    padding: '10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#f59e0b',
                    fontFamily: 'Consolas, Monaco, monospace',
                    height: '140px',
                    minHeight: '80px',
                    maxHeight: '480px',
                    resize: 'vertical',
                    overflow: 'auto',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    border: '1px solid var(--dl-border)'
                  }}
                >
                  {generateCurl(selectedLog)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
