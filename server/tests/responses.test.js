// The words the API answers with (utils/responses/responses.js) and the constants beside
// them: every message a real sentence, every domain and role spelt as its key.
import { describe, expect, it } from 'vitest';
import { DOMAINS, EVENT_MESSAGES, RESPONSE_MESSAGES } from '../src/utils/responses/responses.js';
import * as errors from '../src/event/errorUtils.js';
import { ROLES } from '../src/utils/constants/userConstants.js';

// Labels kept from the template: short, and with no full stop
const TEMPLATE_LABELS = ['badRequest', 'notFound', 'missingUserIdentifier', 'missingFields', 'malformedData'];
// Messages that start with a field's name, as the client sends it
const STARTS_WITH_A_FIELD = ['invalidSplitUk', 'invalidPinHidden'];

describe('EVENT_MESSAGES', () => {
  it('are all non-empty, trimmed text with single spaces', () => {
    for (const [key, message] of Object.entries(EVENT_MESSAGES)) {
      expect(typeof message, key).toBe('string');
      expect(message.length, key).toBeGreaterThan(3);
      expect(message, key).toBe(message.trim());
      expect(message, key).not.toMatch(/ {2}|\n/);
    }
  });

  it('are sentences: a capital first, a full stop (or ? or !) last', () => {
    for (const [key, message] of Object.entries(EVENT_MESSAGES)) {
      if (!STARTS_WITH_A_FIELD.includes(key)) expect(message, key).toMatch(/^["A-Z]/);
      if (!TEMPLATE_LABELS.includes(key)) expect(message, key).toMatch(/[.?!]$/);
    }
    // The exceptions are still there (drop them from the lists once reworded)
    for (const key of [...TEMPLATE_LABELS, ...STARTS_WITH_A_FIELD]) expect(EVENT_MESSAGES[key], key).toBeTruthy();
  });

  it('never leak a placeholder or a stack', () => {
    for (const [key, message] of Object.entries(EVENT_MESSAGES)) {
      expect(message, key).not.toMatch(/undefined|null|\$\{|TODO|Error:/);
    }
  });
});

describe('RESPONSE_MESSAGES', () => {
  it('has a sentence for every error event class but the custom one', () => {
    const classes = Object.keys(errors).filter((name) => /^[A-Z]\w*Event$/.test(name) && typeof errors[name] === 'function' && name !== 'OtherErrorEvent');
    expect(classes.length).toBeGreaterThan(5);
    for (const name of classes) {
      expect(RESPONSE_MESSAGES[name], name).toMatch(/^[A-Z].*\.$/);
    }
    for (const name of Object.keys(RESPONSE_MESSAGES)) expect(classes, name).toContain(name);
  });
});

describe('DOMAINS and ROLES', () => {
  it('spell every value as its key', () => {
    for (const [key, value] of Object.entries(DOMAINS)) expect(value).toBe(key);
    for (const [key, value] of Object.entries(ROLES)) expect(value).toBe(key);
  });

  it('has the three roles the database and the client know', () => {
    expect(Object.values(ROLES).sort()).toEqual(['ADMIN', 'DEVELOPER', 'USER']);
  });
});
