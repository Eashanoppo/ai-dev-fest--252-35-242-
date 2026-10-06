import React from 'react';
import { RequirementStatusType, AppLanguage } from '../types';
import { t } from '../i18n';

interface StatusBadgeProps {
  status: RequirementStatusType;
  lang: AppLanguage;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, lang, size = 'md' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'OK':
        return {
          label: t('status_ok', undefined, lang),
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          badgeBg: 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40',
        };
      case 'EXPIRY_NEEDED':
        return {
          label: t('status_expiry_needed', undefined, lang),
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-800 dark:text-amber-400',
          badgeBg: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40',
        };
      case 'EXPIRED':
        return {
          label: t('status_expired', undefined, lang),
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700 dark:text-rose-400',
          badgeBg: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40',
        };
      case 'MISSING':
        return {
          label: t('status_missing', undefined, lang),
          dotColor: 'bg-rose-500',
          textColor: 'text-rose-700 dark:text-rose-400',
          badgeBg: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40',
        };
      case 'NOT_PROVIDED':
      default:
        return {
          label: t('status_not_provided', undefined, lang),
          dotColor: 'bg-neutral-400 dark:bg-neutral-500',
          textColor: 'text-neutral-600 dark:text-neutral-400',
          badgeBg: 'bg-neutral-100/70 dark:bg-neutral-800/40 border-neutral-200/60 dark:border-neutral-700/40',
        };
    }
  };

  const { label, dotColor, textColor, badgeBg } = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border tracking-normal transition-colors select-none ${
        size === 'sm' ? 'text-[11px] py-0.5 px-2' : 'text-xs py-1 px-2.5'
      } ${badgeBg} ${textColor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span className="truncate">{label}</span>
    </span>
  );
};
