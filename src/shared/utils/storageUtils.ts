import { DevLensSettings, ScreenshotHistoryItem, PickedColorHistory } from '../types';

const DEFAULT_SETTINGS: DevLensSettings = {
  theme: 'light',
  screenshotFormat: 'png',
  jpegQuality: 0.92,
  filenamePrefix: 'devlens-screenshot',
  showDimensionsOnHover: true,
  showCSSInInspector: true,
  showSelectorsInInspector: true,
  aiProvider: 'mock',
  aiApiKey: '',
  aiEndpoint: 'https://api.openai.com/v1/chat/completions',
  privacyMode: true
};

export function isExtensionContextValid(): boolean {
  try {
    return typeof chrome !== 'undefined' && Boolean(chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

export async function getSettings(): Promise<DevLensSettings> {
  return new Promise((resolve) => {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.get(['devlens_settings'], (result) => {
          try {
            if (result && result.devlens_settings) {
              resolve({ ...DEFAULT_SETTINGS, ...result.devlens_settings });
            } else {
              const stored = localStorage.getItem('devlens_settings');
              resolve(stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS);
            }
          } catch {
            const stored = localStorage.getItem('devlens_settings');
            resolve(stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS);
          }
        });
        return;
      } catch {
        // Context invalidated
      }
    }
    const stored = localStorage.getItem('devlens_settings');
    resolve(stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS);
  });
}

export async function saveSettings(settings: Partial<DevLensSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };

  return new Promise((resolve) => {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ devlens_settings: updated }, () => resolve());
        return;
      } catch {
        // Context invalidated
      }
    }
    localStorage.setItem('devlens_settings', JSON.stringify(updated));
    resolve();
  });
}

export async function getScreenshotHistory(): Promise<ScreenshotHistoryItem[]> {
  return new Promise((resolve) => {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.get(['devlens_screenshot_history'], (res) => {
          try {
            if (res && res.devlens_screenshot_history) {
              resolve(res.devlens_screenshot_history);
            } else {
              const stored = localStorage.getItem('devlens_screenshot_history');
              resolve(stored ? JSON.parse(stored) : []);
            }
          } catch {
            const stored = localStorage.getItem('devlens_screenshot_history');
            resolve(stored ? JSON.parse(stored) : []);
          }
        });
        return;
      } catch {
        // Context invalidated
      }
    }
    const stored = localStorage.getItem('devlens_screenshot_history');
    resolve(stored ? JSON.parse(stored) : []);
  });
}

export async function addScreenshotHistory(item: ScreenshotHistoryItem): Promise<void> {
  const history = await getScreenshotHistory();
  const updated = [item, ...history].slice(0, 20);

  return new Promise((resolve) => {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ devlens_screenshot_history: updated }, () => resolve());
        return;
      } catch {
        // Context invalidated
      }
    }
    localStorage.setItem('devlens_screenshot_history', JSON.stringify(updated));
    resolve();
  });
}

export async function removeScreenshotHistoryItem(id: string): Promise<ScreenshotHistoryItem[]> {
  const history = await getScreenshotHistory();
  const updated = history.filter((item) => item.id !== id);

  return new Promise((resolve) => {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ devlens_screenshot_history: updated }, () => resolve(updated));
        return;
      } catch {
        // Context invalidated
      }
    }
    localStorage.setItem('devlens_screenshot_history', JSON.stringify(updated));
    resolve(updated);
  });
}

export async function clearScreenshotHistory(): Promise<void> {
  return new Promise((resolve) => {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ devlens_screenshot_history: [] }, () => resolve());
        return;
      } catch {
        // Context invalidated
      }
    }
    localStorage.removeItem('devlens_screenshot_history');
    resolve();
  });
}

export async function getColorHistory(): Promise<PickedColorHistory[]> {
  return new Promise((resolve) => {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.get(['devlens_color_history'], (res) => {
          try {
            if (res && res.devlens_color_history) {
              resolve(res.devlens_color_history);
            } else {
              const stored = localStorage.getItem('devlens_color_history');
              resolve(stored ? JSON.parse(stored) : []);
            }
          } catch {
            const stored = localStorage.getItem('devlens_color_history');
            resolve(stored ? JSON.parse(stored) : []);
          }
        });
        return;
      } catch {
        // Context invalidated
      }
    }
    const stored = localStorage.getItem('devlens_color_history');
    resolve(stored ? JSON.parse(stored) : []);
  });
}

export async function addColorHistory(item: PickedColorHistory): Promise<void> {
  const history = await getColorHistory();
  const filtered = history.filter((h) => h.color.hex !== item.color.hex);
  const updated = [item, ...filtered].slice(0, 20);

  return new Promise((resolve) => {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      try {
        chrome.storage.local.set({ devlens_color_history: updated }, () => resolve());
        return;
      } catch {
        // Context invalidated
      }
    }
    localStorage.setItem('devlens_color_history', JSON.stringify(updated));
    resolve();
  });
}
