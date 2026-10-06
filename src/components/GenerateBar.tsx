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
      className="sticky bottom-0 z-20 w-full bg-surface/95 backdrop-blur-md border-t border-border shadow-lg select-none transition-all"
    >
      {/* Progress Strip during generation */}
      {isGenerating && (
        <div className="w-full h-1 bg-subtle overflow-hidden">
          <div
            className="h-full bg-accent-steel transition-all duration-300"
            style={{ width: `${Math.max(5, progress.current)}%` }}
          />
        </div>
      )}

      {/* Expandable Reasons Drawer */}
      {isExpanded && blockers.length > 0 && (
        <div
          id="blocking-reasons-drawer"
          className="max-h-60 overflow-y-auto px-6 py-4 bg-subtle border-b border-border text-xs flex flex-col gap-2.5"
        >
          <div className="font-semibold text-primary mb-1">
            {lang === 'bn' ? 'সমাধান আবশ্যক এমন সমস্যাসমূহ:' : 'Issues requiring resolution before generation:'}
          </div>
          {blockers.map((b) => (
            <div
              key={b.requirementId}
              className="flex items-center gap-2.5 text-muted hover:text-primary transition-colors font-mono"
            >
              <AlertIcon size={14} className="text-[#A63D40] dark:text-[#D98A8C] shrink-0" />
              <span className="font-sans text-xs">
                {formatBlockerReason(b, lang)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[76px] flex items-center justify-between gap-4">
        {/* Left: Blocking summary or Ready notification */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">
            {canGenerate ? (
              <div className="w-8 h-8 rounded-full bg-[#E7F0EA] dark:bg-[#182019] text-[#3E7A52] dark:text-[#7FB793] flex items-center justify-center">
                <CheckIcon size={18} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#F6E9E9] dark:bg-[#271617] text-[#A63D40] dark:text-[#D98A8C] flex items-center justify-center">
                <AlertIcon size={18} />
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
                  className="text-xs text-muted hover:text-primary inline-flex items-center gap-1 font-medium underline underline-offset-2 cursor-pointer ml-1 shrink-0"
                >
                  <span>{isExpanded ? t('gen_hide_reasons', undefined, lang) : t('gen_view_reasons', undefined, lang)}</span>
                  {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronUpIcon size={14} />}
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

        {/* Right: Bonus Options & Generate Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Include Index Page Toggle */}
          <label className="hidden md:flex items-center gap-2 text-xs text-muted cursor-pointer hover:text-primary transition-colors">
            <input
              type="checkbox"
              id="include-index-checkbox"
              checked={includeIndexPage}
              onChange={(e) => onToggleIndexPage(e.target.checked)}
              className="rounded border-border accent-accent-steel cursor-pointer"
            />
            <span>{t('btn_include_index', undefined, lang)}</span>
          </label>

          {/* Digital Seal Button */}
          <button
            type="button"
            id="seal-modal-btn"
            onClick={onOpenSealModal}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
              hasSealConfigured
                ? 'border-accent-steel bg-accent-steel/10 text-accent-steel'
                : 'border-border bg-subtle text-muted hover:text-primary'
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium border border-border bg-subtle text-primary hover:bg-surface transition-colors cursor-pointer"
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
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold tracking-tight transition-all duration-150 active:scale-[0.98] ${
              canGenerate && !isGenerating
                ? 'bg-primary text-surface hover:opacity-90 cursor-pointer shadow-xs'
                : 'bg-muted/20 text-muted cursor-not-allowed border border-border/40'
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
