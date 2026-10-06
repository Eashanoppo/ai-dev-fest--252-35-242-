import { PDFDocument } from 'pdf-lib';

/**
 * In-memory storage for raw ArrayBuffers of uploaded PDFs.
 * Keeps React state lightweight and avoids localStorage quotas.
 */
const bufferStore = new Map<string, ArrayBuffer>();

export function storeFileBuffer(fileId: string, buffer: ArrayBuffer): void {
  bufferStore.set(fileId, buffer);
}

export function getFileBuffer(fileId: string): ArrayBuffer | undefined {
  return bufferStore.get(fileId);
}

export function removeFileBuffer(fileId: string): void {
  bufferStore.delete(fileId);
}

export function clearAllFileBuffers(): void {
  bufferStore.clear();
}

/**
 * Validate PDF Magic Bytes (%PDF) within the first 1024 bytes.
 * Handles cases where files contain small prepended metadata or BOMs.
 */
export function isValidPdfMagic(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;

  const headerLimit = Math.min(buffer.byteLength - 4, 1024);
  const bytes = new Uint8Array(buffer, 0, headerLimit + 4);

  // Search for '%PDF' -> ASCII: 0x25, 0x50, 0x44, 0x46
  for (let i = 0; i <= headerLimit; i++) {
    if (
      bytes[i] === 0x25 &&
      bytes[i + 1] === 0x50 &&
      bytes[i + 2] === 0x44 &&
      bytes[i + 3] === 0x46
    ) {
      return true;
    }
  }

  return false;
}

export interface PdfInspectResult {
  pageCount: number;
  valid: boolean;
  error?: string;
}

/**
 * Inspect PDF: load document and retrieve page count.
 * Gracefully handles encrypted or damaged files without crashing.
 */
export async function inspectPdf(buffer: ArrayBuffer): Promise<PdfInspectResult> {
  // First verify magic bytes
  if (!isValidPdfMagic(buffer)) {
    return {
      pageCount: 0,
      valid: false,
      error: 'Not a valid PDF file (missing %PDF signature)',
    };
  }

  try {
    // Attempt parsing with pdf-lib (ignoreEncryption: false ensures password-protected PDFs are caught)
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    const count = doc.getPageCount();
    return {
      pageCount: count,
      valid: true,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown PDF parse error';
    return {
      pageCount: 0,
      valid: false,
      error: `Unreadable or protected: ${errorMsg}`,
    };
  }
}
