import { describe, expect, it } from 'vitest';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_REGEX, PASSWORD_RULE, isValidEmail, serverText } from '@/utils/regex/regex';
// The server's rules, which these must match
import * as serverPasswords from '../../../../../server/src/utils/passwordRules.js';
import { normalizeEmail, sanitizeText } from '../../../../../server/src/utils/sanitize.js';

describe('the password rule', () => {
  it('is the server’s pattern, with its lengths', () => {
    expect(PASSWORD_REGEX.source.replace('{8,128}', '{8,}')).toBe(serverPasswords.PASSWORD_REGEX.source);
    expect(PASSWORD_MAX_LENGTH).toBe(serverPasswords.PASSWORD_MAX_LENGTH);
    expect(PASSWORD_RULE).toBe(serverPasswords.PASSWORD_RULES_MESSAGE);
  });

  const samples = [
    'Passw0rd!',
    'passw0rd!',
    'PASSWORD1!',
    'Password!!',
    'Password12',
    'Pa0!',
    'Pa0!Pa0!',
    'Pass word 1!',
    'Pass/word1!',
    'Pass\\word1!',
    'Pass"word1!',
    "Pass'word1!",
    `A1!${'a'.repeat(125)}`,
    `A1!${'a'.repeat(126)}`,
    'Ünïcødé1!',
    'Tab\tword1!',
    '12345678',
  ];

  it.each(samples)('agrees with the server about %j', (password) => {
    expect(PASSWORD_REGEX.test(password)).toBe(serverPasswords.isValidPassword(password));
  });

  it('takes 8 to 128 characters with a capital, a number and a symbol, and none of / \\ " \'', () => {
    expect(PASSWORD_REGEX.test('Passw0rd!')).toBe(true);
    expect(PASSWORD_REGEX.test(`A1!${'a'.repeat(125)}`)).toBe(true);
    expect(PASSWORD_REGEX.test(`A1!${'a'.repeat(126)}`)).toBe(false);
    expect(PASSWORD_REGEX.test('Pass/word1!')).toBe(false);
  });
});

describe('isValidEmail', () => {
  const samples = [
    'sam@example.com',
    '  Sam.Carter+maps@Example.co.uk ',
    'no-at-sign.example.com',
    'two@@example.com',
    'a@b',
    'a@b.c',
    'a@b.c.',
    'a b@example.com',
    'a<b>@example.com',
    'a,b@example.com',
    'quote"d@example.com',
    'tab\t@example.com',
    'ctrl\u0001@example.com',
    'del\u007f@example.com',
    `${'a'.repeat(250)}@x.io`,
    `${'a'.repeat(249)}@x.io`,
    '',
    null,
  ];

  it.each(samples)('agrees with the server about %j', (email) => {
    expect(isValidEmail(email)).toBe(normalizeEmail(email) !== null);
  });

  it('allows an address up to 254 characters', () => {
    expect(EMAIL_MAX_LENGTH).toBe(254);
    expect(isValidEmail(`${'a'.repeat(249)}@x.io`)).toBe(true);
    expect(isValidEmail(`${'a'.repeat(250)}@x.io`)).toBe(false);
  });
});

describe('serverText', () => {
  const samples = ['  Hello <b>there</b>  ', 'Line one\nLine two\r\n\tindented', 'Bell\u0007 and del\u007f', '<img src=x onerror=alert(1)>', '   ', null, undefined, 'Ünïcødé 🗺️'];

  it.each(samples)('keeps what the server’s sanitizeText keeps of %j', (text) => {
    expect(serverText(text)).toBe(sanitizeText(text, { maxLength: Infinity }) ?? '');
  });
});
