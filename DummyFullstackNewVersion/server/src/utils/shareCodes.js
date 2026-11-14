// Share codes (the "anyone with the link" part of a share URL) and invite tokens.
import crypto from 'node:crypto';

// No 0/O or 1/I/L lookalikes (and no U), so a code read aloud or typed from a screen works
export const SHARE_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const SHARE_CODE_LENGTH = 12;

/** A new random share code, stored form (no dashes), e.g. "K7QXM2PA9RTW". */
export function generateShareCode() {
  let code = '';
  for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
    code += SHARE_CODE_ALPHABET[crypto.randomInt(SHARE_CODE_ALPHABET.length)];
  }
  return code;
}

/** "K7QXM2PA9RTW" -> "K7QX-M2PA-9RTW". */
export function formatShareCode(code) {
  return String(code || '').match(/.{1,4}/g)?.join('-') ?? '';
}

/**
 * What a visitor typed or followed -> the stored form, or null when it can't be a code.
 * Case, spaces and dashes don't matter.
 */
export function normaliseShareCode(input) {
  const code = String(input ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (code.length !== SHARE_CODE_LENGTH) return null;
  for (const char of code) {
    if (!SHARE_CODE_ALPHABET.includes(char)) return null;
  }
  return code;
}

/** The emailed invite token (32 random bytes, base64url). Only its hash is stored. */
export function generateInviteToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashInviteToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}
