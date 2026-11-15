// The password rules, the same as the client's (client/src/utils/regex/regex.js):
// 8 characters or more, an uppercase letter, a number and a special character, and
// none of / \ " '. better-auth also gets the lengths (auth.js), and a hooks.before
// there runs this on sign-up, reset-password and change-password.

export const PASSWORD_MIN_LENGTH = 8;
// better-auth's default maximum, set explicitly
export const PASSWORD_MAX_LENGTH = 128;

// Same pattern as the client's PASSWORD_REGEX; keep the two in step
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s])(?!.*[\\/'"]).{8,}$/;

export const PASSWORD_RULES_MESSAGE =
  'Use 8 to 128 characters, with an uppercase letter, a number and a special character, and none of / \\ " \'.';

/** True when the password meets the rules. */
export const isValidPassword = (password) =>
  typeof password === 'string' &&
  password.length >= PASSWORD_MIN_LENGTH &&
  password.length <= PASSWORD_MAX_LENGTH &&
  PASSWORD_REGEX.test(password);
