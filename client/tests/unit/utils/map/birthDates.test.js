// @vitest-environment node
// A traveller's optional date of birth (src/utils/map/birthDates.js; 23 Nov 2026).
import { describe, expect, it } from 'vitest';
import { BIRTH_DATE_MIN, lifeShareWords, todayInput } from '@/utils/map/birthDates';
import { BIRTH_DATE_MIN as SERVER_MIN } from '../../../../../server/src/utils/travelValidation.js';

describe('birthDates', () => {
  it('starts in 1900, as the server does', () => {
    expect(BIRTH_DATE_MIN).toBe(SERVER_MIN);
  });

  it('gives today as a date input’s value, in the browser’s own day', () => {
    expect(todayInput(new Date(2026, 10, 3, 23, 30))).toBe('2026-11-03');
    expect(todayInput(new Date(2027, 0, 9))).toBe('2027-01-09');
  });

  it('words the share of a life away, and nothing without one', () => {
    expect(lifeShareWords(3.1)).toBe('3.1% of their life');
    expect(lifeShareWords(12)).toBe('12% of their life');
    expect(lifeShareWords(0)).toBe('under 0.1% of their life');
    expect(lifeShareWords(null)).toBeNull();
    expect(lifeShareWords(undefined)).toBeNull();
  });
});
