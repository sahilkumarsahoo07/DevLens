import { ElementData } from '../types';
import { getCssSelector, getXPath, extractBoxModel, extractLayoutData } from './cssUtils';

/**
 * Extracts complete DevLens ElementData from an HTML element
 */
export function extractElementData(element: HTMLElement): ElementData {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  const attributes = Array.from(element.attributes).map((attr) => ({
    name: attr.name,
    value: attr.value
  }));

  const classList = Array.from(element.classList).filter((c) => !c.startsWith('devlens-'));

  const computedStyles: Record<string, string> = {
    display: style.display,
    position: style.position,
    width: `${Math.round(rect.width)}px`,
    height: `${Math.round(rect.height)}px`,
    margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
    padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
    border: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
    borderRadius: style.borderRadius,
    boxShadow: style.boxShadow,
    background: style.backgroundColor,
    color: style.color,
    opacity: style.opacity,
    overflow: style.overflow,
    zIndex: style.zIndex
  };

  if (style.display.includes('flex')) {
    computedStyles.flexDirection = style.flexDirection;
    computedStyles.justifyContent = style.justifyContent;
    computedStyles.alignItems = style.alignItems;
    computedStyles.flexWrap = style.flexWrap;
    computedStyles.gap = style.gap;
  }

  if (style.display.includes('grid')) {
    computedStyles.gridTemplateColumns = style.gridTemplateColumns;
    computedStyles.gridTemplateRows = style.gridTemplateRows;
    computedStyles.gap = style.gap;
  }

  const fontStackParts = style.fontFamily.split(',').map((f) => f.trim());

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || '',
    classList,
    attributes,
    selector: getCssSelector(element),
    xpath: getXPath(element),
    parentTag: element.parentElement ? element.parentElement.tagName.toLowerCase() : '',
    childCount: element.children.length,
    outerHTML: element.outerHTML,
    rect: {
      x: Math.round(rect.x + window.scrollX),
      y: Math.round(rect.y + window.scrollY),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      left: Math.round(rect.left)
    },
    computedStyles,
    boxModel: extractBoxModel(style, rect),
    typography: {
      fontFamily: style.fontFamily,
      fontFamilyRendered: fontStackParts[0] || style.fontFamily,
      fontStack: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      color: style.color,
      backgroundColor: style.backgroundColor,
      textTransform: style.textTransform,
      textDecoration: style.textDecoration,
      fontStyle: style.fontStyle,
      fontVariant: style.fontVariant,
      textAlign: style.textAlign,
      wordSpacing: style.wordSpacing,
      whiteSpace: style.whiteSpace,
      textRendering: style.textRendering,
      textSnippet: element.textContent?.trim().slice(0, 100) || ''
    },
    layout: extractLayoutData(style)
  };
}

/**
 * Checks if an element is fixed or sticky
 */
export function isFixedOrSticky(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return style.position === 'fixed' || style.position === 'sticky';
}
