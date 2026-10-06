import React, { useRef, useState, useCallback } from 'react';
import { UploadedFile, AppLanguage, Requirement } from '../types';
import { t, formatNumber } from '../i18n';
import { computeSHA256 } from '../lib/hash';
import { inspectPdf } from '../lib/pdfInspect';
import { setFileBuffer } from '../lib/fileStore';
import { autoMatchFiles } from '../lib/match';
import { UploadIcon } from './icons';

interface UploadZoneProps {
  currentFiles: UploadedFile[];
  requirements: Requirement[];
  matches: Record<string, string>;
  onFilesAdded: (files: UploadedFile[]) => void;
  onApplyMatches: (matches: Record<string, string>) => void;
  onToast: (type: 'info' | 'success' | 'warning' | 'error', msgEn: string, msgBn: string) => void;
  lang: AppLanguage;
}

const MAX_FILES = 30;
const MAX_TOTAL_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const UploadZone: React.FC<UploadZoneProps> = ({
  currentFiles,
  requirements,
  matches,
  onFilesAdded,
  onApplyMatches,
  onToast,
  lang,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCount = currentFiles.length;
  const currentSizeBytes = currentFiles.reduce((acc, f) => acc + f.size, 0);
  const currentSizeMB = (currentSizeBytes / (1024 * 1024)).toFixed(1);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesArray = Array.from(fileList);
      if (filesArray.length === 0) return;

      if (currentCount + filesArray.length > MAX_FILES) {
        onToast(
          'error',
          `Cannot upload ${filesArray.length} files. Exceeds maximum limit of ${MAX_FILES} files.`,
          `সর্বোচ্চ ${formatNumber(MAX_FILES, 'bn')}টি ফাইলের সীমা অতিক্রম হয়েছে।`
        );
        return;
      }

      const incomingBytes = filesArray.reduce((acc, f) => acc + f.size, 0);
      if (currentSizeBytes + incomingBytes > MAX_TOTAL_SIZE_BYTES) {
        onToast(
          'error',
          `Total upload size exceeds 50MB limit (Incoming: ${(incomingBytes / (1024 * 1024)).toFixed(1)}MB).`,
          `ফাইলের মোট আকার ৫০ মেগাবাইটের বেশি হতে পারবে না।`
        );
        return;
      }

      setIsProcessing(true);
      const newUploadedFiles: UploadedFile[] = [];

      for (const file of filesArray) {
        try {
          const buffer = await file.arrayBuffer();
          const inspectResult = await inspectPdf(buffer);

          if (!inspectResult.valid && inspectResult.errorKind === 'damaged' && inspectResult.error?.includes('missing %PDF')) {
            onToast(
              'error',
              t('toast_non_pdf_rejected', { name: file.name }, 'en'),
              t('toast_non_pdf_rejected', { name: file.name }, 'bn')
            );
            continue;
          }

          const hash = await computeSHA256(buffer);
          const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          setFileBuffer(fileId, buffer.slice(0));

          const uploadedFile: UploadedFile = {
            id: fileId,
            name: file.name,
            size: file.size,
            hash,
            pageCount: inspectResult.pageCount,
            valid: inspectResult.valid,
            errorKind: inspectResult.errorKind,
            error: inspectResult.error,
          };

          if (!inspectResult.valid) {
            onToast(
              'warning',
              t('toast_file_unreadable', { name: file.name }, 'en'),
              t('toast_file_unreadable', { name: file.name }, 'bn')
            );
          }

          newUploadedFiles.push(uploadedFile);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Upload error';
          onToast(
            'error',
            `Failed to process "${file.name}": ${errMsg}`,
            `"${file.name}" প্রক্রিয়া করতে সমস্যা হয়েছে: ${errMsg}`
          );
        }
      }

      setIsProcessing(false);

      if (newUploadedFiles.length > 0) {
        onFilesAdded(newUploadedFiles);
      }
    },
    [currentCount, currentSizeBytes, onFilesAdded, onToast]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleAutoMatch = () => {
    if (currentFiles.length === 0 || requirements.length === 0) return;
    const suggestions = autoMatchFiles(requirements, currentFiles, matches);
    if (suggestions.length === 0) {
      onToast(
        'info',
        'No matching files found for the remaining requirements.',
        'অবশিষ্ট রিকোয়ারমেন্টের জন্য কোনো ম্যাচিং ফাইল পাওয়া যায়নি।'
      );
      return;
    }

    const newMatches: Record<string, string> = {};
    for (const s of suggestions) {
      newMatches[s.requirementId] = s.fileId;
    }

    onApplyMatches(newMatches);
    onToast(
      'success',
      t('toast_automatch_applied', { count: suggestions.length }, 'en'),
      t('toast_automatch_applied', { count: suggestions.length }, 'bn')
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div
        id="pdf-upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-lg p-4 sm:p-5 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-1.5 ${
          isDragOver
            ? 'border-primary bg-surface-subtle'
            : 'border-border bg-surface hover:border-secondary'
        } ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={t('upload_drop_zone_title', undefined, lang)}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="pdf-file-input"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="p-2 rounded-full bg-surface-subtle text-muted">
          <UploadIcon size={18} />
        </div>

        <div>
          <h4 className="text-xs font-semibold text-primary">
            {isProcessing
              ? lang === 'bn'
                ? 'ফাইল প্রসেসিং হচ্ছে...'
                : 'Processing files...'
              : t('upload_drop_zone_title', undefined, lang)}
          </h4>
          <p className="text-[11px] text-muted mt-0.5">
            {t('upload_drop_zone_sub', undefined, lang)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] text-muted px-0.5 font-mono">
        <span>
          {t(
            'upload_limit_info',
            {
              currentFiles: formatNumber(currentCount, lang),
              currentSizeMB: formatNumber(Number(currentSizeMB), lang),
            },
            lang
          )}
        </span>

        {currentFiles.length > 0 && requirements.length > 0 && (
          <button
            type="button"
            id="auto-match-btn"
            onClick={handleAutoMatch}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-surface text-secondary hover:text-primary hover:bg-surface-subtle font-sans text-xs transition-colors cursor-pointer"
          >
            <span>{t('btn_automatch', undefined, lang)}</span>
          </button>
        )}
      </div>
    </div>
  );
};
