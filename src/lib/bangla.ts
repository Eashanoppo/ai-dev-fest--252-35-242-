/**
 * Renders Bangla text into a transparent PNG byte array using HTML Canvas
 * and the Hind Siliguri font. This allows crisp rendering of complex Bengali
 * conjuncts in PDF documents using pdf-lib.
 */

export interface RenderedBanglaImage {
  bytes: Uint8Array;
  width: number;
  height: number;
}

export async function renderBanglaToPng(
  text: string,
  fontSize: number = 24,
  color: string = '#111827'
): Promise<RenderedBanglaImage | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  // Ensure Hind Siliguri font is loaded if document.fonts API is available
  try {
    if (document.fonts && document.fonts.load) {
      await document.fonts.load(`${fontSize}px "Hind Siliguri"`);
    }
  } catch {
    // Continue even if font load check fails
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const fontString = `500 ${fontSize}px "Hind Siliguri", sans-serif`;
  ctx.font = fontString;

  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.5);

  if (textWidth <= 0 || textHeight <= 0) return null;

  canvas.width = Math.max(textWidth + 8, 10);
  canvas.height = Math.max(textHeight, 10);

  // Redo font after canvas resize
  ctx.font = fontString;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 4, canvas.height / 2);

  return new Promise<RenderedBanglaImage | null>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve({
            bytes: new Uint8Array(reader.result),
            width: canvas.width,
            height: canvas.height,
          });
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(blob);
    }, 'image/png');
  });
}
