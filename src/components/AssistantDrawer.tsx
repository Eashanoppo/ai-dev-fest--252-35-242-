import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tender,
  StatusSummary,
  AppLanguage,
  AssistantMessage,
} from '../types';
import { t } from '../i18n';
import {
  getSavedApiKey,
  queryAssistant,
} from '../lib/assistant';
import { tts } from '../lib/tts';
import {
  BotIcon,
  XIcon,
  SendIcon,
  SettingsIcon,
  SpeakerIcon,
  StopIcon,
} from './icons';

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tender: Tender | null;
  statusSummary: StatusSummary;
  lang: AppLanguage;
  onOpenSettings: () => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  tender,
  statusSummary,
  lang,
  onOpenSettings,
}) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      contentEn:
        'Hello! I am your AI Tender Compliance Assistant. I can review your document checklist, identify missing/expired files, and check submission readiness.',
      contentBn:
        'স্বাগতম! আমি আপনার টেন্ডার এআই সহকারী। আমি আপনার নথিপত্রের তালিকা যাচাই করতে, মেয়াদোত্তীর্ণ বা অনুপস্থিত ফাইল শনাক্ত করতে এবং প্রস্তুত হতে সহায়তা করতে পারি।',
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [replyTabs, setReplyTabs] = useState<Record<string, 'en' | 'bn'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to TTS status changes
  useEffect(() => {
    const unsubscribe = tts.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      tts.stop();
    };
  }, []);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const hasApiKey = Boolean(getSavedApiKey());

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    if (!hasApiKey) {
      onOpenSettings();
      return;
    }

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      contentEn: trimmed,
      contentBn: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await queryAssistant(trimmed, tender, statusSummary);
      const assistantMsg: AssistantMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        contentEn: response.en,
        contentBn: response.bn,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown assistant error';
      const errorMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        contentEn: `Error: ${errMsg}. Please verify your API key in settings.`,
        contentBn: `সমস্যা: ${errMsg}। অনুগ্রহ করে সেটিংসে আপনার এপিআই কি যাচাই করুন।`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      tts.stop();
    } else {
      tts.speak(text);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            id="assistant-backdrop"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs select-none"
          />

          {/* Right Drawer: 400px wide, Dark #0A0A0A in BOTH themes */}
          <motion.aside
            id="assistant-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-[#0A0A0A] text-[#E5E5E5] border-l border-white/10 shadow-2xl flex flex-col select-none"
          >
            {/* Header */}
            <div className="h-[60px] px-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-white/5 border border-white/10 text-accent-steel">
                  <BotIcon size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-tight text-white">
                    {t('assistant_title', undefined, lang)}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasApiKey ? 'bg-[#7FB793]' : 'bg-[#D9B36C]'
                      }`}
                    />
                    <span className="text-[10px] text-white/50">
                      {hasApiKey
                        ? t('assistant_status_configured', undefined, lang)
                        : t('assistant_status_no_key', undefined, lang)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="assistant-settings-btn"
                  onClick={onOpenSettings}
                  className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title={t('btn_settings', undefined, lang)}
                  aria-label={t('btn_settings', undefined, lang)}
                >
                  <SettingsIcon size={16} />
                </button>
                <button
                  type="button"
                  id="close-assistant-drawer-btn"
                  onClick={onClose}
                  className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Close Assistant"
                >
                  <XIcon size={16} />
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 text-xs">
              {messages.map((msg) => {
                const activeTab = replyTabs[msg.id] || (lang === 'bn' ? 'bn' : 'en');
                const content = activeTab === 'bn' ? msg.contentBn : msg.contentEn;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#1F1F1F] text-white border border-white/10'
                          : 'bg-[#141414] text-[#E5E5E5] border border-white/10'
                      }`}
                    >
                      {/* Language Tab Switcher for Assistant replies */}
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px]">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setReplyTabs((prev) => ({ ...prev, [msg.id]: 'en' }))
                              }
                              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                                activeTab === 'en'
                                  ? 'bg-accent-steel text-white'
                                  : 'text-white/40 hover:text-white'
                              }`}
                            >
                              EN
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setReplyTabs((prev) => ({ ...prev, [msg.id]: 'bn' }))
                              }
                              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer font-bangla ${
                                activeTab === 'bn'
                                  ? 'bg-accent-steel text-white'
                                  : 'text-white/40 hover:text-white'
                              }`}
                            >
                              বাং
                            </button>
                          </div>

                          {/* TTS Play/Stop Button with 4-Bar Equalizer */}
                          <button
                            type="button"
                            onClick={() => handleSpeak(msg.contentEn)}
                            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white transition-colors cursor-pointer px-1 py-0.5 rounded"
                            title={isSpeaking ? 'Stop voice' : 'Listen in English'}
                          >
                            {isSpeaking ? (
                              <>
                                <StopIcon size={12} className="text-[#D98A8C]" />
                                {/* 4-Bar Equalizer Animation */}
                                <div className="flex items-end gap-0.5 h-3 px-0.5">
                                  <span className="w-0.5 bg-accent-steel animate-pulse h-2.5" />
                                  <span className="w-0.5 bg-accent-steel animate-pulse h-3 delay-75" />
                                  <span className="w-0.5 bg-accent-steel animate-pulse h-1.5 delay-150" />
                                  <span className="w-0.5 bg-accent-steel animate-pulse h-2 delay-200" />
                                </div>
                              </>
                            ) : (
                              <>
                                <SpeakerIcon size={12} />
                                <span className="text-[10px]">Listen</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">{content}</div>
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-white/50 text-[11px] p-2 bg-[#141414] rounded border border-white/10 w-fit">
                  <span className="w-2 h-2 rounded-full bg-accent-steel animate-ping" />
                  <span>
                    {lang === 'bn'
                      ? 'এআই বিশ্লেষণ করছে...'
                      : 'Analyzing tender requirements...'}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-3 border-t border-white/10 bg-[#0E0E0E]">
              {!hasApiKey ? (
                <div className="flex flex-col gap-2 p-2.5 rounded bg-white/5 border border-white/10 text-center">
                  <p className="text-[11px] text-white/70">
                    {t('assistant_key_prompt', undefined, lang)}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="self-center px-3 py-1 rounded bg-accent-steel text-white text-xs font-medium cursor-pointer"
                  >
                    {t('btn_settings', undefined, lang)}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="assistant-query-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('assistant_input_placeholder', undefined, lang)}
                    className="flex-1 py-2 px-3 rounded border border-white/10 bg-[#161616] text-white text-xs placeholder:text-white/30 focus:outline-hidden focus:border-accent-steel"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    id="assistant-send-btn"
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                    className="p-2 rounded bg-white text-black hover:bg-white/90 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Send"
                  >
                    <SendIcon size={15} />
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
