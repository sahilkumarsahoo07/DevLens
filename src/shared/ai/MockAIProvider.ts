import { AIProvider } from './AIProvider';
import { ElementData, PageAnalysisData } from '../types';
import { cssToTailwind } from '../utils/tailwindUtils';

export class MockAIProvider implements AIProvider {
  name = 'Mock AI Provider';

  async ask(
    userQuery: string,
    elementContext?: ElementData | null,
    _pageContext?: PageAnalysisData | null
  ): Promise<string> {
    // Simulate network delay
    await new Promise((res) => setTimeout(res, 600));

    const q = userQuery.toLowerCase();
    const tag = elementContext ? `<${elementContext.tagName}>` : 'the target element';
    const selector = elementContext?.selector || 'element';

    if (q.includes('overflow') || q.includes('scroll') || q.includes('cut off')) {
      return `### DevLens AI Diagnosis: Overflow Analysis

Target Element: \`${selector}\`

**Root Cause:**
The element ${tag} has a fixed computed height of \`${elementContext?.computedStyles.height || 'auto'}\` with computed overflow: \`${elementContext?.computedStyles.overflow || 'visible'}\`. When child content expands, scrollbars or unwanted clipping occurs.

**Recommended Solution:**
1. Change \`height: ${elementContext?.computedStyles.height || '300px'}\` to \`min-height: ${elementContext?.computedStyles.height || '300px'}\` or \`height: auto\`.
2. Apply \`overflow-y: auto\` to allow smooth container scrolling.
3. Ensure parent flex item has \`min-height: 0\` or \`flex-shrink: 0\`.`;
    }

    if (q.includes('tailwind') || q.includes('convert')) {
      const tw = elementContext
        ? cssToTailwind(elementContext.computedStyles, elementContext.typography, elementContext.boxModel, elementContext.layout)
        : 'flex flex-col items-center justify-center p-4 bg-slate-900 text-white rounded-xl shadow-lg';

      return `### DevLens Tailwind Conversion

Converted CSS for \`${selector}\`:

\`\`\`html
<div class="${tw}">
  <!-- ${elementContext?.typography.textSnippet ? elementContext.typography.textSnippet : 'Component Content'} -->
</div>
\`\`\``;
    }

    if (q.includes('center') || q.includes('align') || q.includes('middle')) {
      return `### DevLens Layout Tip: Centering

For \`${selector}\` (${tag}):

**Flexbox Solution (Recommended):**
\`\`\`css
display: flex;
justify-content: center; /* Horizontally center */
align-items: center;     /* Vertically center */
\`\`\`

**CSS Grid Solution:**
\`\`\`css
display: grid;
place-items: center;
\`\`\``;
    }

    if (q.includes('responsive') || q.includes('mobile')) {
      return `### DevLens Responsive Optimization

For \`${selector}\`:

1. Current width is fixed at \`${elementContext?.computedStyles.width || '100%'}\`. Replace with \`width: 100%; max-width: 1280px;\`.
2. Add media queries or Tailwind responsive breakpoints (\`sm:\`, \`md:\`, \`lg:\`).
3. If using flexbox, add \`flex-wrap: wrap\` or switch to \`flex-col\` on mobile viewports.`;
    }

    // Default intelligent response
    return `### DevLens Assistant

**Analysis for:** \`${selector}\` (${tag})

- **Dimensions:** ${elementContext?.rect.width || 0}px × ${elementContext?.rect.height || 0}px
- **Display:** \`${elementContext?.computedStyles.display || 'block'}\`
- **Position:** \`${elementContext?.computedStyles.position || 'static'}\`
- **Font:** \`${elementContext?.typography.fontFamily || 'inherit'}\` (${elementContext?.typography.fontSize || '16px'})

**User Query:** "${userQuery}"

*Suggestion:* Ensure clear CSS selector specificity and check container box-sizing (\`box-sizing: border-box\`) to maintain pixel-perfect layouts.`;
  }
}
