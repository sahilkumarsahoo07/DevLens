import React, { useState, useEffect } from 'react';
import { Square, X, MousePointer, Lock, Unlock, Copy, Check, RotateCcw, Eye, Table } from 'lucide-react';

export interface BoxModelData {
  targetElement?: HTMLElement | null;
  tagName: string;
  className: string;
  id?: string;
  width: number;
  height: number;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  borderTopWidth: string;
  borderRightWidth: string;
  borderBottomWidth: string;
  borderLeftWidth: string;
  borderStyle?: string;
  borderColor?: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  boxSizing: string;
  display?: string;
  position?: string;
  overflow?: string;
  zIndex?: string;
}

interface BoxModelPanelProps {
  data: BoxModelData | null;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onClose: () => void;
}

export const BoxModelPanel: React.FC<BoxModelPanelProps> = ({
  data,
  isLocked = false,
  onToggleLock,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showWebpageOverlay, setShowWebpageOverlay] = useState<boolean>(true);
  const [modifiedProperties, setModifiedProperties] = useState<Record<string, string>>({});
  const [overlayBounds, setOverlayBounds] = useState<any>(null);

  // Parse numeric string value without 'px'
  const cleanVal = (val?: string) => {
    if (!val || val === '0px') return '0';
    return val.replace('px', '');
  };

  // Recalculate overlay bounding rectangles for Webpage highlight layers
  useEffect(() => {
    if (!data?.targetElement || !showWebpageOverlay) {
      setOverlayBounds(null);
      return;
    }

    const updateBounds = () => {
      const el = data.targetElement;
      if (!el || !document.body.contains(el)) {
        setOverlayBounds(null);
        return;
      }

      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      const pTop = parseFloat(style.paddingTop) || 0;
      const pRight = parseFloat(style.paddingRight) || 0;
      const pBottom = parseFloat(style.paddingBottom) || 0;
      const pLeft = parseFloat(style.paddingLeft) || 0;

      const bTop = parseFloat(style.borderTopWidth) || 0;
      const bRight = parseFloat(style.borderRightWidth) || 0;
      const bBottom = parseFloat(style.borderBottomWidth) || 0;
      const bLeft = parseFloat(style.borderLeftWidth) || 0;

      const mTop = parseFloat(style.marginTop) || 0;
      const mRight = parseFloat(style.marginRight) || 0;
      const mBottom = parseFloat(style.marginBottom) || 0;
      const mLeft = parseFloat(style.marginLeft) || 0;

      setOverlayBounds({
        margin: {
          left: rect.left - mLeft,
          top: rect.top - mTop,
          width: rect.width + mLeft + mRight,
          height: rect.height + mTop + mBottom
        },
        border: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        },
        padding: {
          left: rect.left + bLeft,
          top: rect.top + bTop,
          width: Math.max(0, rect.width - (bLeft + bRight)),
          height: Math.max(0, rect.height - (bTop + bBottom))
        },
        content: {
          left: rect.left + bLeft + pLeft,
          top: rect.top + bTop + pTop,
          width: Math.max(0, rect.width - (bLeft + bRight + pLeft + pRight)),
          height: Math.max(0, rect.height - (bTop + bBottom + pTop + pBottom))
        }
      });
    };

    updateBounds();
    window.addEventListener('scroll', updateBounds, { capture: true, passive: true });
    window.addEventListener('resize', updateBounds, { capture: true, passive: true });

    return () => {
      window.removeEventListener('scroll', updateBounds, true);
      window.removeEventListener('resize', updateBounds, true);
    };
  }, [data, showWebpageOverlay, modifiedProperties]);

  // Apply live style mutation on target element
  const handleApplyStyle = (property: string, value: string) => {
    if (!data?.targetElement) return;

    let formattedValue = value.trim();
    if (/^\d+$/.test(formattedValue)) {
      formattedValue += 'px';
    }

    try {
      (data.targetElement.style as any)[property] = formattedValue;
      setModifiedProperties((prev) => ({ ...prev, [property]: formattedValue }));

      // Refresh boxModelData properties locally
      const style = window.getComputedStyle(data.targetElement);
      const rect = data.targetElement.getBoundingClientRect();
      data.width = rect.width;
      data.height = rect.height;
      if (property in data) {
        (data as any)[property] = (style as any)[property] || formattedValue;
      }
    } catch (e) {
      console.warn('Could not set style property:', property, e);
    }
  };

  const handleStartEditing = (field: string, currentVal: string) => {
    setEditingField(field);
    setEditValue(cleanVal(currentVal));
  };

  const handleSaveEdit = (field: string) => {
    if (editValue !== '') {
      handleApplyStyle(field, editValue);
    }
    setEditingField(null);
  };

  const handleResetStyles = () => {
    if (!data?.targetElement) return;
    Object.keys(modifiedProperties).forEach((prop) => {
      (data.targetElement!.style as any)[prop] = '';
    });
    setModifiedProperties({});
  };

  const handleCopyCss = () => {
    if (!data) return;

    const cssSnippet = `/* Box Model CSS Snippet */
width: ${Math.round(data.width)}px;
height: ${Math.round(data.height)}px;
box-sizing: ${data.boxSizing};
margin: ${data.marginTop} ${data.marginRight} ${data.marginBottom} ${data.marginLeft};
padding: ${data.paddingTop} ${data.paddingRight} ${data.paddingBottom} ${data.paddingLeft};
border: ${data.borderTopWidth} ${data.borderStyle || 'solid'} ${data.borderColor || '#000000'};`;

    navigator.clipboard.writeText(cssSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Helper renderer for interactive box values
  const renderValueCell = (
    field: string,
    val: string,
    color: string = '#1e293b',
    title: string = ''
  ) => {
    const isEditing = editingField === field;
    const isModified = Boolean(modifiedProperties[field]);

    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSaveEdit(field)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit(field);
            if (e.key === 'Escape') setEditingField(null);
          }}
          autoFocus
          style={{
            width: '42px',
            padding: '1px 3px',
            fontSize: '10px',
            textAlign: 'center',
            borderRadius: '3px',
            border: '1px solid var(--dl-primary)',
            background: '#ffffff',
            color: '#0f172a',
            fontWeight: 700,
            outline: 'none'
          }}
        />
      );
    }

    return (
      <span
        onClick={() => handleStartEditing(field, val)}
        title={`${title || field}: Click to edit value live`}
        style={{
          cursor: 'pointer',
          color: isModified ? '#2563eb' : color,
          fontWeight: isModified ? 800 : 700,
          textDecoration: isModified ? 'underline' : 'none',
          padding: '1px 4px',
          borderRadius: '3px',
          transition: 'background 0.15s ease',
          display: 'inline-block'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {cleanVal(val)}
      </span>
    );
  };

  return (
    <React.Fragment>
      {/* 4-Layer Webpage Box Model Overlays + Live Floating Badge */}
      {showWebpageOverlay && overlayBounds && data && (
        <React.Fragment>
          {/* MARGIN LAYER (Translucent Amber) */}
          <div
            style={{
              position: 'fixed',
              left: `${overlayBounds.margin.left}px`,
              top: `${overlayBounds.margin.top}px`,
              width: `${overlayBounds.margin.width}px`,
              height: `${overlayBounds.margin.height}px`,
              background: 'rgba(245, 158, 11, 0.25)',
              border: '1px dashed #f59e0b',
              pointerEvents: 'none',
              zIndex: 2147483495,
              borderRadius: '4px'
            }}
          />

          {/* BORDER LAYER (Translucent Yellow) */}
          <div
            style={{
              position: 'fixed',
              left: `${overlayBounds.border.left}px`,
              top: `${overlayBounds.border.top}px`,
              width: `${overlayBounds.border.width}px`,
              height: `${overlayBounds.border.height}px`,
              background: 'rgba(234, 179, 8, 0.35)',
              border: '2px dashed #ca8a04',
              pointerEvents: 'none',
              zIndex: 2147483496
            }}
          />

          {/* PADDING LAYER (Translucent Green) */}
          <div
            style={{
              position: 'fixed',
              left: `${overlayBounds.padding.left}px`,
              top: `${overlayBounds.padding.top}px`,
              width: `${overlayBounds.padding.width}px`,
              height: `${overlayBounds.padding.height}px`,
              background: 'rgba(34, 197, 94, 0.25)',
              border: '1px dashed #16a34a',
              pointerEvents: 'none',
              zIndex: 2147483497
            }}
          />

          {/* CONTENT LAYER (Translucent Cyan) */}
          <div
            style={{
              position: 'fixed',
              left: `${overlayBounds.content.left}px`,
              top: `${overlayBounds.content.top}px`,
              width: `${overlayBounds.content.width}px`,
              height: `${overlayBounds.content.height}px`,
              background: 'rgba(59, 130, 246, 0.3)',
              border: '1px solid #2563eb',
              pointerEvents: 'none',
              zIndex: 2147483498
            }}
          />

          {/* LIVE WEBPAGE FLOATING BADGE WITH FULL MARGIN, PADDING & BORDER LEGEND */}
          <div
            style={{
              position: 'fixed',
              left: `${Math.max(12, overlayBounds.border.left)}px`,
              top: `${Math.max(10, overlayBounds.border.top - 42)}px`,
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 2147483500,
              pointerEvents: 'none'
            }}
          >
            <span style={{ color: '#38bdf8', fontWeight: 800 }}>
              &lt;{data.tagName}{data.className ? `.${data.className.split(' ')[0]}` : ''}&gt;
            </span>

            {/* Content dimensions */}
            <span style={{ background: '#2563eb', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>
              🔵 Content: {Math.round(data.width)} × {Math.round(data.height)}px
            </span>

            {/* Padding */}
            <span style={{ background: '#16a34a', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>
              🟢 Padding: {data.paddingTop} {data.paddingRight} {data.paddingBottom} {data.paddingLeft}
            </span>

            {/* Border */}
            <span style={{ background: '#ca8a04', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>
              🟡 Border: {data.borderTopWidth} {data.borderRightWidth} {data.borderBottomWidth} {data.borderLeftWidth}
            </span>

            {/* Margin */}
            <span style={{ background: '#d97706', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>
              🟠 Margin: {data.marginTop} {data.marginRight} {data.marginBottom} {data.marginLeft}
            </span>
          </div>
        </React.Fragment>
      )}

      {/* Main Extension Box Model Panel */}
      <div
        className="devlens-panel"
        style={{
          right: '20px',
          top: '70px',
          width: '380px',
          maxHeight: 'calc(100vh - 90px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="devlens-panel-header">
          <div className="devlens-panel-title">
            <Square size={16} style={{ color: 'var(--dl-primary)' }} />
            <span>Box Model Inspector Pro</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onToggleLock && (
              <button
                onClick={onToggleLock}
                className="devlens-btn"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: isLocked ? 'rgba(239, 68, 68, 0.15)' : 'var(--dl-bg)',
                  border: isLocked ? '1px solid #ef4444' : '1px solid var(--dl-border)',
                  color: isLocked ? '#ef4444' : 'var(--dl-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={isLocked ? 'Unlock Element (resume hover)' : 'Lock Element (freeze selection to edit metrics)'}
              >
                {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                <span>{isLocked ? 'Locked' : 'Lock'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="devlens-panel-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Helper / Status Banner */}
          <div className="devlens-active-banner" style={{ background: isLocked ? 'rgba(59, 130, 246, 0.12)' : undefined }}>
            <MousePointer size={16} style={{ color: 'var(--dl-primary)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--dl-primary)', marginBottom: '2px', fontSize: '12px' }}>
                {isLocked ? '🔒 Element Selection Locked' : '🖱️ Live Inspection Active'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', lineHeight: '1.3' }}>
                {isLocked
                  ? 'Click any numeric value inside the box diagram to edit padding, margin, border, or dimensions live!'
                  : 'Hover over elements to view dimensions. Click an element to lock it for editing.'}
              </div>
            </div>
          </div>

          {data ? (
            <>
              {/* Element Identifier Card */}
              <div
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
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dl-text)' }}>
                    &lt;<span style={{ color: 'var(--dl-primary)' }}>{data.tagName}</span>&gt;
                    {data.className && <span style={{ color: 'var(--dl-text-muted)', fontWeight: 500 }}>.{data.className.split(' ')[0]}</span>}
                    {data.id && <span style={{ color: '#ec4899', fontWeight: 500 }}>#{data.id}</span>}
                  </div>

                  <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--dl-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {data.boxSizing}
                  </span>
                </div>

                {/* Specs Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '10px', opacity: 0.85 }}>
                  {data.display && <span style={{ background: 'var(--dl-border)', padding: '2px 6px', borderRadius: '3px' }}>display: {data.display}</span>}
                  {data.position && <span style={{ background: 'var(--dl-border)', padding: '2px 6px', borderRadius: '3px' }}>pos: {data.position}</span>}
                  {data.zIndex && data.zIndex !== 'auto' && <span style={{ background: 'var(--dl-border)', padding: '2px 6px', borderRadius: '3px' }}>z-index: {data.zIndex}</span>}
                </div>
              </div>

              {/* Controls Toolbar (Overlay Toggle & Copy CSS) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={showWebpageOverlay}
                    onChange={(e) => setShowWebpageOverlay(e.target.checked)}
                    style={{ accentColor: 'var(--dl-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} /> Show Webpage Overlay
                  </span>
                </label>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {Object.keys(modifiedProperties).length > 0 && (
                    <button
                      onClick={handleResetStyles}
                      className="devlens-btn"
                      style={{ fontSize: '10px', padding: '3px 7px', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}
                      title="Reset live edited CSS styles back to default"
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}

                  <button
                    onClick={handleCopyCss}
                    className="devlens-btn devlens-btn-primary"
                    style={{ fontSize: '10px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? 'Copied!' : 'Copy CSS'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Concentric Box Model Diagram */}
              <div
                style={{
                  background: '#fffbebe6',
                  border: '1px dashed #f59e0b',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#78350f',
                  fontSize: '10px',
                  fontWeight: 700,
                  textAlign: 'center',
                  position: 'relative',
                  boxShadow: 'inset 0 0 10px rgba(245, 158, 11, 0.05)'
                }}
              >
                <div style={{ position: 'absolute', top: '4px', left: '6px', fontSize: '9px', fontWeight: 800, opacity: 0.75, color: '#b45309' }}>
                  MARGIN (px)
                </div>
                <div style={{ margin: '0 auto', width: 'fit-content', marginBottom: '4px' }}>
                  {renderValueCell('marginTop', data.marginTop, '#92400e', 'Margin Top')}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{renderValueCell('marginLeft', data.marginLeft, '#92400e', 'Margin Left')}</span>

                  {/* BORDER BOX */}
                  <div
                    style={{
                      background: '#fef9c3e6',
                      border: '1px dashed #ca8a04',
                      borderRadius: '6px',
                      padding: '10px',
                      color: '#713f12',
                      flex: 1,
                      margin: '0 6px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ position: 'absolute', top: '3px', left: '6px', fontSize: '9px', fontWeight: 800, opacity: 0.75, color: '#a16207' }}>
                      BORDER (px)
                    </div>
                    <div style={{ margin: '0 auto', width: 'fit-content', marginBottom: '4px' }}>
                      {renderValueCell('borderTopWidth', data.borderTopWidth, '#854d0e', 'Border Top Width')}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{renderValueCell('borderLeftWidth', data.borderLeftWidth, '#854d0e', 'Border Left Width')}</span>

                      {/* PADDING BOX */}
                      <div
                        style={{
                          background: '#f0fdf4e6',
                          border: '1px dashed #16a34a',
                          borderRadius: '6px',
                          padding: '10px',
                          color: '#14532d',
                          flex: 1,
                          margin: '0 6px',
                          position: 'relative'
                        }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: '6px', fontSize: '9px', fontWeight: 800, opacity: 0.75, color: '#15803d' }}>
                          PADDING (px)
                        </div>
                        <div style={{ margin: '0 auto', width: 'fit-content', marginBottom: '4px' }}>
                          {renderValueCell('paddingTop', data.paddingTop, '#166534', 'Padding Top')}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{renderValueCell('paddingLeft', data.paddingLeft, '#166534', 'Padding Left')}</span>

                          {/* CONTENT BOX */}
                          <div
                            style={{
                              background: '#eff6ff',
                              border: '1.5px solid #2563eb',
                              borderRadius: '4px',
                              padding: '8px 10px',
                              color: '#1e40af',
                              fontWeight: 800,
                              margin: '0 6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            {renderValueCell('width', `${Math.round(data.width)}px`, '#1d4ed8', 'Width')}
                            <span style={{ opacity: 0.6 }}>×</span>
                            {renderValueCell('height', `${Math.round(data.height)}px`, '#1d4ed8', 'Height')}
                          </div>

                          <span>{renderValueCell('paddingRight', data.paddingRight, '#166534', 'Padding Right')}</span>
                        </div>

                        <div style={{ margin: '4px auto 0 auto', width: 'fit-content' }}>
                          {renderValueCell('paddingBottom', data.paddingBottom, '#166534', 'Padding Bottom')}
                        </div>
                      </div>

                      <span>{renderValueCell('borderRightWidth', data.borderRightWidth, '#854d0e', 'Border Right Width')}</span>
                    </div>

                    <div style={{ margin: '4px auto 0 auto', width: 'fit-content' }}>
                      {renderValueCell('borderBottomWidth', data.borderBottomWidth, '#854d0e', 'Border Bottom Width')}
                    </div>
                  </div>

                  <span>{renderValueCell('marginRight', data.marginRight, '#92400e', 'Margin Right')}</span>
                </div>

                <div style={{ margin: '4px auto 0 auto', width: 'fit-content' }}>
                  {renderValueCell('marginBottom', data.marginBottom, '#92400e', 'Margin Bottom')}
                </div>
              </div>

              {/* Complete Metrics Breakdown Table */}
              <div
                style={{
                  background: 'var(--dl-bg)',
                  border: '1px solid var(--dl-border)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dl-text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Table size={13} style={{ color: 'var(--dl-primary)' }} />
                  <span>Full Box Model Metrics Breakdown</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                  {/* Padding Details */}
                  <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div style={{ fontWeight: 700, color: '#15803d', marginBottom: '4px', fontSize: '10px' }}>🟢 PADDING</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--dl-text)' }}>
                      <div>T / B: {data.paddingTop} / {data.paddingBottom}</div>
                      <div>L / R: {data.paddingLeft} / {data.paddingRight}</div>
                    </div>
                  </div>

                  {/* Margin Details */}
                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontWeight: 700, color: '#b45309', marginBottom: '4px', fontSize: '10px' }}>🟠 MARGIN</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--dl-text)' }}>
                      <div>T / B: {data.marginTop} / {data.marginBottom}</div>
                      <div>L / R: {data.marginLeft} / {data.marginRight}</div>
                    </div>
                  </div>

                  {/* Border Details */}
                  <div style={{ background: 'rgba(234, 179, 8, 0.08)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <div style={{ fontWeight: 700, color: '#a16207', marginBottom: '4px', fontSize: '10px' }}>🟡 BORDER</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--dl-text)' }}>
                      <div>T / B: {data.borderTopWidth} / {data.borderBottomWidth}</div>
                      <div>L / R: {data.borderLeftWidth} / {data.borderRightWidth}</div>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: '4px', fontSize: '10px' }}>🔵 CONTENT</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--dl-text)' }}>
                      <div>Size: {Math.round(data.width)} × {Math.round(data.height)}px</div>
                      <div>Sizing: {data.boxSizing}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--dl-text-muted)', fontSize: '12px' }}>
              Hover over any webpage element to inspect its Box Model, or click an element to lock it for live editing.
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};
