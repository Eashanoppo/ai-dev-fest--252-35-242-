import { useState } from 'react';
import { useStore } from './store';
import { t } from './i18n';
import { TopBar } from './components/TopBar';

export default function App() {
  const { state, dispatch } = useStore();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const handleLanguageChange = (newLang: 'en' | 'bn') => {
    dispatch({ type: 'SET_LANG', payload: newLang });
  };

  const handleThemeToggle = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleAssistantToggle = () => {
    setIsAssistantOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col font-sans transition-colors duration-150">
      <TopBar
        tenderId={state.tender?.tender_id || null}
        lang={state.lang}
        theme={state.theme}
        onLanguageChange={handleLanguageChange}
        onThemeToggle={handleThemeToggle}
        onAssistantToggle={handleAssistantToggle}
        isAssistantOpen={isAssistantOpen}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <span className="kicker">TENDER PACKAGE BUILDER</span>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('app_subtitle', undefined, state.lang)}
          </h1>
          <p className="text-xs text-muted">
            {state.tender
              ? `${state.tender.title} — ${state.tender.procuring_entity}`
              : t('empty_no_tender_desc', undefined, state.lang)}
          </p>
        </header>
      </main>
    </div>
  );
}
