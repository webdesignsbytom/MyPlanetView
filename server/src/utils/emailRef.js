import crypto from 'node:crypto';

/**
 * A short stand-in for an email address in logs (`email#` + 12 hex characters): the
 * same address always gives the same reference, so repeated requests can be matched,
 * but the address isn't stored. Keyed with BETTER_AUTH_SECRET, so it can't be checked
 * against a list of addresses without the secret. Null without an address.
 */
export function emailRef(email) {
  if (typeof email !== 'string' || !email.trim()) return null;
  const key = process.env.BETTER_AUTH_SECRET || 'email-ref';
  const digest = crypto.createHmac('sha256', key).update(email.trim().toLowerCase()).digest('hex');
  return `email#${digest.slice(0, 12)}`;
}
