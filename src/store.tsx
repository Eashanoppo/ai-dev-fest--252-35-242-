import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { ProjectState, Tender, Requirement, UploadedFile, AppLanguage, AppTheme } from './types';

const STORAGE_KEY = 'tenderpack_project_state';
const LANG_STORAGE_KEY = 'tenderpack_lang';
const THEME_STORAGE_KEY = 'tenderpack_theme';

export type Action =
  | { type: 'SET_LANG'; payload: AppLanguage }
  | { type: 'SET_THEME'; payload: AppTheme }
  | { type: 'LOAD_TENDER'; payload: { tender: Tender; requirements: Requirement[] } }
  | { type: 'ADD_FILES'; payload: UploadedFile[] }
  | { type: 'REMOVE_FILE'; payload: string } // fileId
  | { type: 'SET_MATCH'; payload: { requirementId: string; fileId: string } }
  | { type: 'CLEAR_MATCH'; payload: string } // requirementId
  | { type: 'SET_EXPIRY'; payload: { requirementId: string; date: string } }
  | { type: 'APPLY_AUTOMATCH'; payload: Record<string, string> } // requirementId -> fileId
  | { type: 'RESET_STATE' }
  | { type: 'HYDRATE_STATE'; payload: Partial<ProjectState> };

const getInitialLanguage = (): AppLanguage => {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'bn') return saved;
  } catch {}
  return 'en';
};

const getInitialTheme = (): AppTheme => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {}
  return 'light';
};

const initialProjectState: ProjectState = {
  tender: null,
  requirements: [],
  files: [],
  matches: {},
  expiryDates: {},
  lang: getInitialLanguage(),
  theme: getInitialTheme(),
};

function projectReducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'SET_LANG': {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, action.payload);
        document.documentElement.setAttribute('lang', action.payload);
      } catch {}
      return { ...state, lang: action.payload };
    }

    case 'SET_THEME': {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, action.payload);
        if (action.payload === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch {}
      return { ...state, theme: action.payload };
    }

    case 'LOAD_TENDER': {
      // Requirements sorted by order
      const sortedRequirements = [...action.payload.requirements].sort((a, b) => a.order - b.order);
      return {
        ...state,
        tender: action.payload.tender,
        requirements: sortedRequirements,
        // Reset matches & expiries when a fresh tender is loaded
        matches: {},
        expiryDates: {},
      };
    }

    case 'ADD_FILES': {
      // Append new files while maintaining max 30 limit at ingestion
      const existingIds = new Set(state.files.map((f) => f.id));
      const incoming = action.payload.filter((f) => !existingIds.has(f.id));
      return {
        ...state,
        files: [...state.files, ...incoming],
      };
    }

    case 'REMOVE_FILE': {
      const fileIdToRemove = action.payload;
      const updatedFiles = state.files.filter((f) => f.id !== fileIdToRemove);

      // Clean up matches pointing to this file
      const updatedMatches: Record<string, string> = {};
      const updatedExpiries: Record<string, string> = { ...state.expiryDates };

      Object.entries(state.matches).forEach(([reqId, fId]) => {
        if (fId !== fileIdToRemove) {
          updatedMatches[reqId] = fId;
        } else {
          // If match cleared, clear expiry too
          delete updatedExpiries[reqId];
        }
      });

      return {
        ...state,
        files: updatedFiles,
        matches: updatedMatches,
        expiryDates: updatedExpiries,
      };
    }

    case 'SET_MATCH': {
      const { requirementId, fileId } = action.payload;
      const updatedMatches: Record<string, string> = { ...state.matches };

      // Strictly 1:1 match constraint:
      // If this file was already matched to another requirement, remove that match
      Object.keys(updatedMatches).forEach((reqKey) => {
        if (updatedMatches[reqKey] === fileId && reqKey !== requirementId) {
          delete updatedMatches[reqKey];
        }
      });

      updatedMatches[requirementId] = fileId;

      return {
        ...state,
        matches: updatedMatches,
      };
    }

    case 'CLEAR_MATCH': {
      const requirementId = action.payload;
      const updatedMatches = { ...state.matches };
      const updatedExpiries = { ...state.expiryDates };

      delete updatedMatches[requirementId];
      delete updatedExpiries[requirementId];

      return {
        ...state,
        matches: updatedMatches,
        expiryDates: updatedExpiries,
      };
    }

    case 'SET_EXPIRY': {
      return {
        ...state,
        expiryDates: {
          ...state.expiryDates,
          [action.payload.requirementId]: action.payload.date,
        },
      };
    }

    case 'APPLY_AUTOMATCH': {
      return {
        ...state,
        matches: {
          ...state.matches,
          ...action.payload,
        },
      };
    }

    case 'RESET_STATE': {
      return {
        ...initialProjectState,
        lang: state.lang,
        theme: state.theme,
      };
    }

    case 'HYDRATE_STATE': {
      return {
        ...state,
        ...action.payload,
      };
    }

    default:
      return state;
  }
}

interface StoreContextValue {
  state: ProjectState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const useStore = (): StoreContextValue => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialProjectState);
  const isHydratedRef = useRef(false);

  // Hydrate state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && typeof parsed === 'object') {
          // Hydrate metadata only (raw PDF buffers are kept in runtime map)
          dispatch({
            type: 'HYDRATE_STATE',
            payload: {
              tender: parsed.tender || null,
              requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
              files: Array.isArray(parsed.files) ? parsed.files : [],
              matches: parsed.matches || {},
              expiryDates: parsed.expiryDates || {},
            },
          });
        }
      }
    } catch {}
    isHydratedRef.current = true;
  }, []);

  // Sync DOM with current theme & lang
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', state.lang);
  }, [state.lang]);

  // Debounced autosave metadata to localStorage
  useEffect(() => {
    if (!isHydratedRef.current) return;
    const timer = setTimeout(() => {
      try {
        const metadataOnly = {
          tender: state.tender,
          requirements: state.requirements,
          files: state.files.map((f) => ({
            id: f.id,
            name: f.name,
            size: f.size,
            hash: f.hash,
            pageCount: f.pageCount,
            valid: f.valid,
            error: f.error,
          })),
          matches: state.matches,
          expiryDates: state.expiryDates,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataOnly));
      } catch {}
    }, 400);

    return () => clearTimeout(timer);
  }, [state.tender, state.requirements, state.files, state.matches, state.expiryDates]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};
