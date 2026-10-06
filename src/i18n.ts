/**
 * Complete Internationalization (i18n) Engine for TenderPack
 * Fully bilingual (EN / BN) with Intl-based number and date formatters.
 */

import { AppLanguage } from './types';

export const translations = {
  en: {
    // TopBar & Brand
    app_name: 'TENDERPACK',
    app_subtitle: 'Tender Document Package Builder',
    tender_chip: 'Tender {id}',
    no_tender_loaded: 'No tender loaded',
    toggle_theme_dark: 'Switch to Dark Mode',
    toggle_theme_light: 'Switch to Light Mode',
    ai_assistant: 'AI Assistant',

    // Core Statuses (Mandatory exact strings)
    status_ok: 'OK',
    status_missing: 'Missing',
    status_expiry_needed: 'Expiry date needed',
    status_expired: 'Expired',
    status_not_provided: 'Not provided',

    // Tags & Labels
    tag_mandatory: 'Mandatory',
    tag_optional: 'Optional',
    tag_duplicate: 'Duplicate',
    tag_unreadable: 'Unreadable or protected',
    pages_chip: '{count} {plural}',
    page_singular: 'page',
    page_plural: 'pages',

    // Actions & Buttons
    btn_upload: 'Upload',
    btn_generate: 'Generate package',
    btn_download: 'Download',
    btn_remove: 'Remove',
    btn_unmatch: 'Unmatch',
    btn_automatch: 'Auto-match',
    btn_export_csv: 'Export CSV',
    btn_settings: 'Settings',
    btn_close: 'Close',
    btn_cancel: 'Cancel',
    btn_save: 'Save',
    btn_test: 'Test Connection',
    btn_send: 'Send',
    btn_stop_speaking: 'Stop Voice',
    btn_speak: 'Read Aloud',
    btn_choose_files: 'Select PDFs',
    btn_load_json: 'Load requirements.json',

    // Header & Meta Card
    tender_id_label: 'Tender ID',
    procuring_entity_label: 'Procuring Entity',
    bidder_label: 'Bidder',
    deadline_label: 'Submission Deadline',
    package_date_label: 'Date Created',
    status_progress_load: 'Load Tender',
    status_progress_upload: 'Upload Files',
    status_progress_match: 'Match Documents',
    status_progress_verify: 'Verify & Export',

    // Statistics
    stat_total_docs: 'Total Required',
    stat_ready: 'Ready (OK)',
    stat_blocking: 'Blocking Issues',
    stat_optional_skipped: 'Optional Skipped',

    // Workspaces
    sec_requirements: 'Document Checklist',
    sec_requirements_sub: 'Map uploaded PDF documents to corresponding requirements in designated order',
    sec_files: 'Uploaded Files',
    sec_files_sub: 'Up to 30 PDF files, maximum 50MB total',

    // Upload Zone
    upload_drop_zone_title: 'Drag and drop PDF files here',
    upload_drop_zone_sub: 'or click to browse from device (PDF files only, ≤50MB total)',
    upload_limit_info: '{currentFiles}/30 files · {currentSizeMB}MB/50MB',
    upload_json_title: 'Load Requirements Schema',
    upload_json_sub: 'Drop requirements.json or select file to initialize checklist',

    // Combobox & Inputs
    select_file_placeholder: 'Select matched file...',
    expiry_date_placeholder: 'Expiry date (YYYY-MM-DD)',
    expiry_date_label: 'Validity Expiry Date',

    // Generate Bar
    gen_ready_title: 'All requirements verified',
    gen_ready_desc: 'Document package is ready to be compiled into a single PDF.',
    gen_blocked_title: '{count} blocking {plural} must be resolved',
    gen_issue_singular: 'issue',
    gen_issue_plural: 'issues',
    gen_view_reasons: 'View Details',
    gen_hide_reasons: 'Hide Details',
    gen_reason_format: '{order} · {title} · {status} — {action}',
    gen_action_match: 'Match a document',
    gen_action_expiry: 'Enter validity expiry date',
    gen_action_renew: 'Replace with valid document or unmatch',

    // Toasts & Alerts
    toast_non_pdf_rejected: '"{name}" is not a valid PDF file. Magic header "%PDF" was not found.',
    toast_duplicate_blocked: 'Duplicate file "{name}" cannot be matched to different requirements.',
    toast_file_unreadable: '"{name}" could not be parsed or is password-protected.',
    toast_limit_exceeded: 'File limit reached: Maximum 30 files and 50MB allowed.',
    toast_tender_loaded: 'Tender "{id}" loaded with {count} requirements.',
    toast_invalid_json: 'Invalid requirements.json format. Please provide a compliant JSON file.',
    toast_automatch_applied: 'Auto-matched {count} documents. Please review suggestions.',
    toast_pdf_generating: 'Generating submission package PDF...',
    toast_pdf_success: 'Package PDF generated successfully!',
    toast_pdf_error: 'Failed to generate package PDF: {error}',
    toast_csv_exported: 'Checklist exported to CSV.',

    // Empty States
    empty_no_tender_title: 'No Tender Loaded',
    empty_no_tender_desc: 'Upload a valid requirements.json file to view required tender documentation.',
    empty_no_files_title: 'No Files Uploaded',
    empty_no_files_desc: 'Drag & drop your PDF documents to begin matching and verification.',

    // AI Assistant
    assistant_title: 'Tender Assistant',
    assistant_status_configured: 'Ready (Connected)',
    assistant_status_no_key: 'No API Key',
    assistant_welcome: 'Hello! I can analyze your tender submission status, check deadlines, and provide checklist advice.',
    assistant_input_placeholder: 'Ask about submission readiness...',
    assistant_disclaimer: 'Your API key is stored locally in this browser only and never transmitted elsewhere.',
    assistant_key_prompt: 'Please configure your Gemini API Key in Settings to enable the AI assistant.',
    assistant_tab_en: 'English',
    assistant_tab_bn: 'বাংলা',

    // Settings Modal
    settings_title: 'Assistant Configuration',
    settings_provider: 'AI Provider',
    settings_model: 'Model',
    settings_api_key: 'Gemini API Key',
    settings_api_key_placeholder: 'Paste your Gemini API key here...',
    settings_storage_note: 'Note: The key remains securely stored in this browser only (localStorage).',
    settings_saved: 'Settings saved successfully.',
    settings_test_success: 'Connection verified successfully!',
    settings_test_failed: 'Connection failed: {message}',

    // Bonus features
    btn_include_index: 'Include Index Page',
    btn_project_export: 'Backup Project',
    btn_project_import: 'Restore Project',
    seal_heading: 'Digital Seal / Signature',
    seal_upload_btn: 'Upload Seal (PNG)',
    seal_position: 'Position',
    seal_all_pages: 'All Pages',
    seal_first_page: 'First Page Only',
    seal_last_page: 'Last Page Only',
  },

  bn: {
    // TopBar & Brand
    app_name: 'টেন্ডারপ্যাক',
    app_subtitle: 'টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার',
    tender_chip: 'টেন্ডার {id}',
    no_tender_loaded: 'কোনো টেন্ডার লোড করা হয়নি',
    toggle_theme_dark: 'ডার্ক মোড চালু করুন',
    toggle_theme_light: 'লাইট মোড চালু করুন',
    ai_assistant: 'এআই সহকারী',

    // Core Statuses (Mandatory exact strings)
    status_ok: 'ঠিক আছে',
    status_missing: 'অনুপস্থিত',
    status_expiry_needed: 'মেয়াদ শেষের তারিখ প্রয়োজন',
    status_expired: 'মেয়াদোত্তীর্ণ',
    status_not_provided: 'প্রদান করা হয়নি',

    // Tags & Labels
    tag_mandatory: 'আবশ্যক',
    tag_optional: 'ঐচ্ছিক',
    tag_duplicate: 'ডুপ্লিকেট',
    tag_unreadable: 'অপঠনযোগ্য বা সুরক্ষিত',
    pages_chip: '{count} {plural}',
    page_singular: 'পৃষ্ঠা',
    page_plural: 'পৃষ্ঠা',

    // Actions & Buttons
    btn_upload: 'আপলোড করুন',
    btn_generate: 'প্যাকেজ তৈরি করুন',
    btn_download: 'ডাউনলোড',
    btn_remove: 'সরান',
    btn_unmatch: 'ম্যাচ বাতিল করুন',
    btn_automatch: 'স্বয়ংক্রিয় ম্যাচ',
    btn_export_csv: 'সিএসভি এক্সপোর্ট',
    btn_settings: 'সেটিংস',
    btn_close: 'বন্ধ করুন',
    btn_cancel: 'বাতিল',
    btn_save: 'সংরক্ষণ করুন',
    btn_test: 'সংযোগ পরীক্ষা',
    btn_send: 'পাঠান',
    btn_stop_speaking: 'ভয়েস বন্ধ করুন',
    btn_speak: 'পড়ে শুনুন',
    btn_choose_files: 'পিডিএফ নির্বাচন করুন',
    btn_load_json: 'requirements.json লোড করুন',

    // Header & Meta Card
    tender_id_label: 'টেন্ডার আইডি',
    procuring_entity_label: 'ক্রয়কারী কর্তৃপক্ষ',
    bidder_label: 'দরদাতা প্রতিষ্ঠান',
    deadline_label: 'জমা দেওয়ার শেষ সময়',
    package_date_label: 'প্যাকেজ তৈরির তারিখ',
    status_progress_load: 'টেন্ডার লোড',
    status_progress_upload: 'ফাইল আপলোড',
    status_progress_match: 'ডকুমেন্ট ম্যাচ',
    status_progress_verify: 'যাচাই ও এক্সপোর্ট',

    // Statistics
    stat_total_docs: 'মোট আবশ্যক ডকুমেন্ট',
    stat_ready: 'প্রস্তুত (ঠিক আছে)',
    stat_blocking: 'বাধা সৃষ্টিকারী সমস্যা',
    stat_optional_skipped: 'বাদ দেওয়া ঐচ্ছিক',

    // Workspaces
    sec_requirements: 'ডকুমেন্ট চেকলিস্ট',
    sec_requirements_sub: 'নির্দিষ্ট ক্রম অনুযায়ী আপলোড করা পিডিএফ ফাইলগুলো প্রয়োজনীয় নথির সাথে ম্যাচ করুন',
    sec_files: 'আপলোডকৃত ফাইলসমূহ',
    sec_files_sub: 'সর্বোচ্চ ৩০টি ফাইল, মোট আকার অনধিক ৫০ মেগাবাইট',

    // Upload Zone
    upload_drop_zone_title: 'পিডিএফ ফাইলগুলো এখানে টেনে আনুন',
    upload_drop_zone_sub: 'অথবা ডিভাইস থেকে ফাইল ব্রাউজ করুন (শুধুমাত্র পিডিএফ, মোট ≤৫০ মেগাবাইট)',
    upload_limit_info: '{currentFiles}/৩০টি ফাইল · {currentSizeMB} মেগাবাইট/৫০ মেগাবাইট',
    upload_json_title: 'রিকোয়ারমেন্ট স্কিমা লোড করুন',
    upload_json_sub: 'চেকলিস্ট শুরু করতে requirements.json ফাইলটি এখানে ড্রপ করুন বা নির্বাচন করুন',

    // Combobox & Inputs
    select_file_placeholder: 'সংযুক্ত ফাইল নির্বাচন করুন...',
    expiry_date_placeholder: 'মেয়াদের তারিখ (YYYY-MM-DD)',
    expiry_date_label: 'বৈধতার মেয়াদ শেষের তারিখ',

    // Generate Bar
    gen_ready_title: 'সব রিকোয়ারমেন্ট যাচাই সম্পন্ন হয়েছে',
    gen_ready_desc: 'ডকুমেন্ট প্যাকেজটি একটি একক পিডিএফ হিসেবে তৈরি করার জন্য প্রস্তুত।',
    gen_blocked_title: '{count}টি সমস্যা সমাধান করা আবশ্যক',
    gen_issue_singular: 'সমস্যা',
    gen_issue_plural: 'সমস্যা',
    gen_view_reasons: 'বিস্তারিত দেখুন',
    gen_hide_reasons: 'লুকান',
    gen_reason_format: '{order} · {title} · {status} — {action}',
    gen_action_match: 'একটি ফাইল সংযুক্ত করুন',
    gen_action_expiry: 'বৈধতার মেয়াদ শেষের তারিখ দিন',
    gen_action_renew: 'বৈধ ডকুমেন্ট দিন অথবা ম্যাচ বাতিল করুন',

    // Toasts & Alerts
    toast_non_pdf_rejected: '"{name}" কোনো বৈধ পিডিএফ ফাইল নয়। হেডার "%PDF" পাওয়া যায়নি।',
    toast_duplicate_blocked: 'ডুপ্লিকেট ফাইল "{name}" একাধিক ভিন্ন ডকুমেন্টে সংযুক্ত করা যাবে না।',
    toast_file_unreadable: '"{name}" ফাইলটি পড়া সম্ভব হয়নি অথবা পাসওয়ার্ড দিয়ে সুরক্ষিত।',
    toast_limit_exceeded: 'ফাইলের সীমা অতিক্রম হয়েছে: সর্বোচ্চ ৩০টি ফাইল এবং মোট ৫০ মেগাবাইট অনুমোদিত।',
    toast_tender_loaded: 'টেন্ডার "{id}" সফলভাবে {count}টি রিকোয়ারমেন্টসহ লোড করা হয়েছে।',
    toast_invalid_json: 'requirements.json এর ফরম্যাট সঠিক নয়। অনুগ্রহ করে সঠিক ফাইল প্রদান করুন।',
    toast_automatch_applied: '{count}টি ডকুমেন্ট স্বয়ংক্রিয়ভাবে ম্যাচ করা হয়েছে। অনুগ্রহ করে যাচাই করুন।',
    toast_pdf_generating: 'সাবমিশন প্যাকেজ পিডিএফ তৈরি করা হচ্ছে...',
    toast_pdf_success: 'প্যাকেজ পিডিএফ সফলভাবে তৈরি হয়েছে!',
    toast_pdf_error: 'পিডিএফ তৈরি করতে ব্যর্থ হয়েছে: {error}',
    toast_csv_exported: 'চেকলিস্ট সিএসভিতে এক্সপোর্ট করা হয়েছে।',

    // Empty States
    empty_no_tender_title: 'কোনো টেন্ডার লোড করা হয়নি',
    empty_no_tender_desc: 'টেন্ডার নথির তালিকা দেখতে একটি বৈধ requirements.json ফাইল লোড করুন।',
    empty_no_files_title: 'কোনো ফাইল আপলোড করা হয়নি',
    empty_no_files_desc: 'ম্যাচ ও যাচাই শুরু করতে আপনার পিডিএফ ফাইলগুলো টেনে আনুন।',

    // AI Assistant
    assistant_title: 'টেন্ডার এআই সহকারী',
    assistant_status_configured: 'প্রস্তুত (সংযুক্ত)',
    assistant_status_no_key: 'এপিআই কি নেই',
    assistant_welcome: 'স্বাগতম! আমি আপনার টেন্ডার সাবমিশনের বর্তমান অবস্থা বিশ্লেষণ করতে এবং প্রস্তুতিতে সহায়তা করতে পারি।',
    assistant_input_placeholder: 'সাবমিশন প্রস্তুতি সম্পর্কে জিজ্ঞাসা করুন...',
    assistant_disclaimer: 'আপনার এপিআই কি নিরাপদে এই ব্রাউজারে সংরক্ষিত থাকে এবং কোথাও পাঠানো হয় না।',
    assistant_key_prompt: 'এআই সহকারী সক্রিয় করতে সেটিংসে আপনার জেমিনি এপিআই কি যোগ করুন।',
    assistant_tab_en: 'English',
    assistant_tab_bn: 'বাংলা',

    // Settings Modal
    settings_title: 'সহকারী কনফিগারেশন',
    settings_provider: 'এআই প্রোভাইডার',
    settings_model: 'মডেল',
    settings_api_key: 'জেমিনি এপিআই কি',
    settings_api_key_placeholder: 'এখানে জেমিনি এপিআই কি পেস্ট করুন...',
    settings_storage_note: 'মনে রাখবেন: কি-টি শুধুমাত্র আপনার ব্রাউজারের লোকাল স্টোরেজে নিরাপদে সংরক্ষিত থাকবে।',
    settings_saved: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে।',
    settings_test_success: 'সংযোগ সফলভাবে যাচাই করা হয়েছে!',
    settings_test_failed: 'সংযোগ ব্যর্থ হয়েছে: {message}',

    // Bonus features
    btn_include_index: 'সূচিপত্র পৃষ্ঠা যুক্ত করুন',
    btn_project_export: 'প্রকল্প ব্যাকআপ',
    btn_project_import: 'প্রকল্প পুনরুদ্ধার',
    seal_heading: 'ডিজিটাল সিল / স্বাক্ষর',
    seal_upload_btn: 'সিল আপলোড করুন (PNG)',
    seal_position: 'অবস্থান',
    seal_all_pages: 'সকল পৃষ্ঠা',
    seal_first_page: 'শুধুমাত্র প্রথম পৃষ্ঠা',
    seal_last_page: 'শুধুমাত্র শেষ পৃষ্ঠা',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

/**
 * Format string with parameter interpolation
 */
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
  lang: AppLanguage = 'en'
): string {
  const dictionary = translations[lang] || translations.en;
  let text: string = dictionary[key] ?? translations.en[key] ?? key;

  if (params) {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
  }

  return text;
}

/**
 * Number formatting with Intl support (Bangla numerals for bn)
 */
export function formatNumber(num: number, lang: AppLanguage = 'en'): string {
  try {
    const locale = lang === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return String(num);
  }
}

/**
 * Date formatting with Intl support (ISO YYYY-MM-DD to localized date)
 */
export function formatDate(dateStr: string, lang: AppLanguage = 'en'): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const dateObj = new Date(year, month - 1, day);
    const locale = lang === 'bn' ? 'bn-BD' : 'en-GB';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  } catch {
    return dateStr;
  }
}

/**
 * File size formatting (KB/MB)
 */
export function formatFileSize(bytes: number, lang: AppLanguage = 'en'): string {
  if (bytes < 1024 * 1024) {
    const kb = (bytes / 1024).toFixed(1);
    return `${formatNumber(Number(kb), lang)} KB`;
  }
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `${formatNumber(Number(mb), lang)} MB`;
}
