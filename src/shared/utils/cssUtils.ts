import { BoxModelData, TypographyData, LayoutData } from '../types';

/**
 * Generates a unique CSS selector path for a given element.
 */
export function getCssSelector(element: HTMLElement): string {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return '';

  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    } else {
      let sibling = current;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling as HTMLElement;
        if (sibling.tagName === current.tagName) {
          nth++;
        }
      }

      const parentEl = current.parentElement;
      const hasSiblingsOfSameTag = parentEl
        ? Array.from(parentEl.children).some((child) => child !== current && child.tagName === current?.tagName)
        : false;

      if (hasSiblingsOfSameTag) {
        selector += `:nth-of-type(${nth})`;
      }

      if (current.classList.length > 0) {
        const validClasses = Array.from(current.classList)
          .filter((c) => !c.startsWith('devlens-'))
          .slice(0, 2);
        if (validClasses.length > 0) {
          selector += '.' + validClasses.map((c) => CSS.escape(c)).join('.');
        }
      }
    }

    path.unshift(selector);
    if (current.tagName.toLowerCase() === 'html' || current.tagName.toLowerCase() === 'body') {
      break;
    }
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Generates an XPath string for an element.
 */
export function getXPath(element: HTMLElement): string {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return '';

  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let count = 1;
    let sibling = current.previousSibling;

    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        (sibling as HTMLElement).tagName === current.tagName
      ) {
        count++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const indexStr = count > 1 ? `[${count}]` : '';
    parts.unshift(`${tagName}${indexStr}`);

    if (tagName === 'html') break;
    current = current.parentElement;
  }

  return '/' + parts.join('/');
}

/**
 * Formats key typography properties as CSS block string
 */
export function typographyToCssString(typo: TypographyData): string {
  return `font-family: ${typo.fontFamily};
font-size: ${typo.fontSize};
font-weight: ${typo.fontWeight};
line-height: ${typo.lineHeight};
letter-spacing: ${typo.letterSpacing};
color: ${typo.color};
background-color: ${typo.backgroundColor};
text-transform: ${typo.textTransform};
text-align: ${typo.textAlign};`;
}

/**
 * Extracts box model metrics from computed style
 */
export function extractBoxModel(style: CSSStyleDeclaration, rect: DOMRect): BoxModelData {
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    marginTop: style.marginTop,
    marginRight: style.marginRight,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
    borderTopWidth: style.borderTopWidth,
    borderRightWidth: style.borderRightWidth,
    borderBottomWidth: style.borderBottomWidth,
    borderLeftWidth: style.borderLeftWidth,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft
  };
}

/**
 * Extracts layout details (flex / grid / position)
 */
export function extractLayoutData(style: CSSStyleDeclaration): LayoutData {
  const display = style.display;
  const isFlex = display.includes('flex');
  const isGrid = display.includes('grid');

  const layout: LayoutData = {
    display: style.display,
    position: style.position,
    zIndex: style.zIndex !== 'auto' ? style.zIndex : undefined
  };

  if (isFlex) {
    layout.flexDirection = style.flexDirection;
    layout.justifyContent = style.justifyContent;
    layout.alignItems = style.alignItems;
    layout.flexWrap = style.flexWrap;
    layout.gap = style.gap;
    layout.flexGrow = style.flexGrow;
    layout.flexShrink = style.flexShrink;
    layout.flexBasis = style.flexBasis;
  }

  if (isGrid) {
    layout.gridTemplateColumns = style.gridTemplateColumns;
    layout.gridTemplateRows = style.gridTemplateRows;
    layout.gap = style.gap;
    layout.gridColumn = style.gridColumn;
    layout.gridRow = style.gridRow;
  }

  return layout;
}

/**
 * Formats a key-value CSS map into readable CSS string
 */
export function formatCssMap(styles: Record<string, string>): string {
  return Object.entries(styles)
    .filter(([_, value]) => value && value !== 'none' && value !== 'normal' && value !== 'auto')
    .map(([key, value]) => `  ${kebabCase(key)}: ${value};`)
    .join('\n');
}

function kebabCase(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}
