import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastMessage, ToastType, AppLanguage } from '../types';
import { CheckIcon, AlertIcon, XIcon } from './icons';

interface ToastContextValue {
  showToast: (messageEn: string, messageBn: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  lang: AppLanguage;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, lang }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (messageEn: string, messageBn: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastMessage = { id, type, messageEn, messageBn };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        id="toast-container"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const message = lang === 'bn' ? toast.messageBn : toast.messageEn;
            const getIcon = () => {
              switch (toast.type) {
                case 'success':
                  return <CheckIcon className="text-[#3E7A52] dark:text-[#7FB793]" size={18} />;
                case 'error':
                  return <AlertIcon className="text-[#A63D40] dark:text-[#D98A8C]" size={18} />;
                case 'warning':
                  return <AlertIcon className="text-[#96682B] dark:text-[#D9B36C]" size={18} />;
                case 'info':
                default:
                  return <AlertIcon className="text-muted" size={18} />;
              }
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto flex items-start gap-3 p-3.5 rounded border border-border bg-surface text-primary shadow-sm"
              >
                <div className="shrink-0 mt-0.5">{getIcon()}</div>
                <div className="flex-1 text-xs font-normal leading-relaxed">{message}</div>
                <button
                  type="button"
                  id={`toast-close-${toast.id}`}
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 text-muted hover:text-primary transition-colors p-0.5 rounded cursor-pointer"
                  aria-label="Dismiss toast"
                >
                  <XIcon size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
