import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { inspectPdf, isValidPdfMagic } from '../src/lib/pdfInspect';

function loadFileArrayBuffer(filePath: string): ArrayBuffer {
  const b = fs.readFileSync(filePath);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

describe('PDF Inspection & Magic Byte Validation (TC 1.1, 1.2, 1.4)', () => {
  const sampleDir = path.resolve(__dirname, '../public/sample-pack');

  it('TC 1.1: Valid PDFs extract exact page counts', async () => {
    const tradeLicBuf = loadFileArrayBuffer(path.join(sampleDir, '01_Trade_License.pdf'));
    const res1 = await inspectPdf(tradeLicBuf);
    expect(res1.valid).toBe(true);
    expect(res1.pageCount).toBe(2);

    const isoBuf = loadFileArrayBuffer(path.join(sampleDir, '05_ISO_9001_Quality.pdf'));
    const res2 = await inspectPdf(isoBuf);
    expect(res2.valid).toBe(true);
    expect(res2.pageCount).toBe(3);

    const techBuf = loadFileArrayBuffer(path.join(sampleDir, '06_Technical_Proposal.pdf'));
    const res3 = await inspectPdf(techBuf);
    expect(res3.valid).toBe(true);
    expect(res3.pageCount).toBe(4);
  });

  it('TC 1.2: Magic byte validation rejects non-PDF files', async () => {
    const textBuffer = new TextEncoder().encode('Hello this is a plain text file').buffer;
    expect(isValidPdfMagic(textBuffer)).toBe(false);

    const res = await inspectPdf(textBuffer);
    expect(res.valid).toBe(false);
    expect(res.errorKind).toBe('damaged');
  });

  it('TC 1.4: Corrupted PDF in sample pack is handled safely without crashing', async () => {
    const corruptedBuf = loadFileArrayBuffer(path.join(sampleDir, '07_Corrupted_Damaged.pdf'));
    const res = await inspectPdf(corruptedBuf);
    expect(res.valid).toBe(false);
    expect(res.errorKind).toBe('damaged');
    expect(res.pageCount).toBe(0);
  });
});
