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
      className={`flex items-center justify-between p-3 rounded border text-xs transition-colors bg-surface ${
        !file.valid
          ? 'border-[#A63D40]/30 bg-[#F6E9E9]/20 dark:bg-[#271617]/20'
          : isDuplicate
          ? 'border-[#A63D40]/40'
          : 'border-border'
      }`}
    >
      {/* Left: Icon & File Meta */}
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
        <div className="text-muted shrink-0">
          {!file.valid ? (
            <AlertIcon size={18} className="text-[#A63D40] dark:text-[#D98A8C]" />
          ) : (
            <FileIcon size={18} />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="font-medium text-primary truncate max-w-[200px] sm:max-w-[280px]"
              title={file.name}
            >
              {file.name}
            </span>

            {/* Duplicate badge (Red outline per design.md) */}
            {isDuplicate && (
              <span
                id={`duplicate-badge-${file.id}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded border border-[#A63D40] text-[#A63D40] dark:border-[#D98A8C] dark:text-[#D98A8C] text-[10px] font-medium shrink-0"
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
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#F6E9E9] text-[#A63D40] dark:bg-[#271617] dark:text-[#D98A8C] text-[10px] font-medium shrink-0">
                {t('tag_unreadable', undefined, lang)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
            {file.valid && (
              <>
                <span className="tabular-nums">
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
                <span>·</span>
              </>
            )}
            <span className="tabular-nums font-mono">
              {formatFileSize(file.size, lang)}
            </span>

            {/* Matched Requirement Link Chip */}
            {matchedRequirement && (
              <>
                <span>·</span>
                <span
                  className="text-accent-steel font-medium truncate max-w-[180px]"
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
          className="p-1.5 rounded text-muted hover:text-[#A63D40] dark:hover:text-[#D98A8C] hover:bg-subtle transition-colors cursor-pointer"
          aria-label={t('btn_remove', undefined, lang)}
          title={t('btn_remove', undefined, lang)}
        >
          <TrashIcon size={15} />
        </button>
      </div>
    </div>
  );
};
