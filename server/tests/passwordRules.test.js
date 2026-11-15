import { describe, it, expect } from 'vitest';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  isValidPassword,
} from '../src/utils/passwordRules.js';

describe('isValidPassword', () => {
  it('takes a password with an uppercase letter, a number and a special character', () => {
    for (const ok of ['Password1!', 'Abcdef1-', 'Ünïcode-Pass1', 'With Space-1', `A1-${'x'.repeat(PASSWORD_MAX_LENGTH - 3)}`]) {
      expect(isValidPassword(ok), ok).toBe(true);
    }
  });

  it('refuses anything that breaks a rule', () => {
    const bad = [
      'aaaaaaaa', // the audit's example
      'Abc-12', // too short
      'abcdefg-1', // no uppercase
      'Abcdefgh-', // no number
      'Abcdefgh1', // no special character
      'Abcd/efg-1', // slash
      String.raw`Abcd\efg-1`, // backslash
      `Abcd'efg-1`, // quote
      'Abcd"efg-1', // double quote
      'Abcd\nefg-1', // a line break
      `A1-${'x'.repeat(PASSWORD_MAX_LENGTH - 2)}`, // 129 characters
      '',
      null,
      undefined,
      12345678,
    ];
    for (const password of bad) expect(isValidPassword(password), String(password)).toBe(false);
  });

  it('matches the client pattern and lengths', () => {
    // client/src/utils/regex/regex.js
    expect(PASSWORD_REGEX.source).toBe(String.raw`^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\\/'"]).{8,}$`);
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(PASSWORD_MAX_LENGTH).toBe(128);
  });
});
