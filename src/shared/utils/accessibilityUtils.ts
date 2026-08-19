import { A11yReport, A11yIssue } from '../types';
import { parseColor, getContrastRatio } from './colorUtils';
import { getCssSelector } from './cssUtils';

export function runAccessibilityAudit(): A11yReport {
  if (typeof document === 'undefined') {
    return {
      timestamp: Date.now(),
      issues: [],
      summary: { pass: 0, warning: 0, error: 0 }
    };
  }

  const issues: A11yIssue[] = [];
  let idCounter = 1;

  // 1. Check Images for alt text
  const images = Array.from(document.querySelectorAll('img'));
  images.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        id: `a11y-${idCounter++}`,
        type: 'error',
        category: 'Images',
        elementSelector: getCssSelector(img),
        elementTag: 'img',
        problem: 'Image is missing alt attribute.',
        whyItMatters: 'Screen readers cannot describe the image to visually impaired users.',
        suggestedFix: 'Add alt="descriptive text" or alt="" if decorative.'
      });
    } else if (img.getAttribute('alt')?.trim() === '' && img.getAttribute('role') !== 'presentation') {
      issues.push({
        id: `a11y-${idCounter++}`,
        type: 'warning',
        category: 'Images',
        elementSelector: getCssSelector(img),
        elementTag: 'img',
        problem: 'Image has empty alt attribute.',
        whyItMatters: 'Ensure decorative images have role="presentation" or meaningful alt text.',
        suggestedFix: 'Provide descriptive alt text if image conveys information.'
      });
    }
  });

  // 2. Check Buttons for accessible name
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
  buttons.forEach((btn) => {
    const text = btn.textContent?.trim();
    const ariaLabel = btn.getAttribute('aria-label') || btn.getAttribute('aria-labelledby');
    const title = btn.getAttribute('title');

    if (!text && !ariaLabel && !title) {
      issues.push({
        id: `a11y-${idCounter++}`,
        type: 'error',
        category: 'Buttons',
        elementSelector: getCssSelector(btn as HTMLElement),
        elementTag: btn.tagName.toLowerCase(),
        problem: 'Button has no discernible text or ARIA label.',
        whyItMatters: 'Screen reader users cannot determine the function of this button.',
        suggestedFix: 'Add visible text, aria-label="..." or aria-labelledby="..." to the button.'
      });
    }
  });

  // 3. Check Links for accessible name and href
  const links = Array.from(document.querySelectorAll('a'));
  links.forEach((a) => {
    const text = a.textContent?.trim();
    const ariaLabel = a.getAttribute('aria-label');
    const href = a.getAttribute('href');

    if (!text && !ariaLabel && !a.querySelector('img[alt]')) {
      issues.push({
        id: `a11y-${idCounter++}`,
        type: 'error',
        category: 'Links',
        elementSelector: getCssSelector(a),
        elementTag: 'a',
        problem: 'Link has no accessible text name.',
        whyItMatters: 'Screen readers cannot announce link target or purpose.',
        suggestedFix: 'Provide visible text or aria-label for the anchor element.'
      });
    }

    if (!href || href === '#' || href.startsWith('javascript:')) {
      issues.push({
        id: `a11y-${idCounter++}`,
        type: 'warning',
        category: 'Links',
        elementSelector: getCssSelector(a),
        elementTag: 'a',
        problem: 'Link has invalid or placeholder href (# or javascript:).',
        whyItMatters: 'Links should navigate to valid URLs; use <button> for JS actions.',
        suggestedFix: 'Replace with <button> or use valid URL in href.'
      });
    }
  });

  // 4. Check Form Controls for labels
  const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
  inputs.forEach((input) => {
    const id = input.id;
    const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
    const hasParentLabel = input.closest('label');
    const ariaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');

    if (!hasLabel && !hasParentLabel && !ariaLabel) {
      issues.push({
        id: `a11y-${idCounter++}`,
        type: 'error',
        category: 'Forms',
        elementSelector: getCssSelector(input as HTMLElement),
        elementTag: input.tagName.toLowerCase(),
        problem: 'Form input missing associated <label> or aria-label.',
        whyItMatters: 'Users relying on assistive technology will not know what input data is expected.',
        suggestedFix: 'Add a <label for="..."> element or aria-label attribute.'
      });
    }
  });

  // 5. Check Heading Hierarchy
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  headings.forEach((h) => {
    const level = parseInt(h.tagName.substring(1), 10);
    if (lastLevel > 0 && level > lastLevel + 1) {
      issues.push({
        id: `a11y-${idCounter++}`,
        type: 'warning',
        category: 'Headings',
        elementSelector: getCssSelector(h as HTMLElement),
        elementTag: h.tagName.toLowerCase(),
        problem: `Skipped heading level from <h${lastLevel}> to <h${level}>.`,
        whyItMatters: 'Skipping heading levels creates confusing document outline structure.',
        suggestedFix: `Use <h${lastLevel + 1}> instead of <h${level}>.`
      });
    }
    lastLevel = level;
  });

  // 6. Check Text Contrast on key text elements
  const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button')).slice(0, 50);
  textElements.forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 2 && el.children.length === 0) {
      const style = window.getComputedStyle(el);
      const fg = parseColor(style.color);
      const bg = parseColor(style.backgroundColor);
      if (fg && bg && style.backgroundColor !== 'transparent' && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = getContrastRatio(fg, bg);
        if (!contrast.wcagAA) {
          issues.push({
            id: `a11y-${idCounter++}`,
            type: 'error',
            category: 'Contrast',
            elementSelector: getCssSelector(el as HTMLElement),
            elementTag: el.tagName.toLowerCase(),
            problem: `Low text contrast ratio (${contrast.ratio}:1, required 4.5:1).`,
            whyItMatters: 'Text is difficult to read for users with low vision.',
            suggestedFix: 'Increase contrast between text foreground color and background.'
          });
        }
      }
    }
  });

  // Summary counts
  const summary = {
    pass: Math.max(10, 100 - issues.length * 3), // baseline pass score indicators
    warning: issues.filter((i) => i.type === 'warning').length,
    error: issues.filter((i) => i.type === 'error').length
  };

  return {
    timestamp: Date.now(),
    issues,
    summary
  };
}
