import React, { useState } from 'react';
import { StatusSummary, AppLanguage, GenerateProgress } from '../types';
import { t, formatNumber } from '../i18n';
import { ChevronDownIcon, ChevronUpIcon, AlertIcon, CheckIcon, DownloadIcon } from './icons';

interface GenerateBarProps {
  summary: StatusSummary;
  onGenerate: () => void;
  onDownloadLastGenerated?: () => void;
  hasGeneratedPackage: boolean;
  isGenerating: boolean;
  progress: GenerateProgress;
  lang: AppLanguage;
}

export const GenerateBar: React.FC<GenerateBarProps> = ({
  summary,
  onGenerate,
  onDownloadLastGenerated,
  hasGeneratedPackage,
  isGenerating,
  progress,
  lang,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { canGenerate, blockingCount, blockers } = summary;

  return (
    <div
      id="sticky-generate-bar-container"
      className="sticky bottom-0 z-20 w-full bg-surface/95 backdrop-blur-md border-t border-border shadow-md select-none transition-all"
    >
      {/* Expandable Reasons Drawer */}
      {isExpanded && blockers.length > 0 && (
        <div
          id="blocking-reasons-drawer"
          className="max-h-56 overflow-y-auto px-6 py-4 bg-subtle border-b border-border text-xs flex flex-col gap-2"
        >
          <div className="font-semibold text-primary mb-1">
            {lang === 'bn' ? 'সমাধান আবশ্যক এমন সমস্যাসমূহ:' : 'Issues requiring resolution:'}
          </div>
          {blockers.map((b) => (
            <div
              key={b.requirementId}
              className="flex items-center gap-2 text-muted hover:text-primary transition-colors font-mono"
            >
              <AlertIcon size={14} className="text-[#A63D40] dark:text-[#D98A8C] shrink-0" />
              <span>
                {b.requirementId} ·{' '}
                <strong className="font-sans font-medium text-primary">
                  {lang === 'bn' ? b.titleBn : b.titleEn}
                </strong>{' '}
                · <span className="text-[#A63D40] dark:text-[#D98A8C]">{b.status}</span> —{' '}
                {lang === 'bn' ? b.reasonBn : b.reasonEn}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Bar: 72px */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
        {/* Left: Blocking summary or Ready notification */}
        <div className="flex items-center gap-3">
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

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-primary">
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
                  className="text-xs text-muted hover:text-primary inline-flex items-center gap-1 font-medium underline underline-offset-2 cursor-pointer ml-1"
                >
                  <span>{isExpanded ? t('gen_hide_reasons', undefined, lang) : t('gen_view_reasons', undefined, lang)}</span>
                  {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronUpIcon size={14} />}
                </button>
              )}
            </div>

            <span className="text-[11px] text-muted">
              {canGenerate
                ? t('gen_ready_desc', undefined, lang)
                : lang === 'bn'
                ? 'প্যাকেজ তৈরি করতে সব আবশ্যক নথির সমস্যা সমাধান করুন'
                : 'All mandatory documents must be matched and valid before generation'}
            </span>
          </div>
        </div>

        {/* Right: Generate / Download Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Download button if a package has already been built */}
          {hasGeneratedPackage && onDownloadLastGenerated && (
            <button
              type="button"
              id="download-package-btn"
              onClick={onDownloadLastGenerated}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-medium border border-border bg-subtle text-primary hover:border-black/30 dark:hover:border-white/30 transition-colors cursor-pointer"
            >
              <DownloadIcon size={15} />
              <span>{t('btn_download', undefined, lang)}</span>
            </button>
          )}

          {/* Primary Generate Button: Solid black (light) / Solid #E5E5E5 (dark) */}
          <button
            type="button"
            id="generate-package-btn"
            disabled={!canGenerate || isGenerating}
            onClick={onGenerate}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded text-xs font-semibold tracking-tight transition-all duration-150 active:scale-[0.98] ${
              canGenerate && !isGenerating
                ? 'bg-[#0F0F10] text-white dark:bg-[#E5E5E5] dark:text-[#0F0F10] hover:opacity-90 cursor-pointer shadow-xs'
                : 'bg-muted/20 text-muted cursor-not-allowed border border-border/40'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>
                  {lang === 'bn'
                    ? progress.messageBn || 'প্যাকেজ তৈরি হচ্ছে...'
                    : progress.messageEn || 'Compiling...'}
                </span>
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
