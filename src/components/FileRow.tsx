import React from 'react';
import { UploadedFile, Requirement, AppLanguage } from '../types';
import { t, formatNumber, formatFileSize } from '../i18n';
import { FileIcon, TrashIcon, CopyIcon, AlertIcon } from './icons';

interface FileRowProps {
  file: UploadedFile;
  isDuplicate: boolean;
  duplicateSiblings: string[];
  matchedRequirement?: Requirement;
  onRemove: (fileId: string) => void;
  lang: AppLanguage;
}

export const FileRow: React.FC<FileRowProps> = ({
  file,
  isDuplicate,
  duplicateSiblings,
  matchedRequirement,
  onRemove,
  lang,
}) => {
  const reqTitle = matchedRequirement
    ? lang === 'bn' && matchedRequirement.title_bn
      ? matchedRequirement.title_bn
      : matchedRequirement.title_en
    : null;

  return (
    <div
      id={`file-row-${file.id}`}
      className={`group flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all bg-surface hover:bg-surface-subtle/50 ${
        !file.valid
          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
          : isDuplicate
          ? 'border-amber-300 dark:border-amber-900/50'
          : 'border-border'
      }`}
    >
      {/* Left: Icon & File Meta */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        <div className="text-muted shrink-0 flex items-center justify-center w-7 h-7 rounded bg-surface-subtle border border-border">
          {!file.valid ? (
            <AlertIcon size={14} className="text-rose-600 dark:text-rose-400" />
          ) : (
            <FileIcon size={14} className="text-secondary" />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="font-medium text-primary text-[13px] truncate max-w-[180px] sm:max-w-[240px]"
              title={file.name}
            >
              {file.name}
            </span>

            {/* Duplicate badge */}
            {isDuplicate && (
              <span
                id={`duplicate-badge-${file.id}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-mono shrink-0"
                title={
                  duplicateSiblings.length > 0
                    ? `${t('tag_duplicate', undefined, lang)}: ${duplicateSiblings.join(', ')}`
                    : t('tag_duplicate', undefined, lang)
                }
              >
                <CopyIcon size={10} />
                <span>{t('tag_duplicate', undefined, lang)}</span>
              </span>
            )}

            {/* Unreadable badge */}
            {!file.valid && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-mono shrink-0">
                {t('tag_unreadable', undefined, lang)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
            {file.valid && (
              <>
                <span className="tabular-nums font-mono">
                  {t(
                    'pages_chip',
                    {
                      count: formatNumber(file.pageCount, lang),
                      plural:
                        file.pageCount === 1
                          ? t('page_singular', undefined, lang)
                          : t('page_plural', undefined, lang),
                    },
                    lang
                  )}
                </span>
                <span className="text-border-strong">·</span>
              </>
            )}
            <span className="tabular-nums font-mono">
              {formatFileSize(file.size, lang)}
            </span>

            {/* Matched Requirement Link Chip */}
            {matchedRequirement && (
              <>
                <span className="text-border-strong">·</span>
                <span
                  className="text-accent font-medium truncate max-w-[160px]"
                  title={`Matched to: ${matchedRequirement.id} - ${reqTitle}`}
                >
                  → {matchedRequirement.id} {reqTitle}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Remove Button */}
      <div className="shrink-0">
        <button
          type="button"
          id={`remove-file-${file.id}`}
          onClick={() => onRemove(file.id)}
          className="p-1.5 rounded text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-surface-subtle transition-colors cursor-pointer"
          aria-label={t('btn_remove', undefined, lang)}
          title={t('btn_remove', undefined, lang)}
        >
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  );
};
