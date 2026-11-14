import { describe, it, expect } from 'vitest';
import {
  SHARE_CODE_ALPHABET,
  SHARE_CODE_LENGTH,
  generateShareCode,
  formatShareCode,
  normaliseShareCode,
  generateInviteToken,
  hashInviteToken,
} from '../src/utils/shareCodes.js';

describe('share codes', () => {
  it('generates 12 characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateShareCode();
      expect(code).toHaveLength(SHARE_CODE_LENGTH);
      for (const char of code) expect(SHARE_CODE_ALPHABET).toContain(char);
    }
  });

  it('has no lookalike characters', () => {
    for (const char of '01ILOU') expect(SHARE_CODE_ALPHABET).not.toContain(char);
  });

  it('formats in groups of four', () => {
    expect(formatShareCode('K7QXM2PA9RTW')).toBe('K7QX-M2PA-9RTW');
  });

  it('normalises what a visitor types or follows', () => {
    expect(normaliseShareCode('k7qx-m2pa-9rtw')).toBe('K7QXM2PA9RTW');
    expect(normaliseShareCode(' K7QX M2PA 9RTW ')).toBe('K7QXM2PA9RTW');
  });

  it('rejects anything that cannot be a code', () => {
    expect(normaliseShareCode('K7QX-M2PA')).toBeNull();
    expect(normaliseShareCode('K7QX-M2PA-9RT0')).toBeNull(); // 0 is not in the alphabet
    expect(normaliseShareCode(null)).toBeNull();
    expect(normaliseShareCode('../../etc/passwd')).toBeNull();
  });
});

describe('invite tokens', () => {
  it('are long, random and URL-safe', () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('hash the same way every time, and never to the token itself', () => {
    const token = generateInviteToken();
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
    expect(hashInviteToken(token)).not.toBe(token);
    expect(hashInviteToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });
});
