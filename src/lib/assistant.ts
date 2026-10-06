import { Tender, Requirement, UploadedFile, BlockerDetail } from '../types';
import { formatBlockerReason } from './reasons';

export interface AssistantParsedReply {
  en: string;
  bn: string;
  raw?: boolean;
}

export interface AssistantHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export type AIProvider = 'groq' | 'gemini';

const PROVIDER_KEY = 'tenderpack_ai_provider';
const API_KEY_KEY = 'tenderpack_ai_api_key';
const MODEL_KEY = 'tenderpack_ai_model';

export function getSavedProvider(): AIProvider {
  try {
    const p = localStorage.getItem(PROVIDER_KEY);
    if (p === 'gemini') return 'gemini';
  } catch {
    // ignore
  }
  return 'groq';
}

export function saveProvider(provider: AIProvider): void {
  try {
    localStorage.setItem(PROVIDER_KEY, provider);
  } catch {
    // ignore
  }
}

export function getSavedApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_KEY) || '';
  } catch {
    return '';
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_KEY, key.trim());
  } catch {
    // ignore
  }
}

export function getSavedModel(): string {
  try {
    const m = localStorage.getItem(MODEL_KEY);
    if (m && m.trim()) return m.trim();
  } catch {
    // ignore
  }
  return 'openai/gpt-oss-20b';
}

export function saveModel(model: string): void {
  try {
    localStorage.setItem(MODEL_KEY, model.trim());
  } catch {
    // ignore
  }
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function askAssistant(params: {
  apiKey: string;
  model?: string;
  provider?: 'groq' | 'gemini';
  userMessage: string;
  history?: AssistantHistoryItem[];
  tender: Tender | null;
  requirements: Requirement[];
  files: UploadedFile[];
  blockers: BlockerDetail[];
}): Promise<AssistantParsedReply> {
  const {
    apiKey,
    model = 'openai/gpt-oss-20b',
    provider = 'groq',
    userMessage,
    history = [],
    tender,
    requirements,
    files,
    blockers,
  } = params;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is required to use the AI assistant.');
  }

  // Build context summary
  const tenderInfo = tender
    ? `Tender ID: ${tender.tender_id}, Title: "${tender.title}", Entity: "${tender.procuring_entity}", Bidder: "${tender.bidder}", Deadline: ${tender.submission_deadline}`
    : 'No tender currently loaded.';

  const blockerListEn =
    blockers.length === 0
      ? 'None. Package is ready to generate!'
      : blockers.map((b) => `- ${formatBlockerReason(b, 'en')}`).join('\n');

  const systemPrompt = `You are TenderPack Assistant, an expert AI helper for tender document package preparation.
Your job is to assist the user with tender preparation, requirements, verification, expiry dates, duplicate files, and packaging rules.

CURRENT STATE:
${tenderInfo}
Total requirements: ${requirements.length}
Uploaded files: ${files.length} (Valid: ${files.filter((f) => f.valid).length})
Current blocking issues (${blockers.length}):
${blockerListEn}

CRITICAL INSTRUCTION:
You MUST respond with a strictly valid JSON object with exactly two keys: "en" and "bn".
"en": Your complete, helpful, professional response in English.
"bn": The exact equivalent response accurately translated into fluent, natural Bengali (Bangla).
DO NOT wrap the response in markdown code blocks or backticks. Return ONLY the raw JSON object.
Example format:
{"en": "You have 2 missing mandatory documents: R01 and R03.", "bn": "আপনার ২টি বাধ্যতামূলক নথি অনুপস্থিত: R01 এবং R03।"}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    if (provider === 'gemini') {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`;
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Question:\n${userMessage}` }],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseJsonResponse(rawText);
    } else {
      // Groq default
      const requestBody: Record<string, unknown> = {
        model,
        messages,
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      };

      // Add reasoning_effort only if supported/needed
      if (model.includes('gpt-oss')) {
        requestBody.reasoning_effort = 'low';
      }

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `HTTP ${res.status} ${res.statusText}`;
        throw new Error(`Groq API error: ${errMsg}`);
      }

      const data = await res.json();
      const rawText = data?.choices?.[0]?.message?.content || '';
      return parseJsonResponse(rawText);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Safely parses the JSON output into { en, bn }.
 * If parsing fails, returns the raw text gracefully without throwing.
 */
export function parseJsonResponse(text: string): AssistantParsedReply {
  const cleaned = text.trim();
  if (!cleaned) {
    return {
      en: 'No response received from the assistant.',
      bn: 'সহকারীর কাছ থেকে কোনো উত্তর পাওয়া যায়নি।',
    };
  }

  // Strip code fences if the model erroneously included them
  let target = cleaned;
  if (target.startsWith('```')) {
    target = target.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }

  // Find first '{' and last '}'
  const start = target.indexOf('{');
  const end = target.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    target = target.substring(start, end + 1);
  }

  try {
    const parsed = JSON.parse(target);
    if (parsed && typeof parsed === 'object') {
      const en = String(parsed.en || parsed.English || parsed.contentEn || '').trim();
      const bn = String(parsed.bn || parsed.Bangla || parsed.Bengali || parsed.contentBn || '').trim();

      if (en || bn) {
        return {
          en: en || bn,
          bn: bn || en,
        };
      }
    }
  } catch {
    // JSON parse failed; fall back gracefully
  }

  return {
    en: cleaned,
    bn: cleaned,
    raw: true,
  };
}
