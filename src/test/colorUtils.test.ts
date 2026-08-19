import { describe, it, expect } from 'vitest';
import { parseColor, getContrastRatio } from '../shared/utils/colorUtils';

describe('colorUtils', () => {
  it('correctly parses HEX colors', () => {
    const color = parseColor('#2563EB');
    expect(color).not.toBeNull();
    expect(color?.hex).toBe('#2563EB');
    expect(color?.r).toBe(37);
    expect(color?.g).toBe(99);
    expect(color?.b).toBe(235);
  });

  it('correctly parses short 3-digit HEX colors', () => {
    const color = parseColor('#fff');
    expect(color).not.toBeNull();
    expect(color?.hex).toBe('#FFFFFF');
    expect(color?.r).toBe(255);
  });

  it('correctly parses rgb() strings', () => {
    const color = parseColor('rgb(16, 185, 129)');
    expect(color).not.toBeNull();
    expect(color?.hex).toBe('#10B981');
    expect(color?.r).toBe(16);
    expect(color?.g).toBe(185);
    expect(color?.b).toBe(129);
  });

  it('calculates WCAG contrast ratio for Black on White', () => {
    const white = parseColor('#FFFFFF')!;
    const black = parseColor('#000000')!;
    const contrast = getContrastRatio(black, white);

    expect(contrast.ratio).toBe(21);
    expect(contrast.wcagAA).toBe(true);
    expect(contrast.wcagAAA).toBe(true);
  });

  it('detects low contrast ratio', () => {
    const lightGray = parseColor('#EEEEEE')!;
    const white = parseColor('#FFFFFF')!;
    const contrast = getContrastRatio(lightGray, white);

    expect(contrast.ratio).toBeLessThan(4.5);
    expect(contrast.wcagAA).toBe(false);
  });
});
