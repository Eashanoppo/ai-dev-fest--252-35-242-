/**
 * Pure Status Engine for Tender Document Package Builder
 * Recomputed on every state change.
 *
 * Rules:
 * - No match: mandatory -> "Missing" (BLOCKS) / optional -> "Not provided" (OK)
 * - has_expiry + matched + no date -> "Expiry date needed" (BLOCKS)
 * - expiry < deadline -> "Expired" (BLOCKS) [same day = OK, strictly less-than]
 * - else -> "OK"
 *
 * Expiry dates and deadline are ISO strings (YYYY-MM-DD), compared lexicographically.
 */

import {
  Requirement,
  UploadedFile,
  ComputedStatus,
  StatusSummary,
  BlockerDetail,
} from '../types';

export function computeRequirementStatus(
  req: Requirement,
  matchedFile: UploadedFile | undefined,
  expiryDate: string | undefined,
  deadline: string
): ComputedStatus {
  // 1. Check if a valid file is matched
  if (!matchedFile) {
    if (req.mandatory) {
      return {
        status: 'MISSING',
        isBlocking: true,
        reasonEn: 'Mandatory document missing — match a file',
        reasonBn: 'আবশ্যক নথি অনুপস্থিত — একটি ফাইল সংযুক্ত করুন',
      };
    }
    return {
      status: 'NOT_PROVIDED',
      isBlocking: false,
      reasonEn: 'Optional document not provided',
      reasonBn: 'ঐচ্ছিক নথি প্রদান করা হয়নি',
    };
  }

  // 2. If matched and requires expiry date, check expiry
  if (req.has_expiry) {
    if (!expiryDate || expiryDate.trim() === '') {
      return {
        status: 'EXPIRY_NEEDED',
        isBlocking: true,
        reasonEn: 'Expiry date needed — enter validity date',
        reasonBn: 'মেয়াদ শেষের তারিখ প্রয়োজন — মেয়াদের তারিখ প্রদান করুন',
      };
    }

    // Normalized lexicographical comparison (YYYY-MM-DD)
    // Strictly less-than (<): expired. Same day (==) is OK.
    const normalizedExpiry = expiryDate.slice(0, 10);
    const normalizedDeadline = deadline ? deadline.slice(0, 10) : '';

    if (normalizedDeadline && normalizedExpiry < normalizedDeadline) {
      return {
        status: 'EXPIRED',
        isBlocking: true,
        reasonEn: `Expired on ${normalizedExpiry} (before deadline ${normalizedDeadline})`,
        reasonBn: `মেয়াদ ${normalizedExpiry} তারিখে শেষ হয়েছে (জমা দেওয়ার শেষ সময়: ${normalizedDeadline})`,
      };
    }
  }

  // 3. Document is compliant
  return {
    status: 'OK',
    isBlocking: false,
    reasonEn: 'Document valid and verified',
    reasonBn: 'নথি বৈধ ও যাচাই সম্পন্ন',
  };
}

/**
 * Summarize status across all requirements
 */
export function computeProjectStatusSummary(
  requirements: Requirement[],
  files: UploadedFile[],
  matches: Record<string, string>,
  expiryDates: Record<string, string>,
  deadline: string
): StatusSummary {
  const fileMap = new Map<string, UploadedFile>();
  files.forEach((f) => fileMap.set(f.id, f));

  let ok = 0;
  let missing = 0;
  let expiryNeeded = 0;
  let expired = 0;
  let notProvided = 0;
  const blockers: BlockerDetail[] = [];

  requirements.forEach((req) => {
    const matchedFileId = matches[req.id];
    const matchedFile = matchedFileId ? fileMap.get(matchedFileId) : undefined;
    const expiry = expiryDates[req.id];

    // Only valid files count as matched
    const effectiveFile = matchedFile && matchedFile.valid ? matchedFile : undefined;

    const computed = computeRequirementStatus(req, effectiveFile, expiry, deadline);

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
        titleBn: req.title_bn || req.title_en,
        status: computed.status,
        reasonEn: computed.reasonEn,
        reasonBn: computed.reasonBn,
      });
    }
  });

  const blockingCount = blockers.length;
  // Can generate if there are requirements, no blocking issues, and at least one document is ready
  const canGenerate = requirements.length > 0 && blockingCount === 0 && ok > 0;

  return {
    total: requirements.length,
    ok,
    missing,
    expiryNeeded,
    expired,
    notProvided,
    blockingCount,
    canGenerate,
    blockers,
  };
}
