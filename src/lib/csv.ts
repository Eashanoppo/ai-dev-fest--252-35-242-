import { Requirement, UploadedFile, AppLanguage } from '../types';
import { resolveMatchedFile, computeRequirementStatus } from './status';

/**
 * Escapes CSV values and neutralizes Excel formula injection (=, +, -, @)
 */
function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  let str = String(val).trim();

  // Protect against formula injection in Excel/Sheets
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Double up any quotes
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildChecklistCsv(
  requirements: Requirement[],
  files: UploadedFile[],
  matches: Record<string, string>,
  expiryDates: Record<string, string>,
  deadline: string,
  lang: AppLanguage = 'en'
): string {
  const isBn = lang === 'bn';

  const headers = isBn
    ? ['ক্রম', 'আইডি', 'নথির নাম', 'বাধ্যতামূলক', 'সংযুক্ত ফাইল', 'পৃষ্ঠা সংখ্যা', 'মেয়াদ শেষের তারিখ', 'অবস্থা']
    : ['Order', 'ID', 'Document Title', 'Mandatory', 'Matched File', 'Pages', 'Expiry Date', 'Status'];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  for (const req of requirements) {
    const file = resolveMatchedFile(req.id, files, matches);
    const expiry = expiryDates[req.id] || '';
    const computed = computeRequirementStatus(req, file, expiry, deadline);

    const title = isBn ? req.title_bn || req.title_en : req.title_en;
    const mandatoryStr = req.mandatory
      ? isBn ? 'হ্যাঁ' : 'Yes'
      : isBn ? 'না' : 'No';

    const fileName = file ? file.name : (isBn ? 'সংযুক্ত করা হয়নি' : 'Not attached');
    const pages = file ? file.pageCount : 0;
    const expiryDisplay = req.has_expiry
      ? expiry || (isBn ? 'প্রয়োজন' : 'Needed')
      : (isBn ? 'প্রযোজ্য নয়' : 'N/A');

    let statusDisplay: string = computed.status;
    if (isBn) {
      switch (computed.status) {
        case 'OK':
          statusDisplay = 'ঠিক আছে';
          break;
        case 'MISSING':
          statusDisplay = 'অনুপস্থিত';
          break;
        case 'EXPIRY_NEEDED':
          statusDisplay = 'মেয়াদ শেষের তারিখ প্রয়োজন';
          break;
        case 'EXPIRED':
          statusDisplay = 'মেয়াদোত্তীর্ণ';
          break;
        case 'NOT_PROVIDED':
          statusDisplay = 'প্রদান করা হয়নি';
          break;
      }
    }

    const row = [
      escapeCsvCell(req.order),
      escapeCsvCell(req.id),
      escapeCsvCell(title),
      escapeCsvCell(mandatoryStr),
      escapeCsvCell(fileName),
      escapeCsvCell(pages),
      escapeCsvCell(expiryDisplay),
      escapeCsvCell(statusDisplay),
    ];

    rows.push(row.join(','));
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8/Bangla properly without encoding corruption
  return '\uFEFF' + rows.join('\r\n');
}
