import { describe, it, expect } from 'vitest';
import { autoMatchFiles } from '../src/lib/match';
import { Requirement, UploadedFile } from '../src/types';

describe('Auto-Match & Similarity (TC 7.2)', () => {
  const reqs: Requirement[] = [
    { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true },
    { id: 'R02', order: 2, title_en: 'TIN Certificate', mandatory: true, has_expiry: false },
    { id: 'R03', order: 3, title_en: 'VAT Registration', mandatory: true, has_expiry: false },
  ];

  const files: UploadedFile[] = [
    { id: 'f1', name: '01_Trade_License.pdf', size: 100, hash: 'h1', pageCount: 2, valid: true },
    { id: 'f2', name: '02_TIN_Certificate.pdf', size: 100, hash: 'h2', pageCount: 1, valid: true },
    { id: 'f3', name: 'Random_Doc.pdf', size: 100, hash: 'h3', pageCount: 1, valid: true },
  ];

  it('suggests correct matches based on title and filename tokens', () => {
    const suggestions = autoMatchFiles(reqs, files, {});
    expect(suggestions.length).toBeGreaterThanOrEqual(2);

    const matchR01 = suggestions.find((s) => s.requirementId === 'R01');
    expect(matchR01?.fileId).toBe('f1');

    const matchR02 = suggestions.find((s) => s.requirementId === 'R02');
    expect(matchR02?.fileId).toBe('f2');
  });

  it('preserves existing manual matches untouched', () => {
    // Manually matched R01 to f3
    const existing = { R01: 'f3' };
    const suggestions = autoMatchFiles(reqs, files, existing);

    // R01 should not be in suggestions
    expect(suggestions.find((s) => s.requirementId === 'R01')).toBeUndefined();
  });
});
