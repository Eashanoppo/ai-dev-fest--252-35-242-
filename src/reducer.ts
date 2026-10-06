import {
  ProjectState,
  Tender,
  Requirement,
  UploadedFile,
  FileRef,
  AppLanguage,
  AppTheme,
} from './types';
import { deleteFileBuffer } from './lib/fileStore';

export type ProjectAction =
  | { type: 'SET_LANG'; payload: AppLanguage }
  | { type: 'SET_THEME'; payload: AppTheme }
  | { type: 'LOAD_TENDER'; payload: { tender: Tender; requirements: Requirement[] } }
  | { type: 'ADD_FILES'; payload: UploadedFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'SET_MATCH'; payload: { requirementId: string; fileId: string } }
  | { type: 'CLEAR_MATCH'; payload: string }
  | { type: 'SET_EXPIRY'; payload: { requirementId: string; expiry: string } }
  | { type: 'APPLY_MATCHES'; payload: Record<string, string> }
  | { type: 'APPLY_RELINKS'; payload: { newMatches: Record<string, string>; remainingPending: Record<string, FileRef> } }
  | { type: 'CLEAR_PENDING' }
  | { type: 'RESTORE_PROJECT'; payload: ProjectState }
  | { type: 'HYDRATE'; payload: Partial<ProjectState> };

export const initialProjectState: ProjectState = {
  tender: null,
  requirements: [],
  files: [],
  matches: {},
  expiryDates: {},
  pendingLinks: {},
  lang: 'en',
  theme: 'light',
};

/**
 * Checks whether matching `fileId` to `targetReqId` would violate the duplicate cross-matching rule.
 * Rule: If two files have the same hash, they cannot be matched to different requirements.
 */
export function checkDuplicateMatchConflict(
  targetReqId: string,
  fileId: string,
  files: UploadedFile[],
  currentMatches: Record<string, string>
): boolean {
  const targetFile = files.find((f) => f.id === fileId);
  if (!targetFile) return false;

  for (const [reqId, matchedFileId] of Object.entries(currentMatches)) {
    if (reqId === targetReqId) continue;
    if (matchedFileId === fileId) continue; // Moving the same file is an unmatch/reassign, not a duplicate cross-match
    const existingFile = files.find((f) => f.id === matchedFileId);
    if (existingFile && existingFile.hash === targetFile.hash) {
      return true; // Conflict: different file with identical content hash already matched to another requirement
    }
  }

  return false;
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_LANG':
      return { ...state, lang: action.payload };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'LOAD_TENDER':
      return {
        ...state,
        tender: action.payload.tender,
        requirements: [...action.payload.requirements].sort((a, b) => a.order - b.order),
        matches: {},
        expiryDates: {},
        pendingLinks: {},
      };

    case 'ADD_FILES': {
      const incoming = action.payload;
      // Filter out files with existing identical ID
      const existingIds = new Set(state.files.map((f) => f.id));
      const newFiles = [...state.files, ...incoming.filter((f) => !existingIds.has(f.id))];
      return { ...state, files: newFiles };
    }

    case 'REMOVE_FILE': {
      const fileIdToRemove = action.payload;
      deleteFileBuffer(fileIdToRemove);

      const updatedFiles = state.files.filter((f) => f.id !== fileIdToRemove);
      const updatedMatches = { ...state.matches };
      const updatedPending = { ...state.pendingLinks };

      for (const [reqId, matchedFileId] of Object.entries(updatedMatches)) {
        if (matchedFileId === fileIdToRemove) {
          delete updatedMatches[reqId];
          delete updatedPending[reqId];
        }
      }

      return {
        ...state,
        files: updatedFiles,
        matches: updatedMatches,
        pendingLinks: updatedPending,
      };
    }

    case 'SET_MATCH': {
      const { requirementId, fileId } = action.payload;
      const targetFile = state.files.find((f) => f.id === fileId);
      if (!targetFile || !targetFile.valid) {
        return state;
      }

      // Check duplicate conflict
      if (checkDuplicateMatchConflict(requirementId, fileId, state.files, state.matches)) {
        return state;
      }

      // Enforce 1-to-1 matching: if this file was matched elsewhere, remove old match
      const updatedMatches: Record<string, string> = {};
      for (const [rId, fId] of Object.entries(state.matches)) {
        if (fId !== fileId && rId !== requirementId) {
          updatedMatches[rId] = fId;
        }
      }
      updatedMatches[requirementId] = fileId;

      const updatedPending = { ...state.pendingLinks };
      updatedPending[requirementId] = {
        name: targetFile.name,
        size: targetFile.size,
      };

      return {
        ...state,
        matches: updatedMatches,
        pendingLinks: updatedPending,
      };
    }

    case 'CLEAR_MATCH': {
      const reqId = action.payload;
      const updatedMatches = { ...state.matches };
      const updatedPending = { ...state.pendingLinks };
      delete updatedMatches[reqId];
      delete updatedPending[reqId];

      return {
        ...state,
        matches: updatedMatches,
        pendingLinks: updatedPending,
      };
    }

    case 'SET_EXPIRY': {
      const { requirementId, expiry } = action.payload;
      const updatedExpiry = { ...state.expiryDates };
      const trimmed = expiry.trim();
      if (trimmed) {
        updatedExpiry[requirementId] = trimmed.slice(0, 10);
      } else {
        delete updatedExpiry[requirementId];
      }
      return { ...state, expiryDates: updatedExpiry };
    }

    case 'APPLY_MATCHES': {
      const updatedMatches = { ...state.matches, ...action.payload };
      const updatedPending = { ...state.pendingLinks };

      for (const [reqId, fileId] of Object.entries(action.payload)) {
        const file = state.files.find((f) => f.id === fileId);
        if (file) {
          updatedPending[reqId] = { name: file.name, size: file.size };
        }
      }

      return {
        ...state,
        matches: updatedMatches,
        pendingLinks: updatedPending,
      };
    }

    case 'APPLY_RELINKS': {
      return {
        ...state,
        matches: action.payload.newMatches,
        pendingLinks: action.payload.remainingPending,
      };
    }

    case 'CLEAR_PENDING':
      return {
        ...state,
        pendingLinks: {},
      };

    case 'RESTORE_PROJECT':
      return { ...action.payload };

    case 'HYDRATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}
