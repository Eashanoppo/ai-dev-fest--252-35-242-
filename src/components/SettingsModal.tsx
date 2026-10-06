import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLanguage } from '../types';
import { t } from '../i18n';
import {
  getSavedProvider,
  saveProvider,
  getSavedApiKey,
  saveApiKey,
  getSavedModel,
  saveModel,
  AIProvider,
} from '../lib/assistant';
import { XIcon, KeyIcon, SettingsIcon, CheckIcon, AlertIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: AppLanguage;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [provider, setProvider] = useState<AIProvider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('openai/gpt-oss-20b');
  const [customModel, setCustomModel] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedProv = getSavedProvider();
      const savedM = getSavedModel();
      setProvider(savedProv);
      setApiKey(getSavedApiKey());
      setModel(savedM);
      setTestResult(null);

      const knownModels = [
        'openai/gpt-oss-20b',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'mixtral-8x7b-32768',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ];
      if (!knownModels.includes(savedM)) {
        setIsCustomModel(true);
        setCustomModel(savedM);
      }
    }
  }, [isOpen]);

  const handleProviderChange = (newProv: AIProvider) => {
    setProvider(newProv);
    if (newProv === 'groq') {
      setModel('openai/gpt-oss-20b');
    } else {
      setModel('gemini-2.0-flash');
    }
    setIsCustomModel(false);
  };

  const handleSave = () => {
    const finalModel = isCustomModel ? customModel.trim() || model : model;
    saveProvider(provider);
    saveApiKey(apiKey);
    saveModel(finalModel);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: lang === 'bn' ? 'অনুগ্রহ করে এপিআই কি লিখুন' : 'Please enter an API key',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const activeModel = isCustomModel ? customModel.trim() || model : model;

    try {
      if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: activeModel,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 10,
          }),
        });

        if (res.ok) {
          setTestResult({
            success: true,
            message: t('settings_test_success', undefined, lang),
          });
        } else {
          const errData = await res.json().catch(() => null);
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          setTestResult({
            success: false,
            message: t('settings_test_failed', { message: errMsg }, lang),
          });
        }
      } else {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          activeModel
        )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with OK' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        });

        if (res.ok) {
          setTestResult({
            success: true,
            message: t('settings_test_success', undefined, lang),
          });
        } else {
          const errData = await res.json().catch(() => null);
          const errMsg = errData?.error?.message || `HTTP ${res.status}`;
          setTestResult({
            success: false,
            message: t('settings_test_failed', { message: errMsg }, lang),
          });
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Network error';
      setTestResult({
        success: false,
        message: t('settings_test_failed', { message: errMsg }, lang),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="settings-modal-backdrop"
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
              <div className="flex items-center gap-2">
                <SettingsIcon size={18} className="text-accent-steel" />
                <h3 className="text-sm font-semibold text-primary">
                  {t('settings_title', undefined, lang)}
                </h3>
              </div>
              <button
                type="button"
                id="close-settings-modal-btn"
                onClick={onClose}
                className="text-muted hover:text-primary transition-colors cursor-pointer p-1"
                aria-label="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">
                  {t('settings_provider', undefined, lang)}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProviderChange('groq')}
                    className={`py-2 px-3 rounded border text-xs font-medium transition-colors cursor-pointer text-center ${
                      provider === 'groq'
                        ? 'border-accent-steel bg-accent-steel text-white shadow-xs'
                        : 'border-border bg-subtle text-muted hover:text-primary'
                    }`}
                  >
                    Groq Cloud (Selected)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderChange('gemini')}
                    className={`py-2 px-3 rounded border text-xs font-medium transition-colors cursor-pointer text-center ${
                      provider === 'gemini'
                        ? 'border-accent-steel bg-accent-steel text-white shadow-xs'
                        : 'border-border bg-subtle text-muted hover:text-primary'
                    }`}
                  >
                    Google Gemini
                  </button>
                </div>
              </div>

              {/* Model */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-muted">
                    {t('settings_model', undefined, lang)}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomModel((p) => !p)}
                    className="text-[10px] text-accent-steel hover:underline cursor-pointer"
                  >
                    {isCustomModel ? 'Pick Preset Model' : 'Custom Model Name'}
                  </button>
                </div>

                {isCustomModel ? (
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="e.g. openai/gpt-oss-20b or open-ai/gpt-oss-20b"
                    className="w-full py-2 px-3 rounded border border-border bg-subtle text-primary font-mono focus:outline-hidden focus:ring-1 focus:ring-accent-steel"
                  />
                ) : (
                  <select
                    id="settings-model-select"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full py-2 px-3 rounded border border-border bg-subtle text-primary font-mono focus:outline-hidden focus:ring-1 focus:ring-accent-steel cursor-pointer"
                  >
                    {provider === 'groq' ? (
                      <>
                        <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Your Model)</option>
                        <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Fast)</option>
                        <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Lightweight)</option>
                        <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                      </>
                    ) : (
                      <>
                        <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">
                  {provider === 'groq' ? 'Groq API Key' : 'Gemini API Key'}
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    id="settings-api-key-input"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      provider === 'groq'
                        ? 'Paste Groq key (starts with gsk_)...'
                        : t('settings_api_key_placeholder', undefined, lang)
                    }
                    className="w-full py-2 pl-3 pr-16 rounded border border-border bg-subtle text-primary font-mono focus:outline-hidden focus:ring-1 focus:ring-accent-steel"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((prev) => !prev)}
                    className="absolute right-2 top-2 text-[10px] text-muted hover:text-primary transition-colors cursor-pointer px-1 py-0.5 rounded border border-border bg-surface"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-muted mt-1.5 leading-relaxed">
                  {t('settings_storage_note', undefined, lang)}
                </p>
              </div>

              {/* Test Connection Message */}
              {testResult && (
                <div
                  className={`flex items-start gap-2 p-2.5 rounded border text-[11px] leading-relaxed ${
                    testResult.success
                      ? 'border-[#3E7A52]/30 bg-[#E7F0EA]/50 text-[#3E7A52] dark:text-[#7FB793] dark:bg-[#182019]/50'
                      : 'border-[#A63D40]/30 bg-[#F6E9E9]/50 text-[#A63D40] dark:text-[#D98A8C] dark:bg-[#271617]/50'
                  }`}
                >
                  {testResult.success ? (
                    <CheckIcon size={14} className="shrink-0 mt-0.5" />
                  ) : (
                    <AlertIcon size={14} className="shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                type="button"
                id="settings-test-connection-btn"
                onClick={handleTestConnection}
                disabled={isTesting || !apiKey.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-subtle text-muted hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                <KeyIcon size={13} />
                <span>
                  {isTesting
                    ? lang === 'bn'
                      ? 'যাচাই হচ্ছে...'
                      : 'Testing...'
                    : t('btn_test', undefined, lang)}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="settings-cancel-btn"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded border border-border text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  {t('btn_cancel', undefined, lang)}
                </button>
                <button
                  type="button"
                  id="settings-save-btn"
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded bg-primary text-surface font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {t('btn_save', undefined, lang)}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
