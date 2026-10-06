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
    <header className="h-14 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none backdrop-blur-md">
      {/* Left: Brand area with clean geometry and subtle hierarchy */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.ico"
            alt="TenderPack"
            className="w-5 h-5 rounded object-contain border border-border"
          />
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-xs tracking-wider text-primary uppercase font-mono">
              {t('app_name', undefined, lang)}
            </span>
            <span className="text-muted text-xs hidden md:inline font-normal">
              {t('app_subtitle', undefined, lang)}
            </span>
          </div>
        </div>

        {/* Tender active/inactive indicator */}
        <div className="h-4 w-px bg-border hidden sm:block" />

        {tenderId ? (
          <div
            id="tender-active-chip"
            className="inline-flex items-center gap-1.5 text-xs text-secondary font-mono bg-surface-subtle px-2 py-0.5 rounded border border-border"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{tenderId}</span>
          </div>
        ) : (
          <div
            id="tender-inactive-chip"
            className="inline-flex items-center gap-1.5 text-xs text-muted font-mono bg-surface-subtle px-2 py-0.5 rounded border border-border"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span>{t('no_tender_loaded', undefined, lang)}</span>
          </div>
        )}
      </div>

      {/* Right: Compact actions, segmented control, theme and assistant */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {tenderId && onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-medium text-secondary hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            title={t('btn_export_csv', undefined, lang)}
          >
            <DownloadIcon size={13} />
            <span>CSV</span>
          </button>
        )}

        {tenderId && onExportProject && (
          <button
            type="button"
            onClick={onExportProject}
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-medium text-secondary hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            title={t('btn_project_export', undefined, lang)}
          >
            <DownloadIcon size={13} />
            <span>{t('btn_project_export', undefined, lang)}</span>
          </button>
        )}

        {onImportProject && (
          <button
            type="button"
            onClick={onImportProject}
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-medium text-secondary hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            title={t('btn_project_import', undefined, lang)}
          >
            <UploadIcon size={13} />
            <span>{t('btn_project_import', undefined, lang)}</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-md border border-border text-muted hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          title={t('btn_settings', undefined, lang)}
          aria-label={t('btn_settings', undefined, lang)}
        >
          <SettingsIcon size={15} />
        </button>

        {/* EN | বাং Segmented control */}
        <div
          id="lang-segmented-control"
          className="flex items-center p-0.5 rounded-md border border-border bg-surface-subtle text-xs"
          role="radiogroup"
          aria-label="Language selection"
        >
          <button
            type="button"
            id="lang-toggle-en"
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              lang === 'en'
                ? 'bg-surface text-primary shadow-2xs font-semibold'
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
            className={`px-2 py-0.5 rounded text-[11px] font-medium font-bangla transition-colors cursor-pointer ${
              lang === 'bn'
                ? 'bg-surface text-primary shadow-2xs font-semibold'
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
          className="p-1.5 rounded-md border border-border text-muted hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          aria-label={theme === 'dark' ? t('toggle_theme_light', undefined, lang) : t('toggle_theme_dark', undefined, lang)}
          title={theme === 'dark' ? t('toggle_theme_light', undefined, lang) : t('toggle_theme_dark', undefined, lang)}
        >
          {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>

        {/* AI Assistant Button */}
        <button
          type="button"
          id="assistant-toggle-btn"
          onClick={onAssistantToggle}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
            isAssistantOpen
              ? 'border-primary bg-primary text-surface'
              : 'border-border text-secondary hover:text-primary hover:bg-surface-subtle'
          }`}
          aria-label={t('ai_assistant', undefined, lang)}
        >
          <BotIcon size={14} />
          <span className="hidden sm:inline">{t('ai_assistant', undefined, lang)}</span>
        </button>
      </div>
    </header>
  );
};
