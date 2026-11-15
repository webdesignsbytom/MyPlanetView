// Password policy, the same as the server's (sign-up, reset and change password): 8 to 128
// characters, with an uppercase letter, a number and a special character, and none of
// / \ " '. PASSWORD_RULE is the one wording of it, for hints and errors (the server's 400
// says the same).
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\\/'"]).{8,128}$/;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_RULE =
  'Use 8 to 128 characters, with an uppercase letter, a number and a special character, and none of / \\ " \'.';

// An email address the server accepts (server/src/utils/sanitize.js, normalizeEmail): one
// local part, one @, a dotted domain, and nothing that would quote or split it in a mail
// header. isValidEmail checks it the way the server does (trimmed, lower-cased).
export const EMAIL_REGEX = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]+$/;
export const EMAIL_MAX_LENGTH = 254;

const isControlCharacter = (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127;

export function isValidEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return (
    email.length > 0 &&
    email.length <= EMAIL_MAX_LENGTH &&
    ![...email].some(isControlCharacter) &&
    EMAIL_REGEX.test(email)
  );
}

// What the server keeps of a name or message (sanitizeText): no tags, no control
// characters other than tabs and line breaks, trimmed. Empty means it would be refused.
export const serverText = (value) =>
  [...String(value ?? '').replace(/<[^>]*>/g, '')]
    .filter((c) => !isControlCharacter(c) || c === '\t' || c === '\n' || c === '\r')
    .join('')
    .trim();
