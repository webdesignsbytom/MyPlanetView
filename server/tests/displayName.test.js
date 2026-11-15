import { describe, expect, it } from 'vitest';
import { DISPLAY_NAME_MAX, cleanDisplayName } from '../src/utils/displayName.js';

describe('cleanDisplayName', () => {
  it('trims and keeps an ordinary name as it is', () => {
    expect(cleanDisplayName('  Ada Lovelace ')).toBe('Ada Lovelace');
    expect(cleanDisplayName('Zoë 李 🌍')).toBe('Zoë 李 🌍');
  });

  it('turns CR, LF, tabs and other control characters into single spaces', () => {
    expect(cleanDisplayName('Ada\r\nBcc: victim@example.test')).toBe('Ada Bcc: victim@example.test');
    expect(cleanDisplayName('Ada\tLove\u0000lace\u007F')).toBe('Ada Love lace');
    expect(cleanDisplayName('Ada\u0085Lovelace')).toBe('Ada Lovelace');
  });

  it('drops line separators and bidi overrides', () => {
    expect(cleanDisplayName('Ada\u{2028}Lovelace')).toBe('Ada Lovelace');
    expect(cleanDisplayName('\u{202E}gnp.exe')).toBe('gnp.exe');
    expect(cleanDisplayName('a\u{2066}b\u{2069}')).toBe('a b');
  });

  it(`caps the name at ${DISPLAY_NAME_MAX} characters, without splitting an emoji`, () => {
    expect(cleanDisplayName('x'.repeat(500))).toHaveLength(DISPLAY_NAME_MAX);
    const emojis = cleanDisplayName('🌍'.repeat(100));
    expect(Array.from(emojis)).toHaveLength(DISPLAY_NAME_MAX);
    expect(emojis).toBe('🌍'.repeat(DISPLAY_NAME_MAX));
    // No trailing space left by the cut
    expect(cleanDisplayName(`${'x'.repeat(DISPLAY_NAME_MAX - 1)} y`)).toBe('x'.repeat(DISPLAY_NAME_MAX - 1));
  });

  it('returns an empty string when nothing usable is left', () => {
    expect(cleanDisplayName('  \r\n\t ')).toBe('');
    expect(cleanDisplayName(undefined)).toBe('');
    expect(cleanDisplayName(42)).toBe('');
    expect(cleanDisplayName({ toString: () => 'Ada' })).toBe('');
  });
});
