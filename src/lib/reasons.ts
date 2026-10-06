import { BlockerDetail, AppLanguage } from '../types';

export function formatBlockerReason(blocker: BlockerDetail, lang: AppLanguage): string {
  const isBn = lang === 'bn';
  const title = isBn ? blocker.titleBn || blocker.titleEn : blocker.titleEn;

  let statusLabel = '';
  let actionLabel = '';

  switch (blocker.status) {
    case 'MISSING':
      statusLabel = isBn ? 'অনুপস্থিত' : 'Missing';
      actionLabel = isBn ? 'ফাইল সংযুক্ত করুন' : 'Match a file';
      break;
    case 'EXPIRY_NEEDED':
      statusLabel = isBn ? 'মেয়াদ শেষের তারিখ প্রয়োজন' : 'Expiry date needed';
      actionLabel = isBn ? 'মেয়াদ শেষের তারিখ দিন' : 'Enter expiry date';
      break;
    case 'EXPIRED':
      statusLabel = isBn ? 'মেয়াদোত্তীর্ণ' : 'Expired';
      actionLabel = blocker.mandatory
        ? isBn
          ? 'নতুন ফাইল দিন বা তারিখ সংশোধন করুন'
          : 'Update document or correct date'
        : isBn
          ? 'ফাইল সংযোগ বাতিল করুন অথবা তারিখ ঠিক করুন'
          : 'Unmatch file or correct date';
      break;
    default:
      statusLabel = blocker.status;
      actionLabel = isBn ? 'সংশোধন করুন' : 'Resolve issue';
      break;
  }

  return `${blocker.requirementId} · ${title} · ${statusLabel} — ${actionLabel}`;
}
