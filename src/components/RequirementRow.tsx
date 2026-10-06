import React from 'react';
import { Requirement, UploadedFile, ComputedStatus, AppLanguage } from '../types';
import { t, formatNumber } from '../i18n';
import { StatusBadge } from './StatusBadge';
import { XIcon, CalendarIcon } from './icons';

interface RequirementRowProps {
  requirement: Requirement;
  matchedFile: UploadedFile | undefined;
  availableFiles: UploadedFile[];
  currentMatches: Record<string, string>;
  allFiles: UploadedFile[];
  computedStatus: ComputedStatus;
  expiryDate: string;
  onMatchChange: (requirementId: string, fileId: string) => void;
  onUnmatch: (requirementId: string) => void;
  onExpiryChange: (requirementId: string, date: string) => void;
  lang: AppLanguage;
}

export const RequirementRow: React.FC<RequirementRowProps> = ({
  requirement,
  matchedFile,
  availableFiles,
  currentMatches,
  allFiles,
  computedStatus,
  expiryDate,
  onMatchChange,
  onUnmatch,
  onExpiryChange,
  lang,
}) => {
  const title =
    lang === 'bn' && requirement.title_bn ? requirement.title_bn : requirement.title_en;

  // Options for combobox: include currently matched file + all currently unmatched valid files
  const selectableFiles = matchedFile
    ? [matchedFile, ...availableFiles.filter((f) => f.id !== matchedFile.id)]
    : availableFiles;

  // Track hashes matched to other requirements to flag duplicate conflicts (TC 2.3)
  const matchedOtherHashes = new Set<string>();
  for (const [rId, fId] of Object.entries(currentMatches)) {
    if (rId !== requirement.id) {
      const f = allFiles.find((file) => file.id === fId);
      if (f) matchedOtherHashes.add(f.hash);
    }
  }

  return (
    <div
      id={`requirement-row-${requirement.id}`}
      className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-3 transition-colors hover:border-accent-steel/50 shadow-2xs"
    >
      {/* Top line: Order Number, Title, Mandatory Tag, Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Big tabular order number */}
          <span className="font-mono text-base font-semibold text-muted tabular-nums leading-none pt-0.5 w-6 shrink-0">
            {formatNumber(requirement.order, lang).padStart(2, '0')}
          </span>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-primary tracking-tight">
                {title}
              </span>

              {/* Mandatory / Optional Tag */}
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  requirement.mandatory
                    ? 'border-[#A63D40]/30 text-[#A63D40] dark:text-[#D98A8C] bg-[#F6E9E9]/40 dark:bg-[#271617]/40'
                    : 'border-border text-muted bg-subtle'
                }`}
              >
                {requirement.mandatory
                  ? t('tag_mandatory', undefined, lang)
                  : t('tag_optional', undefined, lang)}
              </span>
            </div>

            {/* Fallback English title if viewing Bangla */}
            {lang === 'bn' && requirement.title_bn && (
              <span className="text-[11px] text-muted mt-0.5">
                {requirement.title_en}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge right */}
        <div className="shrink-0">
          <StatusBadge status={computedStatus.status} lang={lang} />
        </div>
      </div>

      {/* Middle/Bottom line: Matching Combobox, Pages Chip, Expiry input, Unmatch action */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/60 flex-wrap">
        {/* Combobox for Matching */}
        <div className="flex-1 min-w-[220px]">
          <select
            id={`match-select-${requirement.id}`}
            value={matchedFile?.id || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId) {
                onMatchChange(requirement.id, selectedId);
              } else {
                onUnmatch(requirement.id);
              }
            }}
            className="w-full text-xs py-1.5 px-2.5 rounded-md border border-border bg-subtle text-primary focus:outline-hidden focus:ring-1 focus:ring-accent-steel cursor-pointer transition-colors"
          >
            <option value="">{t('select_file_placeholder', undefined, lang)}</option>
            {selectableFiles.map((file) => {
              const isDuplicateConflict = matchedOtherHashes.has(file.hash);
              return (
                <option
                  key={file.id}
                  value={file.id}
                  disabled={isDuplicateConflict}
                >
                  {file.name} ({formatNumber(file.pageCount, lang)}{' '}
                  {file.pageCount === 1
                    ? t('page_singular', undefined, lang)
                    : t('page_plural', undefined, lang)}
                  ){isDuplicateConflict ? (lang === 'bn' ? ' — [ডুপ্লিকেট দ্বন্দ্ব]' : ' — [Duplicate Conflict]') : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Pages Chip when matched */}
        {matchedFile && (
          <span
            id={`pages-chip-${requirement.id}`}
            className="text-[11px] font-mono px-2 py-1 rounded bg-subtle text-muted border border-border shrink-0 tabular-nums"
          >
            {t(
              'pages_chip',
              {
                count: formatNumber(matchedFile.pageCount, lang),
                plural:
                  matchedFile.pageCount === 1
                    ? t('page_singular', undefined, lang)
                    : t('page_plural', undefined, lang),
              },
              lang
            )}
          </span>
        )}

        {/* Expiry Date input: Visible ONLY when has_expiry && matched */}
        {requirement.has_expiry && matchedFile && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-muted">
              <CalendarIcon size={14} />
            </span>
            <input
              type="date"
              id={`expiry-input-${requirement.id}`}
              value={expiryDate || ''}
              onChange={(e) => onExpiryChange(requirement.id, e.target.value)}
              className="text-xs py-1 px-2 rounded-md border border-border bg-subtle text-primary font-mono focus:outline-hidden focus:ring-1 focus:ring-accent-steel cursor-pointer"
              aria-label={t('expiry_date_label', undefined, lang)}
            />
          </div>
        )}

        {/* Unmatch Action */}
        {matchedFile && (
          <button
            type="button"
            id={`unmatch-btn-${requirement.id}`}
            onClick={() => onUnmatch(requirement.id)}
            className="p-1 rounded text-muted hover:text-[#A63D40] dark:hover:text-[#D98A8C] hover:bg-subtle transition-colors cursor-pointer shrink-0"
            title={t('btn_unmatch', undefined, lang)}
            aria-label={t('btn_unmatch', undefined, lang)}
          >
            <XIcon size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
