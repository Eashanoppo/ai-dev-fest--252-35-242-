/**
 * Core domain types for the Tender Document Package Builder.
 * Strict TypeScript, no `any`.
 */

export interface Tender {
  tender_id: string;
  title: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string; // ISO date YYYY-MM-DD
}

export interface Requirement {
  id: string;
  order: number;
  title_en: string;
  title_bn?: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface RequirementsPayload {
  tender: Tender;
  requirements: Requirement[];
}

export type FileErrorKind = 'protected' | 'damaged';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  hash: string;
  pageCount: number;
  valid: boolean;
  errorKind?: FileErrorKind;
  error?: string;
}

/** Name and size are enough to re-link a saved match after a page reload. */
export interface FileRef {
  name: string;
  size: number;
}

export type RequirementStatusType =
  | 'OK'
  | 'MISSING'
  | 'EXPIRY_NEEDED'
  | 'EXPIRED'
  | 'NOT_PROVIDED';

export interface ComputedStatus {
  status: RequirementStatusType;
  isBlocking: boolean;
}

export interface BlockerDetail {
  requirementId: string;
  requirementOrder: number;
  titleEn: string;
  titleBn: string;
  mandatory: boolean;
  status: RequirementStatusType;
  expiry: string;
  deadline: string;
}

export interface StatusSummary {
  total: number;
  ok: number;
  missing: number;
  expiryNeeded: number;
  expired: number;
  notProvided: number;
  blockingCount: number;
  canGenerate: boolean;
  blockers: BlockerDetail[];
}

export type AppLanguage = 'en' | 'bn';
export type AppTheme = 'light' | 'dark';

export interface ProjectState {
  tender: Tender | null;
  requirements: Requirement[];
  files: UploadedFile[];
  matches: Record<string, string>; // requirementId -> fileId
  expiryDates: Record<string, string>; // requirementId -> YYYY-MM-DD
  /** Saved matches waiting for the same file to be uploaded again (name + size). */
  pendingLinks: Record<string, FileRef>;
  lang: AppLanguage;
  theme: AppTheme;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  messageEn: string;
  messageBn: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  contentEn: string;
  contentBn: string;
  /** True when the model reply could not be parsed and raw text is shown. */
  raw?: boolean;
  /** True for a fresh reply that should be revealed progressively. */
  reveal?: boolean;
}

export type GeneratePhase =
  | 'idle'
  | 'validating'
  | 'cover'
  | 'index'
  | 'merging'
  | 'footers'
  | 'done';

export interface GenerateProgress {
  phase: GeneratePhase;
  current: number;
  total: number;
  title: string;
  pages: number;
}

export type SealScope = 'all' | 'doc-first' | 'doc-last' | 'custom';
export type SealCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface SealSettings {
  imageBytes: Uint8Array | null;
  previewUrl: string | null;
  scope: SealScope;
  customPages: string;
  corner: SealCorner;
  sizePercent: number;
}
