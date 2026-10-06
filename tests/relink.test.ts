import { describe, it, expect } from 'vitest';
import { computeRelinks } from '../src/lib/relink';
import { UploadedFile, FileRef } from '../src/types';

describe('Autosave Re-linking (TC 7.3)', () => {
  it('re-links pending requirement matches to uploaded files by name and size', () => {
    const pendingLinks: Record<string, FileRef> = {
      R01: { name: '01_Trade_License.pdf', size: 1024 },
      R02: { name: '02_TIN.pdf', size: 2048 },
    };

    const uploadedFiles: UploadedFile[] = [
      { id: 'new-f1', name: '01_Trade_License.pdf', size: 1024, hash: 'h1', pageCount: 2, valid: true },
      { id: 'new-f2', name: 'Other_File.pdf', size: 500, hash: 'h2', pageCount: 1, valid: true },
    ];

    const currentMatches: Record<string, string> = {};

    const result = computeRelinks(pendingLinks, uploadedFiles, currentMatches);

    expect(result.resolvedCount).toBe(1);
    expect(result.newMatches['R01']).toBe('new-f1');
    expect(result.newMatches['R02']).toBeUndefined();
    expect(result.remainingPending['R02']).toBeDefined();
  });
});
