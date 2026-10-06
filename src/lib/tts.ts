import { splitIntoChunks } from './chunk';

export interface TTSState {
  isSpeaking: boolean;
  currentMessageId: string | null;
}

type TTSListener = (state: TTSState) => void;

class TTSService {
  private activeMessageId: string | null = null;
  private currentSessionToken: number = 0;
  private listeners = new Set<TTSListener>();

  public subscribe(listener: TTSListener): () => void {
    this.listeners.add(listener);
    listener({
      isSpeaking: this.activeMessageId !== null,
      currentMessageId: this.activeMessageId,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state: TTSState = {
      isSpeaking: this.activeMessageId !== null,
      currentMessageId: this.activeMessageId,
    };
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  public stop(): void {
    this.currentSessionToken++;
    this.activeMessageId = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.notify();
  }

  public speak(messageId: string, englishText: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    // If currently speaking this message, toggle stop
    if (this.activeMessageId === messageId) {
      this.stop();
      return;
    }

    this.stop();

    const chunks = splitIntoChunks(englishText, 180);
    if (chunks.length === 0) return;

    this.activeMessageId = messageId;
    const sessionToken = ++this.currentSessionToken;
    this.notify();

    let chunkIndex = 0;

    const getEnglishVoice = (): SpeechSynthesisVoice | null => {
      const voices = window.speechSynthesis.getVoices();
      return (
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0] ||
        null
      );
    };

    const speakNext = () => {
      if (sessionToken !== this.currentSessionToken) return;

      if (chunkIndex >= chunks.length) {
        this.activeMessageId = null;
        this.notify();
        return;
      }

      const text = chunks[chunkIndex++];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voice = getEnglishVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (sessionToken === this.currentSessionToken) {
          speakNext();
        }
      };

      utterance.onerror = () => {
        if (sessionToken === this.currentSessionToken) {
          this.activeMessageId = null;
          this.notify();
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        this.activeMessageId = null;
        this.notify();
      }
    };

    // Chrome voices might take a tick to load
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        if (sessionToken === this.currentSessionToken) {
          speakNext();
        }
      };
    } else {
      speakNext();
    }
  }

  public isSpeakingMessage(messageId: string): boolean {
    return this.activeMessageId === messageId;
  }
}

export const tts = new TTSService();
