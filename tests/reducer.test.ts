import { describe, it, expect } from 'vitest';
import { projectReducer, initialProjectState, checkDuplicateMatchConflict } from '../src/reducer';
import { UploadedFile } from '../src/types';

describe('Project Reducer & Matching Constraints (Phase 2)', () => {
  const fileA: UploadedFile = {
    id: 'fA',
    name: 'fileA.pdf',
    size: 2048,
    hash: 'hash-111',
    pageCount: 1,
    valid: true,
  };

  const fileB: UploadedFile = {
    id: 'fB',
    name: 'fileB.pdf',
    size: 2048,
    hash: 'hash-111', // Duplicate of fileA!
    pageCount: 1,
    valid: true,
  };

  const fileC: UploadedFile = {
    id: 'fC',
    name: 'fileC.pdf',
    size: 4096,
    hash: 'hash-222', // Unique
    pageCount: 2,
    valid: true,
  };

  it('TC 2.1: 1-to-1 Matching Constraint - reassigning a file unmatches the previous requirement', () => {
    let state = projectReducer(initialProjectState, {
      type: 'ADD_FILES',
      payload: [fileA, fileC],
    });

    // Match fileA to R01
    state = projectReducer(state, {
      type: 'SET_MATCH',
      payload: { requirementId: 'R01', fileId: 'fA' },
    });
    expect(state.matches['R01']).toBe('fA');

    // Try to match same fileA to R02 -> R01 must be freed, R02 gets fA
    state = projectReducer(state, {
      type: 'SET_MATCH',
      payload: { requirementId: 'R02', fileId: 'fA' },
    });
    expect(state.matches['R01']).toBeUndefined();
    expect(state.matches['R02']).toBe('fA');
  });

  it('TC 2.3: Duplicate Cross-Match Block - cannot match duplicate file to a different requirement', () => {
    let state = projectReducer(initialProjectState, {
      type: 'ADD_FILES',
      payload: [fileA, fileB],
    });

    // Match fileA to R01
    state = projectReducer(state, {
      type: 'SET_MATCH',
      payload: { requirementId: 'R01', fileId: 'fA' },
    });

    // Conflict check directly
    const hasConflict = checkDuplicateMatchConflict('R02', 'fB', state.files, state.matches);
    expect(hasConflict).toBe(true);

    // Reducer SET_MATCH disallows it
    const nextState = projectReducer(state, {
      type: 'SET_MATCH',
      payload: { requirementId: 'R02', fileId: 'fB' },
    });
    expect(nextState.matches['R02']).toBeUndefined();
  });

  it('TC 1.3: File Removal clears its matches and pending links', () => {
    let state = projectReducer(initialProjectState, {
      type: 'ADD_FILES',
      payload: [fileA, fileC],
    });

    state = projectReducer(state, {
      type: 'SET_MATCH',
      payload: { requirementId: 'R01', fileId: 'fA' },
    });
    expect(state.matches['R01']).toBe('fA');

    // Remove fileA
    state = projectReducer(state, {
      type: 'REMOVE_FILE',
      payload: 'fA',
    });

    expect(state.files.find((f) => f.id === 'fA')).toBeUndefined();
    expect(state.matches['R01']).toBeUndefined();
    expect(state.pendingLinks['R01']).toBeUndefined();
  });
});
