import { describe, it, expect } from 'vitest';
import { parseRequirementsJson } from '../src/lib/requirements';

describe('Requirements JSON Parser (Task 4.1)', () => {
  it('parses valid requirements JSON successfully', () => {
    const raw = JSON.stringify({
      tender: {
        tender_id: 'T-2026-0417',
        title: 'Supply of IT Equipment',
        procuring_entity: 'Example Directorate',
        bidder: 'Example Company Ltd.',
        submission_deadline: '2026-10-20',
      },
      requirements: [
        { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true },
        { id: 'R02', order: 2, title_en: 'TIN Certificate', mandatory: 'true', has_expiry: 'false' },
      ],
    });

    const res = parseRequirementsJson(raw);
    expect(res.success).toBe(true);
    expect(res.data?.tender.tender_id).toBe('T-2026-0417');
    expect(res.data?.requirements).toHaveLength(2);
    expect(res.data?.requirements[1].mandatory).toBe(true);
    expect(res.data?.requirements[1].has_expiry).toBe(false);
  });

  it('rejects invalid JSON syntax or missing tender', () => {
    expect(parseRequirementsJson('not json').success).toBe(false);
    expect(parseRequirementsJson('{}').success).toBe(false);
    expect(parseRequirementsJson(JSON.stringify({ tender: {} })).success).toBe(false);
  });

  it('detects duplicate requirement IDs', () => {
    const raw = JSON.stringify({
      tender: {
        tender_id: 'T-2026-0417',
        title: 'Test',
        submission_deadline: '2026-10-20',
      },
      requirements: [
        { id: 'R01', order: 1, title_en: 'Doc 1', mandatory: true },
        { id: 'R01', order: 2, title_en: 'Doc 2', mandatory: true },
      ],
    });

    const res = parseRequirementsJson(raw);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Duplicate requirement ID');
  });
});
