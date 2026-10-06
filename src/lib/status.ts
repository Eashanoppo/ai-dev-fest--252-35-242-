/**
 * Pure status engine. Recomputed on every state change; never stores anything.
 *
 * Rules (problem statement section 5):
 *  - no match:                  mandatory -> MISSING (blocks), optional -> NOT_PROVIDED (ok)
 *  - has_expiry, no date:       EXPIRY_NEEDED (blocks)
 *  - expiry < deadline:         EXPIRED (blocks). Same day is OK (strictly less-than).
 *  - otherwise:                 OK
 *
 * Dates are ISO strings (YYYY-MM-DD) so lexicographic order equals chronological order.
 */

import {
  Requirement,
  UploadedFile,
  ComputedStatus,
  StatusSummary,
  BlockerDetail,
} from '../types';

function isoDay(value: string | undefined): string {
  return (value ?? '').trim().slice(0, 10);
}

export function computeRequirementStatus(
  req: Requirement,
  matchedFile: UploadedFile | undefined,
  expiryDate: string | undefined,
  deadline: string
): ComputedStatus {
  if (!matchedFile) {
    return req.mandatory
      ? { status: 'MISSING', isBlocking: true }
      : { status: 'NOT_PROVIDED', isBlocking: false };
  }

  if (req.has_expiry) {
    const expiry = isoDay(expiryDate);
    if (expiry === '') {
      return { status: 'EXPIRY_NEEDED', isBlocking: true };
    }
    const due = isoDay(deadline);
    if (due !== '' && expiry < due) {
      return { status: 'EXPIRED', isBlocking: true };
    }
  }

  return { status: 'OK', isBlocking: false };
}

/** Only a readable file that still exists counts as a real match. */
export function resolveMatchedFile(
  requirementId: string,
  files: UploadedFile[],
  matches: Record<string, string>
): UploadedFile | undefined {
  const fileId = matches[requirementId];
  if (!fileId) return undefined;
  const file = files.find((f) => f.id === fileId);
  return file && file.valid ? file : undefined;
}

export function computeProjectStatusSummary(
  requirements: Requirement[],
  files: UploadedFile[],
  matches: Record<string, string>,
  expiryDates: Record<string, string>,
  deadline: string
): StatusSummary {
  let ok = 0;
  let missing = 0;
  let expiryNeeded = 0;
  let expired = 0;
  let notProvided = 0;
  const blockers: BlockerDetail[] = [];

  for (const req of requirements) {
    const file = resolveMatchedFile(req.id, files, matches);
    const expiry = expiryDates[req.id] ?? '';
    const computed = computeRequirementStatus(req, file, expiry, deadline);

    switch (computed.status) {
      case 'OK':
        ok++;
        break;
      case 'MISSING':
        missing++;
        break;
      case 'EXPIRY_NEEDED':
        expiryNeeded++;
        break;
      case 'EXPIRED':
        expired++;
        break;
      case 'NOT_PROVIDED':
        notProvided++;
        break;
    }

    if (computed.isBlocking) {
      blockers.push({
        requirementId: req.id,
        requirementOrder: req.order,
        titleEn: req.title_en,
        titleBn: req.title_bn && req.title_bn.trim() !== '' ? req.title_bn : req.title_en,
        mandatory: req.mandatory,
        status: computed.status,
        expiry: isoDay(expiry),
        deadline: isoDay(deadline),
      });
    }
  }

  const blockingCount = blockers.length;

  return {
    total: requirements.length,
    ok,
    missing,
    expiryNeeded,
    expired,
    notProvided,
    blockingCount,
    // Nothing to package when there are no requirements or no included document.
    canGenerate: requirements.length > 0 && blockingCount === 0 && ok > 0,
    blockers,
  };
}
