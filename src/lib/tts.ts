/**
 * Text-to-Speech Engine (English only)
 * Fixes Chrome long-utterance freeze by splitting text into <= 200 char chunks
 * Queues sequentially and notifies active/stopped listeners for the 4-bar equalizer
 */

class TTSEngine {
  private isSpeaking = false;
  private queue: string[] = [];
  private onStateChangeListeners: Array<(speaking: boolean) => void> = [];
  private currentVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoice();
      };
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural English US voices
    const enUsVoice =
      voices.find((v) => v.lang === 'en-US' && v.name.includes('Natural')) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en'));
    this.currentVoice = enUsVoice || null;
  }

  public subscribe(listener: (speaking: boolean) => void): () => void {
    this.onStateChangeListeners.push(listener);
    listener(this.isSpeaking);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.onStateChangeListeners.forEach((l) => l(this.isSpeaking));
  }

  public stop(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.queue = [];
    window.speechSynthesis.cancel();
    this.isSpeaking = false;
    this.notify();
  }

  public speak(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.stop();

    // Chunk text into <= 200 characters sentences/fragments
    const chunks = this.splitIntoChunks(text, 180);
    if (chunks.length === 0) return;

    this.queue = [...chunks];
    this.isSpeaking = true;
    this.notify();
    this.playNextChunk();
  }

  private playNextChunk(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (this.queue.length === 0) {
      this.isSpeaking = false;
      this.notify();
      return;
    }

    const chunk = this.queue.shift();
    if (!chunk) {
      this.playNextChunk();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk);
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      this.playNextChunk();
    };

    utterance.onerror = () => {
      this.playNextChunk();
    };

    window.speechSynthesis.speak(utterance);
  }

  private splitIntoChunks(text: string, maxLen: number): string[] {
    // Clean string from code blocks or asterisks
    const clean = text.replace(/[*_#`[\]]/g, '').trim();
    if (clean.length <= maxLen) return [clean];

    // Split by punctuation
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const result: string[] = [];
    let currentChunk = '';

    for (const s of sentences) {
      const trimmed = s.trim();
      if ((currentChunk + ' ' + trimmed).trim().length <= maxLen) {
        currentChunk = (currentChunk + ' ' + trimmed).trim();
      } else {
        if (currentChunk) result.push(currentChunk);
        if (trimmed.length > maxLen) {
          // Sub-split by comma or words
          const words = trimmed.split(' ');
          let subChunk = '';
          for (const w of words) {
            if ((subChunk + ' ' + w).trim().length <= maxLen) {
              subChunk = (subChunk + ' ' + w).trim();
            } else {
              if (subChunk) result.push(subChunk);
              subChunk = w;
            }
          }
          if (subChunk) currentChunk = subChunk;
        } else {
          currentChunk = trimmed;
        }
      }
    }

    if (currentChunk) result.push(currentChunk);
    return result;
  }
}

export const tts = new TTSEngine();
