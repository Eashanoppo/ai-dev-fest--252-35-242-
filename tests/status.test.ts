import { describe, it, expect } from 'vitest';
import { computeRequirementStatus, computeProjectStatusSummary } from '../src/lib/status';
import { Requirement, UploadedFile } from '../src/types';

describe('Status Engine Rules (Section 5 & Test Cases 3.1 - 3.7)', () => {
  const deadline = '2026-10-20';

  const dummyFile: UploadedFile = {
    id: 'f1',
    name: 'test.pdf',
    size: 1024,
    hash: 'abc',
    pageCount: 2,
    valid: true,
  };

  it('TC 3.1: Missing (Mandatory) - unmatched mandatory requirement blocks', () => {
    const req: Requirement = {
      id: 'R01',
      order: 1,
      title_en: 'Trade License',
      mandatory: true,
      has_expiry: true,
    };

    const res = computeRequirementStatus(req, undefined, undefined, deadline);
    expect(res.status).toBe('MISSING');
    expect(res.isBlocking).toBe(true);
  });

  it('TC 3.5: Not Provided (Optional) - unmatched optional requirement does not block', () => {
    const req: Requirement = {
      id: 'R05',
      order: 5,
      title_en: 'ISO Certificate',
      mandatory: false,
      has_expiry: true,
    };

    const res = computeRequirementStatus(req, undefined, undefined, deadline);
    expect(res.status).toBe('NOT_PROVIDED');
    expect(res.isBlocking).toBe(false);
  });

  it('TC 3.2: Expiry Date Needed - matched file to has_expiry requirement without date blocks', () => {
    const req: Requirement = {
      id: 'R01',
      order: 1,
      title_en: 'Trade License',
      mandatory: true,
      has_expiry: true,
    };

    const res = computeRequirementStatus(req, dummyFile, '', deadline);
    expect(res.status).toBe('EXPIRY_NEEDED');
    expect(res.isBlocking).toBe(true);
  });

  it('TC 3.3: Expired - expiry date strictly before submission deadline blocks', () => {
    const req: Requirement = {
      id: 'R01',
      order: 1,
      title_en: 'Trade License',
      mandatory: true,
      has_expiry: true,
    };

    const res = computeRequirementStatus(req, dummyFile, '2026-10-19', deadline);
    expect(res.status).toBe('EXPIRED');
    expect(res.isBlocking).toBe(true);
  });

  it('TC 3.4: Same-Day Expiry - document expiring ON the deadline day is OK (not expired)', () => {
    const req: Requirement = {
      id: 'R01',
      order: 1,
      title_en: 'Trade License',
      mandatory: true,
      has_expiry: true,
    };

    const res = computeRequirementStatus(req, dummyFile, '2026-10-20', deadline);
    expect(res.status).toBe('OK');
    expect(res.isBlocking).toBe(false);
  });

  it('TC 3.6: OK - expiry date in future is OK', () => {
    const req: Requirement = {
      id: 'R01',
      order: 1,
      title_en: 'Trade License',
      mandatory: true,
      has_expiry: true,
    };

    const res = computeRequirementStatus(req, dummyFile, '2026-12-31', deadline);
    expect(res.status).toBe('OK');
    expect(res.isBlocking).toBe(false);
  });

  it('TC 3.7: Optional but Expired - matched optional document with past expiry blocks', () => {
    const req: Requirement = {
      id: 'R05',
      order: 5,
      title_en: 'ISO Certificate',
      mandatory: false,
      has_expiry: true,
    };

    const res = computeRequirementStatus(req, dummyFile, '2026-05-01', deadline);
    expect(res.status).toBe('EXPIRED');
    expect(res.isBlocking).toBe(true);
  });

  it('computeProjectStatusSummary aggregates totals and blockers correctly', () => {
    const reqs: Requirement[] = [
      { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true },
      { id: 'R02', order: 2, title_en: 'TIN', mandatory: true, has_expiry: false },
      { id: 'R03', order: 3, title_en: 'Optional ISO', mandatory: false, has_expiry: false },
    ];

    const files: UploadedFile[] = [
      { ...dummyFile, id: 'f1' },
      { ...dummyFile, id: 'f2' },
    ];

    // R01 matched with valid future expiry
    // R02 unmatched (mandatory -> missing -> blocks)
    // R03 unmatched (optional -> not provided -> doesn't block)
    const matches = { R01: 'f1' };
    const expiries = { R01: '2027-01-01' };

    const summary = computeProjectStatusSummary(reqs, files, matches, expiries, deadline);
    expect(summary.total).toBe(3);
    expect(summary.ok).toBe(1);
    expect(summary.missing).toBe(1);
    expect(summary.notProvided).toBe(1);
    expect(summary.blockingCount).toBe(1);
    expect(summary.canGenerate).toBe(false);
    expect(summary.blockers).toHaveLength(1);
    expect(summary.blockers[0].requirementId).toBe('R02');
  });
});
