import React, { useState } from 'react';
import { StatusSummary, AppLanguage, GenerateProgress } from '../types';
import { t, formatNumber } from '../i18n';
import { formatBlockerReason } from '../lib/reasons';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  AlertIcon,
  CheckIcon,
  DownloadIcon,
  StampIcon,
} from './icons';

interface GenerateBarProps {
  summary: StatusSummary;
  onGenerate: () => void;
  onDownloadLastGenerated?: () => void;
  hasGeneratedPackage: boolean;
  isGenerating: boolean;
  progress: GenerateProgress;
  includeIndexPage: boolean;
  onToggleIndexPage: (value: boolean) => void;
  onOpenSealModal: () => void;
  hasSealConfigured: boolean;
  lang: AppLanguage;
}

export const GenerateBar: React.FC<GenerateBarProps> = ({
  summary,
  onGenerate,
  onDownloadLastGenerated,
  hasGeneratedPackage,
  isGenerating,
  progress,
  includeIndexPage,
  onToggleIndexPage,
  onOpenSealModal,
  hasSealConfigured,
  lang,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { canGenerate, blockingCount, blockers } = summary;

  return (
    <div
      id="sticky-generate-bar-container"
      className="sticky bottom-0 z-30 w-full bg-surface/95 backdrop-blur-md border-t border-border shadow-xs select-none transition-all"
    >
      {/* Progress Strip during generation */}
      {isGenerating && (
        <div className="w-full h-1 bg-surface-subtle overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${Math.max(5, progress.current)}%` }}
          />
        </div>
      )}

      {/* Expandable Reasons Drawer */}
      {isExpanded && blockers.length > 0 && (
        <div
          id="blocking-reasons-drawer"
          className="max-h-60 overflow-y-auto px-6 py-3.5 bg-surface-subtle border-b border-border text-xs flex flex-col gap-2"
        >
          <div className="font-semibold text-primary text-[11px] uppercase tracking-wider font-mono">
            {lang === 'bn' ? 'সমাধান আবশ্যক এমন সমস্যাসমূহ:' : 'Issues requiring resolution before generation:'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {blockers.map((b) => (
              <div
                key={b.requirementId}
                className="flex items-center gap-2 p-2 rounded-md bg-surface border border-border text-secondary font-mono text-[11px]"
              >
                <AlertIcon size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-sans text-xs truncate">
                  {formatBlockerReason(b, lang)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Command Bar */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Validation status & explanation */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="shrink-0">
            {canGenerate ? (
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckIcon size={15} />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertIcon size={14} />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-primary truncate">
                {canGenerate
                  ? t('gen_ready_title', undefined, lang)
                  : t(
                      'gen_blocked_title',
                      {
                        count: formatNumber(blockingCount, lang),
                        plural:
                          blockingCount === 1
                            ? t('gen_issue_singular', undefined, lang)
                            : t('gen_issue_plural', undefined, lang),
                      },
                      lang
                    )}
              </span>

              {blockingCount > 0 && (
                <button
                  type="button"
                  id="toggle-reasons-btn"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="text-xs text-muted hover:text-primary inline-flex items-center gap-1 font-mono cursor-pointer ml-1 shrink-0"
                >
                  <span>{isExpanded ? t('gen_hide_reasons', undefined, lang) : t('gen_view_reasons', undefined, lang)}</span>
                  {isExpanded ? <ChevronDownIcon size={13} /> : <ChevronUpIcon size={13} />}
                </button>
              )}
            </div>

            <span className="text-[11px] text-muted truncate">
              {canGenerate
                ? t('gen_ready_desc', undefined, lang)
                : lang === 'bn'
                ? 'প্যাকেজ তৈরি করতে সব আবশ্যক নথির সমস্যা সমাধান করুন'
                : 'All mandatory documents must be matched and valid before generation'}
            </span>
          </div>
        </div>

        {/* Right: Options & Primary Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Include Index Page Toggle */}
          <label className="hidden md:flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-primary transition-colors select-none font-medium">
            <input
              type="checkbox"
              id="include-index-checkbox"
              checked={includeIndexPage}
              onChange={(e) => onToggleIndexPage(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border accent-accent cursor-pointer"
            />
            <span>{t('btn_include_index', undefined, lang)}</span>
          </label>

          {/* Digital Seal Button */}
          <button
            type="button"
            id="seal-modal-btn"
            onClick={onOpenSealModal}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              hasSealConfigured
                ? 'border-accent/40 bg-accent/10 text-accent font-semibold'
                : 'border-border bg-surface text-secondary hover:text-primary hover:bg-surface-subtle'
            }`}
            title={t('seal_heading', undefined, lang)}
          >
            <StampIcon size={14} />
            <span>{t('seal_heading', undefined, lang)}</span>
          </button>

          {/* Download button if already built */}
          {hasGeneratedPackage && onDownloadLastGenerated && !isGenerating && (
            <button
              type="button"
              id="download-package-btn"
              onClick={onDownloadLastGenerated}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-surface text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              <DownloadIcon size={14} />
              <span>{t('btn_download', undefined, lang)}</span>
            </button>
          )}

          {/* Primary Generate Button */}
          <button
            type="button"
            id="generate-package-btn"
            disabled={!canGenerate || isGenerating}
            onClick={onGenerate}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md text-xs font-semibold tracking-tight transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              canGenerate && !isGenerating
                ? 'bg-primary text-surface hover:opacity-90 shadow-2xs font-semibold'
                : 'bg-surface-subtle text-muted cursor-not-allowed border border-border opacity-70'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{progress.title || 'Compiling...'}</span>
              </>
            ) : (
              <span>{t('btn_generate', undefined, lang)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
