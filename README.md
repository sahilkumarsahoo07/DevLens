# DevLens - Web Inspection & Developer Toolkit

**DevLens** is a modern, production-grade Chrome extension (Manifest V3) that provides an all-in-one web inspection toolkit for frontend developers, UI/UX designers, QA engineers, product architects, and technical users.

With DevLens, you can inspect elements, analyze typography, sample colors with contrast checking, measure element distances, test viewport responsiveness, audit WCAG accessibility, analyze page tech stacks, capture multi-mode screenshots, and consult an AI assistant—all directly on any webpage without opening standard Chrome DevTools.

---

## 🌟 Key Features

### 1. Floating Injected Toolbar
- **Shadow DOM Isolation**: Injected via Web Component / Shadow DOM root (`attachShadow`) to prevent page CSS pollution.
- **Draggable & Responsive**: Drag anywhere on screen, toggle dark/light theme, access tooltips and keybindings.
- **Keyboard Shortcut Ready**: Instant activation via configurable Chrome extension commands (`Alt+Shift+D`, `Alt+Shift+I`, `Alt+Shift+C`, etc.).

### 2. 🔍 Element Inspector & Box Model
- **DOM & Attributes**: Inspect element tag, ID, classes, attributes, parent, children, and outer HTML.
- **Computed CSS**: Live computed style extraction (display, position, flex/grid, margins, padding, box-shadow, z-index).
- **Box Model Visualizer**: Interactive box-model diagram displaying exact pixel values for Margin, Border, Padding, and Content dimensions.
- **Developers Copy**: One-click Copy CSS, Copy HTML, Copy Selector, Copy XPath, and Copy Tailwind equivalent.

### 3. 🔤 Typography Inspector
- **Actual Rendered Font**: Detects font family, font stack, actual rendered font, font size, weight, line-height, letter-spacing, colors, and text snippet preview.
- **Tailwind & CSS Export**: Copy typography CSS rules, JSON configuration, or Tailwind class equivalent.

### 4. 🎨 Color Picker & WCAG Contrast Checker
- **Native EyeDropper**: Magnified crosshair color picker.
- **Format Support**: Conversions for HEX, RGB, and HSL values.
- **WCAG 2.1 Audit**: Automatic contrast ratio calculation with AA/AAA compliance ratings for normal and large text.
- **Page Palette Extraction**: Extracts top colors used across the webpage DOM.
- **Color History**: Saved and recently picked color history.

### 5. 📏 Measurement Ruler Tool
- **Distance Calculation**: Measure pixel distance (ΔX, ΔY, diagonal) between points or elements on the webpage.
- **Alignment Guides**: Live SVG guide lines and boundary boxes above page content.

### 6. 📸 Screenshot Toolkit
- **Multi-Mode Capture**: Visible Viewport, Full Page scrolling capture, Area drag selection, and Element capture.
- **Format Selection**: Export as PNG, JPEG, or WebP with configurable quality settings.
- **Clipboard & Download**: Direct copy to clipboard, custom file prefixing, and recent screenshot history panel.

### 7. 📱 Responsive Viewport Tester
- **Device Presets**: Mobile S/M/L (320px, 375px, 390px), Tablet (768px), Laptop (1024px), Desktop (1440px), 4K (1920px).
- **Custom Viewport**: Enter custom width and height dimensions with live status overlay.

### 8. ♿ Accessibility Checker
- **Automated WCAG Audit**: Scans for missing alt text, unlabelled buttons, link text issues, heading hierarchy jumps, unlabelled form controls, and low contrast text.
- **Fix Guidance**: Shows problem description, why it matters, suggested fix, and element highlighter.

### 9. 📊 Page Tech & Overview Analyzer
- **Page Overview**: Viewport, URL, title, language, DOM count, scripts count, stylesheets count, images count, and iframe count.
- **Tech Stack Detection**: Client-side hints for React, Next.js, Vue.js, Angular, Tailwind CSS, Bootstrap, WordPress, and Shopify.

