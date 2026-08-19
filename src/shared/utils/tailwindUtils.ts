import { TypographyData, BoxModelData, LayoutData } from '../types';
import { parseColor } from './colorUtils';

/**
 * Converts computed styles, typography, and layout data to equivalent Tailwind CSS utility classes.
 */
export function cssToTailwind(
  styles: Record<string, string>,
  typography?: TypographyData,
  boxModel?: BoxModelData,
  layout?: LayoutData
): string {
  const classes: string[] = [];

  // 1. Display
  const display = layout?.display || styles.display;
  if (display === 'flex' || display === 'inline-flex') {
    classes.push(display);
    if (layout?.flexDirection === 'column') classes.push('flex-col');
    if (layout?.flexDirection === 'row-reverse') classes.push('flex-row-reverse');
    if (layout?.flexDirection === 'column-reverse') classes.push('flex-col-reverse');

    if (layout?.justifyContent === 'center') classes.push('justify-center');
    if (layout?.justifyContent === 'space-between') classes.push('justify-between');
    if (layout?.justifyContent === 'space-around') classes.push('justify-around');
    if (layout?.justifyContent === 'space-evenly') classes.push('justify-evenly');
    if (layout?.justifyContent === 'flex-end' || layout?.justifyContent === 'end') classes.push('justify-end');
    if (layout?.justifyContent === 'flex-start' || layout?.justifyContent === 'start') classes.push('justify-start');

    if (layout?.alignItems === 'center') classes.push('items-center');
    if (layout?.alignItems === 'flex-start' || layout?.alignItems === 'start') classes.push('items-start');
    if (layout?.alignItems === 'flex-end' || layout?.alignItems === 'end') classes.push('items-end');
    if (layout?.alignItems === 'stretch') classes.push('items-stretch');
    if (layout?.alignItems === 'baseline') classes.push('items-baseline');

    if (layout?.flexWrap === 'wrap') classes.push('flex-wrap');
  } else if (display === 'grid' || display === 'inline-grid') {
    classes.push(display);
  } else if (display === 'block') {
    classes.push('block');
  } else if (display === 'inline-block') {
    classes.push('inline-block');
  } else if (display === 'hidden' || display === 'none') {
    classes.push('hidden');
  }

  // 2. Position
  const position = layout?.position || styles.position;
  if (position && position !== 'static') {
    classes.push(position);
  }

  // 3. Spacing (Padding & Margin)
  if (boxModel) {
    const pt = pxToSpacing(boxModel.paddingTop);
    const pr = pxToSpacing(boxModel.paddingRight);
    const pb = pxToSpacing(boxModel.paddingBottom);
    const pl = pxToSpacing(boxModel.paddingLeft);

    if (pt && pt === pr && pr === pb && pb === pl) {
      if (pt !== '0') classes.push(`p-${pt}`);
    } else {
      if (pt && pt === pb && pt !== '0') classes.push(`py-${pt}`);
      else {
        if (pt && pt !== '0') classes.push(`pt-${pt}`);
        if (pb && pb !== '0') classes.push(`pb-${pb}`);
      }
      if (pr && pr === pl && pr !== '0') classes.push(`px-${pr}`);
      else {
        if (pr && pr !== '0') classes.push(`pr-${pr}`);
        if (pl && pl !== '0') classes.push(`pl-${pl}`);
      }
    }
  }

  // 4. Typography
  if (typography) {
    // Font Weight
    const weightMap: Record<string, string> = {
      '100': 'font-thin',
      '200': 'font-extralight',
      '300': 'font-light',
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
      '800': 'font-extrabold',
      '900': 'font-black'
    };
    if (weightMap[typography.fontWeight]) {
      classes.push(weightMap[typography.fontWeight]);
    }

    // Text Size
    const fontSizePx = parseInt(typography.fontSize, 10);
    if (!isNaN(fontSizePx)) {
      if (fontSizePx <= 12) classes.push('text-xs');
      else if (fontSizePx <= 14) classes.push('text-sm');
      else if (fontSizePx <= 16) classes.push('text-base');
      else if (fontSizePx <= 18) classes.push('text-lg');
      else if (fontSizePx <= 20) classes.push('text-xl');
      else if (fontSizePx <= 24) classes.push('text-2xl');
      else if (fontSizePx <= 30) classes.push('text-3xl');
      else if (fontSizePx <= 36) classes.push('text-4xl');
      else classes.push(`text-[${typography.fontSize}]`);
    }

    // Text Align
    if (typography.textAlign && typography.textAlign !== 'start' && typography.textAlign !== 'left') {
      classes.push(`text-${typography.textAlign}`);
    }

    // Text Color
    const parsedColor = parseColor(typography.color);
    if (parsedColor) {
      classes.push(`text-[${parsedColor.hex}]`);
    }
  }

  // 5. Background & Border Radius
  const bgStr = styles.backgroundColor;
  if (bgStr && bgStr !== 'transparent' && bgStr !== 'rgba(0, 0, 0, 0)') {
    const parsedBg = parseColor(bgStr);
    if (parsedBg) {
      classes.push(`bg-[${parsedBg.hex}]`);
    }
  }

  const borderRadius = styles.borderRadius;
  if (borderRadius && borderRadius !== '0px') {
    if (borderRadius === '9999px' || borderRadius === '50%') classes.push('rounded-full');
    else if (borderRadius === '4px' || borderRadius === '0.25rem') classes.push('rounded');
    else if (borderRadius === '6px' || borderRadius === '0.375rem') classes.push('rounded-md');
    else if (borderRadius === '8px' || borderRadius === '0.5rem') classes.push('rounded-lg');
    else if (borderRadius === '12px' || borderRadius === '0.75rem') classes.push('rounded-xl');
    else if (borderRadius === '16px' || borderRadius === '1rem') classes.push('rounded-2xl');
    else classes.push(`rounded-[${borderRadius}]`);
  }

  return classes.length > 0 ? classes.join(' ') : '/* No direct Tailwind mapping found */';
}

function pxToSpacing(pxStr: string): string {
  const val = parseFloat(pxStr);
  if (isNaN(val) || val === 0) return '0';
  const rem = val / 16;
  const tailwindSpacing = rem * 4; // 1 spacing unit = 0.25rem = 4px
  if (Number.isInteger(tailwindSpacing)) {
    return tailwindSpacing.toString();
  }
  return `[${pxStr}]`;
}
