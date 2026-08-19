/**
 * Crops a dataUrl image according to a crop rectangle.
 * Automatically accounts for High DPI / Retina devicePixelRatio.
 */
export async function cropDataUrl(
  dataUrl: string,
  cropRect: { x: number; y: number; width: number; height: number },
  format: 'png' | 'jpeg' | 'webp' = 'png'
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Calculate real scale ratio (dpr) of the captured image relative to window width
        const dpr = img.width / window.innerWidth;

        const canvas = document.createElement('canvas');
        const cropW = Math.max(1, Math.round(cropRect.width * dpr));
        const cropH = Math.max(1, Math.round(cropRect.height * dpr));

        canvas.width = cropW;
        canvas.height = cropH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(
          img,
          Math.round(cropRect.x * dpr),
          Math.round(cropRect.y * dpr),
          cropW,
          cropH,
          0,
          0,
          cropW,
          cropH
        );

        resolve(canvas.toDataURL(`image/${format}`));
      } catch (e) {
        console.warn('[DevLens] Tainted canvas encountered during crop, returning original dataUrl:', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Converts a dataUrl to the desired target format ('png' | 'jpeg' | 'webp').
 */
export async function convertDataUrlFormat(
  dataUrl: string,
  targetFormat: 'png' | 'jpeg' | 'webp'
): Promise<string> {
  if (!dataUrl) return '';
  if (targetFormat === 'png' && dataUrl.startsWith('data:image/png')) return dataUrl;
  if (targetFormat === 'jpeg' && dataUrl.startsWith('data:image/jpeg')) return dataUrl;
  if (targetFormat === 'webp' && dataUrl.startsWith('data:image/webp')) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (targetFormat === 'jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL(`image/${targetFormat}`));
        } else {
          resolve(dataUrl);
        }
      } catch (e) {
        console.warn('[DevLens] Tainted canvas encountered during format conversion, returning base dataUrl:', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Fallback in-page canvas/DOM capture for when chrome.tabs.captureVisibleTab is unavailable or extension context is invalidated.
 * Renders actual DOM content using SVG foreignObject rasterization.
 */
export async function captureDomAsDataUrl(format: 'png' | 'jpeg' | 'webp' = 'png'): Promise<string> {
  try {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    // Clone clean HTML without DevLens overlay shadow host
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    const devlensInClone = clone.querySelector('#devlens-root');
    if (devlensInClone) devlensInClone.remove();

    const htmlString = new XMLSerializer().serializeToString(clone);
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="background:#ffffff;">
            ${htmlString}
          </div>
        </foreignObject>
      </svg>
    `;

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL(`image/${format}`));
          } else {
            URL.revokeObjectURL(url);
            resolve('');
          }
        } catch (e) {
          console.warn('[DevLens] Tainted SVG canvas encountered, using simple canvas banner fallback:', e);
          URL.revokeObjectURL(url);
          resolve(renderSimpleCanvasBanner(width, height, dpr, format));
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(renderSimpleCanvasBanner(width, height, dpr, format));
      };
      img.src = url;
    });
  } catch (e) {
    console.warn('[DevLens] Fallback DOM capture exception:', e);
    return '';
  }
}

function renderSimpleCanvasBanner(width: number, height: number, dpr: number, format: 'png' | 'jpeg' | 'webp'): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(24 * dpr)}px system-ui, sans-serif`;
      ctx.fillText(document.title || 'Webpage Snapshot', 40 * dpr, 60 * dpr);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.round(14 * dpr)}px system-ui, sans-serif`;
      ctx.fillText(window.location.href, 40 * dpr, 95 * dpr);
      return canvas.toDataURL(`image/${format}`);
    }
  } catch {
    // ignore
  }
  return '';
}
