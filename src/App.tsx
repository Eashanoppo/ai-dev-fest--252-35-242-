import { useState, useMemo } from 'react';
import { useStore } from './store';
import { t, formatNumber } from './i18n';
import { TopBar } from './components/TopBar';
import { TenderHeader } from './components/TenderHeader';
import { UploadZone } from './components/UploadZone';
import { FileRow } from './components/FileRow';
import { EmptyState } from './components/EmptyState';
import { UploadedFile, RequirementsPayload } from './types';
import { removeFileBuffer } from './lib/pdf';
import { isFileDuplicate, getSiblingDuplicateNames } from './lib/match';
import { FileIcon } from './components/icons';

export default function App() {
  const { state, dispatch } = useStore();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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

  // Map of matched requirements for files
  const fileToRequirementMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(state.matches).forEach(([reqId, fileId]) => {
      map.set(fileId, reqId);
    });
    return map;
  }, [state.matches]);

  const matchedCount = Object.keys(state.matches).length;

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

      <main className="flex-1 max-w-[1280px] w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
        {/* Tender Header Card */}
        <TenderHeader
          tender={state.tender}
          onTenderLoaded={handleTenderLoaded}
          lang={state.lang}
          totalFiles={state.files.length}
          matchedCount={matchedCount}
          totalRequirements={state.requirements.length}
        />

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
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-subtle text-muted border border-border">
                  {formatNumber(state.requirements.length, state.lang)}{' '}
                  {state.lang === 'bn' ? 'নথি' : 'items'}
                </span>
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
                {state.requirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded border border-border bg-surface flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-muted text-xs">
                        {String(req.order).padStart(2, '0')}
                      </span>
                      <div>
                        <span className="font-medium text-primary">
                          {state.lang === 'bn' && req.title_bn ? req.title_bn : req.title_en}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted">
                          <span>{req.mandatory ? t('tag_mandatory', undefined, state.lang) : t('tag_optional', undefined, state.lang)}</span>
                          {req.has_expiry && <span>· {t('expiry_date_label', undefined, state.lang)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
    </div>
  );
}
