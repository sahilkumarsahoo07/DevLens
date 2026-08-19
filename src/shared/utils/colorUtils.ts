import { ColorInfo, ContrastResult } from '../types';

/**
 * Converts HEX color string to ColorInfo object containing HEX, RGB, and HSL.
 */
export function parseColor(colorStr: string): ColorInfo | null {
  if (!colorStr) return null;

  // Handle rgb / rgba
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return rgbToColorInfo(r, g, b);
  }

  // Handle HEX
  let hex = colorStr.trim();
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }

  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return rgbToColorInfo(r, g, b);
    }
  }

  return null;
}

export function rgbToColorInfo(r: number, g: number, b: number): ColorInfo {
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  const rgb = `rgb(${r}, ${g}, ${b})`;
  
  // RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

  return { hex, rgb, hsl, r, g, b };
}

/**
 * Calculates relative luminance according to WCAG 2.1 specs
 */
export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates contrast ratio between two colors (1 to 21)
 */
export function getContrastRatio(color1: ColorInfo, color2: ColorInfo): ContrastResult {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  const ratio = (brightest + 0.05) / (darkest + 0.05);
  const roundedRatio = Math.round(ratio * 100) / 100;

  return {
    ratio: roundedRatio,
    wcagAA: roundedRatio >= 4.5,
    wcagAALarge: roundedRatio >= 3.0,
    wcagAAA: roundedRatio >= 7.0,
    wcagAAALarge: roundedRatio >= 4.5
  };
}

/**
 * Extracts unique colors used on the current webpage DOM
 */
export function extractPageColors(maxCount = 12): ColorInfo[] {
  if (typeof document === 'undefined') return [];

  const colorMap = new Map<string, { color: ColorInfo; count: number }>();
  const elements = Array.from(document.querySelectorAll('*'));

  elements.forEach((el) => {
    const style = window.getComputedStyle(el);
    const colorStr = style.color;
    const bgStr = style.backgroundColor;

    [colorStr, bgStr].forEach((str) => {
      if (str && str !== 'transparent' && str !== 'rgba(0, 0, 0, 0)') {
        const parsed = parseColor(str);
        if (parsed) {
          const existing = colorMap.get(parsed.hex);
          if (existing) {
            existing.count += 1;
          } else {
            colorMap.set(parsed.hex, { color: parsed, count: 1 });
          }
        }
      }
    });
  });

  return Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxCount)
    .map((item) => item.color);
}
