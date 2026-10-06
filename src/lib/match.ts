import { UploadedFile, Requirement } from '../types';

/**
 * Returns a map of hash -> files where multiple files share the exact same hash
 */
export function getDuplicateGroups(files: UploadedFile[]): Map<string, UploadedFile[]> {
  const hashMap = new Map<string, UploadedFile[]>();

  files.forEach((file) => {
    if (!file.valid || !file.hash) return;
    const existing = hashMap.get(file.hash) || [];
    existing.push(file);
    hashMap.set(file.hash, existing);
  });

  const duplicatesOnly = new Map<string, UploadedFile[]>();
  hashMap.forEach((group, hash) => {
    if (group.length > 1) {
      duplicatesOnly.set(hash, group);
    }
  });

  return duplicatesOnly;
}

/**
 * Check if a file belongs to a duplicate group
 */
export function isFileDuplicate(file: UploadedFile, files: UploadedFile[]): boolean {
  if (!file.valid || !file.hash) return false;
  return files.filter((f) => f.valid && f.hash === file.hash).length > 1;
}

/**
 * Get other file names that share the same hash
 */
export function getSiblingDuplicateNames(file: UploadedFile, files: UploadedFile[]): string[] {
  if (!file.valid || !file.hash) return [];
  return files
    .filter((f) => f.id !== file.id && f.valid && f.hash === file.hash)
    .map((f) => f.name);
}

/**
 * Check if matching this file to target requirement violates duplicate constraints:
 * If another file in the same duplicate group is already matched to a DIFFERENT requirement,
 * this match attempt is blocked.
 */
export function checkDuplicateMatchConflict(
  fileId: string,
  targetRequirementId: string,
  files: UploadedFile[],
  matches: Record<string, string>
): { allowed: boolean; conflictingReqId?: string; conflictingFileName?: string } {
  const currentFile = files.find((f) => f.id === fileId);
  if (!currentFile || !currentFile.hash) {
    return { allowed: true };
  }

  // Find other files in the same duplicate group
  const duplicateSiblings = files.filter(
    (f) => f.id !== fileId && f.valid && f.hash === currentFile.hash
  );

  if (duplicateSiblings.length === 0) {
    return { allowed: true };
  }

  // Check if any duplicate sibling is matched to any requirement
  for (const sibling of duplicateSiblings) {
    for (const [reqId, matchedFileId] of Object.entries(matches)) {
      if (matchedFileId === sibling.id && reqId !== targetRequirementId) {
        return {
          allowed: false,
          conflictingReqId: reqId,
          conflictingFileName: sibling.name,
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Tokenize and normalize string for auto-matching
 */
export function tokenizeText(text: string): Set<string> {
  const cleaned = text
    .toLowerCase()
    .replace(/[._\-–—()[\]/\\,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = cleaned
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !/^\d+$/.test(t));

  return new Set(tokens);
}

/**
 * Auto-match engine: greedy token overlap between normalized filename and requirement titles.
 * Strictly respects 1:1 matching, duplicate constraints, and never overwrites manual matches.
 */
export function computeAutoMatches(
  requirements: Requirement[],
  files: UploadedFile[],
  existingMatches: Record<string, string>
): Record<string, string> {
  const newMatches: Record<string, string> = {};
  const matchedFileIds = new Set(Object.values(existingMatches));

  // Filter requirements that do not have a match yet
  const availableRequirements = requirements.filter((r) => !existingMatches[r.id]);
  const availableFiles = files.filter((f) => f.valid && !matchedFileIds.has(f.id));

  // Compute match candidates with overlap score
  const candidates: Array<{
    reqId: string;
    fileId: string;
    score: number;
  }> = [];

  for (const req of availableRequirements) {
    const reqEnTokens = tokenizeText(req.title_en);
    const reqBnTokens = req.title_bn ? tokenizeText(req.title_bn) : new Set<string>();

    for (const file of availableFiles) {
      const fileTokens = tokenizeText(file.name.replace(/\.pdf$/i, ''));
      if (fileTokens.size === 0) continue;

      let matchCount = 0;
      fileTokens.forEach((token) => {
        if (reqEnTokens.has(token) || reqBnTokens.has(token)) {
          matchCount++;
        }
      });

      if (matchCount > 0) {
        // Score = matched tokens / total requirement tokens
        const totalReqTokens = Math.max(reqEnTokens.size, 1);
        const score = matchCount / totalReqTokens;
        candidates.push({ reqId: req.id, fileId: file.id, score });
      }
    }
  }

  // Sort greedy by score descending
  candidates.sort((a, b) => b.score - a.score);

  const assignedReqs = new Set<string>();
  const assignedFiles = new Set<string>();

  for (const candidate of candidates) {
    if (assignedReqs.has(candidate.reqId) || assignedFiles.has(candidate.fileId)) {
      continue;
    }

    // Check duplicate group constraint
    const conflict = checkDuplicateMatchConflict(
      candidate.fileId,
      candidate.reqId,
      files,
      { ...existingMatches, ...newMatches }
    );

    if (conflict.allowed) {
      newMatches[candidate.reqId] = candidate.fileId;
      assignedReqs.add(candidate.reqId);
      assignedFiles.add(candidate.fileId);
    }
  }

  return newMatches;
}
