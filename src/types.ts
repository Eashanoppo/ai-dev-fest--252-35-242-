/**
 * Core Domain Types for Tender Document Package Builder
 * Strict TypeScript without any usage of 'any'
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

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  hash: string;
  pageCount: number;
  valid: boolean;
  error?: string;
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
  reasonEn: string;
  reasonBn: string;
}

export interface BlockerDetail {
  requirementId: string;
  requirementOrder: number;
  titleEn: string;
  titleBn: string;
  status: RequirementStatusType;
  reasonEn: string;
  reasonBn: string;
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
  timestamp: number;
}

export interface AssistantConfig {
  apiKey: string;
  model: string;
  provider: 'groq' | 'gemini';
}

export interface GenerateProgress {
  phase: 'idle' | 'validating' | 'cover' | 'merging' | 'footing' | 'complete' | 'error';
  currentDocIndex: number;
  totalDocs: number;
  messageEn: string;
  messageBn: string;
}
