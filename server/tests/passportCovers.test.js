// The passport's cover colours (26 Nov 2026, the user's wish; src/utils/passportCovers.js)
import { describe, expect, it } from 'vitest';
import { PASSPORT_COLOURS, isPassportColour } from '../src/utils/passportCovers.js';

describe('isPassportColour', () => {
  it('takes one of the cover colours, or null for the plan’s own', () => {
    for (const colour of PASSPORT_COLOURS) expect(isPassportColour(colour)).toBe(true);
    expect(isPassportColour(null)).toBe(true);
  });

  it('refuses anything else', () => {
    for (const bad of [undefined, '', 'burgundy', 'PINK', '#5a1621', 3, {}]) expect(isPassportColour(bad), String(bad)).toBe(false);
  });

  it('offers the colours real passports come in', () => {
    expect(PASSPORT_COLOURS).toEqual(['BURGUNDY', 'NAVY', 'BLACK', 'GREEN', 'BLUE', 'TAN']);
  });
});
