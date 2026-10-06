import React, { useRef, useState } from 'react';
import { Tender, AppLanguage, RequirementsPayload, StatusSummary } from '../types';
import { t, formatDate } from '../i18n';
import { UploadIcon, CalendarIcon, CheckIcon } from './icons';
import { parseRequirementsJson } from '../lib/requirements';
import { CountUp } from './CountUp';

interface TenderHeaderProps {
  tender: Tender | null;
  onTenderLoaded: (payload: RequirementsPayload) => void;
  lang: AppLanguage;
  summary: StatusSummary;
  totalFiles: number;
  matchedCount: number;
  onToast: (type: 'info' | 'success' | 'warning' | 'error', msgEn: string, msgBn: string) => void;
}

export const TenderHeader: React.FC<TenderHeaderProps> = ({
  tender,
  onTenderLoaded,
  lang,
  summary,
  totalFiles,
  matchedCount,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingJson, setIsDraggingJson] = useState(false);

  const processJsonText = (text: string) => {
    const result = parseRequirementsJson(text);
    if (!result.success || !result.data) {
      onToast(
        'error',
        result.error || t('toast_invalid_json', undefined, 'en'),
        result.error || t('toast_invalid_json', undefined, 'bn')
      );
      return;
    }

    onTenderLoaded(result.data);
    onToast(
      'success',
      t('toast_tender_loaded', { id: result.data.tender.tender_id, count: result.data.requirements.length }, 'en'),
      t('toast_tender_loaded', { id: result.data.tender.tender_id, count: result.data.requirements.length }, 'bn')
    );
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processJsonText(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingJson(true);
  };

  const handleDragLeave = () => {
    setIsDraggingJson(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingJson(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.json') || file.type.includes('json'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processJsonText(text);
      };
      reader.readAsText(file);
    }
  };

  const hasTender = Boolean(tender);
  const hasFiles = totalFiles > 0;
  const isComplete = summary.canGenerate;
  const todayStr = new Date().toISOString().slice(0, 10);

  const steps = [
    { num: 1, label: t('status_progress_load', undefined, lang), isDone: hasTender, isActive: !hasTender },
    { num: 2, label: t('status_progress_upload', undefined, lang), isDone: hasFiles, isActive: hasTender && !hasFiles },
    { num: 3, label: t('status_progress_match', undefined, lang), isDone: matchedCount > 0 && matchedCount === summary.total, isActive: hasFiles && !isComplete },
    { num: 4, label: t('status_progress_verify', undefined, lang), isDone: isComplete, isActive: isComplete },
  ];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-surface border rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5 transition-colors ${
        isDraggingJson ? 'border-primary ring-1 ring-primary/20' : 'border-border'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        id="tender-json-input"
        accept=".json,application/json"
        onChange={handleJsonUpload}
        className="hidden"
      />

      {/* Top row: Eyebrow label, strong title, and primary action */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="max-w-2xl">
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase font-mono block">
            TENDER SPECIFICATION & COMPLIANCE
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary mt-1">
            {tender ? tender.title : t('empty_no_tender_title', undefined, lang)}
          </h1>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {tender
              ? `${tender.procuring_entity} · Bidder: ${tender.bidder}`
              : 'Upload a requirements specification file to begin validating and compiling your submission package.'}
          </p>
        </div>

        <button
          type="button"
          id="load-requirements-json-btn"
          onClick={() => fileInputRef.current?.click()}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold bg-primary text-surface hover:opacity-90 transition-opacity cursor-pointer shadow-2xs shrink-0"
        >
          <UploadIcon size={14} />
          <span>{t('btn_load_json', undefined, lang)}</span>
        </button>
      </div>

      {/* Tender Metadata Row */}
      {tender && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border text-xs">
          <div className="flex flex-col">
            <span className="text-muted text-[11px]">{t('tender_id_label', undefined, lang)}</span>
            <span className="font-mono font-medium text-primary mt-0.5">{tender.tender_id}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-muted text-[11px]">{t('bidder_label', undefined, lang)}</span>
            <span className="font-medium text-primary mt-0.5 truncate" title={tender.bidder}>
              {tender.bidder}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-muted text-[11px]">{t('deadline_label', undefined, lang)}</span>
            <span className="inline-flex items-center gap-1 font-mono font-medium text-primary mt-0.5">
              <CalendarIcon size={12} className="text-muted" />
              {formatDate(tender.submission_deadline, lang)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-muted text-[11px]">{t('package_date_label', undefined, lang)}</span>
            <span className="font-mono text-muted mt-0.5">{formatDate(todayStr, lang)}</span>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      {tender && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-lg border border-border bg-surface-subtle/50 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted">{t('stat_total_docs', undefined, lang)}</span>
            <span className="text-lg font-bold font-mono text-primary mt-1">
              <CountUp value={summary.total} lang={lang} />
            </span>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              {t('stat_ready', undefined, lang)}
            </span>
            <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              <CountUp value={summary.ok} lang={lang} />
            </span>
          </div>

          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              summary.blockingCount > 0
                ? 'border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                : 'border-border bg-surface-subtle/50 text-muted'
            }`}
          >
            <span className="text-[11px] font-medium">{t('stat_blocking', undefined, lang)}</span>
            <span className="text-lg font-bold font-mono mt-1">
              <CountUp value={summary.blockingCount} lang={lang} />
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border bg-surface-subtle/50 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted">{t('stat_optional_skipped', undefined, lang)}</span>
            <span className="text-lg font-bold font-mono text-secondary mt-1">
              <CountUp value={summary.notProvided} lang={lang} />
            </span>
          </div>
        </div>
      )}

      {/* Refined Workflow Stepper */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-3 sm:gap-4 flex-nowrap w-full">
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-medium transition-colors ${
                    step.isDone
                      ? 'bg-emerald-600 text-white'
                      : step.isActive
                      ? 'bg-primary text-surface'
                      : 'border border-border text-muted bg-surface-subtle'
                  }`}
                >
                  {step.isDone ? <CheckIcon size={10} /> : step.num}
                </span>
                <span
                  className={`text-xs ${
                    step.isDone
                      ? 'text-primary font-medium'
                      : step.isActive
                      ? 'text-primary font-semibold'
                      : 'text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-px bg-border min-w-4 max-w-16 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
