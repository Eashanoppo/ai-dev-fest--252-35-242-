import { describe, it, expect } from 'vitest';
import { parsePageRanges } from '../src/lib/ranges';

describe('Page Range Parser', () => {
  it('parses individual and range pages correctly', () => {
    const pages = parsePageRanges('1, 3, 5-7', 10);
    expect(pages).toEqual([1, 3, 5, 6, 7]);
  });

  it('clamps pages to maxPages', () => {
    const pages = parsePageRanges('1-15', 5);
    expect(pages).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles empty or invalid range strings gracefully', () => {
    expect(parsePageRanges('', 5)).toEqual([]);
    expect(parsePageRanges('abc, invalid', 5)).toEqual([]);
  });
});
