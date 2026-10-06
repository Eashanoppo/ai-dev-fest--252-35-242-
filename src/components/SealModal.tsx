import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLanguage } from '../types';
import { t } from '../i18n';
import { XIcon, UploadIcon, CheckIcon, TrashIcon } from './icons';

export interface SealSettings {
  imageBytes: Uint8Array | null;
  imagePreviewUrl: string | null;
  scope: 'all' | 'first' | 'last';
  corner: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  sizePercent: number;
}

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
  const [scope, setScope] = useState<'all' | 'first' | 'last'>(sealSettings.scope);
  const [corner, setCorner] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>(
    sealSettings.corner
  );
  const [sizePercent, setSizePercent] = useState<number>(sealSettings.sizePercent);
  const [previewUrl, setPreviewUrl] = useState<string | null>(sealSettings.imagePreviewUrl);
  const [rawBytes, setRawBytes] = useState<Uint8Array | null>(sealSettings.imageBytes);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      alert(lang === 'bn' ? 'শুধুমাত্র PNG ফাইল নির্বাচন করুন' : 'Please upload a PNG file');
      return;
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));

    setRawBytes(bytes);
    setPreviewUrl(url);
    e.target.value = '';
  };

  const handleRemove = () => {
    setRawBytes(null);
    setPreviewUrl(null);
  };

  const handleSave = () => {
    onUpdateSeal({
      imageBytes: rawBytes,
      imagePreviewUrl: previewUrl,
      scope,
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
            className="w-full max-w-md bg-surface border border-border rounded p-6 shadow-xl flex flex-col gap-5 text-xs"
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

            {/* PNG Upload / Preview */}
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrl ? (
                <div className="flex items-center justify-between p-3 rounded border border-border bg-subtle">
                  <div className="flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Seal Preview"
                      className="w-12 h-12 object-contain rounded bg-white p-1 border border-border"
                    />
                    <div>
                      <span className="font-semibold text-primary block">Seal Loaded</span>
                      <span className="text-[11px] text-muted">PNG format verified</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1.5 text-muted hover:text-[#A63D40] transition-colors cursor-pointer"
                    title="Remove seal"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded border-[1.5px] border-dashed border-border bg-subtle/50 hover:bg-subtle text-center cursor-pointer transition-colors flex flex-col items-center gap-2"
                >
                  <UploadIcon size={20} className="text-muted" />
                  <span className="font-medium text-primary">
                    {t('seal_upload_btn', undefined, lang)}
                  </span>
                  <span className="text-[11px] text-muted">Transparent PNG recommended</span>
                </button>
              )}

              {/* Placement Scope */}
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">
                  Target Pages
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'first', 'last'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScope(s)}
                      className={`py-1.5 px-2 rounded border text-xs font-medium transition-colors cursor-pointer ${
                        scope === s
                          ? 'border-accent-steel bg-accent-steel text-white'
                          : 'border-border bg-subtle text-muted hover:text-primary'
                      }`}
                    >
                      {s === 'all'
                        ? t('seal_all_pages', undefined, lang)
                        : s === 'first'
                        ? t('seal_first_page', undefined, lang)
                        : t('seal_last_page', undefined, lang)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Placement */}
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">
                  Position Corner
                </label>
                <select
                  value={corner}
                  onChange={(e) =>
                    setCorner(
                      e.target.value as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
                    )
                  }
                  className="w-full py-1.5 px-3 rounded border border-border bg-subtle text-primary font-mono focus:outline-hidden focus:ring-1 focus:ring-accent-steel cursor-pointer"
                >
                  <option value="bottom-right">Bottom Right (Above Footer)</option>
                  <option value="bottom-left">Bottom Left (Above Footer)</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              {/* Size Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-muted mb-1">
                  <span>Seal Scale</span>
                  <span className="font-mono">{sizePercent}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={sizePercent}
                  onChange={(e) => setSizePercent(Number(e.target.value))}
                  className="w-full cursor-pointer accent-accent-steel"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-border text-muted hover:text-primary transition-colors cursor-pointer"
              >
                {t('btn_cancel', undefined, lang)}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-primary text-surface font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <CheckIcon size={14} />
                <span>{t('btn_save', undefined, lang)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
