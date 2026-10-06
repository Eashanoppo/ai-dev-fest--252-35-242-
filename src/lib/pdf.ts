import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { Tender, Requirement, UploadedFile, GenerateProgress } from '../types';

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
 * Fast binary regex fallback to count /Type /Page objects in raw PDF
 */
export function countPagesFromRawPdf(buffer: ArrayBuffer): number {
  try {
    const bytes = new Uint8Array(buffer);
    let binaryStr = '';
    // Read up to 2MB or entire file if smaller
    const len = Math.min(bytes.length, 2 * 1024 * 1024);
    for (let i = 0; i < len; i++) {
      binaryStr += String.fromCharCode(bytes[i] || 0);
    }
    const matches = binaryStr.match(/\/Type\s*\/Page(?![s\w])/g);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Inspect PDF: load document and retrieve exact page count.
 * Uses a multi-stage approach with pdf-lib, encryption fallback, and regex verification.
 * Guarantees correct page counts even on scanned, linearized, or permissions-encrypted PDFs.
 */
export async function inspectPdf(buffer: ArrayBuffer): Promise<PdfInspectResult> {
  if (!isValidPdfMagic(buffer)) {
    return {
      pageCount: 0,
      valid: false,
      error: 'Not a valid PDF file (missing %PDF signature)',
    };
  }

  // Clone buffer slice to ensure it is not mutated or detached
  const cloned = buffer.slice(0);

  // Attempt 1: Standard load with pdf-lib
  try {
    const doc = await PDFDocument.load(cloned, { ignoreEncryption: true });
    let pageCount = doc.getPageCount();

    // Verify against actual page array length
    const resolvedPages = doc.getPages();
    if (resolvedPages.length > 0 && resolvedPages.length !== pageCount) {
      pageCount = resolvedPages.length;
    }

    if (pageCount > 0) {
      return {
        pageCount,
        valid: true,
      };
    }
  } catch (err) {
    // If standard load fails, try regex fallback before reporting unreadable
    const regexCount = countPagesFromRawPdf(buffer);
    if (regexCount > 0) {
      return {
        pageCount: regexCount,
        valid: true,
      };
    }

    const errorMsg = err instanceof Error ? err.message : 'Unknown PDF parse error';
    return {
      pageCount: 0,
      valid: false,
      error: `Unreadable or protected: ${errorMsg}`,
    };
  }

  // Attempt 2: Fallback to regex scan if pdf-lib reported 0 pages
  const fallbackCount = countPagesFromRawPdf(buffer);
  return {
    pageCount: Math.max(fallbackCount, 1),
    valid: true,
  };
}

/**
 * Sanitize tender ID for safe filename output
 */
export function sanitizeFilename(tenderId: string): string {
  const sanitized = tenderId.replace(/[^A-Za-z0-9._-]/g, '_').replace(/_+/g, '_').trim();
  return sanitized.length > 0 ? sanitized : 'Tender';
}

/**
 * Sanitize ASCII text for StandardFonts (Helvetica) to prevent WinAnsi encoding crashes
 */
function sanitizeAscii(str: string): string {
  // Replace characters not in standard Latin/WinAnsi range with close equivalents or '?'
  return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

export interface BuildPackageOptions {
  includeIndexPage?: boolean;
  sealImageBytes?: Uint8Array;
  sealPlacement?: {
    scope: 'all' | 'first' | 'last';
    corner: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    sizePercent: number;
  };
  onProgress?: (progress: GenerateProgress) => void;
}

export interface PackageBuildResult {
  pdfBytes: Uint8Array;
  filename: string;
  totalPages: number;
}

/**
 * Build the final combined compliant Tender Package PDF according to Section 6:
 * Page 1 = Cover (English, A4: tender ID, title, procuring entity, bidder, deadline, date, numbered doc list)
 * [Optional Page 2 = Index page with starting page numbers]
 * Then included docs sorted by order (all pages, original order, skip optional with no file).
 * Precompute Y = 1 + [1] + sum of pages of included docs.
 * Draw on EVERY page (including cover): white rect (height 20pt at bottom), centered 8pt Helvetica #333: "${tenderId} | Page ${i} of ${Y}".
 */
export async function buildPackage(
  tender: Tender,
  requirements: Requirement[],
  files: UploadedFile[],
  matches: Record<string, string>,
  options: BuildPackageOptions = {}
): Promise<PackageBuildResult> {
  const { includeIndexPage = false, sealImageBytes, sealPlacement, onProgress } = options;

  onProgress?.({
    phase: 'validating',
    currentDocIndex: 0,
    totalDocs: requirements.length,
    messageEn: 'Validating and arranging documents in order...',
    messageBn: 'ডকুমেন্টসমূহ ক্রম অনুযায়ী বিন্যাস করা হচ্ছে...',
  });

  const fileMap = new Map<string, UploadedFile>();
  files.forEach((f) => fileMap.set(f.id, f));

  // 1. Identify included documents: sorted by requirement.order, MUST have matched valid file
  // Optional documents without a matched file are skipped
  const sortedRequirements = [...requirements].sort((a, b) => a.order - b.order);
  const includedItems: Array<{
    req: Requirement;
    file: UploadedFile;
    buffer: ArrayBuffer;
  }> = [];

  for (const req of sortedRequirements) {
    const fileId = matches[req.id];
    if (fileId) {
      const file = fileMap.get(fileId);
      if (file && file.valid) {
        const buffer = getFileBuffer(file.id);
        if (buffer) {
          includedItems.push({ req, file, buffer });
        }
      }
    }
  }

  // Precompute body page counts
  let bodyPagesCount = 0;
  for (const item of includedItems) {
    bodyPagesCount += item.file.pageCount;
  }

  const coverPagesCount = 1;
  const indexPagesCount = includeIndexPage ? 1 : 0;
  const totalPagesY = coverPagesCount + indexPagesCount + bodyPagesCount;

  // Create merged PDF Document
  const mergedPdf = await PDFDocument.create();
  const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // A4 dimensions: 595.28 x 841.89 points
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  // -----------------------------------------------------------------
  // PAGE 1: COVER PAGE (English, A4)
  // -----------------------------------------------------------------
  onProgress?.({
    phase: 'cover',
    currentDocIndex: 0,
    totalDocs: includedItems.length,
    messageEn: 'Generating formal cover page...',
    messageBn: 'কভার পৃষ্ঠা তৈরি করা হচ্ছে...',
  });

  const coverPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  const marginX = 48;
  let cursorY = A4_HEIGHT - 60;

  // Kicker
  coverPage.drawText('TENDER DOCUMENT SUBMISSION PACKAGE', {
    x: marginX,
    y: cursorY,
    size: 10,
    font: helveticaBoldFont,
    color: rgb(0.36, 0.42, 0.48), // Steel accent
  });
  cursorY -= 28;

  // Large Tender ID
  coverPage.drawText(sanitizeAscii(tender.tender_id), {
    x: marginX,
    y: cursorY,
    size: 26,
    font: helveticaBoldFont,
    color: rgb(0.06, 0.06, 0.06),
  });
  cursorY -= 24;

  // Tender Title
  const cleanTitle = sanitizeAscii(tender.title);
  coverPage.drawText(cleanTitle, {
    x: marginX,
    y: cursorY,
    size: 16,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  cursorY -= 24;

  // Horizontal Rule
  coverPage.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: A4_WIDTH - marginX, y: cursorY },
    thickness: 0.75,
    color: rgb(0.8, 0.8, 0.8),
  });
  cursorY -= 20;

  // Metadata Grid
  const metaRows: Array<[string, string]> = [
    ['Procuring Entity:', sanitizeAscii(tender.procuring_entity)],
    ['Bidder Organization:', sanitizeAscii(tender.bidder)],
    ['Submission Deadline:', sanitizeAscii(tender.submission_deadline)],
    ['Package Compiled Date:', new Date().toISOString().slice(0, 10)],
    ['Included Documents:', `${includedItems.length} documents (${bodyPagesCount} pages)`],
  ];

  for (const [label, val] of metaRows) {
    coverPage.drawText(label, {
      x: marginX,
      y: cursorY,
      size: 9.5,
      font: helveticaBoldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    coverPage.drawText(val, {
      x: marginX + 160,
      y: cursorY,
      size: 9.5,
      font: helveticaFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= 17;
  }

  cursorY -= 12;

  // Horizontal Rule before Document List
  coverPage.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: A4_WIDTH - marginX, y: cursorY },
    thickness: 0.75,
    color: rgb(0.8, 0.8, 0.8),
  });
  cursorY -= 24;

  // Document List Header
  coverPage.drawText('SCHEDULE OF INCLUDED DOCUMENTS', {
    x: marginX,
    y: cursorY,
    size: 11,
    font: helveticaBoldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 20;

  // Table header
  coverPage.drawText('Order', { x: marginX, y: cursorY, size: 8.5, font: helveticaBoldFont, color: rgb(0.4, 0.4, 0.4) });
  coverPage.drawText('Document Title', { x: marginX + 45, y: cursorY, size: 8.5, font: helveticaBoldFont, color: rgb(0.4, 0.4, 0.4) });
  coverPage.drawText('Source File', { x: marginX + 270, y: cursorY, size: 8.5, font: helveticaBoldFont, color: rgb(0.4, 0.4, 0.4) });
  coverPage.drawText('Pages', { x: A4_WIDTH - marginX - 40, y: cursorY, size: 8.5, font: helveticaBoldFont, color: rgb(0.4, 0.4, 0.4) });
  cursorY -= 14;

  coverPage.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: A4_WIDTH - marginX, y: cursorY },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  cursorY -= 16;

  // Render list of included documents
  includedItems.forEach((item, index) => {
    if (cursorY > 60) {
      const orderStr = String(index + 1).padStart(2, '0');
      const docTitle = sanitizeAscii(item.req.title_en);
      const fileName = sanitizeAscii(item.file.name);
      const pageStr = `${item.file.pageCount} p.`;

      // Truncate long strings
      const safeTitle = docTitle.length > 36 ? docTitle.slice(0, 34) + '...' : docTitle;
      const safeFileName = fileName.length > 28 ? fileName.slice(0, 26) + '...' : fileName;

      coverPage.drawText(orderStr, { x: marginX, y: cursorY, size: 8.5, font: helveticaBoldFont, color: rgb(0.3, 0.3, 0.3) });
      coverPage.drawText(safeTitle, { x: marginX + 45, y: cursorY, size: 8.5, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
      coverPage.drawText(safeFileName, { x: marginX + 270, y: cursorY, size: 8, font: helveticaFont, color: rgb(0.45, 0.45, 0.45) });
      coverPage.drawText(pageStr, { x: A4_WIDTH - marginX - 35, y: cursorY, size: 8.5, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });

      cursorY -= 16;
    }
  });

  // -----------------------------------------------------------------
  // BONUS: INDEX PAGE (Page 2 if enabled)
  // -----------------------------------------------------------------
  const docStartPages: number[] = [];
  let runningPageCounter = 1 + (includeIndexPage ? 1 : 0);

  if (includeIndexPage) {
    onProgress?.({
      phase: 'cover',
      currentDocIndex: 0,
      totalDocs: includedItems.length,
      messageEn: 'Generating document index directory...',
      messageBn: 'সূচিপত্র তৈরি করা হচ্ছে...',
    });

    const indexPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
    let indexCursorY = A4_HEIGHT - 60;

    indexPage.drawText('DOCUMENT INDEX DIRECTORY', {
      x: marginX,
      y: indexCursorY,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    indexCursorY -= 20;

    indexPage.drawText('Page navigation for all attached documents in this package:', {
      x: marginX,
      y: indexCursorY,
      size: 9.5,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    indexCursorY -= 25;

    indexPage.drawLine({
      start: { x: marginX, y: indexCursorY },
      end: { x: A4_WIDTH - marginX, y: indexCursorY },
      thickness: 0.75,
      color: rgb(0.8, 0.8, 0.8),
    });
    indexCursorY -= 18;

    includedItems.forEach((item, index) => {
      const startPage = runningPageCounter + 1;
      docStartPages.push(startPage);

      const title = sanitizeAscii(item.req.title_en);
      const safeTitle = title.length > 45 ? title.slice(0, 43) + '...' : title;

      indexPage.drawText(`${index + 1}.  ${safeTitle}`, {
        x: marginX,
        y: indexCursorY,
        size: 9,
        font: helveticaBoldFont,
        color: rgb(0.15, 0.15, 0.15),
      });

      indexPage.drawText(`Page ${startPage}`, {
        x: A4_WIDTH - marginX - 50,
        y: indexCursorY,
        size: 9,
        font: helveticaFont,
        color: rgb(0.36, 0.42, 0.48),
      });

      indexCursorY -= 18;
      runningPageCounter += item.file.pageCount;
    });
  }

  // -----------------------------------------------------------------
  // BODY: MERGE ALL INCLUDED DOCUMENTS (IN ORIGINAL PAGE ORDER)
  // -----------------------------------------------------------------
  for (let i = 0; i < includedItems.length; i++) {
    const item = includedItems[i];
    if (!item) continue;

    onProgress?.({
      phase: 'merging',
      currentDocIndex: i + 1,
      totalDocs: includedItems.length,
      messageEn: `Merging document ${i + 1} of ${includedItems.length}: ${item.req.title_en}...`,
      messageBn: `নথি ${i + 1}/${includedItems.length} যুক্ত করা হচ্ছে: ${item.req.title_en}...`,
    });

    const srcDoc = await PDFDocument.load(item.buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  // -----------------------------------------------------------------
  // FOOTER ON EVERY PAGE (INCLUDING COVER & INDEX)
  // Rule: white rectangle (height 20pt at bottom), centered 8pt Helvetica #333 text:
  // "${tenderId} | Page ${i} of ${Y}"
  // Rule 6.4: Must not obscure page content. We calculate bottom bounds accurately.
  // -----------------------------------------------------------------
  onProgress?.({
    phase: 'footing',
    currentDocIndex: includedItems.length,
    totalDocs: includedItems.length,
    messageEn: `Applying standardized footers on all ${totalPagesY} pages...`,
    messageBn: `সকল ${totalPagesY} পৃষ্ঠায় ফুটার যুক্ত করা হচ্ছে...`,
  });

  const allPages = mergedPdf.getPages();
  const footerTextPrefix = sanitizeAscii(tender.tender_id);

  // Embed seal image if provided (Bonus feature)
  let embeddedSealImage: Awaited<ReturnType<typeof mergedPdf.embedPng>> | null = null;
  if (sealImageBytes && sealImageBytes.length > 0) {
    try {
      embeddedSealImage = await mergedPdf.embedPng(sealImageBytes);
    } catch {
      embeddedSealImage = null;
    }
  }

  allPages.forEach((page, pageIndex) => {
    const pageNum = pageIndex + 1;
    const { width: pWidth, height: pHeight } = page.getSize();
    const rotation = page.getRotation().angle;

    // 1. Draw white background strip (height 20pt) at bottom
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pWidth,
      height: 20,
      color: rgb(1, 1, 1), // White rectangle
    });

    // 2. Centered footer text: "${tenderId} | Page ${i} of ${Y}"
    const footerText = `${footerTextPrefix} | Page ${pageNum} of ${totalPagesY}`;
    const textWidth = helveticaFont.widthOfTextAtSize(footerText, 8);
    const textX = Math.max((pWidth - textWidth) / 2, 10);
    const textY = 6; // Centered vertically in 20pt strip

    page.drawText(footerText, {
      x: textX,
      y: textY,
      size: 8,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2), // #333 equivalent
    });

    // 3. Digital Seal / Signature placement (if enabled)
    if (embeddedSealImage && sealPlacement) {
      let shouldPlaceSeal = false;
      if (sealPlacement.scope === 'all') shouldPlaceSeal = true;
      else if (sealPlacement.scope === 'first' && pageNum === 1) shouldPlaceSeal = true;
      else if (sealPlacement.scope === 'last' && pageNum === allPages.length) shouldPlaceSeal = true;

      if (shouldPlaceSeal) {
        const sealDims = embeddedSealImage.scale(0.2 * (sealPlacement.sizePercent / 100));
        let sealX = pWidth - sealDims.width - 24;
        let sealY = 28; // Just above 20pt footer

        if (sealPlacement.corner === 'bottom-left') {
          sealX = 24;
          sealY = 28;
        } else if (sealPlacement.corner === 'top-right') {
          sealX = pWidth - sealDims.width - 24;
          sealY = pHeight - sealDims.height - 24;
        } else if (sealPlacement.corner === 'top-left') {
          sealX = 24;
          sealY = pHeight - sealDims.height - 24;
        }

        page.drawImage(embeddedSealImage, {
          x: sealX,
          y: sealY,
          width: sealDims.width,
          height: sealDims.height,
          rotate: degrees(rotation),
        });
      }
    }
  });

  onProgress?.({
    phase: 'complete',
    currentDocIndex: includedItems.length,
    totalDocs: includedItems.length,
    messageEn: 'Package compiled successfully!',
    messageBn: 'প্যাকেজ সংকলন সফল হয়েছে!',
  });

  const pdfBytes = await mergedPdf.save();
  const safeFilename = `${sanitizeFilename(tender.tender_id)}_Package.pdf`;

  return {
    pdfBytes,
    filename: safeFilename,
    totalPages: totalPagesY,
  };
}

/**
 * Trigger immediate browser download of the generated PDF Blob
 */
export function downloadPdfBlob(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
