import { describe, it, expect } from 'vitest';
import { splitIntoChunks } from '../src/lib/chunk';

describe('Text Chunker for Speech Synthesis', () => {
  it('returns empty array for empty string', () => {
    expect(splitIntoChunks('')).toEqual([]);
    expect(splitIntoChunks('   ')).toEqual([]);
  });

  it('keeps short text in a single chunk', () => {
    const text = 'Hello, this is a short response.';
    const chunks = splitIntoChunks(text, 200);
    expect(chunks).toEqual([text]);
  });

  it('splits long paragraph into chunks of <= 200 characters without breaking words', () => {
    const longText =
      'The procurement authority requires all documents to be submitted in pristine condition. ' +
      'Every bidder must provide trade licenses, tax clearance certificates, bank solvency statements, ' +
      'and proof of past work experience. If any document is expired before the submission deadline, ' +
      'the system will immediately flag it and prevent package generation until updated.';

    const chunks = splitIntoChunks(longText, 150);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(150);
    }
    // All original words should be present
    expect(chunks.join(' ')).toContain('procurement authority requires');
    expect(chunks.join(' ')).toContain('prevent package generation');
  });
});
