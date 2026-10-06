import React from 'react';
import { AppLanguage } from '../types';
import { t } from '../i18n';
import {
  DownloadIcon,
  UploadIcon,
  StampIcon,
  SparklesIcon,
} from './icons';

interface ActionToolbarProps {
  onAutoMatch: () => void;
  canAutoMatch: boolean;
  onExportCsv: () => void;
  hasTender: boolean;
  onOpenSealModal: () => void;
  hasSealConfigured: boolean;
  includeIndexPage: boolean;
  onToggleIndexPage: (checked: boolean) => void;
  onExportProject: () => void;
  onImportProject: () => void;
  lang: AppLanguage;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onAutoMatch,
  canAutoMatch,
  onExportCsv,
  hasTender,
  onOpenSealModal,
  hasSealConfigured,
  includeIndexPage,
  onToggleIndexPage,
  onExportProject,
  onImportProject,
  lang,
}) => {
  return (
    <div
      id="action-toolbar"
      className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-border bg-surface text-xs select-none shadow-2xs"
    >
      {/* Group 1: Primary & Secondary Document Actions */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Auto-match action (Primary action within toolbar) */}
        <button
          type="button"
          id="toolbar-automatch-btn"
          onClick={onAutoMatch}
          disabled={!canAutoMatch}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all active:scale-[0.98] ${
            canAutoMatch
              ? 'bg-accent text-white hover:bg-accent/90 cursor-pointer shadow-2xs'
              : 'bg-surface-subtle text-muted border border-border/50 cursor-not-allowed opacity-60'
          }`}
          title={t('btn_automatch', undefined, lang)}
        >
          <SparklesIcon size={13} />
          <span>{t('btn_automatch', undefined, lang)}</span>
        </button>

        {/* Export CSV (Secondary Action) */}
        <button
          type="button"
          id="toolbar-export-csv-btn"
          onClick={onExportCsv}
          disabled={!hasTender}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            hasTender
              ? 'border-border bg-surface text-secondary hover:text-primary hover:bg-surface-subtle cursor-pointer'
              : 'border-border/40 text-muted cursor-not-allowed opacity-50'
          }`}
          title={t('btn_export_csv', undefined, lang)}
        >
          <DownloadIcon size={13} />
          <span>{t('btn_export_csv', undefined, lang)}</span>
        </button>

        {/* Digital Seal / Signature */}
        <button
          type="button"
          id="toolbar-seal-btn"
          onClick={onOpenSealModal}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
            hasSealConfigured
              ? 'border-accent/40 bg-accent/10 text-accent font-semibold'
              : 'border-border bg-surface text-secondary hover:text-primary hover:bg-surface-subtle'
          }`}
          title={t('seal_heading', undefined, lang)}
        >
          <StampIcon size={13} />
          <span>{t('seal_heading', undefined, lang)}</span>
        </button>
      </div>

      {/* Group 2: Utility Controls */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Include Index Page custom checkbox */}
        <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-primary transition-colors text-xs font-medium select-none">
          <input
            type="checkbox"
            id="toolbar-index-checkbox"
            checked={includeIndexPage}
            onChange={(e) => onToggleIndexPage(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border accent-accent cursor-pointer"
          />
          <span>{t('btn_include_index', undefined, lang)}</span>
        </label>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Backup Project */}
        <button
          type="button"
          id="toolbar-backup-btn"
          onClick={onExportProject}
          disabled={!hasTender}
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            hasTender
              ? 'border-border bg-surface text-secondary hover:text-primary hover:bg-surface-subtle cursor-pointer'
              : 'border-border/40 text-muted cursor-not-allowed opacity-50'
          }`}
          title={t('btn_project_export', undefined, lang)}
        >
          <DownloadIcon size={12} />
          <span>{t('btn_project_export', undefined, lang)}</span>
        </button>

        {/* Restore Project */}
        <button
          type="button"
          id="toolbar-restore-btn"
          onClick={onImportProject}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium border border-border bg-surface text-secondary hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          title={t('btn_project_import', undefined, lang)}
        >
          <UploadIcon size={12} />
          <span>{t('btn_project_import', undefined, lang)}</span>
        </button>
      </div>
    </div>
  );
};
