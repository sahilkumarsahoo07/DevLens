# DevLens Architecture & Communication Specs

## Architecture Overview

DevLens follows a clean Manifest V3 extension architecture divided into isolated layers:

```mermaid
graph TD
    User([User Action / Keyboard Shortcut]) --> Popup[Extension Popup / Options]
    User --> ServiceWorker[Background Service Worker]
    
    ServiceWorker -- chrome.tabs.sendMessage --> ContentScript[Content Script: src/content/index.ts]
    Popup -- chrome.tabs.sendMessage --> ContentScript
    
    ContentScript --> ShadowDOMHost[Shadow DOM Host Container: #devlens-root]
    ShadowDOMHost --> ReactRoot[React Root Component: DevLensOverlay]
    
    ReactRoot --> Toolbar[Floating Drag Toolbar]
    ReactRoot --> CommandPalette[Command Palette Overlay]
    ReactRoot --> Inspector[Element & Box Model Inspector]
    ReactRoot --> Typography[Typography Inspector]
    ReactRoot --> ColorPicker[Color Picker & WCAG Contrast]
    ReactRoot --> Measurement[Measurement Overlay]
    ReactRoot --> Screenshot[Screenshot Modal]
    ReactRoot --> Responsive[Responsive Viewport Tester]
    ReactRoot --> A11y[Accessibility Auditor]
    ReactRoot --> PageAnalyzer[Page Overview Analyzer]
    ReactRoot --> AI[Ask DevLens AI Assistant]
    
    AI --> AIProviderAdapter[AIProvider Adapter Interface]
    AIProviderAdapter --> MockAI[MockAIProvider (Offline)]
    AIProviderAdapter --> OpenAI[OpenAIProvider (API Key)]
```

---

## Component Responsibilities

### 1. Background Service Worker (`src/background/service-worker.ts`)
- **Lifecycle Management**: Listens to installation events and extension command shortcuts (`Alt+Shift+D`, `Alt+Shift+I`, etc.).
- **Message Routing**: Forwards user trigger events to the active browser tab via `chrome.tabs.sendMessage`.
- **Active Tab Screen Capture**: Executes `chrome.tabs.captureVisibleTab` when requested by the content script's screenshot tool.

### 2. Content Script & Shadow DOM Mount (`src/content/index.ts`)
- **Host DOM Isolation**: Attaches an open Shadow DOM root (`devlensHostContainer.attachShadow({ mode: 'open' })`) to prevent host website CSS rules from breaking DevLens UI, and prevents DevLens CSS from polluting the host site.
- **CSS Injection**: Injects `devlens-theme.css` directly into the shadow root.
- **React Hydration**: Mounts the main React application (`DevLensOverlay`) inside the shadow root using React 18 `createRoot`.

### 3. Extension Popup (`src/popup/PopupApp.tsx`)
- **Quick Action Trigger**: Sends direct execution messages to active tabs (`inspect`, `color`, `typography`, `screenshot`, `measure`).
- **Activity Summary**: Displays status badge (● Active) and previews recent color & screenshot activity from `chrome.storage.local`.

### 4. Options / Settings (`src/options/OptionsApp.tsx`)
- **User Preferences**: Manages theme, default screenshot formats, filename prefixes, inspector options, AI provider configuration, and privacy mode.

---

## AI Architecture Abstraction (`src/shared/ai/`)

DevLens uses an adapter design pattern for AI capabilities:

```typescript
export interface AIProvider {
  name: string;
  ask(userQuery: string, elementContext?: ElementData | null, pageContext?: PageAnalysisData | null): Promise<string>;
}
```

- **`MockAIProvider`**: Default offline implementation requiring zero API key. Uses structured pattern matching to answer common CSS overflow, Tailwind conversion, centering, and responsive design questions instantly.
- **`OpenAIProvider`**: Connects to OpenAI or custom completions endpoints when the user configures their API key in Settings.

---

## Storage & Persistence Layer (`src/shared/utils/storageUtils.ts`)

- Wraps `chrome.storage.local` with fallback to `localStorage` for development and testing environments.
- Persists settings (`devlens_settings`), screenshot history (`devlens_screenshot_history`), and picked color history (`devlens_color_history`).
