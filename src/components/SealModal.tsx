import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLanguage, SealSettings, SealScope, SealCorner } from '../types';
import { t } from '../i18n';
import { XIcon, UploadIcon, CheckIcon, TrashIcon } from './icons';

interface SealModalProps {
  isOpen: boolean;
  onClose: () => void;
  sealSettings: SealSettings;
  onUpdateSeal: (settings: SealSettings) => void;
  lang: AppLanguage;
}

export const SealModal: React.FC<SealModalProps> = ({
  isOpen,
  onClose,
  sealSettings,
  onUpdateSeal,
  lang,
}) => {
  const [scope, setScope] = useState<SealScope>(sealSettings.scope);
  const [customPages, setCustomPages] = useState<string>(sealSettings.customPages || '');
  const [corner, setCorner] = useState<SealCorner>(sealSettings.corner);
  const [sizePercent, setSizePercent] = useState<number>(sealSettings.sizePercent || 20);
  const [previewUrl, setPreviewUrl] = useState<string | null>(sealSettings.previewUrl);
  const [rawBytes, setRawBytes] = useState<Uint8Array | null>(sealSettings.imageBytes);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Verify PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const isPngMagic =
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a;

      if (!isPngMagic) {
        setErrorMessage(
          lang === 'bn'
            ? 'শুধুমাত্র বৈধ PNG ফাইল নির্বাচন করুন।'
            : 'Please upload a valid PNG file (with transparent background recommended).'
        );
        return;
      }

      const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
      setRawBytes(bytes);
      setPreviewUrl(url);
    } catch {
      setErrorMessage(lang === 'bn' ? 'ফাইল পড়তে সমস্যা হয়েছে।' : 'Failed to read image file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setRawBytes(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  };

  const handleSave = () => {
    onUpdateSeal({
      imageBytes: rawBytes,
      previewUrl,
      scope,
      customPages,
      corner,
      sizePercent,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="seal-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-xl flex flex-col gap-5 text-xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-primary">
                {t('seal_heading', undefined, lang)}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-muted hover:text-primary transition-colors cursor-pointer p-1"
                aria-label="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="p-2.5 rounded bg-status-expired-bg text-status-expired-text border border-status-expired-border text-xs">
                {errorMessage}
              </div>
            )}

            {/* Upload Zone & Preview */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,.png"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-subtle">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Seal Preview"
                      className="w-12 h-12 object-contain rounded border border-border bg-surface p-1"
                    />
                    <div>
                      <span className="font-medium text-primary block">Seal / Signature Loaded</span>
                      <span className="text-[10px] text-muted">Ready to stamp on output PDF</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1.5 rounded text-muted hover:text-status-expired-text transition-colors cursor-pointer"
                    title={t('seal_clear', undefined, lang)}
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-[1.5px] border-dashed border-border hover:border-accent-steel rounded-lg flex flex-col items-center justify-center gap-2 text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  <UploadIcon size={20} />
                  <span className="font-medium">{t('seal_upload_btn', undefined, lang)}</span>
                </button>
              )}
            </div>

            {/* Scope Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-primary">{t('seal_position', undefined, lang)} Scope:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: t('seal_all_pages', undefined, lang) },
                  { id: 'doc-first', label: t('seal_doc_first', undefined, lang) },
                  { id: 'doc-last', label: t('seal_doc_last', undefined, lang) },
                  { id: 'custom', label: t('seal_custom', undefined, lang) },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScope(item.id as SealScope)}
                    className={`py-2 px-2.5 rounded-md border text-center transition-colors cursor-pointer truncate ${
                      scope === item.id
                        ? 'border-accent-steel bg-accent-steel/10 text-accent-steel font-medium'
                        : 'border-border bg-surface text-muted hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {scope === 'custom' && (
                <div className="mt-1">
                  <input
                    type="text"
                    value={customPages}
                    onChange={(e) => setCustomPages(e.target.value)}
                    placeholder="e.g. 1, 3, 5-7"
                    className="w-full py-1.5 px-3 rounded-md border border-border bg-subtle text-primary font-mono text-xs focus:ring-1 focus:ring-accent-steel"
                  />
                </div>
              )}
            </div>

            {/* Corner Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-primary">{t('seal_corner', undefined, lang)}:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bottom-right', label: t('seal_corner_br', undefined, lang) },
                  { id: 'bottom-left', label: t('seal_corner_bl', undefined, lang) },
                  { id: 'top-right', label: t('seal_corner_tr', undefined, lang) },
                  { id: 'top-left', label: t('seal_corner_tl', undefined, lang) },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCorner(item.id as SealCorner)}
                    className={`py-1.5 px-2 rounded-md border text-center transition-colors cursor-pointer ${
                      corner === item.id
                        ? 'border-accent-steel bg-accent-steel/10 text-accent-steel font-medium'
                        : 'border-border bg-surface text-muted hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-muted">
                <span>{t('seal_size', undefined, lang)}</span>
                <span className="font-mono">{sizePercent}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={40}
                value={sizePercent}
                onChange={(e) => setSizePercent(Number(e.target.value))}
                className="w-full accent-accent-steel cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md border border-border text-primary hover:bg-subtle transition-colors cursor-pointer"
              >
                {t('btn_cancel', undefined, lang)}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-md bg-primary text-surface font-medium hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
              >
                <CheckIcon size={14} />
                <span>{t('seal_apply', undefined, lang)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
