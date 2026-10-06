/**
 * Parse page range strings such as "1, 3, 5-8" or "1-3, 5"
 * Returns an array of 1-indexed unique page numbers sorted in ascending order.
 */
export function parsePageRanges(input: string, maxPages: number): number[] {
  if (!input || !input.trim() || maxPages <= 0) {
    return [];
  }

  const pages = new Set<number>();
  const tokens = input.split(',').map((s) => s.trim()).filter(Boolean);

  for (const token of tokens) {
    if (token.includes('-')) {
      const parts = token.split('-').map((s) => s.trim());
      if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(maxPages, Math.max(start, end));
          for (let p = from; p <= to; p++) {
            pages.add(p);
          }
        }
      }
    } else {
      const page = parseInt(token, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}
