import React, { useRef, useState, useCallback } from 'react';
import { UploadedFile, AppLanguage } from '../types';
import { t, formatNumber } from '../i18n';
import { computeSHA256 } from '../lib/hash';
import { inspectPdf, storeFileBuffer } from '../lib/pdf';
import { useToast } from './Toast';
import { UploadIcon } from './icons';

interface UploadZoneProps {
  currentFiles: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
  lang: AppLanguage;
}

const MAX_FILES = 30;
const MAX_TOTAL_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const UploadZone: React.FC<UploadZoneProps> = ({
  currentFiles,
  onFilesAdded,
  lang,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const currentCount = currentFiles.length;
  const currentSizeBytes = currentFiles.reduce((acc, f) => acc + f.size, 0);
  const currentSizeMB = (currentSizeBytes / (1024 * 1024)).toFixed(1);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesArray = Array.from(fileList);
      if (filesArray.length === 0) return;

      // 1. Check count limit
      if (currentCount + filesArray.length > MAX_FILES) {
        showToast(
          `Cannot upload ${filesArray.length} files. Exceeds maximum limit of ${MAX_FILES} files.`,
          `সর্বোচ্চ ${formatNumber(MAX_FILES, 'bn')}টি ফাইলের সীমা অতিক্রম হয়েছে।`,
          'error'
        );
        return;
      }

      // 2. Check total size limit
      const incomingBytes = filesArray.reduce((acc, f) => acc + f.size, 0);
      if (currentSizeBytes + incomingBytes > MAX_TOTAL_SIZE_BYTES) {
        showToast(
          `Total upload size exceeds 50MB limit (Incoming: ${(incomingBytes / (1024 * 1024)).toFixed(1)}MB).`,
          `ফাইলের মোট আকার ৫০ মেগাবাইটের বেশি হতে পারবে না।`,
          'error'
        );
        return;
      }

      setIsProcessing(true);
      const newUploadedFiles: UploadedFile[] = [];

      for (const file of filesArray) {
        try {
          const buffer = await file.arrayBuffer();

          // Inspect PDF magic bytes and parse structure
          const inspectResult = await inspectPdf(buffer);

          if (!inspectResult.valid && inspectResult.error?.includes('missing %PDF')) {
            showToast(
              t('toast_non_pdf_rejected', { name: file.name }, 'en'),
              t('toast_non_pdf_rejected', { name: file.name }, 'bn'),
              'error'
            );
            continue; // Skip non-PDFs entirely
          }

          // Calculate SHA-256 hash
          const hash = await computeSHA256(buffer);
          const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          // Store raw ArrayBuffer in memory
          storeFileBuffer(fileId, buffer);

          const uploadedFile: UploadedFile = {
            id: fileId,
            name: file.name,
            size: file.size,
            hash,
            pageCount: inspectResult.pageCount,
            valid: inspectResult.valid,
            error: inspectResult.error,
          };

          if (!inspectResult.valid) {
            showToast(
              t('toast_file_unreadable', { name: file.name }, 'en'),
              t('toast_file_unreadable', { name: file.name }, 'bn'),
              'warning'
            );
          }

          newUploadedFiles.push(uploadedFile);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Upload error';
          showToast(
            `Failed to process "${file.name}": ${errMsg}`,
            `"${file.name}" প্রক্রিয়া করতে সমস্যা হয়েছে: ${errMsg}`,
            'error'
          );
        }
      }

      setIsProcessing(false);

      if (newUploadedFiles.length > 0) {
        onFilesAdded(newUploadedFiles);
      }
    },
    [currentCount, currentSizeBytes, onFilesAdded, showToast]
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
      // Reset input value so re-selecting the same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        id="pdf-upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-[1.5px] border-dashed rounded p-6 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? 'border-primary bg-subtle'
            : 'border-border bg-surface hover:border-black/30 dark:hover:border-white/30'
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

        <div className="p-2 rounded-full bg-subtle text-muted">
          <UploadIcon size={22} />
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

      <div className="flex justify-between items-center text-[11px] text-muted px-1 font-mono">
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
        <span>≤30 PDFs · ≤50MB</span>
      </div>
    </div>
  );
};
