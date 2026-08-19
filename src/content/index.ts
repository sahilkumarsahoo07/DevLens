import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { DevLensOverlay } from './overlay/DevLensOverlay';
import themeCss from '../shared/styles/devlens-theme.css?inline';
import { ActiveTool } from '../shared/types';
import { initNetworkTracker } from '../shared/utils/networkTracker';

// Initialize API & Network Tracker immediately on page load
initNetworkTracker();

let devlensHostContainer: HTMLElement | null = null;
let devlensShadowRoot: ShadowRoot | null = null;
let reactRoot: Root | null = null;

function cleanupDuplicateRoots() {
  const roots = document.querySelectorAll('#devlens-root');
  if (roots.length > 0) {
    roots.forEach((root) => root.remove());
  }
  devlensHostContainer = null;
  devlensShadowRoot = null;
  reactRoot = null;
}

function mountDevLens(initialTool: ActiveTool = null) {
  try {
    // Check if #devlens-root already exists in the host DOM
    const existing = document.getElementById('devlens-root');
    if (existing) {
      // If container already exists and reactRoot is active, simply update
      if (devlensHostContainer === existing && reactRoot) {
        renderApp(initialTool);
        return;
      }
      // Otherwise, clean up old orphan containers from script re-injections
      cleanupDuplicateRoots();
    }

    // 1. Create host div on host document with pointer-events: none
    devlensHostContainer = document.createElement('div');
    devlensHostContainer.id = 'devlens-root';
    devlensHostContainer.style.position = 'fixed';
    devlensHostContainer.style.top = '0';
    devlensHostContainer.style.left = '0';
    devlensHostContainer.style.width = '100vw';
    devlensHostContainer.style.height = '100vh';
    devlensHostContainer.style.pointerEvents = 'none';
    devlensHostContainer.style.zIndex = '2147483647';

    document.documentElement.appendChild(devlensHostContainer);

    // 2. Attach Shadow DOM
    devlensShadowRoot = devlensHostContainer.attachShadow({ mode: 'open' });

    // 3. Inject CSS Theme into Shadow DOM
    const styleEl = document.createElement('style');
    styleEl.textContent = themeCss;
    devlensShadowRoot.appendChild(styleEl);

    // 4. Create App Render Target inside Shadow DOM
    const appTarget = document.createElement('div');
    appTarget.id = 'devlens-app-target';
    appTarget.style.pointerEvents = 'none';
    devlensShadowRoot.appendChild(appTarget);

    // 5. Render React Component
    reactRoot = createRoot(appTarget);
    renderApp(initialTool);
  } catch (err) {
    console.error('[DevLens] Mounting failed:', err);
  }
}

function renderApp(initialTool: ActiveTool = null) {
  if (!reactRoot) return;

  reactRoot.render(
    React.createElement(DevLensOverlay, {
      initialTool,
      onCloseExtension: unmountDevLens
    })
  );
}

function unmountDevLens() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  if (devlensHostContainer) {
    devlensHostContainer.remove();
    devlensHostContainer = null;
    devlensShadowRoot = null;
  }

  cleanupDuplicateRoots();
}

function toggleDevLens(initialTool: ActiveTool = null) {
  const existing = document.getElementById('devlens-root');
  if (existing && reactRoot) {
    if (initialTool !== null) {
      renderApp(initialTool);
    } else {
      unmountDevLens();
    }
  } else {
    mountDevLens(initialTool);
  }
}

// Ensure chrome message listeners are registered ONLY ONCE per window session
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const win = window as any;
  if (!win.__DEVLENS_LISTENER_REGISTERED__) {
    win.__DEVLENS_LISTENER_REGISTERED__ = true;
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'TOGGLE_TOOLBAR') {
        toggleDevLens(message.payload?.tool || null);
        sendResponse({ status: 'success' });
      } else if (message.type === 'ACTIVATE_TOOL') {
        mountDevLens(message.payload?.tool || null);
        sendResponse({ status: 'success' });
      }
      return true;
    });
  }
}

// Auto-mount shortcut listener (Alt+Shift+D) - Register once
const win = window as any;
if (!win.__DEVLENS_SHORTCUT_REGISTERED__) {
  win.__DEVLENS_SHORTCUT_REGISTERED__ = true;
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key.toUpperCase() === 'D') {
      e.preventDefault();
      toggleDevLens();
    }
  });
}


// DevLens content script loaded and ready to respond to toggle events (Popup / Shortcut / Chrome Actions)

