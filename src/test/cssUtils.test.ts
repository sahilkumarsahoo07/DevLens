import { describe, it, expect } from 'vitest';
import { typographyToCssString, formatCssMap } from '../shared/utils/cssUtils';
import { TypographyData } from '../shared/types';

describe('cssUtils', () => {
  it('formats typography data to CSS string', () => {
    const typo: TypographyData = {
      fontFamily: 'Inter, sans-serif',
      fontFamilyRendered: 'Inter',
      fontStack: 'Inter, sans-serif',
      fontSize: '16px',
      fontWeight: '500',
      lineHeight: '24px',
      letterSpacing: '0px',
      color: '#111827',
      backgroundColor: '#ffffff',
      textTransform: 'none',
      textDecoration: 'none',
      fontStyle: 'normal',
      fontVariant: 'normal',
      textAlign: 'left',
      wordSpacing: '0px',
      whiteSpace: 'normal',
      textRendering: 'auto',
      textSnippet: 'Sample'
    };

    const cssStr = typographyToCssString(typo);
    expect(cssStr).toContain('font-family: Inter, sans-serif;');
    expect(cssStr).toContain('font-size: 16px;');
    expect(cssStr).toContain('font-weight: 500;');
    expect(cssStr).toContain('line-height: 24px;');
  });

  it('formats CSS style map into readable kebab-case block', () => {
    const map = {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      borderRadius: '8px'
    };

    const result = formatCssMap(map);
    expect(result).toContain('display: flex;');
    expect(result).toContain('flex-direction: column;');
    expect(result).toContain('border-radius: 8px;');
  });
});
