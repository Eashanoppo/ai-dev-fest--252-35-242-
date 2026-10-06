import { Requirement, UploadedFile, AppLanguage } from '../types';
import { computeRequirementStatus } from './status';

/**
 * Export checklist as a RFC-4180 compliant CSV file with UTF-8 BOM
 * Columns: Document, File, Pages, Expiry, Status
 */
export function exportChecklistCsv(
  requirements: Requirement[],
  files: UploadedFile[],
  matches: Record<string, string>,
  expiryDates: Record<string, string>,
  deadline: string,
  tenderId: string,
  lang: AppLanguage = 'en'
): void {
  const fileMap = new Map<string, UploadedFile>();
  files.forEach((f) => fileMap.set(f.id, f));

  const headers = [
    lang === 'bn' ? 'ডকুমেন্ট' : 'Document',
    lang === 'bn' ? 'ফাইল নাম' : 'File Name',
    lang === 'bn' ? 'পৃষ্ঠা সংখ্যা' : 'Pages',
    lang === 'bn' ? 'মেয়াদের তারিখ' : 'Expiry Date',
    lang === 'bn' ? 'স্ট্যাটাস' : 'Status',
  ];

  const rows: string[][] = [headers];

  const sorted = [...requirements].sort((a, b) => a.order - b.order);

  sorted.forEach((req) => {
    const matchedFileId = matches[req.id];
    const file = matchedFileId ? fileMap.get(matchedFileId) : undefined;
    const expiry = expiryDates[req.id] || '';
    const status = computeRequirementStatus(req, file, expiry, deadline);

    const docTitle =
      lang === 'bn' && req.title_bn
        ? `${req.id}. ${req.title_bn}`
        : `${req.id}. ${req.title_en}`;

    const fileName = file ? file.name : (lang === 'bn' ? 'প্রদান করা হয়নি' : 'Not provided');
    const pages = file ? String(file.pageCount) : '-';
    const expDate = req.has_expiry ? (expiry || (lang === 'bn' ? 'প্রয়োজন' : 'Needed')) : '-';
    const statusText = status.status;

    rows.push([docTitle, fileName, pages, expDate, statusText]);
  });

  // Convert to CSV with escaping
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
    .join('\r\n');

  // Add UTF-8 BOM (\uFEFF) for proper Bengali character rendering in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${tenderId || 'Tender'}_Checklist.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
