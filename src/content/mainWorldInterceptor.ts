// DevLens MAIN World Network Interceptor
// Runs inside the webpage's main JavaScript context to intercept true fetch & XHR calls

(function () {
  const win = window as any;
  if (win.__DEVLENS_MAIN_INTERCEPTOR_ACTIVE__) return;
  win.__DEVLENS_MAIN_INTERCEPTOR_ACTIVE__ = true;

  const origFetch = window.fetch;
  const origXHR = window.XMLHttpRequest;

  const MAX_PAYLOAD_CHARS = 500000; // 500KB limit for 99.9% complete payload capture

  function safeTruncate(body: string | null): string | null {
    if (!body) return null;
    if (body.length <= MAX_PAYLOAD_CHARS) return body;
    const sizeKb = (body.length / 1024).toFixed(1);
    return (
      body.substring(0, MAX_PAYLOAD_CHARS) +
      `\n\n... [Payload truncated by DevLens (Total Size: ${sizeKb} KB / ${body.length} chars) to ensure 60 FPS smooth UI performance] ...`
    );
  }

  // 1. Intercept fetch in MAIN World
  if (origFetch) {
    window.fetch = async function (...args: any[]) {
      const startTime = performance.now();
      let url = '';
      let method = 'GET';
      let reqHeaders: Record<string, string> = {};
      let reqBody: string | null = null;

      try {
        if (typeof args[0] === 'string') {
          url = args[0];
        } else if (args[0] && typeof args[0] === 'object' && args[0].url) {
          url = args[0].url;
          method = args[0].method || 'GET';
        }

        if (args[1]) {
          const opts = args[1];
          if (opts.method) method = opts.method.toUpperCase();
          if (opts.headers) {
            if (typeof opts.headers.forEach === 'function') {
              opts.headers.forEach((val: string, key: string) => {
                reqHeaders[key] = val;
              });
            } else if (typeof opts.headers === 'object') {
              reqHeaders = { ...opts.headers };
            }
          }
          if (opts.body) {
            reqBody = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
          }
        }
      } catch {
        // Ignore header parse error
      }

      const id = `fetch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

      try {
        const response = await (origFetch as any).apply(this, args);
        const durationMs = Math.round(performance.now() - startTime);

        let resBody: string | null = null;
        try {
          const clone = response.clone();
          const contentType = clone.headers.get('content-type') || '';
          if (
            contentType.includes('application/json') ||
            contentType.includes('text/') ||
            contentType.includes('javascript') ||
            contentType.includes('xml')
          ) {
            const fullText = await clone.text();
            resBody = safeTruncate(fullText);
          } else {
            resBody = `[Binary Data: ${contentType || 'Unknown'}]`;
          }
        } catch {
          resBody = '[Response stream unavailable]';
        }

        const logItem = {
          id,
          url,
          method,
          status: response.status,
          statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
          type: 'fetch',
          startTime: Date.now(),
          durationMs,
          requestHeaders: reqHeaders,
          requestBody: safeTruncate(reqBody),
          responseBody: resBody
        };

        window.postMessage({ source: 'DEVLENS_NETWORK_INTERCEPTOR', payload: logItem }, '*');
        return response;
      } catch (err: any) {
        const durationMs = Math.round(performance.now() - startTime);
        const logItem = {
          id,
          url,
          method,
          status: 0,
          statusText: err?.message || 'Network Failed / CORS Error',
          type: 'fetch',
          startTime: Date.now(),
          durationMs,
          requestHeaders: reqHeaders,
          requestBody: safeTruncate(reqBody),
          responseBody: err?.message || 'Network call failed'
        };

        window.postMessage({ source: 'DEVLENS_NETWORK_INTERCEPTOR', payload: logItem }, '*');
        throw err;
      }
    };
  }

  // 2. Intercept XMLHttpRequest in MAIN World
  if (origXHR) {
    function WrappedXHR(this: any) {
      const xhr = new origXHR();
      const id = `xhr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      let method = 'GET';
      let url = '';
      let startTime = 0;
      let reqHeaders: Record<string, string> = {};
      let reqBody: string | null = null;

      const origOpen = xhr.open;
      const origSetRequestHeader = xhr.setRequestHeader;
      const origSend = xhr.send;

      xhr.open = function (m: string, u: string, ...rest: any[]) {
        method = (m || 'GET').toUpperCase();
        url = u;
        return origOpen.apply(this, [m, u, ...rest] as any);
      };

      xhr.setRequestHeader = function (header: string, value: string) {
        reqHeaders[header] = value;
        return origSetRequestHeader.apply(this, [header, value]);
      };

      xhr.send = function (body?: any) {
        startTime = performance.now();
        if (body) {
          reqBody = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const handleComplete = () => {
          if (xhr.readyState === 4) {
            const durationMs = Math.round(performance.now() - startTime);
            let resBody: string | null = null;
            try {
              resBody = safeTruncate(xhr.responseText);
            } catch {
              resBody = '[XHR Response Unreadable]';
            }

            const logItem = {
              id,
              url,
              method,
              status: xhr.status,
              statusText: xhr.statusText || (xhr.status >= 200 && xhr.status < 300 ? 'OK' : 'Error'),
              type: 'xhr',
              startTime: Date.now(),
              durationMs,
              requestHeaders: reqHeaders,
              requestBody: safeTruncate(reqBody),
              responseBody: resBody
            };

            window.postMessage({ source: 'DEVLENS_NETWORK_INTERCEPTOR', payload: logItem }, '*');
          }
        };

        xhr.addEventListener('readystatechange', handleComplete);
        return origSend.apply(this, [body]);
      };

      return xhr;
    }

    Object.assign(WrappedXHR, origXHR);
    window.XMLHttpRequest = WrappedXHR as any;
  }
})();