### 10. 🤖 "Ask DevLens" AI Assistant Architecture
- **Target Context Aware**: Sends selected element dimensions, typography, and computed CSS to the AI instead of blindly uploading the entire page.
- **Flexible Provider System**: Pluggable `AIProvider` architecture (`MockAIProvider` for zero-config offline use, `OpenAIProvider` for custom OpenAI API keys).

### 11. ⌨️ Command Palette (`Ctrl+K`)
- **Quick Action Launcher**: Search and trigger any DevLens tool or command with keyboard arrow navigation.

---

## 🛠️ Technology Stack

- **Manifest**: Chrome Extension Manifest V3
- **Language**: TypeScript (Strict Mode)
- **Framework**: React 18
- **Bundler**: Vite 5 with Multi-Entry Rollup Configuration
- **Icons**: Lucide React
- **Styling**: Vanilla Modern CSS with CSS Variables & Shadow DOM scope
- **Testing**: Vitest with unit tests for color conversions, contrast, CSS parsing, Tailwind mapping, and command search

---

## 📁 Project Structure

```
dist/                       # Production extension output directory
public/
  ├── manifest.json         # Manifest V3 configuration
  └── icons/                # Extension icons (16, 48, 128 px)
src/
  ├── background/
  │   └── service-worker.ts # Service worker (commands & visible tab capture)
  ├── content/
  │   ├── index.ts          # Content script entry point & Shadow DOM mount
  │   └── overlay/          # React components injected into Shadow DOM
  │       ├── DevLensOverlay.tsx
  │       ├── Toolbar.tsx
  │       ├── CommandPalette.tsx
  │       ├── InspectorPanel.tsx
  │       ├── TypographyInspector.tsx
  │       ├── ColorPickerOverlay.tsx
  │       ├── MeasurementOverlay.tsx
  │       ├── ScreenshotModal.tsx
  │       ├── ResponsiveModal.tsx
  │       ├── AccessibilityPanel.tsx
  │       ├── PageAnalyzerPanel.tsx
  │       └── AIPanel.tsx
  ├── popup/
  │   ├── index.html        # Extension browser toolbar popup
  │   ├── main.tsx
  │   └── PopupApp.tsx
  ├── options/
  │   ├── index.html        # Extension settings page
  │   ├── main.tsx
  │   └── OptionsApp.tsx
  ├── shared/
  │   ├── ai/               # AI Provider abstraction & implementations
  │   ├── types/            # TypeScript interface definitions
  │   ├── utils/            # Color, CSS, DOM, Tailwind, A11y, Storage utils
  │   └── styles/           # DevLens design system CSS
  └── test/                 # Vitest test suite
```

---

## 🚀 Installation & Setup

### Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Run ESLint code checks
npm run lint

# 4. Build extension bundle
npm run build
```

---

## 📦 Loading Unpacked Extension in Google Chrome

1. Open **Google Chrome** and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `dist/` directory located inside this project folder:
   `c:\Users\ssahoo\OneDrive - Phenom Enterprise Cloud\Desktop\multi extension\dist`
5. DevLens will now appear in your extension toolbar. Pin DevLens for quick access.
6. Open any website and press `Alt+Shift+D` or click the DevLens icon to launch the floating toolbar.

---

## 🔒 Privacy & Permissions Explanation

DevLens is built with a **privacy-first** design:
- **No Browsing History Collected**: DevLens does not track or send browsing history anywhere.
- **Local Data Only**: Screenshots, settings, and color history stay strictly on your device inside `chrome.storage.local`.
- **Permissions**:
  - `activeTab`: Used to capture visible viewport screenshots and inspect elements on active tab.
  - `storage`: Used to persist user settings and recent activity locally.
  - `scripting`: Used to inject the DevLens overlay into webpages when requested.

---

## 🗺️ Future Roadmap & Extensions

- **SVG Inspector & Optimizer**: Extract clean SVG markup and path metrics.
- **CSS Variable & Token Extractor**: Map page CSS custom properties (`--var`) into design token JSON.
- **Figma Design Comparison Overlay**: Overlay Figma mockups onto live webpages for pixel-perfect comparison.
