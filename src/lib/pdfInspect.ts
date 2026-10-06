import { PDFDocument } from 'pdf-lib';
import { FileErrorKind } from '../types';

export interface PdfInspectResult {
  pageCount: number;
  valid: boolean;
  errorKind?: FileErrorKind;
  error?: string;
}

/**
 * Validates whether the first 1024 bytes contain the standard '%PDF' magic header.
 */
export function isValidPdfMagic(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 4) return false;
  const headerLimit = Math.min(buffer.byteLength - 4, 1024);
  const bytes = new Uint8Array(buffer, 0, headerLimit + 4);

  // Search for '%PDF' (0x25, 0x50, 0x44, 0x46)
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

/**
 * Inspects a PDF ArrayBuffer to extract the exact page count and determine validity.
 * Detects password encryption and corrupted files without crashing.
 */
export async function inspectPdf(buffer: ArrayBuffer): Promise<PdfInspectResult> {
  if (!isValidPdfMagic(buffer)) {
    return {
      pageCount: 0,
      valid: false,
      errorKind: 'damaged',
      error: 'Not a valid PDF file (missing %PDF signature)',
    };
  }

  try {
    // Clone slice to protect original buffer
    const copy = buffer.slice(0);
    const doc = await PDFDocument.load(copy);
    const pageCount = doc.getPageCount();

    if (pageCount <= 0) {
      return {
        pageCount: 0,
        valid: false,
        errorKind: 'damaged',
        error: 'PDF contains no pages',
      };
    }

    return {
      pageCount,
      valid: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message.toLowerCase() : '';
    const isEncrypted =
      message.includes('encrypt') ||
      message.includes('password') ||
      (err as { name?: string })?.name === 'EncryptedPDFError';

    if (isEncrypted) {
      return {
        pageCount: 0,
        valid: false,
        errorKind: 'protected',
        error: 'Password-protected or encrypted PDF',
      };
    }

    return {
      pageCount: 0,
      valid: false,
      errorKind: 'damaged',
      error: 'Corrupted or unreadable PDF',
    };
  }
}
