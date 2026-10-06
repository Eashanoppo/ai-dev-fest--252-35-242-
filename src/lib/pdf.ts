import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFPage,
  PDFFont,
} from 'pdf-lib';
import {
  Tender,
  Requirement,
  UploadedFile,
  GenerateProgress,
  SealSettings,
} from '../types';
import { getFileBuffer } from './fileStore';
import { resolveMatchedFile } from './status';
import { parsePageRanges } from './ranges';

export interface BuildPackageOptions {
  tender: Tender;
  requirements: Requirement[];
  files: UploadedFile[];
  matches: Record<string, string>;
  includeIndexPage?: boolean;
  seal?: SealSettings | null;
  onProgress?: (progress: GenerateProgress) => void;
  getBuffer?: (fileId: string) => ArrayBuffer | undefined;
  generationDate?: Date;
}

export interface BuildPackageResult {
  pdfBytes: Uint8Array;
  filename: string;
  totalPages: number;
  docStartPages: Record<string, number>;
}

// A4 Dimensions in points: 210mm x 297mm (72 dpi)
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const FOOTER_STRIP_HEIGHT = 20;

export function sanitizeFilename(tenderId: string): string {
  const clean = tenderId.replace(/[^A-Za-z0-9._-]/g, '_').replace(/_+/g, '_').trim();
  return `${clean || 'Tender'}_Package.pdf`;
}

function formatDateString(isoString: string | undefined): string {
  if (!isoString) return '';
  try {
    const parts = isoString.split('-');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day));
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      });
    }
  } catch {
    // fallback
  }
  return isoString;
}

/**
 * Wraps text into lines that do not exceed maxWidth.
 */
function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

interface IncludedDoc {
  req: Requirement;
  file: UploadedFile;
  pageCount: number;
}

/**
 * Main PDF Package Builder
 */
