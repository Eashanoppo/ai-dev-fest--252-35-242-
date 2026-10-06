import { Requirement, UploadedFile } from '../types';

const STOPWORDS = new Set([
  'pdf',
  'doc',
  'document',
  'file',
  'copy',
  'certificate',
  'cert',
  'of',
  'the',
  'and',
  'in',
  'for',
  'to',
  'a',
  'an',
  'scan',
  'final',
  'new',
  'ltd',
  'limited',
]);

/**
 * Tokenize string into lowercase alphanumeric and Unicode (Bangla) tokens.
 */
function tokenize(str: string): string[] {
  // Split on camelCase boundaries first
  const unCamel = str.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Match letters, marks (accents/Bangla vowel signs), and numbers
  const tokens = unCamel
    .toLowerCase()
    .replace(/[._\-–—()[\]{}+/\\@#%&*]/g, ' ')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && !STOPWORDS.has(s));

  return tokens;
}

/**
 * Computes Dice similarity coefficient between two token sets: (2 * |A ∩ B|) / (|A| + |B|)
 */
function diceSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setB = new Set(tokensB);
  let intersection = 0;

  for (const token of tokensA) {
    if (setB.has(token)) {
      intersection++;
    } else {
      // Partial prefix/substring match for words of length >= 4
      for (const b of setB) {
        if (
          (token.length >= 4 && b.includes(token)) ||
          (b.length >= 4 && token.includes(b))
        ) {
          intersection += 0.8;
          break;
        }
      }
    }
  }

  return (2 * intersection) / (tokensA.length + tokensB.length);
}

export interface MatchSuggestion {
  requirementId: string;
  fileId: string;
  confidence: number;
}

/**
 * Finds best 1:1 auto-matches without overwriting existing matches
 * and without matching duplicate files to different requirements.
 */
export function autoMatchFiles(
  requirements: Requirement[],
  files: UploadedFile[],
  existingMatches: Record<string, string>
): MatchSuggestion[] {
  const validFiles = files.filter((f) => f.valid);
  if (validFiles.length === 0 || requirements.length === 0) {
    return [];
  }

  // Already assigned file IDs
  const assignedFileIds = new Set(Object.values(existingMatches));

  // Determine hash set of already matched files to avoid matching a duplicate to another requirement
  const matchedHashes = new Map<string, string>(); // hash -> reqId
  for (const [reqId, fileId] of Object.entries(existingMatches)) {
    const matchedFile = files.find((f) => f.id === fileId);
    if (matchedFile) {
      matchedHashes.set(matchedFile.hash, reqId);
    }
  }

  // Filter requirements that do not yet have a match
  const unassignedReqs = requirements.filter((r) => !existingMatches[r.id]);

  // Available files that are not yet assigned
  const availableFiles = validFiles.filter((f) => !assignedFileIds.has(f.id));

  const candidates: {
    reqId: string;
    fileId: string;
    score: number;
  }[] = [];

  for (const req of unassignedReqs) {
    const titleTokens = [
      ...tokenize(req.title_en),
      ...(req.title_bn ? tokenize(req.title_bn) : []),
    ];

    for (const file of availableFiles) {
      // If this file's hash is already matched to a DIFFERENT requirement, skip it!
      const existingReqForHash = matchedHashes.get(file.hash);
      if (existingReqForHash && existingReqForHash !== req.id) {
        continue;
      }

      // Tokenize filename (without extension)
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const fileTokens = tokenize(baseName);

      // Also check requirement ID match (e.g., "R01" or "01")
      const reqIdNormalized = req.id.toLowerCase().replace(/^r0*/, '');
      const hasIdMatch =
        fileTokens.some((t) => t.toLowerCase() === req.id.toLowerCase()) ||
        baseName.toLowerCase().startsWith(req.id.toLowerCase()) ||
        (reqIdNormalized.length > 0 &&
          fileTokens.some((t) => t === reqIdNormalized || t === `0${reqIdNormalized}`));

      let score = diceSimilarity(titleTokens, fileTokens);
      if (hasIdMatch) {
        score = Math.max(score, 0.75) + 0.25;
      }

      // Threshold: minimum 0.35 similarity or strong ID match
      if (score >= 0.35) {
        candidates.push({
          reqId: req.id,
          fileId: file.id,
          score,
        });
      }
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const finalMatches: MatchSuggestion[] = [];
  const chosenReqs = new Set<string>();
  const chosenFiles = new Set<string>();
  const chosenHashes = new Map<string, string>(matchedHashes);

  for (const candidate of candidates) {
    if (chosenReqs.has(candidate.reqId) || chosenFiles.has(candidate.fileId)) {
      continue;
    }

    const file = files.find((f) => f.id === candidate.fileId);
    if (!file) continue;

    // Check duplicate hash conflict
    const existingReq = chosenHashes.get(file.hash);
    if (existingReq && existingReq !== candidate.reqId) {
      continue;
    }

    chosenReqs.add(candidate.reqId);
    chosenFiles.add(candidate.fileId);
    chosenHashes.set(file.hash, candidate.reqId);

    finalMatches.push({
      requirementId: candidate.reqId,
      fileId: candidate.fileId,
      confidence: Math.min(candidate.score, 1),
    });
  }

  return finalMatches;
}
