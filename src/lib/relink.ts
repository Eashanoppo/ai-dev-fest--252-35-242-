import { FileRef, UploadedFile } from '../types';

export interface RelinkResult {
  newMatches: Record<string, string>;
  resolvedCount: number;
  remainingPending: Record<string, FileRef>;
}

/**
 * Computes new matches from pending links when files are re-uploaded.
 * Matches by name and size (or exact name if unique).
 * Respects 1-to-1 matching constraints.
 */
export function computeRelinks(
  pendingLinks: Record<string, FileRef>,
  files: UploadedFile[],
  currentMatches: Record<string, string>
): RelinkResult {
  const newMatches = { ...currentMatches };
  const remainingPending: Record<string, FileRef> = {};
  let resolvedCount = 0;

  // Track already assigned file IDs
  const usedFileIds = new Set(Object.values(currentMatches));

  for (const [reqId, ref] of Object.entries(pendingLinks)) {
    // If requirement already has a valid match, drop pending
    if (newMatches[reqId]) {
      continue;
    }

    // Find candidate uploaded files matching name and size
    const candidate = files.find(
      (f) =>
        f.valid &&
        !usedFileIds.has(f.id) &&
        f.name === ref.name &&
        (ref.size === 0 || f.size === ref.size)
    );

    if (candidate) {
      newMatches[reqId] = candidate.id;
      usedFileIds.add(candidate.id);
      resolvedCount++;
    } else {
      remainingPending[reqId] = ref;
    }
  }

  return {
    newMatches,
    resolvedCount,
    remainingPending,
  };
}
