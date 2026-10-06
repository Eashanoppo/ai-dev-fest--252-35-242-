import { describe, it, expect } from 'vitest';
import { buildChecklistCsv } from '../src/lib/csv';
import { Requirement, UploadedFile } from '../src/types';

describe('CSV Checklist Export (TC 7.1)', () => {
  it('prepends UTF-8 BOM and neutralizes formula injection', () => {
    const reqs: Requirement[] = [
      { id: 'R01', order: 1, title_en: '=SUM(A1:A10)', mandatory: true, has_expiry: false },
    ];
    const files: UploadedFile[] = [
      { id: 'f1', name: '+malicious.pdf', size: 100, hash: 'h1', pageCount: 1, valid: true },
    ];

    const csv = buildChecklistCsv(reqs, files, { R01: 'f1' }, {}, '2026-10-20', 'en');

    // TC 7.1: UTF-8 BOM must be present
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    // Formula injection neutralized with leading single quote inside quotes
    expect(csv).toContain('"\'=SUM(A1:A10)"');
    expect(csv).toContain('"\'+malicious.pdf"');
  });
});
