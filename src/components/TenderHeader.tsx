import React, { useRef, useState } from 'react';
import { Tender, AppLanguage, RequirementsPayload, StatusSummary } from '../types';
import { t, formatDate } from '../i18n';
import { UploadIcon, CalendarIcon } from './icons';
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
  const isMatching = matchedCount > 0;
  const isComplete = summary.canGenerate;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-surface border rounded-xl p-6 shadow-xs flex flex-col gap-6 transition-colors ${
        isDraggingJson ? 'border-accent-steel ring-2 ring-accent-steel/20' : 'border-border'
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

      {/* Top row: Kicker & Load Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="kicker">TENDER SPECIFICATION & COMPLIANCE</span>
          <h1 className="display-title text-primary mt-1 text-xl sm:text-2xl font-bold tracking-tight">
            {tender ? tender.title : t('empty_no_tender_title', undefined, lang)}
          </h1>
        </div>

        <button
          type="button"
          id="load-requirements-json-btn"
          onClick={() => fileInputRef.current?.click()}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium border border-border bg-subtle text-primary hover:bg-surface hover:border-accent-steel transition-colors cursor-pointer shadow-2xs"
        >
          <UploadIcon size={14} />
          <span>{t('btn_load_json', undefined, lang)}</span>
        </button>
      </div>

      {/* Tender Metadata Details */}
      {tender && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-border text-xs">
          <div>
            <span className="text-muted block text-[11px] mb-0.5">
              {t('tender_id_label', undefined, lang)}
            </span>
            <span className="font-mono font-semibold text-primary">
              {tender.tender_id}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px] mb-0.5">
              {t('procuring_entity_label', undefined, lang)}
            </span>
            <span className="font-medium text-primary truncate block" title={tender.procuring_entity}>
              {tender.procuring_entity}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px] mb-0.5">
              {t('bidder_label', undefined, lang)}
            </span>
            <span className="font-medium text-primary truncate block" title={tender.bidder}>
              {tender.bidder}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px] mb-0.5">
              {t('deadline_label', undefined, lang)}
            </span>
            <span className="inline-flex items-center gap-1 font-mono font-medium text-primary">
              <CalendarIcon size={13} className="text-muted" />
              {formatDate(tender.submission_deadline, lang)}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px] mb-0.5">
              {t('package_date_label', undefined, lang)}
            </span>
            <span className="font-mono text-muted">
              {formatDate(todayStr, lang)}
            </span>
          </div>
        </div>
      )}

      {/* Stat Cards with CountUp */}
      {tender && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg border border-border bg-subtle/50 flex flex-col">
            <span className="text-[11px] text-muted mb-1">{t('stat_total_docs', undefined, lang)}</span>
            <span className="text-lg font-bold font-mono text-primary">
              <CountUp value={summary.total} lang={lang} />
            </span>
          </div>

          <div className="p-3 rounded-lg border border-status-ok-border bg-status-ok-bg/40 flex flex-col">
            <span className="text-[11px] text-status-ok-text mb-1">{t('stat_ready', undefined, lang)}</span>
            <span className="text-lg font-bold font-mono text-status-ok-text">
              <CountUp value={summary.ok} lang={lang} />
            </span>
          </div>

          <div
            className={`p-3 rounded-lg border flex flex-col ${
              summary.blockingCount > 0
                ? 'border-status-expired-border bg-status-expired-bg/40 text-status-expired-text'
                : 'border-border bg-subtle/50 text-muted'
            }`}
          >
            <span className="text-[11px] mb-1">{t('stat_blocking', undefined, lang)}</span>
            <span className="text-lg font-bold font-mono">
              <CountUp value={summary.blockingCount} lang={lang} />
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border bg-subtle/50 flex flex-col">
            <span className="text-[11px] text-muted mb-1">{t('stat_optional_skipped', undefined, lang)}</span>
            <span className="text-lg font-bold font-mono text-primary">
              <CountUp value={summary.notProvided} lang={lang} />
            </span>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                hasTender ? 'bg-primary text-surface' : 'bg-subtle text-muted border border-border'
              }`}
            >
              1
            </span>
            <span className={hasTender ? 'text-primary' : 'text-muted'}>
              {t('status_progress_load', undefined, lang)}
            </span>
          </div>

          <span className="text-muted text-[10px]">→</span>

          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                hasFiles ? 'bg-primary text-surface' : 'bg-subtle text-muted border border-border'
              }`}
            >
              2
            </span>
            <span className={hasFiles ? 'text-primary' : 'text-muted'}>
              {t('status_progress_upload', undefined, lang)}
            </span>
          </div>

          <span className="text-muted text-[10px]">→</span>

          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                isMatching ? 'bg-primary text-surface' : 'bg-subtle text-muted border border-border'
              }`}
            >
              3
            </span>
            <span className={isMatching ? 'text-primary' : 'text-muted'}>
              {t('status_progress_match', undefined, lang)}
            </span>
          </div>

          <span className="text-muted text-[10px]">→</span>

          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                isComplete ? 'bg-[#3E7A52] text-white' : 'bg-subtle text-muted border border-border'
              }`}
            >
              4
            </span>
            <span className={isComplete ? 'text-[#3E7A52] dark:text-[#7FB793]' : 'text-muted'}>
              {t('status_progress_verify', undefined, lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
