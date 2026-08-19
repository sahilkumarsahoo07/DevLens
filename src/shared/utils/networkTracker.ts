import { NetworkLogItem } from '../types';

declare global {
  interface Window {
    __DEVLENS_NETWORK_TRACKER_INITIALIZED__?: boolean;
    __DEVLENS_NETWORK_LOGS__?: NetworkLogItem[];
  }
}

let isRecordingGlobal = true;
const STORAGE_KEY = '__DEVLENS_SESSION_NETWORK_LOGS__';

function safeSendMessage(message: any, callback?: (res: any) => void) {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          return;
        }
        if (callback) callback(response);
      });
    }
  } catch (_) {
    // Context invalidated safely caught
  }
}

export function setNetworkRecording(recording: boolean) {
  isRecordingGlobal = recording;
}

export function isNetworkRecording(): boolean {
  return isRecordingGlobal;
}

export function clearGlobalNetworkLogs() {
  if (typeof window !== 'undefined') {
    window.__DEVLENS_NETWORK_LOGS__ = [];
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore sessionStorage error
    }
    safeSendMessage({ type: 'CLEAR_TAB_NETWORK_LOGS' });
    window.dispatchEvent(new CustomEvent('devlens:network-cleared'));
  }
}

export function getGlobalNetworkLogs(): NetworkLogItem[] {
  if (typeof window === 'undefined') return [];
  if (!window.__DEVLENS_NETWORK_LOGS__ || window.__DEVLENS_NETWORK_LOGS__.length === 0) {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        window.__DEVLENS_NETWORK_LOGS__ = JSON.parse(stored);
      }
    } catch {
      // Ignore parse error
    }
  }
  return window.__DEVLENS_NETWORK_LOGS__ || [];
}

function saveToSessionStorage(logs: NetworkLogItem[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 150)));
  } catch {
    // Ignore storage quota errors
  }
}

export function initNetworkTracker() {
  if (typeof window === 'undefined') return;

  // Initialize array
  if (!window.__DEVLENS_NETWORK_LOGS__) {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      window.__DEVLENS_NETWORK_LOGS__ = stored ? JSON.parse(stored) : [];
    } catch {
      window.__DEVLENS_NETWORK_LOGS__ = [];
    }
  }

  // Request tab logs from background service worker to ensure past page calls persist
  safeSendMessage({ type: 'GET_TAB_NETWORK_LOGS' }, (response) => {
    if (response && Array.isArray(response.logs) && response.logs.length > 0) {
      const bgLogs: NetworkLogItem[] = response.logs;
      const currentLogs = window.__DEVLENS_NETWORK_LOGS__ || [];
      bgLogs.forEach((log) => {
        if (!currentLogs.some((item) => item.id === log.id)) {
          currentLogs.push(log);
        }
      });
      currentLogs.sort((a, b) => b.startTime - a.startTime);
      window.__DEVLENS_NETWORK_LOGS__ = currentLogs;
      saveToSessionStorage(currentLogs);
      window.dispatchEvent(new CustomEvent('devlens:network-log'));
    }
  });

  if (window.__DEVLENS_NETWORK_TRACKER_INITIALIZED__) return;
  window.__DEVLENS_NETWORK_TRACKER_INITIALIZED__ = true;

  // Listen to network events posted from mainWorldInterceptor.js (injected via manifest.json with world: MAIN)
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.source === 'DEVLENS_NETWORK_INTERCEPTOR') {
      const logItem: NetworkLogItem = event.data.payload;
      if (isRecordingGlobal && window.__DEVLENS_NETWORK_LOGS__) {
        // Prevent duplicate logs by ID
        if (!window.__DEVLENS_NETWORK_LOGS__.some((item) => item.id === logItem.id)) {
          window.__DEVLENS_NETWORK_LOGS__.unshift(logItem);
          if (window.__DEVLENS_NETWORK_LOGS__.length > 200) {
            window.__DEVLENS_NETWORK_LOGS__.pop();
          }
          saveToSessionStorage(window.__DEVLENS_NETWORK_LOGS__);

          // Sync to Background worker for cross-page navigation persistence
          safeSendMessage({ type: 'ADD_TAB_NETWORK_LOG', payload: logItem });

          window.dispatchEvent(new CustomEvent('devlens:network-log', { detail: logItem }));
        }
      }
    }
  });
}
