export type ActiveTool =
  | 'inspect'
  | 'typography'
  | 'color'
  | 'box-model'
  | 'layout'
  | 'measure'
  | 'responsive'
  | 'a11y'
  | 'page-analyzer'
  | 'screenshot'
  | 'network'
  | 'ai'
  | 'perf-hud'
  | 'storage'
  | 'image-inspector'
  | 'video-recorder'
  | null;

export interface NetworkLogItem {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  type: 'fetch' | 'xhr';
  startTime: number;
  durationMs: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string | null;
  responseHeaders?: Record<string, string>;
  responseBody?: string | null;
  sizeBytes?: number;
}


export type ScreenshotMode = 'full' | 'visible' | 'area' | 'element';
export type ScreenshotFormat = 'png' | 'jpeg' | 'webp';

export interface ScreenshotHistoryItem {
  id: string;
  dataUrl: string;
  mode: ScreenshotMode;
  format: ScreenshotFormat;
  dimensions: { width: number; height: number };
  timestamp: number;
  filename: string;
}

export interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  r: number;
  g: number;
  b: number;
}

export interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAALarge: boolean;
  wcagAAA: boolean;
  wcagAAALarge: boolean;
}

export interface PickedColorHistory {
  color: ColorInfo;
  timestamp: number;
}

export interface ElementData {
  tagName: string;
  id: string;
  classList: string[];
  attributes: { name: string; value: string }[];
  selector: string;
  xpath: string;
  parentTag: string;
  childCount: number;
  outerHTML: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
  computedStyles: Record<string, string>;
  boxModel: BoxModelData;
  typography: TypographyData;
  layout: LayoutData;
}

export interface BoxModelData {
  width: number;
  height: number;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  borderTopWidth: string;
  borderRightWidth: string;
  borderBottomWidth: string;
  borderLeftWidth: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
}

export interface TypographyData {
  fontFamily: string;
  fontFamilyRendered: string;
  fontStack: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  backgroundColor: string;
  textTransform: string;
  textDecoration: string;
  fontStyle: string;
  fontVariant: string;
  textAlign: string;
  wordSpacing: string;
  whiteSpace: string;
  textRendering: string;
  textSnippet: string;
}

export interface LayoutData {
  display: string;
  position: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
  gap?: string;
  flexGrow?: string;
  flexShrink?: string;
  flexBasis?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string;
  gridRow?: string;
  zIndex?: string;
}

export interface A11yIssue {
  id: string;
  type: 'error' | 'warning' | 'pass';
  category: string;
  elementSelector: string;
  elementTag: string;
  problem: string;
  whyItMatters: string;
  suggestedFix: string;
}

export interface A11yReport {
  timestamp: number;
  issues: A11yIssue[];
  summary: {
    pass: number;
    warning: number;
    error: number;
  };
}

export interface TechHint {
  name: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  icon?: string;
}

export interface PagePerformanceData {
  loadTimeMs: number;
  domInteractiveMs: number;
  domDepth: number;
  jsHeapMb?: number;
  protocol: string;
}

export interface LighthouseScores {
  performance: number;   // 0–100
  accessibility: number; // 0–100
  bestPractices: number; // 0–100
  seo: number;           // 0–100
}

export interface CoreWebVitals {
  fcpMs: number;       // First Contentful Paint
  lcpMs: number;       // Largest Contentful Paint
  clsScore: number;    // Cumulative Layout Shift
  tbtMs: number;       // Total Blocking Time
  ttfbMs: number;      // Time To First Byte
}

export interface PageSeoData {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  robots: string;
  viewportMeta: string;
  langAttr: string;
  faviconUrl: string;
  hasSchemaOrg: boolean;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  missingAltCount: number;
  totalImages: number;
}

export interface PageAnalysisData {
  url: string;
  title: string;
  viewport: string;
  language: string;
  domCount: number;
  scriptCount: number;
  stylesheetCount: number;
  imageCount: number;
  iframeCount: number;
  technologies: TechHint[];
  fonts: string[];
  performance?: PagePerformanceData;
  seo?: PageSeoData;
  lighthouse?: LighthouseScores;
  webVitals?: CoreWebVitals;
}

export interface DevLensSettings {
  theme: 'dark' | 'light' | 'system';
  screenshotFormat: ScreenshotFormat;
  jpegQuality: number;
  filenamePrefix: string;
  showDimensionsOnHover: boolean;
  showCSSInInspector: boolean;
  showSelectorsInInspector: boolean;
  aiProvider: 'mock' | 'openai';
  aiApiKey: string;
  aiEndpoint: string;
  privacyMode: boolean;
}

export interface ExtensionMessage {
  type:
    | 'TOGGLE_TOOLBAR'
    | 'ACTIVATE_TOOL'
    | 'TAKE_SCREENSHOT'
    | 'CAPTURE_VISIBLE_TAB'
    | 'SCREENSHOT_CAPTURED'
    | 'GET_SETTINGS'
    | 'UPDATE_SETTINGS';
  payload?: unknown;
}
