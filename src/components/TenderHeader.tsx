import React, { useRef } from 'react';
import { Tender, AppLanguage, RequirementsPayload } from '../types';
import { t, formatDate, formatNumber } from '../i18n';
import { UploadIcon, CalendarIcon } from './icons';
import { useToast } from './Toast';

interface TenderHeaderProps {
  tender: Tender | null;
  onTenderLoaded: (payload: RequirementsPayload) => void;
  lang: AppLanguage;
  totalFiles: number;
  matchedCount: number;
  totalRequirements: number;
}

export const TenderHeader: React.FC<TenderHeaderProps> = ({
  tender,
  onTenderLoaded,
  lang,
  totalFiles,
  matchedCount,
  totalRequirements,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Tolerant schema validation without 'any'
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          !parsed.tender ||
          typeof parsed.tender !== 'object' ||
          !Array.isArray(parsed.requirements)
        ) {
          throw new Error('Missing tender or requirements fields');
        }

        const tenderObj: Tender = {
          tender_id: String(parsed.tender.tender_id || 'T-UNSPECIFIED'),
          title: String(parsed.tender.title || 'Untitled Tender'),
          procuring_entity: String(parsed.tender.procuring_entity || 'N/A'),
          bidder: String(parsed.tender.bidder || 'N/A'),
          // Handle ISO dates with possible time parts (e.g. YYYY-MM-DDTHH:mm:ss -> YYYY-MM-DD)
          submission_deadline: String(parsed.tender.submission_deadline || '').slice(0, 10),
        };

        const requirementsList = parsed.requirements.map((r: Record<string, unknown>, index: number) => ({
          id: String(r.id || `R${index + 1}`),
          order: typeof r.order === 'number' ? r.order : index + 1,
          title_en: String(r.title_en || r.title_bn || `Document ${index + 1}`),
          title_bn: r.title_bn ? String(r.title_bn) : undefined,
          mandatory: Boolean(r.mandatory),
          has_expiry: Boolean(r.has_expiry),
        }));

        onTenderLoaded({
          tender: tenderObj,
          requirements: requirementsList,
        });

        showToast(
          t('toast_tender_loaded', { id: tenderObj.tender_id, count: requirementsList.length }, 'en'),
          t('toast_tender_loaded', { id: tenderObj.tender_id, count: formatNumber(requirementsList.length, 'bn') }, 'bn'),
          'success'
        );
      } catch {
        showToast(
          t('toast_invalid_json', undefined, 'en'),
          t('toast_invalid_json', undefined, 'bn'),
          'error'
        );
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Determine active step in progress strip
  const hasTender = Boolean(tender);
  const hasFiles = totalFiles > 0;
  const isMatching = matchedCount > 0;
  const isComplete = totalRequirements > 0 && matchedCount >= totalRequirements;

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="bg-surface border border-border rounded p-6 shadow-xs flex flex-col gap-6">
      <input
        ref={fileInputRef}
        type="file"
        id="tender-json-input"
        accept=".json,application/json"
        onChange={handleJsonUpload}
        className="hidden"
      />

      {/* Top row: Kicker & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="kicker">TENDER SPECIFICATION & COMPLIANCE</span>
          <h1 className="display-title text-primary mt-1">
            {tender ? tender.title : t('empty_no_tender_title', undefined, lang)}
          </h1>
        </div>

        <button
          type="button"
          id="load-requirements-json-btn"
          onClick={() => fileInputRef.current?.click()}
          className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-medium border border-border bg-subtle text-primary hover:border-black/20 dark:hover:border-white/20 transition-colors cursor-pointer"
        >
          <UploadIcon size={14} />
          <span>{t('btn_load_json', undefined, lang)}</span>
        </button>
      </div>

      {/* Meta Grid */}
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

      {/* Progress Strip: Load → Upload → Match → Verify */}
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

        {/* Counts summary chip */}
        {tender && (
          <div className="hidden md:flex items-center gap-3 text-[11px] text-muted font-mono">
            <span>
              {formatNumber(matchedCount, lang)}/{formatNumber(totalRequirements, lang)} Matched
            </span>
            <span>·</span>
            <span>
              {formatNumber(totalFiles, lang)} Files
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
