import React from 'react';
import { AppLanguage, AppTheme } from '../types';
import { t } from '../i18n';
import { SunIcon, MoonIcon, BotIcon, SettingsIcon, DownloadIcon, UploadIcon } from './icons';

interface TopBarProps {
  tenderId: string | null;
  lang: AppLanguage;
  theme: AppTheme;
  onLanguageChange: (lang: AppLanguage) => void;
  onThemeToggle: () => void;
  onAssistantToggle: () => void;
  isAssistantOpen: boolean;
  onOpenSettings: () => void;
  onExportCsv?: () => void;
  onExportProject?: () => void;
  onImportProject?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  tenderId,
  lang,
  theme,
  onLanguageChange,
  onThemeToggle,
  onAssistantToggle,
  isAssistantOpen,
  onOpenSettings,
  onExportCsv,
  onExportProject,
  onImportProject,
}) => {
  return (
    <header className="h-[60px] border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Official SaaS Logo, Wordmark & Tender Chip */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.ico"
            alt="TenderPack Logo"
            className="w-7 h-7 rounded-md object-contain border border-border shadow-2xs"
          />
          <span className="font-bold text-sm tracking-wider text-primary">
            {t('app_name', undefined, lang)}
          </span>
          <span className="text-muted text-xs font-normal hidden md:inline">/</span>
          <span className="text-muted text-xs font-normal hidden md:inline">
            {t('app_subtitle', undefined, lang)}
          </span>
        </div>

        {tenderId ? (
          <span
            id="tender-active-chip"
            className="text-xs font-mono px-2 py-0.5 rounded bg-subtle text-primary border border-border font-medium"
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

      {/* Right: Actions, Language Segmented Control, Theme Toggle, Assistant */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* CSV Export Button (if tender loaded) */}
        {tenderId && onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-xs font-medium text-primary hover:bg-subtle transition-colors cursor-pointer"
            title={t('btn_export_csv', undefined, lang)}
          >
            <DownloadIcon size={14} />
            <span>{t('btn_export_csv', undefined, lang)}</span>
          </button>
        )}

        {/* Project Backup & Restore Buttons */}
        {tenderId && onExportProject && (
          <button
            type="button"
            onClick={onExportProject}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-xs font-medium text-primary hover:bg-subtle transition-colors cursor-pointer"
            title={t('btn_project_export', undefined, lang)}
          >
            <DownloadIcon size={14} />
            <span>{t('btn_project_export', undefined, lang)}</span>
          </button>
        )}

        {onImportProject && (
          <button
            type="button"
            onClick={onImportProject}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-xs font-medium text-primary hover:bg-subtle transition-colors cursor-pointer"
            title={t('btn_project_import', undefined, lang)}
          >
            <UploadIcon size={14} />
            <span>{t('btn_project_import', undefined, lang)}</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded border border-border bg-surface text-muted hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
          title={t('btn_settings', undefined, lang)}
          aria-label={t('btn_settings', undefined, lang)}
        >
          <SettingsIcon size={16} />
        </button>

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
          className="p-2 rounded border border-border bg-surface text-muted hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
          aria-label={
            theme === 'dark'
              ? t('toggle_theme_light', undefined, lang)
              : t('toggle_theme_dark', undefined, lang)
          }
          title={
            theme === 'dark'
              ? t('toggle_theme_light', undefined, lang)
              : t('toggle_theme_dark', undefined, lang)
          }
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
