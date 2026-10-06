import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  ProjectState,
  StatusSummary,
  ToastMessage,
  ToastType,
  AppLanguage,
  AppTheme,
  FileRef,
} from './types';
import {
  projectReducer,
  ProjectAction,
  initialProjectState,
} from './reducer';
import { computeProjectStatusSummary } from './lib/status';
import { computeRelinks } from './lib/relink';

const STORAGE_KEY = 'tenderpack_project_state';
const LANG_STORAGE_KEY = 'tenderpack_lang';
const THEME_STORAGE_KEY = 'tenderpack_theme';

interface StoreContextValue {
  state: ProjectState;
  dispatch: React.Dispatch<ProjectAction>;
  summary: StatusSummary;
  toasts: ToastMessage[];
  notify: (type: ToastType, messageEn: string, messageBn: string) => void;
  dismissToast: (id: string) => void;
  setLanguage: (lang: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const isHydratedRef = useRef(false);

  const notify = useCallback((type: ToastType, messageEn: string, messageBn: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, messageEn, messageBn }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    dispatch({ type: 'SET_LANG', payload: lang });
  }, []);

  const setTheme = useCallback((theme: AppTheme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  // Hydrate preferences and state from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as AppLanguage | null;
      if (savedLang === 'en' || savedLang === 'bn') {
        dispatch({ type: 'SET_LANG', payload: savedLang });
      }

      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        dispatch({ type: 'SET_THEME', payload: savedTheme });
      } else if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        dispatch({ type: 'SET_THEME', payload: 'dark' });
      }

      const savedProject = localStorage.getItem(STORAGE_KEY);
      if (savedProject) {
        const parsed = JSON.parse(savedProject);
        if (parsed && typeof parsed === 'object') {
          // Re-hydrate metadata and pendingLinks
          const pendingLinks: Record<string, FileRef> =
            parsed.pendingLinks || {};

          // If there were saved matches and files metadata, build pendingLinks if missing
          if (
            Object.keys(pendingLinks).length === 0 &&
            parsed.matches &&
            Array.isArray(parsed.files)
          ) {
            for (const [rId, fId] of Object.entries(parsed.matches)) {
              const f = parsed.files.find((item: { id: string }) => item.id === fId);
              if (f) {
                pendingLinks[rId] = { name: f.name, size: f.size };
              }
            }
          }

          dispatch({
            type: 'HYDRATE',
            payload: {
              tender: parsed.tender || null,
              requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
              expiryDates: parsed.expiryDates || {},
              pendingLinks,
              matches: {}, // Buffer-backed files will re-link on upload
              files: [],
            },
          });
        }
      }
    } catch {
      // ignore
    }
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

  // Check for automatic re-linking when files change and pending links exist
  useEffect(() => {
    if (!isHydratedRef.current) return;
    const pendingCount = Object.keys(state.pendingLinks).length;
    if (pendingCount > 0 && state.files.length > 0) {
      const relink = computeRelinks(state.pendingLinks, state.files, state.matches);
      if (relink.resolvedCount > 0) {
        dispatch({
          type: 'APPLY_RELINKS',
          payload: {
            newMatches: relink.newMatches,
            remainingPending: relink.remainingPending,
          },
        });
        notify(
          'info',
          `Restored ${relink.resolvedCount} document ${relink.resolvedCount === 1 ? 'match' : 'matches'} from saved session.`,
          `পূর্ববর্তী সেশন থেকে ${relink.resolvedCount}টি ডকুমেন্টের ম্যাচ সফলভাবে পুনঃস্থাপন করা হয়েছে।`
        );
      }
    }
  }, [state.files, state.pendingLinks, state.matches, notify]);

  // Debounced autosave of project metadata (excluding binary buffers)
  useEffect(() => {
    if (!isHydratedRef.current) return;
    const timer = setTimeout(() => {
      try {
        const metadataOnly = {
          tender: state.tender,
          requirements: state.requirements,
          matches: state.matches,
          expiryDates: state.expiryDates,
          pendingLinks: state.pendingLinks,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataOnly));
      } catch {
        // ignore
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [state.tender, state.requirements, state.matches, state.expiryDates, state.pendingLinks]);

  // Compute live project status summary
  const summary = useMemo(() => {
    return computeProjectStatusSummary(
      state.requirements,
      state.files,
      state.matches,
      state.expiryDates,
      state.tender?.submission_deadline || ''
    );
  }, [state.requirements, state.files, state.matches, state.expiryDates, state.tender]);

  return (
    <StoreContext.Provider
      value={{
        state,
        dispatch,
        summary,
        toasts,
        notify,
        dismissToast,
        setLanguage,
        setTheme,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
