import { Tender, StatusSummary } from '../types';

const ASSISTANT_PROVIDER_STORAGE = 'tenderpack_ai_provider';
const ASSISTANT_KEY_STORAGE = 'tenderpack_ai_api_key';
const ASSISTANT_MODEL_STORAGE = 'tenderpack_ai_model';

export type AIProvider = 'groq' | 'gemini';

export function getSavedProvider(): AIProvider {
  try {
    const saved = localStorage.getItem(ASSISTANT_PROVIDER_STORAGE);
    if (saved === 'groq' || saved === 'gemini') return saved;
  } catch {}
  return 'groq';
}

export function saveProvider(provider: AIProvider): void {
  try {
    localStorage.setItem(ASSISTANT_PROVIDER_STORAGE, provider);
  } catch {}
}

export function getSavedApiKey(): string {
  try {
    return localStorage.getItem(ASSISTANT_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(ASSISTANT_KEY_STORAGE, key.trim());
  } catch {}
}

export function getSavedModel(): string {
  try {
    const saved = localStorage.getItem(ASSISTANT_MODEL_STORAGE);
    if (saved) return saved;
  } catch {}
  return 'openai/gpt-oss-20b';
}

export function saveModel(model: string): void {
  try {
    localStorage.setItem(ASSISTANT_MODEL_STORAGE, model.trim());
  } catch {}
}

export interface AssistantResponse {
  en: string;
  bn: string;
}

/**
 * Robust JSON extraction from LLM response (handles markdown code fences and prefix/suffix)
 */
export function extractBilingualJson(rawText: string): AssistantResponse {
  try {
    // 1. Strip markdown fences: ```json ... ```
    let cleaned = rawText.replace(/```(?:json)?([\s\S]*?)```/gi, '$1').trim();

    // 2. Locate first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.en === 'string' && typeof parsed.bn === 'string') {
        return { en: parsed.en, bn: parsed.bn };
      }
    }
  } catch {}

  // Fallback if parsing fails: display raw text
  return {
    en: rawText,
    bn: rawText,
  };
}

/**
 * Universal Assistant Caller: supports Groq (default) and Google Gemini
 */
export async function queryAssistant(
  userQuery: string,
  tender: Tender | null,
  statusSummary: StatusSummary
): Promise<AssistantResponse> {
  const apiKey = getSavedApiKey();
  if (!apiKey) {
    throw new Error('No API key provided. Please configure your API Key in Settings.');
  }

  const provider = getSavedProvider();
  const model = getSavedModel();

  // Construct context-rich system prompt
  const blockersContext = statusSummary.blockers
    .map(
      (b) =>
        `- Requirement [${b.requirementId}]: ${b.titleEn} | Status: ${b.status} | Issue: ${b.reasonEn}`
    )
    .join('\n');

  const liveContext = `
LIVE TENDER CONTEXT:
- Tender ID: ${tender?.tender_id || 'Not loaded'}
- Tender Title: ${tender?.title || 'Not loaded'}
- Procuring Entity: ${tender?.procuring_entity || 'N/A'}
- Bidder: ${tender?.bidder || 'N/A'}
- Submission Deadline: ${tender?.submission_deadline || 'N/A'}
- Total Requirements: ${statusSummary.total}
- Ready Documents (OK): ${statusSummary.ok}
- Blocking Issues (${statusSummary.blockingCount}):
${blockersContext || 'None (Ready to generate package!)'}
`;

  const systemInstruction = `You are TenderPack Assistant, an expert advisor for government and corporate procurement document compliance.
Your role is to help the bidder verify and prepare their tender document package before the submission deadline.
Analyze the provided LIVE TENDER CONTEXT and answer the user query concisely, authoritatively, and accurately.
CRITICAL FORMATTING INSTRUCTION:
You MUST reply ONLY with a raw JSON object containing both English and Bengali translations:
{"en": "Your clear response in English", "bn": "আপনার বাংলা অনুবাদ"}
Do NOT wrap the response in markdown quotes or extra text. Output valid JSON only.`;

  if (provider === 'groq') {
    // Groq OpenAI-Compatible Chat Completions Endpoint
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const payload = {
      model: model || 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: `${systemInstruction}\n\n${liveContext}`,
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const msg = errorData?.error?.message || `HTTP error ${response.status}`;
      throw new Error(`Groq API Error: ${msg}`);
    }

    const data = await response.json();
    const candidateText = data?.choices?.[0]?.message?.content || 'No response generated.';
    return extractBilingualJson(candidateText);
  } else {
    // Google Gemini Endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\n${liveContext}\n\nUser Question: ${userQuery}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1000,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const msg = errorData?.error?.message || `HTTP error ${response.status}`;
      throw new Error(`Gemini API Error: ${msg}`);
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return extractBilingualJson(candidateText);
  }
}
