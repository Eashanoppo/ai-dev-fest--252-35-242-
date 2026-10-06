import React from 'react';
import { RequirementStatusType, AppLanguage } from '../types';
import { t } from '../i18n';
import { CheckIcon, AlertIcon, ClockIcon } from './icons';

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
          icon: <CheckIcon size={size === 'sm' ? 14 : 16} />,
          className:
            'bg-[#E7F0EA] text-[#3E7A52] dark:bg-[#182019] dark:text-[#7FB793] border border-[#3E7A52]/20 dark:border-[#7FB793]/30',
        };
      case 'EXPIRY_NEEDED':
        return {
          label: t('status_expiry_needed', undefined, lang),
          icon: <ClockIcon size={size === 'sm' ? 14 : 16} />,
          className:
            'bg-[#F2EBDC] text-[#96682B] dark:bg-[#241D10] dark:text-[#D9B36C] border border-[#96682B]/20 dark:border-[#D9B36C]/30',
        };
      case 'EXPIRED':
        return {
          label: t('status_expired', undefined, lang),
          icon: <AlertIcon size={size === 'sm' ? 14 : 16} />,
          className:
            'bg-[#F6E9E9] text-[#A63D40] dark:bg-[#271617] dark:text-[#D98A8C] border border-[#A63D40]/20 dark:border-[#D98A8C]/30',
        };
      case 'MISSING':
        return {
          label: t('status_missing', undefined, lang),
          icon: <AlertIcon size={size === 'sm' ? 14 : 16} />,
          className:
            'bg-[#F6E9E9] text-[#A63D40] dark:bg-[#271617] dark:text-[#D98A8C] border border-[#A63D40]/20 dark:border-[#D98A8C]/30',
        };
      case 'NOT_PROVIDED':
      default:
        return {
          label: t('status_not_provided', undefined, lang),
          icon: null,
          className:
            'bg-[#EFEFEF] text-[#6E6E70] dark:bg-[#1B1B1B] dark:text-[#9A9A9E] border border-black/10 dark:border-white/10',
        };
    }
  };

  const { label, icon, className } = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded px-2.5 py-0.5 tracking-tight transition-colors ${
        size === 'sm' ? 'text-xs py-0.5 px-2' : 'text-xs'
      } ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
