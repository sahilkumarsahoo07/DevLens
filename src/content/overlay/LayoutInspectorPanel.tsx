import React, { useState, useEffect } from 'react';
import { LayoutGrid, X, Layers } from 'lucide-react';

interface LayoutContainer {
  id: string;
  type: 'flex' | 'grid';
  tagName: string;
  className: string;
  gap: string;
  flexDirection?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  rect: DOMRect;
  element: HTMLElement;
}

interface LayoutInspectorPanelProps {
  onClose: () => void;
}

export const LayoutInspectorPanel: React.FC<LayoutInspectorPanelProps> = ({ onClose }) => {
  const [containers, setContainers] = useState<LayoutContainer[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    // Scan DOM for all CSS Grid and Flexbox containers
    const found: LayoutContainer[] = [];
    const elements = Array.from(document.querySelectorAll('*'));

    elements.forEach((el, idx) => {
      if (el.closest('#devlens-root')) return;

      const style = window.getComputedStyle(el);
      const display = style.display;

      if (display.includes('flex') || display.includes('grid')) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) {
          found.push({
            id: `container-${idx}`,
            type: display.includes('grid') ? 'grid' : 'flex',
            tagName: el.tagName.toLowerCase(),
            className: el.className ? String(el.className).split(' ')[0] : '',
            gap: style.gap || '0px',
            flexDirection: style.flexDirection,
            gridTemplateColumns: style.gridTemplateColumns,
            gridTemplateRows: style.gridTemplateRows,
            rect,
            element: el as HTMLElement
          });
        }
      }
    });

    setContainers(found.slice(0, 15));
  }, []);

  const highlightedContainer = containers.find((c) => c.id === highlightedId);

  return (
    <>
      {/* Visual Overlay Highlight over active layout container */}
      {highlightedContainer && (
        <div
          style={{
            position: 'fixed',
            left: `${highlightedContainer.rect.left}px`,
            top: `${highlightedContainer.rect.top}px`,
            width: `${highlightedContainer.rect.width}px`,
            height: `${highlightedContainer.rect.height}px`,
            border: highlightedContainer.type === 'grid' ? '2px dashed #ec4899' : '2px dashed #3b82f6',
            background: highlightedContainer.type === 'grid' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            pointerEvents: 'none',
            zIndex: 2147483640
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: 0,
              background: highlightedContainer.type === 'grid' ? '#ec4899' : '#3b82f6',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            {highlightedContainer.type.toUpperCase()} CONTAINER | &lt;{highlightedContainer.tagName}&gt;
          </div>
        </div>
      )}

      {/* Floating Panel */}
      <div
        className="devlens-panel"
        style={{
          right: '20px',
          top: '70px',
          width: '360px',
          maxHeight: 'calc(100vh - 100px)'
        }}
      >
        <div className="devlens-panel-header">
          <div className="devlens-panel-title">
            <LayoutGrid size={16} style={{ color: 'var(--dl-primary)' }} />
            <span>Layout Inspector (Grid & Flex)</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} style={{ color: 'var(--dl-primary)' }} />
            Found <strong>{containers.length}</strong> active Flexbox & Grid containers on page:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
            {containers.map((c) => (
              <div
                key={c.id}
                onMouseEnter={() => setHighlightedId(c.id)}
                onMouseLeave={() => setHighlightedId(null)}
                style={{
                  background: highlightedId === c.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--dl-bg)',
                  border: highlightedId === c.id ? '1px solid var(--dl-primary)' : '1px solid var(--dl-border)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--dl-text)' }}>
                    &lt;{c.tagName}&gt; {c.className ? `.${c.className}` : ''}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', marginTop: '2px' }}>
                    Gap: {c.gap} {c.type === 'flex' ? `| Dir: ${c.flexDirection}` : ''}
                  </div>
                </div>

                <span
                  style={{
                    background: c.type === 'grid' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: c.type === 'grid' ? '#ec4899' : '#3b82f6',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase'
                  }}
                >
                  {c.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
