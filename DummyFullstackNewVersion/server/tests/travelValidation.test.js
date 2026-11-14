import { describe, it, expect } from 'vitest';
import {
  parseDateOnly,
  parseDateTime,
  datesInOrder,
  toDateOnly,
  parsePosition,
  isUuid,
  isCountryCode,
  isEmail,
  isSubsetOf,
} from '../src/utils/travelValidation.js';

describe('parseDateOnly', () => {
  it('reads a real date at UTC midnight', () => {
    const { ok, value } = parseDateOnly('2026-03-14');
    expect(ok).toBe(true);
    expect(value.toISOString()).toBe('2026-03-14T00:00:00.000Z');
  });

  it('tells missing (leave) from null or empty (clear)', () => {
    expect(parseDateOnly(undefined)).toEqual({ ok: true, value: undefined });
    expect(parseDateOnly(null)).toEqual({ ok: true, value: null });
    expect(parseDateOnly('')).toEqual({ ok: true, value: null });
  });

  it('rejects impossible and badly formatted dates', () => {
    expect(parseDateOnly('2026-02-31').ok).toBe(false);
    expect(parseDateOnly('14/03/2026').ok).toBe(false);
    expect(parseDateOnly(20260314).ok).toBe(false);
  });
});

describe('parseDateTime', () => {
  it('reads ISO timestamps and rejects junk', () => {
    expect(parseDateTime('2026-03-14T10:30:00Z').value.toISOString()).toBe('2026-03-14T10:30:00.000Z');
    expect(parseDateTime('not a date').ok).toBe(false);
    expect(parseDateTime(12).ok).toBe(false);
  });
});

describe('dates', () => {
  it('needs the end on or after the start', () => {
    const a = parseDateOnly('2026-01-01').value;
    const b = parseDateOnly('2026-01-10').value;
    expect(datesInOrder(a, b)).toBe(true);
    expect(datesInOrder(b, a)).toBe(false);
    expect(datesInOrder(a, null)).toBe(true);
  });

  it('formats back to YYYY-MM-DD', () => {
    expect(toDateOnly(new Date('2026-03-14T00:00:00Z'))).toBe('2026-03-14');
    expect(toDateOnly(null)).toBeNull();
  });
});

describe('parsePosition', () => {
  it('accepts both coordinates or neither', () => {
    expect(parsePosition(51.5, -0.12)).toEqual({ ok: true, latitude: 51.5, longitude: -0.12 });
    expect(parsePosition('51.5', '-0.12')).toEqual({ ok: true, latitude: 51.5, longitude: -0.12 });
    expect(parsePosition(undefined, null)).toEqual({ ok: true, latitude: null, longitude: null });
  });

  it('rejects one without the other, or positions off the Earth', () => {
    expect(parsePosition(51.5, undefined).ok).toBe(false);
    expect(parsePosition(95, 0).ok).toBe(false);
    expect(parsePosition('abc', 0).ok).toBe(false);
  });
});

describe('small checks', () => {
  it('recognises ids, codes and emails', () => {
    expect(isUuid('3f2b8c1e-6d4a-4b7e-9c2d-1a2b3c4d5e6f')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isCountryCode('JP')).toBe(true);
    expect(isCountryCode('jp')).toBe(false);
    expect(isEmail('ada@example.test')).toBe(true);
    expect(isEmail('ada@example')).toBe(false);
  });

  it('checks a list is distinct and drawn from the allowed ids', () => {
    expect(isSubsetOf(['a', 'b'], ['a', 'b', 'c'])).toBe(true);
    expect(isSubsetOf(['a', 'a'], ['a'])).toBe(false);
    expect(isSubsetOf(['z'], ['a'])).toBe(false);
    expect(isSubsetOf('a', ['a'])).toBe(false);
  });
});
