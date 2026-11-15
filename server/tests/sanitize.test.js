import { describe, it, expect } from 'vitest';
import { normalizeEmail, EMAIL_MAX_LENGTH } from '../src/utils/sanitize.js';

describe('normalizeEmail', () => {
  it('trims and lower-cases a plain address', () => {
    expect(normalizeEmail('  Ada.Lovelace+maps@Example.CO.uk ')).toBe('ada.lovelace+maps@example.co.uk');
    expect(normalizeEmail('a@b.io')).toBe('a@b.io');
  });

  it('refuses anything that is not one plain address', () => {
    const bad = [
      '',
      '   ',
      'ada',
      'ada@example',
      '@example.com',
      'ada@.com',
      'ada@example.com.',
      'ada@@example.com',
      'ada@exa mple.com',
      'Ada <ada@example.com>',
      '<ada@example.com>',
      'ada@example.com,eve@example.com',
      'ada@example.com;eve@example.com',
      '"ada"@example.com',
      'ada@example.com\r\nBcc: eve@example.com',
      'ada\u0000@example.com',
      'ad<b>a@example.com',
    ];
    for (const value of bad) expect(normalizeEmail(value)).toBeNull();
  });

  it('refuses non-strings', () => {
    for (const value of [null, undefined, 42, {}, ['a@b.io']]) expect(normalizeEmail(value)).toBeNull();
  });

  it('refuses an address longer than 254 characters instead of cutting it', () => {
    const domain = '@example.com';
    const fits = `${'a'.repeat(EMAIL_MAX_LENGTH - domain.length)}${domain}`;
    expect(normalizeEmail(fits)).toBe(fits);
    expect(normalizeEmail(`a${fits}`)).toBeNull();
  });
});
