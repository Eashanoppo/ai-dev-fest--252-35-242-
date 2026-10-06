import React from 'react';
import { AppLanguage, AppTheme } from '../types';
import { t } from '../i18n';
import { SunIcon, MoonIcon, BotIcon } from './icons';

interface TopBarProps {
  tenderId: string | null;
  lang: AppLanguage;
  theme: AppTheme;
  onLanguageChange: (lang: AppLanguage) => void;
  onThemeToggle: () => void;
  onAssistantToggle: () => void;
  isAssistantOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  tenderId,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onAssistantToggle,
  isAssistantOpen,
}) => {
  return (
    <header className="h-[60px] border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Wordmark & Tender Chip */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-wider text-primary">
            {t('app_name', undefined, lang)}
          </span>
          <span className="text-muted text-xs font-normal hidden sm:inline">/</span>
          <span className="text-muted text-xs font-normal hidden sm:inline">
            {t('app_subtitle', undefined, lang)}
          </span>
        </div>

        {tenderId ? (
          <span
            id="tender-active-chip"
            className="text-xs font-mono px-2 py-0.5 rounded bg-subtle text-primary border border-border"
          >
            {t('tender_chip', { id: tenderId }, lang)}
          </span>
        ) : (
          <span
            id="tender-inactive-chip"
            className="text-xs font-mono px-2 py-0.5 rounded bg-subtle text-muted border border-border"
          >
            {t('no_tender_loaded', undefined, lang)}
          </span>
        )}
      </div>

      {/* Right: Language Segmented Control, Theme Toggle, Assistant */}
      <div className="flex items-center gap-3">
        {/* EN | বাং Segmented control */}
        <div
          id="lang-segmented-control"
          className="flex items-center p-0.5 rounded border border-border bg-subtle text-xs"
          role="radiogroup"
          aria-label="Language selection"
        >
          <button
            type="button"
            id="lang-toggle-en"
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 rounded transition-colors font-medium cursor-pointer ${
              lang === 'en'
                ? 'bg-accent-steel text-white shadow-xs'
                : 'text-muted hover:text-primary'
            }`}
            aria-checked={lang === 'en'}
            role="radio"
          >
            EN
          </button>
          <button
            type="button"
            id="lang-toggle-bn"
            onClick={() => onLanguageChange('bn')}
            className={`px-2.5 py-1 rounded transition-colors font-medium font-bangla cursor-pointer ${
              lang === 'bn'
                ? 'bg-accent-steel text-white shadow-xs'
                : 'text-muted hover:text-primary'
            }`}
            aria-checked={lang === 'bn'}
            role="radio"
          >
            বাং
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          id="theme-toggle-btn"
          onClick={onThemeToggle}
          className="p-2 rounded border border-border bg-surface text-muted hover:text-primary hover:border-black/20 dark:hover:border-white/20 transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? t('toggle_theme_light', undefined, lang) : t('toggle_theme_dark', undefined, lang)}
          title={theme === 'dark' ? t('toggle_theme_light', undefined, lang) : t('toggle_theme_dark', undefined, lang)}
        >
          {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>

        {/* Assistant Button with Steel Outline */}
        <button
          type="button"
          id="assistant-toggle-btn"
          onClick={onAssistantToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
            isAssistantOpen
              ? 'border-accent-steel bg-accent-steel text-white'
              : 'border-accent-steel/50 text-accent-steel hover:bg-accent-steel/10'
          }`}
          aria-label={t('ai_assistant', undefined, lang)}
        >
          <BotIcon size={16} />
          <span className="hidden sm:inline">{t('ai_assistant', undefined, lang)}</span>
        </button>
      </div>
    </header>
  );
};