export async function buildPackage(options: BuildPackageOptions): Promise<BuildPackageResult> {
  const {
    tender,
    requirements,
    files,
    matches,
    includeIndexPage = false,
    seal = null,
    onProgress,
    getBuffer = getFileBuffer,
    generationDate = new Date(),
  } = options;

  onProgress?.({
    phase: 'validating',
    current: 0,
    total: 100,
    title: 'Validating documents',
    pages: 0,
  });

  // Sort requirements by order ascending
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);

  const includedDocs: IncludedDoc[] = [];

  for (const req of sortedReqs) {
    const file = resolveMatchedFile(req.id, files, matches);
    if (!file) {
      continue; // Skip unmatched optional documents
    }

    const buf = getBuffer(file.id);
    if (!buf) {
      throw new Error(`Buffer missing for matched file "${file.name}" (ID: ${file.id})`);
    }

    includedDocs.push({
      req,
      file,
      pageCount: file.pageCount,
    });
  }

  if (includedDocs.length === 0) {
    throw new Error('No valid documents matched to include in the package.');
  }

  // Precompute Cover & Index layout to know total pages Y accurately
  // Standard cover page capacity: header takes ~340pt, doc list item takes ~28pt.
  // First cover page can fit up to 14 items; continuation cover pages fit up to 24 items.
  const docsPerFirstCover = 14;
  const docsPerContCover = 24;
  let coverPageCount = 1;
  if (includedDocs.length > docsPerFirstCover) {
    coverPageCount += Math.ceil((includedDocs.length - docsPerFirstCover) / docsPerContCover);
  }

  let indexPageCount = 0;
  if (includeIndexPage) {
    indexPageCount = Math.max(1, Math.ceil(includedDocs.length / 22));
  }

  const totalBodyPages = includedDocs.reduce((acc, doc) => acc + doc.pageCount, 0);
  const totalPackagePages = coverPageCount + indexPageCount + totalBodyPages;

  onProgress?.({
    phase: 'cover',
    current: 10,
    total: 100,
    title: 'Generating cover page',
    pages: coverPageCount,
  });

  const mergedDoc = await PDFDocument.create();
  const helvetica = await mergedDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await mergedDoc.embedFont(StandardFonts.HelveticaBold);

  const madeDateIso = generationDate.toISOString().slice(0, 10);
  const madeDateLong = formatDateString(madeDateIso);
  const deadlineLong = formatDateString(tender.submission_deadline);

  // 1. Draw Cover Pages
  let docIndex = 0;
  for (let c = 0; c < coverPageCount; c++) {
    const page = mergedDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const isFirstCover = c === 0;

    let cursorY = A4_HEIGHT - 54;

    if (isFirstCover) {
      // Top Kicker
      page.drawText('TENDER SUBMISSION PACKAGE', {
        x: 54,
        y: cursorY,
        size: 9,
        font: helveticaBold,
        color: rgb(0.3, 0.35, 0.4),
      });
      cursorY -= 26;

      // Tender ID
      page.drawText(tender.tender_id, {
        x: 54,
        y: cursorY,
        size: 24,
        font: helveticaBold,
        color: rgb(0.08, 0.1, 0.14),
      });
      cursorY -= 32;

      // Tender Title (wrapped)
      const titleLines = wrapText(tender.title, helveticaBold, 15, A4_WIDTH - 108);
      for (const line of titleLines) {
        page.drawText(line, {
          x: 54,
          y: cursorY,
          size: 15,
          font: helveticaBold,
          color: rgb(0.12, 0.15, 0.2),
        });
        cursorY -= 20;
      }
      cursorY -= 12;

      // Metadata Divider Line
      page.drawLine({
        start: { x: 54, y: cursorY },
        end: { x: A4_WIDTH - 54, y: cursorY },
        thickness: 1,
        color: rgb(0.85, 0.87, 0.9),
      });
      cursorY -= 20;

      // Metadata Key-Value Grid
      const metaRows: [string, string][] = [
        ['Procuring Entity:', tender.procuring_entity || 'N/A'],
        ['Bidder Name:', tender.bidder || 'N/A'],
        ['Submission Deadline:', `${tender.submission_deadline} (${deadlineLong})`],
        ['Package Generated On:', `${madeDateIso} (${madeDateLong})`],
      ];

      for (const [key, val] of metaRows) {
        page.drawText(key, {
          x: 54,
          y: cursorY,
          size: 9.5,
          font: helveticaBold,
          color: rgb(0.35, 0.4, 0.45),
        });
        page.drawText(val, {
          x: 200,
          y: cursorY,
          size: 9.5,
          font: helvetica,
          color: rgb(0.12, 0.15, 0.2),
        });
        cursorY -= 17;
      }

      cursorY -= 12;

      // Document list header
      page.drawText('Included Documents', {
        x: 54,
        y: cursorY,
        size: 11,
        font: helveticaBold,
        color: rgb(0.1, 0.12, 0.16),
      });
      cursorY -= 10;

      page.drawLine({
        start: { x: 54, y: cursorY },
        end: { x: A4_WIDTH - 54, y: cursorY },
        thickness: 0.75,
        color: rgb(0.85, 0.87, 0.9),
      });
      cursorY -= 18;
    } else {
      // Continuation cover header
      page.drawText(`Included Documents (Continued - ${tender.tender_id})`, {
        x: 54,
        y: cursorY,
        size: 12,
        font: helveticaBold,
        color: rgb(0.1, 0.12, 0.16),
      });
      cursorY -= 14;

      page.drawLine({
        start: { x: 54, y: cursorY },
        end: { x: A4_WIDTH - 54, y: cursorY },
        thickness: 0.75,
        color: rgb(0.85, 0.87, 0.9),
      });
      cursorY -= 20;
    }

    // Render document list rows on this cover page
    while (docIndex < includedDocs.length && cursorY > 64) {
      const doc = includedDocs[docIndex];
      docIndex++;
      if (!doc) continue;

      const orderLabel = `${doc.req.order}.`;
      page.drawText(orderLabel, {
        x: 54,
        y: cursorY,
        size: 9.5,
        font: helveticaBold,
        color: rgb(0.2, 0.25, 0.3),
      });

      const titleText = doc.req.title_en;
      page.drawText(titleText, {
        x: 76,
        y: cursorY,
        size: 9.5,
        font: helvetica,
        color: rgb(0.12, 0.15, 0.2),
      });

      const fileInfo = `${doc.file.name} (${doc.pageCount} ${doc.pageCount === 1 ? 'page' : 'pages'})`;
      const fileInfoWidth = helvetica.widthOfTextAtSize(fileInfo, 8.5);
      page.drawText(fileInfo, {
        x: A4_WIDTH - 54 - fileInfoWidth,
        y: cursorY,
        size: 8.5,
        font: helvetica,
        color: rgb(0.4, 0.45, 0.5),
      });

      cursorY -= 20;
    }
  }

  // 2. Draw Index Page(s) if enabled
  const docStartPages: Record<string, number> = {};
  let currentRunningPage = coverPageCount + indexPageCount + 1;

  for (const doc of includedDocs) {
    docStartPages[doc.req.id] = currentRunningPage;
    currentRunningPage += doc.pageCount;
  }

  if (includeIndexPage) {
    onProgress?.({
      phase: 'index',
      current: 25,
      total: 100,
      title: 'Generating index page',
      pages: indexPageCount,
    });

    let indexDocIdx = 0;
    for (let ip = 0; ip < indexPageCount; ip++) {
      const page = mergedDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      let cursorY = A4_HEIGHT - 54;

      page.drawText('DOCUMENT INDEX', {
        x: 54,
        y: cursorY,
        size: 14,
        font: helveticaBold,
        color: rgb(0.1, 0.12, 0.16),
      });
      cursorY -= 14;

      page.drawLine({
        start: { x: 54, y: cursorY },
        end: { x: A4_WIDTH - 54, y: cursorY },
        thickness: 0.75,
        color: rgb(0.85, 0.87, 0.9),
      });
      cursorY -= 22;

      // Table Header
      page.drawText('Order', { x: 54, y: cursorY, size: 9, font: helveticaBold, color: rgb(0.35, 0.4, 0.45) });
      page.drawText('Document Name', { x: 96, y: cursorY, size: 9, font: helveticaBold, color: rgb(0.35, 0.4, 0.45) });
      page.drawText('Start Page', { x: A4_WIDTH - 110, y: cursorY, size: 9, font: helveticaBold, color: rgb(0.35, 0.4, 0.45) });
      cursorY -= 16;

      page.drawLine({
        start: { x: 54, y: cursorY },
        end: { x: A4_WIDTH - 54, y: cursorY },
        thickness: 0.5,
        color: rgb(0.9, 0.92, 0.95),
      });
      cursorY -= 18;

      while (indexDocIdx < includedDocs.length && cursorY > 64) {
        const doc = includedDocs[indexDocIdx];
        indexDocIdx++;
        if (!doc) continue;

        const startPg = docStartPages[doc.req.id];

        page.drawText(String(doc.req.order), {
          x: 54,
          y: cursorY,
          size: 9.5,
          font: helveticaBold,
          color: rgb(0.2, 0.25, 0.3),
        });

        page.drawText(doc.req.title_en, {
          x: 96,
          y: cursorY,
          size: 9.5,
          font: helvetica,
          color: rgb(0.12, 0.15, 0.2),
        });

        page.drawText(`Page ${startPg}`, {
          x: A4_WIDTH - 110,
          y: cursorY,
          size: 9.5,
          font: helveticaBold,
          color: rgb(0.15, 0.3, 0.55),
        });

        cursorY -= 22;
      }
    }
  }

  // 3. Merge Body Document Pages
  onProgress?.({
    phase: 'merging',
    current: 40,
    total: 100,
    title: 'Merging document pages',
    pages: totalBodyPages,
  });

  const bodyPageIndices: number[] = [];

  for (let i = 0; i < includedDocs.length; i++) {
    const doc = includedDocs[i];
    if (!doc) continue;
    const buffer = getBuffer(doc.file.id);
    if (!buffer) continue;

    // Load source document
    const srcDoc = await PDFDocument.load(buffer.slice(0));
    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);

    for (const page of copiedPages) {
      const addedPage = mergedDoc.addPage(page);
      bodyPageIndices.push(mergedDoc.getPageCount() - 1);

      // Section 6.4: Expand page visible box at visual bottom by FOOTER_STRIP_HEIGHT (20pt)
      // so the footer does NOT cover any existing content!
      growPageBottom(addedPage, FOOTER_STRIP_HEIGHT);
    }

    const pct = 40 + Math.round(((i + 1) / includedDocs.length) * 35);
    onProgress?.({
      phase: 'merging',
      current: pct,
      total: 100,
      title: `Merged: ${doc.req.title_en}`,
      pages: mergedDoc.getPageCount(),
    });
  }

  // 4. Draw Running Footer on EVERY Page (Cover, Index, and Body)
  onProgress?.({
    phase: 'footers',
    current: 80,
    total: 100,
    title: 'Applying running footers',
    pages: totalPackagePages,
  });

  const totalPages = mergedDoc.getPageCount();
  const footerFont = helvetica;
  const footerFontSize = 8;
  const footerTextColor = rgb(0.2, 0.2, 0.2);

  for (let p = 0; p < totalPages; p++) {
    const page = mergedDoc.getPage(p);
    const pageNum = p + 1;
    const footerText = `${tender.tender_id} | Page ${pageNum} of ${totalPages}`;

    drawPageFooter(page, footerText, footerFont, footerFontSize, footerTextColor, FOOTER_STRIP_HEIGHT);
  }

  // 5. Apply Seal/Signature Stamping if configured
  if (seal && seal.imageBytes && seal.imageBytes.byteLength > 0) {
    try {
      const sealImg = await mergedDoc.embedPng(seal.imageBytes);
      applySeal(mergedDoc, seal, sealImg, includedDocs, docStartPages);
    } catch {
      // If seal embedding fails, proceed with the package without corrupting output
    }
  }

  onProgress?.({
    phase: 'done',
    current: 100,
    total: 100,
    title: 'Package generated successfully',
    pages: totalPages,
  });

  const pdfBytes = await mergedDoc.save();
  const filename = sanitizeFilename(tender.tender_id);

  return {
    pdfBytes,
    filename,
    totalPages,
    docStartPages,
  };
}

