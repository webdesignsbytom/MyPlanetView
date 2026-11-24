import { describe, expect, it } from 'vitest';
import { earliestOf, passportPageOrder } from '../src/utils/passportOrder.js';

// The passport's pages in the order visited (24 Nov 2026, the user's wish)
describe('passportPageOrder', () => {
  const at = (rows) => ({
    enteredOn: (code) => rows[code]?.entered ?? null,
    markedAt: (code) => rows[code]?.marked ?? null,
  });

  it('puts the places in the order first visited', () => {
    const rows = { GB: { entered: '1990-05-01' }, FR: { entered: '2019-04-12' }, IT: { entered: '2025-07-02' } };
    expect(passportPageOrder(['IT', 'FR', 'GB'], at(rows))).toEqual(['GB', 'FR', 'IT']);
  });

  it('puts an undated place on the day it was marked, after the places visited before then', () => {
    const rows = {
      IT: { entered: '2025-07-02', marked: '2025-07-20T10:00:00Z' },
      DO: { marked: '2026-11-24T19:40:00Z' },
      DZ: { marked: '2026-11-24T19:45:00Z' },
    };
    expect(passportPageOrder(['DZ', 'DO', 'IT'], at(rows))).toEqual(['IT', 'DO', 'DZ']);
  });

  it('on the same day, keeps the order they were marked: Japan, dated today, after those marked earlier today', () => {
    const rows = {
      DO: { marked: '2026-11-24T19:40:00Z' },
      JP: { entered: '2026-11-24', marked: '2026-11-24T19:55:00Z' },
      AS: { marked: '2026-11-24T19:50:00Z' },
    };
    expect(passportPageOrder(['JP', 'DO', 'AS'], at(rows))).toEqual(['DO', 'AS', 'JP']);
  });

  it('puts a place with neither a date nor a time last, then A–Z', () => {
    const rows = { FR: { entered: '2019-04-12' }, IE: {}, BE: {} };
    expect(passportPageOrder(['IE', 'FR', 'BE'], at(rows))).toEqual(['FR', 'BE', 'IE']);
  });
});

describe('earliestOf', () => {
  it('is the earliest date given, skipping none', () => {
    expect(earliestOf(new Date('2019-06-02T10:00:00Z'), '1990-05-01')).toBe('1990-05-01');
    expect(earliestOf(null, '2019-04-12')).toBe('2019-04-12');
    expect(earliestOf(undefined, null)).toBeNull();
  });
});
