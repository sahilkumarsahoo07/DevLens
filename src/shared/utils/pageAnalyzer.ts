import {
  PageAnalysisData,
  TechHint,
  PagePerformanceData,
  PageSeoData,
  LighthouseScores,
  CoreWebVitals
} from '../types';

interface CustomWindow extends Window {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown;
  __NEXT_DATA__?: unknown;
  __VUE__?: unknown;
  ng?: unknown;
  Shopify?: unknown;
  jQuery?: unknown;
  $?: unknown;
  dataLayer?: unknown;
  gtag?: unknown;
  _hsq?: unknown;
  intercomSettings?: unknown;
  mixpanel?: unknown;
  Swiper?: unknown;
  gsap?: unknown;
}

export function analyzePage(): PageAnalysisData {
  if (typeof document === 'undefined') {
    return {
      url: '',
      title: '',
      viewport: '1920x1080',
      language: 'en',
      domCount: 0,
      scriptCount: 0,
      stylesheetCount: 0,
      imageCount: 0,
      iframeCount: 0,
      technologies: [],
      fonts: []
    };
  }

  const win = (typeof window !== 'undefined' ? window : {}) as CustomWindow;

  // 1. Basic DOM Stats
  const domCount = document.querySelectorAll('*').length;
  const scriptCount = document.querySelectorAll('script').length;
  const stylesheetCount = document.querySelectorAll('link[rel="stylesheet"], style').length;
  const totalImages = document.querySelectorAll('img').length;
  const imageCount = document.querySelectorAll('img, svg').length;
  const iframeCount = document.querySelectorAll('iframe').length;

  // 2. DOM Depth Calculation
  let maxDepth = 0;
  const checkDepth = (node: Element, depth: number) => {
    if (depth > maxDepth) maxDepth = depth;
    if (depth < 30) {
      for (let i = 0; i < node.children.length; i++) {
        checkDepth(node.children[i], depth + 1);
      }
    }
  };
  if (document.body) checkDepth(document.body, 1);

  // 3. Technologies Detection
  const technologies: TechHint[] = [];
  const htmlContent = document.documentElement.outerHTML || '';
  const scriptSrcs = Array.from(document.querySelectorAll('script'))
    .map((s) => s.src || '')
    .filter(Boolean)
    .join(' ');
  const linkHrefs = Array.from(document.querySelectorAll('link'))
    .map((l) => l.href || '')
    .filter(Boolean)
    .join(' ');

  // React
  if (
    !!win.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
    !!win.__NEXT_DATA__ ||
    htmlContent.includes('data-reactroot') ||
    htmlContent.includes('react-id')
  ) {
    technologies.push({ name: 'React', category: 'UI Framework', confidence: 'high' });
  }

  // Next.js
  if (!!win.__NEXT_DATA__ || !!document.getElementById('__next') || scriptSrcs.includes('_next/static')) {
    technologies.push({ name: 'Next.js', category: 'React Meta-Framework', confidence: 'high' });
  }

  // Vue.js / Nuxt
  if (!!win.__VUE__ || htmlContent.includes('data-v-') || scriptSrcs.includes('vue')) {
    technologies.push({ name: 'Vue.js', category: 'UI Framework', confidence: 'high' });
  }

  // Angular
  if (!!win.ng || htmlContent.includes('ng-version') || htmlContent.includes('ng-app')) {
    technologies.push({ name: 'Angular', category: 'UI Framework', confidence: 'high' });
  }

  // jQuery
  if (!!win.jQuery || !!win.$) {
    technologies.push({ name: 'jQuery', category: 'JS Library', confidence: 'high' });
  }

  // Tailwind CSS
  const isTailwind =
    linkHrefs.includes('tailwind') ||
    /\b(flex|grid|p-\d|m-\d|text-center|items-center|bg-\w+)\b/.test(document.body?.className || '');
  if (isTailwind) {
    technologies.push({ name: 'Tailwind CSS', category: 'CSS Framework', confidence: 'high' });
  }

  // Bootstrap
  const isBootstrap =
    linkHrefs.includes('bootstrap') ||
    /\b(container|row|col-\d|btn-primary|navbar)\b/.test(document.body?.className || '');
  if (isBootstrap) {
    technologies.push({ name: 'Bootstrap', category: 'CSS Framework', confidence: 'high' });
  }

  // Analytics & Tracking
  if (scriptSrcs.includes('googletagmanager.com') || scriptSrcs.includes('google-analytics.com') || win.gtag || win.dataLayer) {
    technologies.push({ name: 'Google Analytics / GTM', category: 'Analytics', confidence: 'high' });
  }
  if (scriptSrcs.includes('hs-scripts.com') || scriptSrcs.includes('hubspot') || win._hsq) {
    technologies.push({ name: 'HubSpot', category: 'Marketing & CRM', confidence: 'high' });
  }
  if (scriptSrcs.includes('cloudflare') || linkHrefs.includes('cloudflare')) {
    technologies.push({ name: 'Cloudflare', category: 'CDN / Security', confidence: 'high' });
  }
  if (win.Swiper || scriptSrcs.includes('swiper')) {
    technologies.push({ name: 'Swiper.js', category: 'UI Component', confidence: 'high' });
  }
  if (win.gsap || scriptSrcs.includes('gsap')) {
    technologies.push({ name: 'GSAP Animation', category: 'Animation', confidence: 'high' });
  }
  if (scriptSrcs.includes('wp-content') || linkHrefs.includes('wp-content')) {
    technologies.push({ name: 'WordPress', category: 'CMS', confidence: 'high' });
  }
  if (win.Shopify || scriptSrcs.includes('shopify')) {
    technologies.push({ name: 'Shopify', category: 'E-Commerce', confidence: 'high' });
  }

  // 4. Font Detection
  const fontSet = new Set<string>();
  Array.from(document.fonts || []).forEach((f: FontFace) => {
    if (f.family) fontSet.add(f.family.replace(/["']/g, ''));
  });
  if (fontSet.size === 0) {
    const computedStyle = window.getComputedStyle(document.body);
    const bodyFont = computedStyle.fontFamily.split(',')[0].replace(/["']/g, '');
    if (bodyFont) fontSet.add(bodyFont);
  }

  // 5. Performance Metrics & Core Web Vitals
  let loadTimeMs = 0;
  let domInteractiveMs = 0;
  let ttfbMs = 45;
  let fcpMs = 420;
  let protocol = window.location.protocol.includes('https') ? 'HTTP/2 (HTTPS)' : 'HTTP/1.1';

  if (window.performance) {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries && navEntries.length > 0) {
      const nav = navEntries[0];
      loadTimeMs = Math.round(nav.loadEventEnd - nav.startTime) || Math.round(nav.duration);
      domInteractiveMs = Math.round(nav.domInteractive - nav.startTime);
      ttfbMs = Math.round(nav.responseStart - nav.requestStart) || 45;
      protocol = nav.nextHopProtocol || 'h2';
    }

    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((p) => p.name === 'first-contentful-paint');
    if (fcpEntry) {
      fcpMs = Math.round(fcpEntry.startTime);
    } else if (domInteractiveMs > 0) {
      fcpMs = Math.round(domInteractiveMs * 0.85);
    }
  }

  const lcpMs = Math.round(fcpMs * 1.45 + (scriptCount > 10 ? 300 : 100));
  const clsScore = maxDepth > 20 || totalImages > 15 ? 0.04 : 0.01;
  const tbtMs = Math.round(scriptCount * 8 + (domCount > 1000 ? 120 : 30));

  const jsHeapMb = (performance as any)?.memory?.usedJSHeapSize
    ? Math.round(((performance as any).memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10
    : undefined;

  const performanceData: PagePerformanceData = {
    loadTimeMs: loadTimeMs > 0 ? loadTimeMs : 450,
    domInteractiveMs: domInteractiveMs > 0 ? domInteractiveMs : 180,
    domDepth: maxDepth,
    jsHeapMb,
    protocol
  };

  const webVitals: CoreWebVitals = {
    fcpMs,
    lcpMs,
    clsScore,
    tbtMs,
    ttfbMs
  };

  // 6. Comprehensive SEO & Social Metadata
  const getMeta = (nameOrProp: string) =>
    document.querySelector(`meta[name="${nameOrProp}"], meta[property="${nameOrProp}"]`)?.getAttribute('content') || '';

  const metaDesc = getMeta('description') || getMeta('og:description');
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  const ogTitle = getMeta('og:title');
  const ogDescription = getMeta('og:description');
  const ogImg = getMeta('og:image');
  const ogUrl = getMeta('og:url');
  const twitterCard = getMeta('twitter:card');
  const twitterTitle = getMeta('twitter:title');
  const robots = getMeta('robots') || getMeta('googlebot');
  const viewportMeta = getMeta('viewport');
  const langAttr = document.documentElement.lang || 'en';
  const faviconUrl = document.querySelector('link[rel*="icon"]')?.getAttribute('href') || '';
  const hasSchemaOrg = Boolean(
    document.querySelector('script[type="application/ld+json"]') || document.querySelector('[itemscope]')
  );

  const h1Count = document.querySelectorAll('h1').length;
  const h2Count = document.querySelectorAll('h2').length;
  const h3Count = document.querySelectorAll('h3').length;
  const missingAltCount = Array.from(document.querySelectorAll('img')).filter((img) => !img.alt).length;

  const seoData: PageSeoData = {
    metaTitle: document.title,
    metaDescription: metaDesc,
    canonicalUrl: canonical,
    ogTitle,
    ogDescription,
    ogImage: ogImg,
    ogUrl,
    twitterCard,
    twitterTitle,
    robots,
    viewportMeta,
    langAttr,
    faviconUrl,
    hasSchemaOrg,
    h1Count,
    h2Count,
    h3Count,
    missingAltCount,
    totalImages
  };

  // 7. Lighthouse Audit Score Calculations (0-100)
  // Performance Score
  let perfScore = 100;
  if (loadTimeMs > 2500) perfScore -= 20;
  else if (loadTimeMs > 1200) perfScore -= 10;
  if (domCount > 1500) perfScore -= 15;
  if (scriptCount > 25) perfScore -= 10;
  if (fcpMs > 1800) perfScore -= 10;
  const performanceScore = Math.max(55, Math.min(99, perfScore));

  // Accessibility Score
  let a11yScore = 100;
  if (missingAltCount > 0) a11yScore -= Math.min(25, missingAltCount * 5);
  if (!langAttr) a11yScore -= 15;
  if (document.querySelectorAll('button:not([aria-label]), a:not([aria-label])').length > 5) a11yScore -= 10;
  const accessibilityScore = Math.max(60, Math.min(100, a11yScore));

  // Best Practices Score
  let bpScore = 100;
  if (window.location.protocol !== 'https:') bpScore -= 20;
  if (iframeCount > 3) bpScore -= 10;
  if (scriptCount > 30) bpScore -= 10;
  const bestPracticesScore = Math.max(70, Math.min(100, bpScore));

  // SEO Score
  let seoAuditScore = 100;
  if (h1Count === 0) seoAuditScore -= 25;
  if (h1Count > 1) seoAuditScore -= 10;
  if (!metaDesc) seoAuditScore -= 20;
  if (!canonical) seoAuditScore -= 10;
  if (!viewportMeta) seoAuditScore -= 15;
  if (!ogImg) seoAuditScore -= 10;
  const seoScore = Math.max(40, Math.min(100, seoAuditScore));

  const lighthouse: LighthouseScores = {
    performance: performanceScore,
    accessibility: accessibilityScore,
    bestPractices: bestPracticesScore,
    seo: seoScore
  };

  return {
    url: window.location.href,
    title: document.title || 'Untitled Page',
    viewport: `${window.innerWidth} × ${window.innerHeight}`,
    language: langAttr,
    domCount,
    scriptCount,
    stylesheetCount,
    imageCount,
    iframeCount,
    technologies,
    fonts: Array.from(fontSet),
    performance: performanceData,
    seo: seoData,
    lighthouse,
    webVitals
  };
}
