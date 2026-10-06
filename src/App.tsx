import { useState, useMemo, useRef } from 'react';
import { useStore } from './store';
import { t, formatNumber } from './i18n';
import { TopBar } from './components/TopBar';
import { TenderHeader } from './components/TenderHeader';
import { UploadZone } from './components/UploadZone';
import { FileRow } from './components/FileRow';
import { RequirementRow } from './components/RequirementRow';
import { GenerateBar } from './components/GenerateBar';
import { EmptyState } from './components/EmptyState';
import { AssistantDrawer } from './components/AssistantDrawer';
import { SettingsModal } from './components/SettingsModal';
import { SealModal, SealSettings } from './components/SealModal';
import { useToast } from './components/Toast';
import { UploadedFile, RequirementsPayload, GenerateProgress } from './types';
import { removeFileBuffer, buildPackage, downloadPdfBlob, sanitizeFilename } from './lib/pdf';
import {
  isFileDuplicate,
  getSiblingDuplicateNames,
  checkDuplicateMatchConflict,
  computeAutoMatches,
} from './lib/match';
import {
  computeRequirementStatus,
  computeProjectStatusSummary,
} from './lib/status';
import { exportChecklistCsv } from './lib/csv';
import { FileIcon, DownloadIcon } from './components/icons';

