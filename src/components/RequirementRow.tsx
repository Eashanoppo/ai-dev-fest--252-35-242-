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

  const selectableFiles = matchedFile
    ? [matchedFile, ...availableFiles.filter((f) => f.id !== matchedFile.id)]
    : availableFiles;

  // Track duplicate conflict hashes
  const matchedOtherHashes = new Set<string>();
  for (const [rId, fId] of Object.entries(currentMatches)) {
    if (rId !== requirement.id) {
      const f = allFiles.find((file) => file.id === fId);
      if (f) matchedOtherHashes.add(f.hash);
    }
  }

  // Row state borders
  const isBlocking = computedStatus.isBlocking;
  const isOk = computedStatus.status === 'OK';

  return (
    <div
      id={`requirement-row-${requirement.id}`}
      className={`p-3.5 rounded-lg border bg-surface flex flex-col gap-2.5 transition-colors duration-150 hover:bg-surface-subtle/30 ${
        isBlocking
          ? 'border-rose-300/70 dark:border-rose-900/60'
          : isOk
          ? 'border-emerald-300/60 dark:border-emerald-900/40'
          : 'border-border'
      }`}
    >
      {/* Top line: Tabular index, title, mandatory indicator, and status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="font-mono text-xs font-semibold text-muted tabular-nums pt-0.5 w-6 shrink-0 text-center">
            {formatNumber(requirement.order, lang).padStart(2, '0')}
          </span>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-xs sm:text-sm text-primary tracking-tight">
                {title}
              </span>

              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                  requirement.mandatory
                    ? 'border-rose-200/60 text-rose-700 dark:border-rose-900/40 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-border text-muted bg-surface-subtle'
                }`}
              >
                {requirement.mandatory
                  ? t('tag_mandatory', undefined, lang)
                  : t('tag_optional', undefined, lang)}
              </span>
            </div>

            {lang === 'bn' && requirement.title_bn && (
              <span className="text-[11px] text-muted mt-0.5">
                {requirement.title_en}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={computedStatus.status} lang={lang} size="sm" />
        </div>
      </div>

      {/* Bottom line: File selector, page indicator, expiry date, and unmatch button */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/50 flex-wrap">
        <div className="flex-1 min-w-[200px]">
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
            className="w-full text-xs py-1.5 px-2.5 rounded-md border border-border bg-surface-subtle/60 text-primary focus:outline-hidden focus:border-primary cursor-pointer transition-colors"
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

        {matchedFile && (
          <span
            id={`pages-chip-${requirement.id}`}
            className="text-[11px] font-mono px-2 py-1 rounded bg-surface-subtle text-secondary border border-border shrink-0 tabular-nums"
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

        {requirement.has_expiry && matchedFile && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-muted">
              <CalendarIcon size={13} />
            </span>
            <input
              type="date"
              id={`expiry-input-${requirement.id}`}
              value={expiryDate || ''}
              onChange={(e) => onExpiryChange(requirement.id, e.target.value)}
              className="text-xs py-1 px-2 rounded-md border border-border bg-surface-subtle/60 text-primary font-mono focus:outline-hidden focus:border-primary cursor-pointer"
              aria-label={t('expiry_date_label', undefined, lang)}
            />
          </div>
        )}

        {matchedFile && (
          <button
            type="button"
            id={`unmatch-btn-${requirement.id}`}
            onClick={() => onUnmatch(requirement.id)}
            className="p-1 rounded-md text-muted hover:text-rose-600 hover:bg-surface-subtle transition-colors cursor-pointer shrink-0"
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
