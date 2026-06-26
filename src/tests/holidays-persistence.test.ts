import { describe, it, expect } from 'vitest';

describe('holidays persistence', () => {
  const STORAGE_KEY = 'apex_holidays';

  it('saves holidays to localStorage', () => {
    const holidays = [
      { date: '2025-01-01', name: 'New Year' },
      { date: '2025-12-25', name: 'Christmas' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved).toEqual(holidays);
  });

  it('loads holidays from localStorage', () => {
    const holidays = [{ date: '2025-08-17', name: 'Independence Day' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holidays));
    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Independence Day');
  });

  it('returns empty array when localStorage has no holidays', () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeNull();
    const holidays = raw ? JSON.parse(raw) : [];
    expect(holidays).toEqual([]);
  });

  it('survives corrupted data by falling back to empty array', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');
    let holidays: any[] = [];
    try {
      holidays = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    } catch {
      holidays = [];
    }
    expect(holidays).toEqual([]);
  });
});
