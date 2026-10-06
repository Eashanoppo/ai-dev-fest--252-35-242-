import { RequirementsPayload, Requirement, Tender } from '../types';

export interface ParseRequirementsResult {
  success: boolean;
  data?: RequirementsPayload;
  error?: string;
}

function parseBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return fallback;
}

export function parseRequirementsJson(jsonString: string): ParseRequirementsResult {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    return { success: false, error: 'Invalid JSON syntax' };
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { success: false, error: 'Expected JSON object with tender and requirements' };
  }

  const obj = raw as Record<string, unknown>;

  if (!obj.tender || typeof obj.tender !== 'object') {
    return { success: false, error: 'Missing tender object in requirements payload' };
  }

  const rawTender = obj.tender as Record<string, unknown>;
  const tenderId = String(rawTender.tender_id ?? '').trim();
  const title = String(rawTender.title ?? '').trim();
  const procuringEntity = String(rawTender.procuring_entity ?? '').trim();
  const bidder = String(rawTender.bidder ?? '').trim();
  const submissionDeadline = String(rawTender.submission_deadline ?? '').trim().slice(0, 10);

  if (!tenderId) {
    return { success: false, error: 'Tender ID is required' };
  }

  if (!title) {
    return { success: false, error: 'Tender title is required' };
  }

  if (!submissionDeadline || !/^\d{4}-\d{2}-\d{2}$/.test(submissionDeadline)) {
    return { success: false, error: 'Valid submission deadline (YYYY-MM-DD) is required' };
  }

  const tender: Tender = {
    tender_id: tenderId,
    title,
    procuring_entity: procuringEntity,
    bidder,
    submission_deadline: submissionDeadline,
  };

  if (!Array.isArray(obj.requirements)) {
    return { success: false, error: 'Requirements must be a list' };
  }

  if (obj.requirements.length === 0) {
    return { success: false, error: 'Requirements list cannot be empty' };
  }

  const requirements: Requirement[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < obj.requirements.length; i++) {
    const r = obj.requirements[i];
    if (!r || typeof r !== 'object') {
      return { success: false, error: `Invalid requirement item at index ${i}` };
    }

    const item = r as Record<string, unknown>;
    const id = String(item.id ?? `R${String(i + 1).padStart(2, '0')}`).trim();

    if (seenIds.has(id)) {
      return { success: false, error: `Duplicate requirement ID found: "${id}"` };
    }
    seenIds.add(id);

    const orderNum = parseInt(String(item.order ?? i + 1), 10);
    const order = isNaN(orderNum) ? i + 1 : orderNum;

    const titleEn = String(item.title_en ?? '').trim();
    if (!titleEn) {
      return { success: false, error: `Requirement "${id}" is missing title_en` };
    }

    const titleBn = item.title_bn ? String(item.title_bn).trim() : undefined;
    const mandatory = parseBool(item.mandatory, true);
    const hasExpiry = parseBool(item.has_expiry, false);

    requirements.push({
      id,
      order,
      title_en: titleEn,
      title_bn: titleBn,
      mandatory,
      has_expiry: hasExpiry,
    });
  }

  // Sort requirements by order ascending
  requirements.sort((a, b) => a.order - b.order);

  return {
    success: true,
    data: {
      tender,
      requirements,
    },
  };
}
