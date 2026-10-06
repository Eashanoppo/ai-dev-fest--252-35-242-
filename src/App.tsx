import { useState, useMemo, useRef } from 'react';
import { useStore } from './store';
import { t, formatNumber } from './i18n';
import { TopBar } from './components/TopBar';
import { TenderHeader } from './components/TenderHeader';
import { ActionToolbar } from './components/ActionToolbar';
import { UploadZone } from './components/UploadZone';
import { FileRow } from './components/FileRow';
import { RequirementRow } from './components/RequirementRow';
import { GenerateBar } from './components/GenerateBar';
import { EmptyState } from './components/EmptyState';
import { AssistantDrawer } from './components/AssistantDrawer';
import { SettingsModal } from './components/SettingsModal';
import { SealModal } from './components/SealModal';
import {
  UploadedFile,
  RequirementsPayload,
  GenerateProgress,
  SealSettings,
} from './types';
import { buildPackage, sanitizeFilename } from './lib/pdf';
import { buildChecklistCsv } from './lib/csv';
import { computeRequirementStatus } from './lib/status';
import { autoMatchFiles } from './lib/match';
import { FileIcon, AlertIcon } from './components/icons';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const {
    state,
    dispatch,
    summary,
    notify,
    setLanguage,
    setTheme,
  } = useStore();

  // Modal / Drawer state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);

  // Bonus: Index page toggle
  const [includeIndexPage, setIncludeIndexPage] = useState(false);

  // Bonus: Seal stamp settings
  const [sealSettings, setSealSettings] = useState<SealSettings>({
    imageBytes: null,
    previewUrl: null,
    scope: 'all',
    customPages: '',
    corner: 'bottom-right',
    sizePercent: 20,
  });

  // Package generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedPackage, setHasGeneratedPackage] = useState(false);
  const [lastGeneratedBytes, setLastGeneratedBytes] = useState<Uint8Array | null>(null);
  const [lastGeneratedFilename, setLastGeneratedFilename] = useState<string>('');
  const [generateProgress, setGenerateProgress] = useState<GenerateProgress>({
    phase: 'idle',
    current: 0,
    total: 100,
    title: '',
    pages: 0,
  });

  const projectImportInputRef = useRef<HTMLInputElement>(null);

  const handleTenderLoaded = (payload: RequirementsPayload) => {
    dispatch({ type: 'LOAD_TENDER', payload });
  };

  const handleFilesAdded = (files: UploadedFile[]) => {
    dispatch({ type: 'ADD_FILES', payload: files });
  };

  const handleFileRemove = (fileId: string) => {
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

  // Duplicate files hashing index (TC 2.2)
  const hashCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of state.files) {
      if (f.hash) {
        counts.set(f.hash, (counts.get(f.hash) || 0) + 1);
      }
    }
    return counts;
  }, [state.files]);

  // Map of matched requirements for files
  const fileToRequirementMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(state.matches).forEach(([reqId, fileId]) => {
      map.set(fileId, reqId);
    });
    return map;
  }, [state.matches]);

  // Handle matching file to requirement
  const handleMatchChange = (requirementId: string, fileId: string) => {
    dispatch({
      type: 'SET_MATCH',
      payload: { requirementId, fileId },
    });
  };

  const handleUnmatch = (requirementId: string) => {
    dispatch({ type: 'CLEAR_MATCH', payload: requirementId });
  };

  const handleExpiryChange = (requirementId: string, expiry: string) => {
    dispatch({
      type: 'SET_EXPIRY',
      payload: { requirementId, expiry },
    });
  };

  const handleApplyMatches = (newMatches: Record<string, string>) => {
    dispatch({ type: 'APPLY_MATCHES', payload: newMatches });
  };

  // Auto-match action
  const handleAutoMatch = () => {
    if (state.requirements.length === 0 || state.files.length === 0) return;
    const suggestions = autoMatchFiles(state.requirements, state.files, state.matches);
    if (suggestions.length === 0) {
      notify(
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
    dispatch({ type: 'APPLY_MATCHES', payload: newMatches });
    notify(
      'success',
      t('toast_automatch_applied', { count: suggestions.length }, 'en'),
      t('toast_automatch_applied', { count: suggestions.length }, 'bn')
    );
  };

  // CSV Export Bonus Feature
  const handleExportCsv = () => {
    if (!state.tender) {
      notify('warning', 'Please load a tender first.', 'অনুগ্রহ করে প্রথমে একটি টেন্ডার লোড করুন।');
      return;
    }

    const csvContent = buildChecklistCsv(
      state.requirements,
      state.files,
      state.matches,
      state.expiryDates,
      state.tender.submission_deadline,
      state.lang
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${sanitizeFilename(state.tender.tender_id).replace('_Package.pdf', '')}_Checklist.csv`;
    downloadBlob(blob, filename);

    notify('success', t('toast_csv_exported', undefined, 'en'), t('toast_csv_exported', undefined, 'bn'));
  };

  // Real PDF Package Builder & Downloader
  const handleGenerateClick = async () => {
    if (!summary.canGenerate || !state.tender) return;

    setIsGenerating(true);
    setGenerateProgress({
      phase: 'validating',
      current: 0,
      total: 100,
      title: 'Validating documents...',
      pages: 0,
    });

    try {
      notify('info', t('toast_pdf_generating', undefined, 'en'), t('toast_pdf_generating', undefined, 'bn'));

      const result = await buildPackage({
        tender: state.tender,
        requirements: state.requirements,
        files: state.files,
        matches: state.matches,
        includeIndexPage,
        seal: sealSettings.imageBytes ? sealSettings : null,
        onProgress: (prog) => setGenerateProgress(prog),
      });

      setLastGeneratedBytes(result.pdfBytes);
      setLastGeneratedFilename(result.filename);
      setHasGeneratedPackage(true);

      // Trigger instant download via Blob (Section 4.8 / TC 4.7)
      const blob = new Blob([new Uint8Array(result.pdfBytes)], { type: 'application/pdf' });
      downloadBlob(blob, result.filename);

      notify('success', t('toast_pdf_success', undefined, 'en'), t('toast_pdf_success', undefined, 'bn'));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown generation error';
      notify('error', t('toast_pdf_error', { error: errMsg }, 'en'), t('toast_pdf_error', { error: errMsg }, 'bn'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadLastGenerated = () => {
    if (lastGeneratedBytes && lastGeneratedFilename) {
      const blob = new Blob([new Uint8Array(lastGeneratedBytes)], { type: 'application/pdf' });
      downloadBlob(blob, lastGeneratedFilename);
    }
  };

  // Project Backup (Export JSON)
  const handleExportProjectJson = () => {
    if (!state.tender) return;
    const backupData = {
      tender: state.tender,
      requirements: state.requirements,
      matches: state.matches,
      expiryDates: state.expiryDates,
      pendingLinks: state.pendingLinks,
      includeIndexPage,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const filename = `${sanitizeFilename(state.tender.tender_id).replace('_Package.pdf', '')}_Project.json`;
    downloadBlob(blob, filename);
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
            dispatch({ type: 'APPLY_MATCHES', payload: parsed.matches });
          }
          if (parsed.expiryDates) {
            Object.entries(parsed.expiryDates).forEach(([rId, date]) => {
              dispatch({ type: 'SET_EXPIRY', payload: { requirementId: rId, expiry: String(date) } });
            });
          }
          if (typeof parsed.includeIndexPage === 'boolean') {
            setIncludeIndexPage(parsed.includeIndexPage);
          }
          notify('success', 'Project restored successfully.', 'প্রকল্প পুনরুদ্ধার সফল হয়েছে।');
        }
      } catch {
        notify('error', 'Invalid project backup file.', 'অকার্যকর ব্যাকআপ ফাইল।');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const pendingCount = Object.keys(state.pendingLinks).length;
  const deadline = state.tender?.submission_deadline || '';

  return (
    <div className="min-h-screen bg-page text-primary flex flex-col font-sans transition-colors duration-150">
      <TopBar
        tenderId={state.tender?.tender_id || null}
        lang={state.lang}
        theme={state.theme}
        onLanguageChange={setLanguage}
        onThemeToggle={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
        onAssistantToggle={() => setIsAssistantOpen((prev) => !prev)}
        isAssistantOpen={isAssistantOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCsv={handleExportCsv}
        onExportProject={handleExportProjectJson}
        onImportProject={() => projectImportInputRef.current?.click()}
      />

      <input
        ref={projectImportInputRef}
        type="file"
        accept=".json"
        onChange={handleImportProjectJson}
        className="hidden"
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6 pb-28">
        {/* Re-link Pending Matches Banner */}
        {pendingCount > 0 && (
          <div className="p-3.5 rounded-lg border border-accent/30 bg-accent/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertIcon size={16} className="text-accent shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-primary">
                  {t('relink_banner_title', undefined, state.lang)}
                </h4>
                <p className="text-[11px] text-muted mt-0.5">
                  {t('relink_banner_desc', { count: formatNumber(pendingCount, state.lang) }, state.lang)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'CLEAR_PENDING' })}
              className="text-xs text-muted hover:text-primary transition-colors cursor-pointer px-2.5 py-1 rounded border border-border bg-surface shrink-0"
            >
              {t('relink_dismiss', undefined, state.lang)}
            </button>
          </div>
        )}

        {/* Tender Header Card */}
        <TenderHeader
          tender={state.tender}
          onTenderLoaded={handleTenderLoaded}
          lang={state.lang}
          summary={summary}
          totalFiles={state.files.length}
          matchedCount={Object.keys(state.matches).length}
          onToast={notify}
        />

        {/* Dedicated Action Toolbar */}
        <ActionToolbar
          onAutoMatch={handleAutoMatch}
          canAutoMatch={state.requirements.length > 0 && state.files.length > 0}
          onExportCsv={handleExportCsv}
          hasTender={Boolean(state.tender)}
          onOpenSealModal={() => setIsSealModalOpen(true)}
          hasSealConfigured={Boolean(sealSettings.imageBytes)}
          includeIndexPage={includeIndexPage}
          onToggleIndexPage={setIncludeIndexPage}
          onExportProject={handleExportProjectJson}
          onImportProject={() => projectImportInputRef.current?.click()}
          lang={state.lang}
        />

        {/* Workspace: Requirements Checklist (2fr) + Files panel (1fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Requirements List Checklist (2fr) */}
          <section
            id="requirements-checklist-panel"
            className="lg:col-span-2 flex flex-col gap-4 bg-surface border border-border rounded-lg p-5 shadow-2xs"
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
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle text-muted border border-border">
                    {formatNumber(Object.keys(state.matches).length, state.lang)}/{formatNumber(state.requirements.length, state.lang)}{' '}
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
              <div className="flex flex-col gap-2.5">
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
                      currentMatches={state.matches}
                      allFiles={state.files}
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
            className="flex flex-col gap-4 bg-surface border border-border rounded-lg p-5 shadow-2xs"
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
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-subtle text-muted border border-border">
                  {formatNumber(state.files.length, state.lang)}
                </span>
              )}
            </div>

            {/* Upload Zone */}
            <UploadZone
              currentFiles={state.files}
              requirements={state.requirements}
              matches={state.matches}
              onFilesAdded={handleFilesAdded}
              onApplyMatches={handleApplyMatches}
              onToast={notify}
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
                  const isDup = (hashCounts.get(file.hash) || 0) > 1;
                  const duplicateSiblings = state.files
                    .filter((f) => f.hash === file.hash && f.id !== file.id)
                    .map((f) => f.name);
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
        summary={summary}
        onGenerate={handleGenerateClick}
        onDownloadLastGenerated={handleDownloadLastGenerated}
        hasGeneratedPackage={hasGeneratedPackage}
        isGenerating={isGenerating}
        progress={generateProgress}
        includeIndexPage={includeIndexPage}
        onToggleIndexPage={setIncludeIndexPage}
        onOpenSealModal={() => setIsSealModalOpen(true)}
        hasSealConfigured={Boolean(sealSettings.imageBytes)}
        lang={state.lang}
      />

      {/* AI Assistant Drawer */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        tender={state.tender}
        requirements={state.requirements}
        files={state.files}
        blockers={summary.blockers}
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
