/**
 * Splits text into readable chunks of at most maxChars (default: 200),
 * respecting sentence and clause boundaries for speech synthesis.
 */
export function splitIntoChunks(text: string, maxChars: number = 200): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const chunks: string[] = [];
  // Split on paragraph or sentence boundaries first
  const sentences = trimmed.split(/(?<=[.?!;:\n])\s+/);

  let current = '';

  for (const sentence of sentences) {
    if (!sentence) continue;

    if (sentence.length > maxChars) {
      // If a single sentence exceeds maxChars, split by comma or words
      const words = sentence.split(/\s+/);
      for (const word of words) {
        if (!word) continue;
        if (current.length === 0) {
          current = word;
        } else if (current.length + 1 + word.length <= maxChars) {
          current += ' ' + word;
        } else {
          chunks.push(current);
          current = word;
        }
      }
    } else {
      if (current.length === 0) {
        current = sentence;
      } else if (current.length + 1 + sentence.length <= maxChars) {
        current += ' ' + sentence;
      } else {
        chunks.push(current);
        current = sentence;
      }
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks;
}
