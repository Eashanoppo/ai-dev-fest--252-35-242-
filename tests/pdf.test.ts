import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { buildPackage } from '../src/lib/pdf';
import { Tender, Requirement, UploadedFile } from '../src/types';

function loadFileArrayBuffer(filePath: string): ArrayBuffer {
  const b = fs.readFileSync(filePath);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

describe('PDF Package Builder (Section 6 & Phase 4)', () => {
  const sampleDir = path.resolve(__dirname, '../public/sample-pack');

  const tradeLicBuf = loadFileArrayBuffer(path.join(sampleDir, '01_Trade_License.pdf'));
  const tinBuf = loadFileArrayBuffer(path.join(sampleDir, '02_TIN_Certificate.pdf'));

  const tender: Tender = {
    tender_id: 'T-2026-0417',
    title: 'Supply of IT Equipment',
    procuring_entity: 'Example Directorate',
    bidder: 'Example Company Ltd.',
    submission_deadline: '2026-10-20',
  };

  const reqs: Requirement[] = [
    { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true },
    { id: 'R02', order: 2, title_en: 'TIN Certificate', mandatory: true, has_expiry: false },
    { id: 'R03', order: 3, title_en: 'Optional Proposal', mandatory: false, has_expiry: false },
  ];

  const files: UploadedFile[] = [
    { id: 'f1', name: '01_Trade_License.pdf', size: tradeLicBuf.byteLength, hash: 'h1', pageCount: 2, valid: true },
    { id: 'f2', name: '02_TIN_Certificate.pdf', size: tinBuf.byteLength, hash: 'h2', pageCount: 1, valid: true },
  ];

  const bufferMap = new Map<string, ArrayBuffer>([
    ['f1', tradeLicBuf],
    ['f2', tinBuf],
  ]);

  it('builds package with exact cover page, order, and footer total count (TC 4.2 - 4.7)', async () => {
    // R01 matched to f1 (2 pages), R02 matched to f2 (1 page), R03 unmatched (optional -> skipped)
    const matches = { R01: 'f1', R02: 'f2' };

    const result = await buildPackage({
      tender,
      requirements: reqs,
      files,
      matches,
      includeIndexPage: false,
      getBuffer: (id) => bufferMap.get(id),
    });

    // Expected pages: 1 cover + 2 (f1) + 1 (f2) = 4 pages
    expect(result.totalPages).toBe(4);
    expect(result.filename).toBe('T-2026-0417_Package.pdf');

    // Verify output with pdf-lib
    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(4);
  });

  it('builds package with index page included (Bonus 7.1)', async () => {
    const matches = { R01: 'f1', R02: 'f2' };

    const result = await buildPackage({
      tender,
      requirements: reqs,
      files,
      matches,
      includeIndexPage: true,
      getBuffer: (id) => bufferMap.get(id),
    });

    // Expected pages: 1 cover + 1 index + 2 (f1) + 1 (f2) = 5 pages
    expect(result.totalPages).toBe(5);

    const loaded = await PDFDocument.load(result.pdfBytes);
    expect(loaded.getPageCount()).toBe(5);
  });
});
