import { describe, it, expect } from 'vitest';
import { cssToTailwind } from '../shared/utils/tailwindUtils';
import { TypographyData, BoxModelData, LayoutData } from '../shared/types';

describe('tailwindUtils', () => {
  it('converts flexbox layout properties to Tailwind', () => {
    const layout: LayoutData = {
      display: 'flex',
      position: 'relative',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    };

    const tw = cssToTailwind({ display: 'flex' }, undefined, undefined, layout);
    expect(tw).toContain('flex');
    expect(tw).toContain('flex-col');
    expect(tw).toContain('justify-center');
    expect(tw).toContain('items-center');
  });

  it('converts typography properties to Tailwind', () => {
    const typo: TypographyData = {
      fontFamily: 'sans-serif',
      fontFamilyRendered: 'sans-serif',
      fontStack: 'sans-serif',
      fontSize: '16px',
      fontWeight: '700',
      lineHeight: '24px',
      letterSpacing: '0',
      color: 'rgb(37, 99, 235)',
      backgroundColor: 'transparent',
      textTransform: 'none',
      textDecoration: 'none',
      fontStyle: 'normal',
      fontVariant: 'normal',
      textAlign: 'center',
      wordSpacing: '0',
      whiteSpace: 'normal',
      textRendering: 'auto',
      textSnippet: ''
    };

    const tw = cssToTailwind({}, typo);
    expect(tw).toContain('font-bold');
    expect(tw).toContain('text-base');
    expect(tw).toContain('text-center');
    expect(tw).toContain('text-[#2563EB]');
  });

  it('converts box model padding to Tailwind', () => {
    const boxModel: BoxModelData = {
      width: 100,
      height: 100,
      marginTop: '0px',
      marginRight: '0px',
      marginBottom: '0px',
      marginLeft: '0px',
      borderTopWidth: '0px',
      borderRightWidth: '0px',
      borderBottomWidth: '0px',
      borderLeftWidth: '0px',
      paddingTop: '16px',
      paddingRight: '16px',
      paddingBottom: '16px',
      paddingLeft: '16px'
    };

    const tw = cssToTailwind({}, undefined, boxModel);
    expect(tw).toContain('p-4');
  });
});