/**
 * Expands a page's visible box by stripHeight at the visual bottom based on rotation.
 */
function growPageBottom(page: PDFPage, stripHeight: number): void {
  const rotation = page.getRotation().angle;
  const mediaBox = page.getMediaBox();
  const cropBox = page.getCropBox() || mediaBox;

  let x = cropBox.x;
  let y = cropBox.y;
  let width = cropBox.width;
  let height = cropBox.height;

  switch (rotation) {
    case 0:
      y -= stripHeight;
      height += stripHeight;
      break;
    case 90:
      width += stripHeight;
      break;
    case 180:
      height += stripHeight;
      break;
    case 270:
      x -= stripHeight;
      width += stripHeight;
      break;
  }

  page.setCropBox(x, y, width, height);

  // Ensure MediaBox contains the CropBox
  const mx = Math.min(mediaBox.x, x);
  const my = Math.min(mediaBox.y, y);
  const mw = Math.max(mediaBox.x + mediaBox.width, x + width) - mx;
  const mh = Math.max(mediaBox.y + mediaBox.height, y + height) - my;
  page.setMediaBox(mx, my, mw, mh);
}

/**
 * Draws a clean white footer strip and centered footer text at the visual bottom of the page.
 */
function drawPageFooter(
  page: PDFPage,
  text: string,
  font: PDFFont,
  fontSize: number,
  color: ReturnType<typeof rgb>,
  stripHeight: number
): void {
  const rotation = page.getRotation().angle;
  const cropBox = page.getCropBox() || page.getMediaBox();
  const { x, y, width, height } = cropBox;

  // Visual dimensions
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const visualWidth = isRotated90or270 ? height : width;

  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textXVisual = (visualWidth - textWidth) / 2;
  const textYVisual = 6; // Centered vertically in 20pt strip

  // Map visual coords (vx, vy) to PDF user coords based on rotation
  const mapCoords = (vx: number, vy: number): { x: number; y: number } => {
    switch (rotation) {
      case 0:
        return { x: x + vx, y: y + vy };
      case 90:
        return { x: x + width - vy, y: y + vx };
      case 180:
        return { x: x + width - vx, y: y + height - vy };
      case 270:
        return { x: x + vy, y: y + height - vx };
      default:
        return { x: x + vx, y: y + vy };
    }
  };

  // Draw white rectangle across footer strip
  const stripOrigin = mapCoords(0, 0);

  let rectW = visualWidth;
  let rectH = stripHeight;

  if (rotation === 90) {
    rectW = stripHeight;
    rectH = visualWidth;
  } else if (rotation === 270) {
    rectW = stripHeight;
    rectH = visualWidth;
  }

  // Draw white strip
  page.drawRectangle({
    x: rotation === 90 ? stripOrigin.x - stripHeight : stripOrigin.x,
    y: rotation === 180 ? stripOrigin.y - stripHeight : stripOrigin.y,
    width: rectW,
    height: rectH,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  // Draw footer text
  const textOrigin = mapCoords(textXVisual, textYVisual);
  page.drawText(text, {
    x: textOrigin.x,
    y: textOrigin.y,
    size: fontSize,
    font,
    color,
    rotate: degrees(rotation),
  });
}

/**
 * Applies a seal/signature PNG image to designated pages.
 */
function applySeal(
  mergedDoc: PDFDocument,
  seal: SealSettings,
  sealImg: ReturnType<PDFDocument['embedPng']> extends Promise<infer T> ? T : never,
  includedDocs: IncludedDoc[],
  docStartPages: Record<string, number>
): void {
  const totalPages = mergedDoc.getPageCount();
  const targetPages = new Set<number>();

  switch (seal.scope) {
    case 'all':
      for (let i = 1; i <= totalPages; i++) targetPages.add(i);
      break;
    case 'doc-first':
      for (const doc of includedDocs) {
        if (!doc) continue;
        const start = docStartPages[doc.req.id];
        if (start) targetPages.add(start);
      }
      break;
    case 'doc-last':
      for (const doc of includedDocs) {
        if (!doc) continue;
        const start = docStartPages[doc.req.id];
        if (start) targetPages.add(start + doc.pageCount - 1);
      }
      break;
    case 'custom':
      for (const p of parsePageRanges(seal.customPages, totalPages)) {
        targetPages.add(p);
      }
      break;
  }

  for (const pageNum of targetPages) {
    if (pageNum < 1 || pageNum > totalPages) continue;
    const page = mergedDoc.getPage(pageNum - 1);
    const box = page.getCropBox() || page.getMediaBox();

    // Scale seal width relative to page width
    const targetWidth = Math.max(50, (box.width * (seal.sizePercent || 20)) / 100);
    const scale = targetWidth / sealImg.width;
    const targetHeight = sealImg.height * scale;

    const margin = 28;
    let x = box.x + box.width - targetWidth - margin;
    let y = box.y + FOOTER_STRIP_HEIGHT + margin;

    if (seal.corner === 'bottom-left') {
      x = box.x + margin;
      y = box.y + FOOTER_STRIP_HEIGHT + margin;
    } else if (seal.corner === 'top-right') {
      x = box.x + box.width - targetWidth - margin;
      y = box.y + box.height - targetHeight - margin;
    } else if (seal.corner === 'top-left') {
      x = box.x + margin;
      y = box.y + box.height - targetHeight - margin;
    }

    page.drawImage(sealImg, {
      x,
      y,
      width: targetWidth,
      height: targetHeight,
      opacity: 0.9,
    });
  }
}