export default function App() {
  const { state, dispatch } = useStore();
  const { showToast } = useToast();

  // Modal / Drawer state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);

  // Bonus: Index page toggle
  const [includeIndexPage, setIncludeIndexPage] = useState(false);

  // Bonus: Seal stamp settings
  const [sealSettings, setSealSettings] = useState<SealSettings>({
    imageBytes: null,
    imagePreviewUrl: null,
    scope: 'all',
    corner: 'bottom-right',
    sizePercent: 60,
  });

  // Package generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedPackage, setHasGeneratedPackage] = useState(false);
  const [lastGeneratedBytes, setLastGeneratedBytes] = useState<Uint8Array | null>(null);
  const [lastGeneratedFilename, setLastGeneratedFilename] = useState<string>('');
  const [generateProgress, setGenerateProgress] = useState<GenerateProgress>({
    phase: 'idle',
    currentDocIndex: 0,
    totalDocs: 0,
    messageEn: '',
    messageBn: '',
  });

  const projectImportInputRef = useRef<HTMLInputElement>(null);

  const handleLanguageChange = (newLang: 'en' | 'bn') => {
    dispatch({ type: 'SET_LANG', payload: newLang });
  };

  const handleThemeToggle = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleAssistantToggle = () => {
    setIsAssistantOpen((prev) => !prev);
  };

  const handleTenderLoaded = (payload: RequirementsPayload) => {
    dispatch({ type: 'LOAD_TENDER', payload });
  };

  const handleFilesAdded = (files: UploadedFile[]) => {
    dispatch({ type: 'ADD_FILES', payload: files });
  };

  const handleFileRemove = (fileId: string) => {
    removeFileBuffer(fileId);
    dispatch({ type: 'REMOVE_FILE', payload: fileId });
  };

  // Set of all currently matched file IDs across the project
  const matchedFileIds = useMemo(() => {
    return new Set(Object.values(state.matches));
  }, [state.matches]);

  // Available files for matching: valid files that are not currently matched
  const availableFiles = useMemo(() => {
    return state.files.filter((f) => f.valid && !matchedFileIds.has(f.id));
  }, [state.files, matchedFileIds]);

  // Map of matched requirements for files
  const fileToRequirementMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(state.matches).forEach(([reqId, fileId]) => {
      map.set(fileId, reqId);
    });
    return map;
  }, [state.matches]);

  // Handle matching file to requirement with duplicate conflict guard
  const handleMatchChange = (requirementId: string, fileId: string) => {
    const conflictCheck = checkDuplicateMatchConflict(
      fileId,
      requirementId,
      state.files,
      state.matches
    );

    if (!conflictCheck.allowed) {
      const fileObj = state.files.find((f) => f.id === fileId);
      const fileName = fileObj?.name || 'File';
      showToast(
        t('toast_duplicate_blocked', { name: fileName }, 'en'),
        t('toast_duplicate_blocked', { name: fileName }, 'bn'),
        'warning'
      );
      return;
    }

    dispatch({
      type: 'SET_MATCH',
      payload: { requirementId, fileId },
    });
  };

  const handleUnmatch = (requirementId: string) => {
    dispatch({ type: 'CLEAR_MATCH', payload: requirementId });
  };

  const handleExpiryChange = (requirementId: string, date: string) => {
    dispatch({
      type: 'SET_EXPIRY',
      payload: { requirementId, date },
    });
  };

  // Auto-Match Bonus Feature
  const handleAutoMatch = () => {
    const suggestions = computeAutoMatches(
      state.requirements,
      state.files,
      state.matches
    );

    const matchCount = Object.keys(suggestions).length;
    if (matchCount > 0) {
      dispatch({ type: 'APPLY_AUTOMATCH', payload: suggestions });
      showToast(
        t('toast_automatch_applied', { count: matchCount }, 'en'),
        t('toast_automatch_applied', { count: formatNumber(matchCount, 'bn') }, 'bn'),
        'success'
      );
    } else {
      showToast(
        'No new automatic document matches found.',
        'নতুন কোনো মিল পাওয়া যায়নি।',
        'info'
      );
    }
  };

  // CSV Export Bonus Feature
  const handleExportCsv = () => {
    if (!state.tender) {
      showToast('Please load a tender first.', 'অনুগ্রহ করে প্রথমে টেন্ডার লোড করুন।', 'warning');
      return;
    }

    exportChecklistCsv(
      state.requirements,
      state.files,
      state.matches,
      state.expiryDates,
      state.tender.submission_deadline,
      state.tender.tender_id,
      state.lang
    );

    showToast(
      t('toast_csv_exported', undefined, 'en'),
      t('toast_csv_exported', undefined, 'bn'),
      'success'
    );
  };

  // Recompute live project status summary on every state change
  const deadline = state.tender?.submission_deadline || '';
  const statusSummary = useMemo(() => {
    return computeProjectStatusSummary(
      state.requirements,
      state.files,
      state.matches,
      state.expiryDates,
      deadline
    );
  }, [state.requirements, state.files, state.matches, state.expiryDates, deadline]);

  const matchedCount = Object.keys(state.matches).length;

  // Real PDF Package Builder & Downloader
  const handleGenerateClick = async () => {
    if (!statusSummary.canGenerate || !state.tender) return;

    setIsGenerating(true);
    setGenerateProgress({
      phase: 'validating',
      currentDocIndex: 0,
      totalDocs: state.requirements.length,
      messageEn: 'Validating package components...',
      messageBn: 'প্যাকেজের উপাদানসমূহ যাচাই করা হচ্ছে...',
    });

    try {
      showToast(
        t('toast_pdf_generating', undefined, 'en'),
        t('toast_pdf_generating', undefined, 'bn'),
        'info'
      );

      const result = await buildPackage(
        state.tender,
        state.requirements,
        state.files,
        state.matches,
        {
          includeIndexPage,
          sealImageBytes: sealSettings.imageBytes || undefined,
          sealPlacement: sealSettings.imageBytes
            ? {
                scope: sealSettings.scope,
                corner: sealSettings.corner,
                sizePercent: sealSettings.sizePercent,
              }
            : undefined,
          onProgress: (prog) => setGenerateProgress(prog),
        }
      );

      setLastGeneratedBytes(result.pdfBytes);
      setLastGeneratedFilename(result.filename);
      setHasGeneratedPackage(true);

      // Trigger instant download via Blob
      downloadPdfBlob(result.pdfBytes, result.filename);

      showToast(
        t('toast_pdf_success', undefined, 'en'),
        t('toast_pdf_success', undefined, 'bn'),
        'success'
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown generation error';
      showToast(
        t('toast_pdf_error', { error: errMsg }, 'en'),
        t('toast_pdf_error', { error: errMsg }, 'bn'),
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadLastGenerated = () => {
    if (lastGeneratedBytes && lastGeneratedFilename) {
      downloadPdfBlob(lastGeneratedBytes, lastGeneratedFilename);
    }
  };

  // Project Backup (Export JSON)
  const handleExportProjectJson = () => {
    const backupData = {
      tender: state.tender,
      requirements: state.requirements,
      matches: state.matches,
      expiryDates: state.expiryDates,
      includeIndexPage,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(state.tender?.tender_id || 'Tender')}_Project.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Project Restore (Import JSON)
  const handleImportProjectJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.tender && Array.isArray(parsed.requirements)) {
          dispatch({
            type: 'LOAD_TENDER',
            payload: { tender: parsed.tender, requirements: parsed.requirements },
          });
          if (parsed.matches) {
            dispatch({ type: 'APPLY_AUTOMATCH', payload: parsed.matches });
          }
          if (parsed.expiryDates) {
            Object.entries(parsed.expiryDates).forEach(([rId, date]) => {
              dispatch({ type: 'SET_EXPIRY', payload: { requirementId: rId, date: String(date) } });
            });
          }
          if (typeof parsed.includeIndexPage === 'boolean') {
            setIncludeIndexPage(parsed.includeIndexPage);
          }
          showToast('Project restored successfully.', 'প্রকল্প পুনরুদ্ধার সফল হয়েছে।', 'success');
        }
      } catch {
        showToast('Invalid project backup file.', 'অকার্যকর ব্যাকআপ ফাইল।', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col font-sans transition-colors duration-150">
      <TopBar
        tenderId={state.tender?.tender_id || null}
        lang={state.lang}
        theme={state.theme}
        onLanguageChange={handleLanguageChange}
        onThemeToggle={handleThemeToggle}
        onAssistantToggle={handleAssistantToggle}
        isAssistantOpen={isAssistantOpen}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 pb-28">
        {/* Tender Header Card */}
        <TenderHeader
          tender={state.tender}
          onTenderLoaded={handleTenderLoaded}
          lang={state.lang}
          totalFiles={state.files.length}
          matchedCount={matchedCount}
          totalRequirements={state.requirements.length}
        />

        {/* Action Toolbar (Auto-match, CSV export, Index page toggle, Seal stamp, Backup) */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-surface border border-border rounded px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-Match Button */}
            <button
              type="button"
              id="automatch-btn"
              onClick={handleAutoMatch}
              disabled={state.requirements.length === 0 || state.files.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-subtle text-primary hover:border-black/30 dark:hover:border-white/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <span>{t('btn_automatch', undefined, state.lang)}</span>
            </button>

            {/* CSV Export Button */}
            <button
              type="button"
              id="export-csv-btn"
              onClick={handleExportCsv}
              disabled={state.requirements.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-subtle text-primary hover:border-black/30 dark:hover:border-white/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <DownloadIcon size={14} />
              <span>{t('btn_export_csv', undefined, state.lang)}</span>
            </button>

            {/* Digital Seal / Signature Modal Button */}
            <button
              type="button"
              id="seal-stamp-btn"
              onClick={() => setIsSealModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
                sealSettings.imageBytes
                  ? 'border-accent-steel bg-accent-steel text-white'
                  : 'border-border bg-subtle text-primary hover:border-black/30 dark:hover:border-white/30'
              }`}
            >
              <span>
                {sealSettings.imageBytes
                  ? `${t('seal_heading', undefined, state.lang)} (Active)`
                  : t('seal_heading', undefined, state.lang)}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Index Page Toggle */}
            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                id="toggle-index-page"
                checked={includeIndexPage}
                onChange={(e) => setIncludeIndexPage(e.target.checked)}
                className="rounded border-border accent-accent-steel cursor-pointer"
              />
              <span className="font-medium text-primary">
                {t('btn_include_index', undefined, state.lang)}
              </span>
            </label>

            {/* Backup Project */}
            <button
              type="button"
              onClick={handleExportProjectJson}
              disabled={!state.tender}
              className="text-muted hover:text-primary transition-colors cursor-pointer text-[11px] disabled:opacity-40"
              title="Backup project to JSON"
            >
              {t('btn_project_export', undefined, state.lang)}
            </button>

            {/* Restore Project */}
            <input
              ref={projectImportInputRef}
              type="file"
              accept=".json"
              onChange={handleImportProjectJson}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => projectImportInputRef.current?.click()}
              className="text-muted hover:text-primary transition-colors cursor-pointer text-[11px]"
              title="Restore project from JSON"
            >
              {t('btn_project_import', undefined, state.lang)}
            </button>
          </div>
        </div>

        {/* Workspace: Requirements (2fr) + Files panel (1fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Requirements List Checklist (2fr) */}
          <section
            id="requirements-checklist-panel"
            className="lg:col-span-2 flex flex-col gap-4 bg-surface border border-border rounded p-5 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-primary">
                  {t('sec_requirements', undefined, state.lang)}
                </h2>
                <p className="text-[11px] text-muted mt-0.5">
                  {t('sec_requirements_sub', undefined, state.lang)}
                </p>
              </div>

              {state.requirements.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-subtle text-muted border border-border">
                    {formatNumber(matchedCount, state.lang)}/{formatNumber(state.requirements.length, state.lang)}{' '}
                    {state.lang === 'bn' ? 'ম্যাচড' : 'matched'}
                  </span>
                </div>
              )}
            </div>

            {state.requirements.length === 0 ? (
              <EmptyState
                title={t('empty_no_tender_title', undefined, state.lang)}
                description={t('empty_no_tender_desc', undefined, state.lang)}
                icon={<FileIcon size={32} />}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {state.requirements.map((req) => {
                  const matchedFileId = state.matches[req.id];
                  const matchedFile = matchedFileId
                    ? state.files.find((f) => f.id === matchedFileId && f.valid)
                    : undefined;
                  const expiry = state.expiryDates[req.id] || '';

                  // Compute live status for this row
                  const rowStatus = computeRequirementStatus(
                    req,
                    matchedFile,
                    expiry,
                    deadline
                  );

                  return (
                    <RequirementRow
                      key={req.id}
                      requirement={req}
                      matchedFile={matchedFile}
                      availableFiles={availableFiles}
                      computedStatus={rowStatus}
                      expiryDate={expiry}
                      onMatchChange={handleMatchChange}
                      onUnmatch={handleUnmatch}
                      onExpiryChange={handleExpiryChange}
                      lang={state.lang}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Right: Files Panel (1fr) */}
          <section
            id="uploaded-files-panel"
            className="flex flex-col gap-4 bg-surface border border-border rounded p-5 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-primary">
                  {t('sec_files', undefined, state.lang)}
                </h2>
                <p className="text-[11px] text-muted mt-0.5">
                  {t('sec_files_sub', undefined, state.lang)}
                </p>
              </div>

              {state.files.length > 0 && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-subtle text-muted border border-border">
                  {formatNumber(state.files.length, state.lang)}
                </span>
              )}
            </div>

            {/* Upload Zone */}
            <UploadZone
              currentFiles={state.files}
              onFilesAdded={handleFilesAdded}
              lang={state.lang}
            />

            {/* Files List */}
            {state.files.length === 0 ? (
              <EmptyState
                title={t('empty_no_files_title', undefined, state.lang)}
                description={t('empty_no_files_desc', undefined, state.lang)}
                icon={<FileIcon size={28} />}
              />
            ) : (
              <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                {state.files.map((file) => {
                  const isDup = isFileDuplicate(file, state.files);
                  const duplicateSiblings = getSiblingDuplicateNames(file, state.files);
                  const matchedReqId = fileToRequirementMap.get(file.id);
                  const matchedReq = matchedReqId
                    ? state.requirements.find((r) => r.id === matchedReqId)
                    : undefined;

                  return (
                    <FileRow
                      key={file.id}
                      file={file}
                      isDuplicate={isDup}
                      duplicateSiblings={duplicateSiblings}
                      matchedRequirement={matchedReq}
                      onRemove={handleFileRemove}
                      lang={state.lang}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Sticky Bottom Generate Bar */}
      <GenerateBar
        summary={statusSummary}
        onGenerate={handleGenerateClick}
        onDownloadLastGenerated={handleDownloadLastGenerated}
        hasGeneratedPackage={hasGeneratedPackage}
        isGenerating={isGenerating}
        progress={generateProgress}
        lang={state.lang}
      />

      {/* AI Assistant Drawer */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        tender={state.tender}
        statusSummary={statusSummary}
        lang={state.lang}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={state.lang}
      />

      {/* Digital Seal / Signature Modal */}
      <SealModal
        isOpen={isSealModalOpen}
        onClose={() => setIsSealModalOpen(false)}
        sealSettings={sealSettings}
        onUpdateSeal={(newSettings) => setSealSettings(newSettings)}
        lang={state.lang}
      />
    </div>
  );
}
