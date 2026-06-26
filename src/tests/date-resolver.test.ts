import { describe, it, expect } from 'vitest';
import { resolveDate } from '../lib/date-resolver';

describe('resolveDate', () => {
  it('resolves a day within a single-month range', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-31');
    const result = resolveDate(15, start, end);
    expect(result).toBe('2025-01-15');
  });

  it('resolves day "1" in a cross-month range (Dec 26 – Jan 25) to January', () => {
    const start = new Date('2024-12-26');
    const end = new Date('2025-01-25');
    // Day 1 should resolve to Jan 1 (the one that makes sense in context)
    // Dec 1 is BEFORE the start date, so it should pick Jan 1
    const result = resolveDate(1, start, end);
    expect(result).toBe('2025-01-01');
  });

  it('resolves day "28" in a cross-month range (Dec 26 – Jan 25) to December', () => {
    const start = new Date('2024-12-26');
    const end = new Date('2025-01-25');
    // Day 28 exists in Dec (within range) but not before Jan 25 end
    const result = resolveDate(28, start, end);
    expect(result).toBe('2024-12-28');
  });

  it('resolves day "25" in a cross-month range (Dec 26 – Jan 25) to January', () => {
    const start = new Date('2024-12-26');
    const end = new Date('2025-01-25');
    // Day 25 in Dec is BEFORE start, day 25 in Jan IS within range
    const result = resolveDate(25, start, end);
    expect(result).toBe('2025-01-25');
  });

  it('resolves day "26" in a cross-month range (Dec 26 – Jan 25) to December', () => {
    const start = new Date('2024-12-26');
    const end = new Date('2025-01-25');
    // Day 26 in Dec IS within range, Jan 26 is AFTER end
    const result = resolveDate(26, start, end);
    expect(result).toBe('2024-12-26');
  });

  it('returns null for a day that does not exist in the range', () => {
    const start = new Date('2025-02-01');
    const end = new Date('2025-02-28');
    // Day 31 doesn't exist in February
    const result = resolveDate(31, start, end);
    expect(result).toBeNull();
  });

  it('falls back to current month when no start/end provided', () => {
    const result = resolveDate(15, null, null);
    expect(result).toBeDefined();
    expect(result).toMatch(/^\d{4}-\d{2}-15$/);
  });
});
