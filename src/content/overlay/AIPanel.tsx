import React, { useState, useEffect } from 'react';
import { ElementData, DevLensSettings } from '../../shared/types';
import { AIProvider } from '../../shared/ai/AIProvider';
import { MockAIProvider } from '../../shared/ai/MockAIProvider';
import { OpenAIProvider } from '../../shared/ai/OpenAIProvider';
import { getSettings } from '../../shared/utils/storageUtils';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';

interface AIPanelProps {
  elementData: ElementData | null;
  onClose: () => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({ elementData, onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<AIProvider>(new MockAIProvider());

  useEffect(() => {
    getSettings().then((settings: DevLensSettings) => {
      if (settings.aiProvider === 'openai' && settings.aiApiKey) {
        setProvider(new OpenAIProvider(settings.aiApiKey, settings.aiEndpoint));
      } else {
        setProvider(new MockAIProvider());
      }
    });
  }, []);

  const handleAsk = async (promptText?: string) => {
    const textToAsk = promptText || query;
    if (!textToAsk.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await provider.ask(textToAsk, elementData);
      setResponse(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred while fetching AI response.');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Why is this element overflowing?',
    'Explain this CSS & typography.',
    'Convert this CSS to Tailwind.',
    'How do I make this layout responsive?',
    'Why isn’t this element centered?'
  ];

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
          <Bot size={16} style={{ color: 'var(--dl-primary)' }} />
          <span>Ask DevLens AI ({provider.name})</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="devlens-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Context Banner */}
        {elementData ? (
          <div
            style={{
              background: 'var(--dl-bg)',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              borderLeft: '3px solid var(--dl-primary)'
            }}
          >
            <span style={{ color: 'var(--dl-text-muted)' }}>SELECTED TARGET: </span>
            <strong style={{ fontFamily: 'monospace' }}>
              &lt;{elementData.tagName}&gt; {elementData.selector}
            </strong>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--dl-bg)',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--dl-text-muted)'
            }}
          >
            💡 Select an element with Inspector for pinpoint target analysis, or ask general questions.
          </div>
        )}

        {/* Quick Prompts */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--dl-text-muted)', marginBottom: '4px' }}>
            QUICK SUGGESTED QUESTIONS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setQuery(p);
                  handleAsk(p);
                }}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--dl-border)',
                  background: 'var(--dl-bg)',
                  color: 'var(--dl-text)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Sparkles size={10} style={{ display: 'inline', marginRight: '4px', color: 'var(--dl-primary)' }} />
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            className="devlens-input"
            placeholder="Ask AI about CSS, layout, responsiveness..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <button
            className="devlens-btn devlens-btn-primary"
            onClick={() => handleAsk()}
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>

        {/* Response Box */}
        {error && (
          <div
            style={{
              padding: '10px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--dl-danger)',
              fontSize: '12px'
            }}
          >
            {error}
          </div>
        )}

        {response && (
          <div
            className="devlens-code-block"
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              color: 'var(--dl-text)',
              fontSize: '12px',
              lineHeight: 1.6
            }}
          >
            {response}
          </div>
        )}
      </div>
    </div>
  );
};
