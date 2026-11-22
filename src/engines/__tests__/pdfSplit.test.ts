import { describe, expect, it } from 'vitest';
import { formatPagesToRangeString, parsePageRanges } from '../pdfSplit';

describe('PDF Split Page-Range Parser', () => {
  it('parses mixed single pages and ranges cleanly in sorted unique order', () => {
    const res = parsePageRanges('1, 3-5, 8, 4', 10);
    expect(res.valid).toBe(true);
    expect(res.pages).toEqual([1, 3, 4, 5, 8]);
    expect(formatPagesToRangeString(res.pages)).toBe('1, 3-5, 8');
  });

  it('rejects out-of-bounds pages and ranges', () => {
    const tooHigh = parsePageRanges('1, 12', 10);
    expect(tooHigh.valid).toBe(false);
    expect(tooHigh.error).toContain('12');

    const zero = parsePageRanges('0-2', 10);
    expect(zero.valid).toBe(false);
  });

  it('rejects reversed ranges like 5-2', () => {
    const reversed = parsePageRanges('5-2', 10);
    expect(reversed.valid).toBe(false);
    expect(reversed.error).toContain('2-5');
  });

  it('rejects empty strings, trailing commas, and invalid tokens', () => {
    expect(parsePageRanges('   ', 5).valid).toBe(false);
    expect(parsePageRanges('1, , 3', 5).valid).toBe(false);
    expect(parsePageRanges('1-2-3', 5).valid).toBe(false);
    expect(parsePageRanges('abc', 5).valid).toBe(false);
  });

  it('formats consecutive pages back into compact range strings', () => {
    expect(formatPagesToRangeString([1, 2, 3, 6, 8, 9])).toBe('1-3, 6, 8-9');
    expect(formatPagesToRangeString([])).toBe('');
  });
});
