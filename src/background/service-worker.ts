// DevLens Service Worker (Manifest V3)

const tabNetworkLogs: Record<number, any[]> = {};

chrome.runtime.onInstalled.addListener(() => {
  console.log('DevLens Developer Extension installed successfully.');
});

// Handle Direct Extension Action Icon Clicks
if (chrome.action) {
  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab || !tab.id) return;
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_TOOLBAR',
        payload: { tool: null }
      });
    } catch {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      setTimeout(() => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_TOOLBAR',
            payload: { tool: null }
          }).catch(() => {});
        }
      }, 200);
    }
  });
}

// Handle Keyboard Command Shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    const commandToolMap: Record<string, string> = {
      'toggle-toolbar': 'inspect',
      'screenshot': 'screenshot',
      'color-picker': 'color',
      'font-inspector': 'typography',
      'element-inspector': 'inspect',
      'measure': 'measure',
      'responsive': 'responsive',
      'accessibility': 'a11y'
    };

    const tool = commandToolMap[command] || null;

    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_TOOLBAR',
        payload: { tool }
      });
    } catch (err) {
      console.warn('[DevLens] Could not send message to tab. Injecting content script...', err);
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      setTimeout(() => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_TOOLBAR',
            payload: { tool }
          }).catch(() => {});
        }
      }, 200);
    }
  } catch (e) {
    console.error('[DevLens Command Error]:', e);
  }
});

// Handle Messages from Content Script / Popup / Network Interceptor
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ADD_TAB_NETWORK_LOG') {
    const tabId = sender.tab?.id;
    if (tabId) {
      if (!tabNetworkLogs[tabId]) tabNetworkLogs[tabId] = [];
      const logs = tabNetworkLogs[tabId];
      if (!logs.some((l: any) => l.id === message.payload.id)) {
        logs.unshift(message.payload);
        if (logs.length > 300) logs.pop();
      }
    }
    return false;
  }

  if (message.type === 'GET_TAB_NETWORK_LOGS') {
    const tabId = sender.tab?.id;
    const logs = tabId && tabNetworkLogs[tabId] ? tabNetworkLogs[tabId] : [];
    sendResponse({ logs });
    return true;
  }

  if (message.type === 'CLEAR_TAB_NETWORK_LOGS') {
    const tabId = sender.tab?.id;
    if (tabId) tabNetworkLogs[tabId] = [];
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'CAPTURE_VISIBLE_TAB') {
    // Chrome tabs.captureVisibleTab natively ONLY accepts 'png' or 'jpeg'
    const requestedFormat = message.payload?.format;
    const captureFormat: 'png' | 'jpeg' = requestedFormat === 'jpeg' ? 'jpeg' : 'png';
    const quality = captureFormat === 'jpeg' ? 90 : undefined;

    try {
      chrome.tabs.captureVisibleTab(
        { format: captureFormat, quality },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.warn('[DevLens Worker] captureVisibleTab lastError:', chrome.runtime.lastError.message);
            sendResponse({ dataUrl: null, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ dataUrl, error: null });
          }
        }
      );
    } catch (err: any) {
      console.error('[DevLens Worker] Exception during capture:', err);
      sendResponse({ dataUrl: null, error: err?.message || 'Screenshot exception' });
    }
    return true; // Keep message channel open for async response
  }

  if (message.type === 'DOWNLOAD_ASSET') {
    const { url, filename } = message.payload || {};
    if (url && chrome.downloads) {
      try {
        chrome.downloads.download(
          {
            url,
            filename: filename || `asset-${Date.now()}`,
            saveAs: false
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              sendResponse({ success: true, downloadId });
            }
          }
        );
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || 'Download error' });
      }
      return true; // async response
    }
  }

  if (message.type === 'REQUEST_DESKTOP_CAPTURE') {
    if (sender.tab && sender.tab.id && chrome.desktopCapture) {
      try {
        chrome.desktopCapture.chooseDesktopMedia(
          ['screen', 'window', 'tab', 'audio'],
          sender.tab,
          (streamId) => {
            if (chrome.runtime.lastError || !streamId) {
              sendResponse({ streamId: null, error: chrome.runtime.lastError?.message || 'Stream selection canceled' });
            } else {
              sendResponse({ streamId, error: null });
            }
          }
        );
      } catch (err: any) {
        sendResponse({ streamId: null, error: err?.message || 'chooseDesktopMedia exception' });
      }
      return true; // Keep async response channel open
    } else {
      sendResponse({ streamId: null, error: 'desktopCapture API unavailable on this tab' });
      return false;
    }
  }
});
