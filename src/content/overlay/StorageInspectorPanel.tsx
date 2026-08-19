import React, { useState, useEffect } from 'react';
import { Database, Search, Trash2, Plus, RefreshCw, X, Copy, Check, Key, Code2 } from 'lucide-react';

interface StorageInspectorPanelProps {
  onClose: () => void;
}

interface StorageItem {
  key: string;
  value: string;
  isJson: boolean;
  formattedValue: string;
}

function tryFormatJson(val: string): { isJson: boolean; formatted: string } {
  if (!val || typeof val !== 'string') return { isJson: false, formatted: val };
  const trimmed = val.trim();
  if ((!trimmed.startsWith('{') && !trimmed.startsWith('[')) && (!trimmed.startsWith('"') && !trimmed.includes('{'))) {
    return { isJson: false, formatted: val };
  }

  try {
    let parsed = JSON.parse(val);
    // Handle double-escaped JSON string (e.g. "\"{\\\"a\\\":1}\"")
    if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) {
      try {
        parsed = JSON.parse(parsed);
      } catch (_) {}
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return { isJson: true, formatted: JSON.stringify(parsed, null, 2) };
    }
  } catch (_) {}

  return { isJson: false, formatted: val };
}

export const StorageInspectorPanel: React.FC<StorageInspectorPanelProps> = ({ onClose }) => {
  const [storageType, setStorageType] = useState<'local' | 'session' | 'cookie'>('local');
  const [items, setItems] = useState<StorageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rawViewKeys, setRawViewKeys] = useState<Record<string, boolean>>({});

  // New item form state
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadStorageData = () => {
    const list: StorageItem[] = [];

    try {
      if (storageType === 'local') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const rawVal = localStorage.getItem(key) || '';
            const { isJson, formatted } = tryFormatJson(rawVal);
            list.push({ key, value: rawVal, isJson, formattedValue: formatted });
          }
        }
      } else if (storageType === 'session') {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            const rawVal = sessionStorage.getItem(key) || '';
            const { isJson, formatted } = tryFormatJson(rawVal);
            list.push({ key, value: rawVal, isJson, formattedValue: formatted });
          }
        }
      } else if (storageType === 'cookie') {
        const cookies = document.cookie ? document.cookie.split(';') : [];
        cookies.forEach((c) => {
          const [k, ...v] = c.trim().split('=');
          if (k) {
            const rawVal = v.join('=');
            const { isJson, formatted } = tryFormatJson(rawVal);
            list.push({ key: k, value: rawVal, isJson, formattedValue: formatted });
          }
        });
      }
    } catch (e) {
      console.warn('[DevLens Storage] Failed to access storage:', e);
    }

    setItems(list);
  };

  useEffect(() => {
    loadStorageData();
  }, [storageType]);

  const toggleRawFormat = (key: string) => {
    setRawViewKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    try {
      if (storageType === 'local') {
        localStorage.setItem(newKey, newValue);
      } else if (storageType === 'session') {
        sessionStorage.setItem(newKey, newValue);
      } else if (storageType === 'cookie') {
        document.cookie = `${encodeURIComponent(newKey)}=${encodeURIComponent(newValue)}; path=/`;
      }
    } catch (err) {
      console.error('[DevLens Storage] Add item error:', err);
    }

    setNewKey('');
    setNewValue('');
    setIsAdding(false);
    loadStorageData();
  };

  const handleDeleteItem = (key: string) => {
    try {
      if (storageType === 'local') {
        localStorage.removeItem(key);
      } else if (storageType === 'session') {
        sessionStorage.removeItem(key);
      } else if (storageType === 'cookie') {
        document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    } catch (err) {
      console.error('[DevLens Storage] Delete error:', err);
    }
    loadStorageData();
  };

  const handleClearAll = () => {
    if (!confirm(`Are you sure you want to clear all ${storageType}Storage entries?`)) return;

    try {
      if (storageType === 'local') {
        localStorage.clear();
      } else if (storageType === 'session') {
        sessionStorage.clear();
      }
    } catch (err) {
      console.error('[DevLens Storage] Clear error:', err);
    }
    loadStorageData();
  };

  const copyValue = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filteredItems = items.filter(
    (item) =>
      item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="devlens-panel"
      style={{
        right: '20px',
        top: '70px',
        width: '480px',
        maxHeight: '85vh',
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        border: '1px solid var(--dl-border)',
        borderRadius: '12px'
      }}
    >
      <div className="devlens-panel-header">
        <div className="devlens-panel-title">
          <Database size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Storage & Cookie Inspector</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadStorageData} className="devlens-btn devlens-btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={onClose} className="devlens-tool-btn" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Storage Type Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--dl-border)', background: 'var(--dl-bg-card)' }}>
        {[
          { type: 'local', label: 'LocalStorage' },
          { type: 'session', label: 'SessionStorage' },
          { type: 'cookie', label: 'Cookies' }
        ].map((t) => (
          <button
            key={t.type}
            onClick={() => setStorageType(t.type as any)}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '11px',
              fontWeight: 600,
              color: storageType === t.type ? 'var(--dl-primary)' : 'var(--dl-text-muted)',
              borderBottom: storageType === t.type ? '2px solid var(--dl-primary)' : 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--dl-border)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--dl-text-muted)' }} />
          <input
            type="text"
            className="devlens-input"
            placeholder={`Search ${storageType} keys or values...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '28px' }}
          />
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="devlens-btn devlens-btn-primary"
          style={{ padding: '6px 10px', fontSize: '11px' }}
        >
          <Plus size={13} /> Add
        </button>

        {storageType !== 'cookie' && (
          <button
            onClick={handleClearAll}
            className="devlens-btn devlens-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '11px', color: '#ef4444' }}
            title="Clear all entries"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Add New Key Form */}
      {isAdding && (
        <form onSubmit={handleAddItem} style={{ padding: '10px 14px', background: 'var(--dl-bg)', borderBottom: '1px solid var(--dl-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input
              type="text"
              className="devlens-input"
              placeholder="Key Name"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              required
            />
            <input
              type="text"
              className="devlens-input"
              placeholder="Value (string or JSON)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button type="button" onClick={() => setIsAdding(false)} className="devlens-btn devlens-btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
              Cancel
            </button>
            <button type="submit" className="devlens-btn devlens-btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }}>
              Save Entry
            </button>
          </div>
        </form>
      )}

      {/* Storage Items List */}
      <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--dl-text-muted)', padding: '24px', fontSize: '12px' }}>
            No {storageType} entries found
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isRawView = rawViewKeys[item.key] || false;
            const displayContent = item.isJson && !isRawView ? item.formattedValue : item.value;

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--dl-bg)',
                  border: '1px solid var(--dl-border)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--dl-primary)', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Key size={13} /> {item.key}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {item.isJson && (
                      <button
                        onClick={() => toggleRawFormat(item.key)}
                        className="devlens-btn devlens-btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '10px', height: '24px', gap: '3px' }}
                        title={isRawView ? 'Format JSON' : 'Show Raw Text'}
                      >
                        <Code2 size={11} /> {isRawView ? 'Format' : 'Raw'}
                      </button>
                    )}

                    <button
                      onClick={() => copyValue(item.key, item.isJson && !isRawView ? item.formattedValue : item.value)}
                      className="devlens-tool-btn"
                      style={{ width: '24px', height: '24px' }}
                      title="Copy Value"
                    >
                      {copiedKey === item.key ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.key)}
                      className="devlens-tool-btn"
                      style={{ width: '24px', height: '24px', color: '#ef4444' }}
                      title="Delete Entry"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <pre
                  style={{
                    margin: 0,
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '11px',
                    lineHeight: '1.45',
                    color: 'var(--dl-text)',
                    background: 'var(--dl-bg-surface)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--dl-border)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {displayContent || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>(empty)</span>}
                </pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
