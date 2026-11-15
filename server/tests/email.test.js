import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Settings so the handler sends (to the fake client below) instead of only logging
vi.hoisted(() => {
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.EMAIL_FROM = 'hello@example.test';
});

// Fake Resend client: records each send and answers with the next queued result
// (success when the queue is empty). The real templates still render.
const fake = vi.hoisted(() => ({ sent: [], results: [] }));
vi.mock('resend', () => ({
  Resend: class {
    constructor() {
      this.emails = {
        send: async (payload, options) => {
          fake.sent.push({ ...payload, options });
          return fake.results.shift() ?? { data: { id: 'test-id' }, error: null };
        },
      };
    }
  },
}));

const { sendContactEmail, sendUserChangeEmailConfirmation, sendUserEmail } = await import('../src/services/email/emailHandler.js');

const CONTACT = {
  title: 'New Contact Form Received',
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  message: 'Hello from the contact form',
  businessName: 'Test Co',
  businessUrl: 'https://example.test',
  year: 2026,
};

const failure = (name, statusCode) => ({ data: null, error: { name, statusCode, message: name } });

beforeEach(() => {
  fake.sent.length = 0;
  fake.results.length = 0;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('emailHandler: real templates, faked Resend', () => {
  it('renders contactFormNotification.handlebars and sends it from EMAIL_FROM', async () => {
    const ok = await sendContactEmail('admin@example.test', 'New Contact Form Received', 'contactFormNotification', CONTACT);

    expect(ok).toBe(true);
    expect(fake.sent).toHaveLength(1);
    const [sent] = fake.sent;
    expect(sent.to).toBe('admin@example.test');
    expect(sent.from).toMatch(/<hello@example\.test>$/);
    expect(sent.subject).toBe('New Contact Form Received');
    expect(sent.html).toContain('Ada Lovelace');
    expect(sent.html).toContain('ada@example.test');
    expect(sent.html).toContain('Hello from the contact form');
    expect(sent.html).toContain('Test Co');
  });

  it('sets reply-to on a contact notification to the person who sent the form', async () => {
    await sendContactEmail('admin@example.test', 'x', 'contactFormNotification', CONTACT);
    expect(fake.sent[0].replyTo).toBe('ada@example.test');
  });

  it('omits the image block when no image was attached (handlebars {{#if}})', async () => {
    await sendContactEmail('admin@example.test', 'x', 'contactFormNotification', { ...CONTACT, message: 'no image attached' });
    expect(fake.sent[0].html).not.toContain('<img');
  });

  it('returns false (does not throw) for a template that does not exist', async () => {
    const ok = await sendContactEmail('admin@example.test', 'x', 'does-not-exist', {});
    expect(ok).toBe(false);
    expect(fake.sent).toHaveLength(0);
  });

  it('returns false without sending when there is no recipient', async () => {
    const ok = await sendContactEmail(undefined, 'x', 'contactFormNotification', CONTACT);
    expect(ok).toBe(false);
    expect(fake.sent).toHaveLength(0);
  });

  // Waits the real one-second retry delay
  it('retries a Resend server error with the same idempotency key, then succeeds', async () => {
    fake.results.push(failure('internal_server_error', 500));
    const ok = await sendUserEmail('friend@example.test', 'Shared', 'shareEmail', { title: 'Shared', email: 'friend@example.test' });

    expect(ok).toBe(true);
    expect(fake.sent).toHaveLength(2);
    expect(fake.sent[0].options.idempotencyKey).toBeTruthy();
    expect(fake.sent[1].options.idempotencyKey).toBe(fake.sent[0].options.idempotencyKey);
  });

  it('does not retry a validation error or a used-up quota', async () => {
    fake.results.push(failure('validation_error', 422));
    expect(await sendUserEmail('friend@example.test', 'x', 'shareEmail', {})).toBe(false);
    expect(fake.sent).toHaveLength(1);

    fake.sent.length = 0;
    fake.results.push(failure('daily_quota_exceeded', 429));
    expect(await sendUserEmail('friend@example.test', 'x', 'shareEmail', {})).toBe(false);
    expect(fake.sent).toHaveLength(1);
  });

  it('renders the change-email confirmation for the current address, with both addresses and the link', async () => {
    const ok = await sendUserChangeEmailConfirmation('old@example.test', 'Confirm your new email address', 'userChangeEmailConfirmation', {
      title: 'Confirm your new email address',
      email: 'old@example.test',
      newEmail: 'new@example.test',
      confirmationUrl: 'https://example.test/verify-email-address/u1/tok?change=confirm',
      expiryTime: '15 Nov 2026, 10:00',
      businessName: 'Test Co',
      businessUrl: 'https://example.test',
      year: 2026,
    });

    expect(ok).toBe(true);
    const [sent] = fake.sent;
    expect(sent.to).toBe('old@example.test');
    expect(sent.html).toContain('old@example.test');
    expect(sent.html).toContain('new@example.test');
    // Handlebars escapes the link's & and = as entities
    expect(sent.html).toContain('https://example.test/verify-email-address/u1/tok?change&#x3D;confirm');
    expect(sent.html).toContain('15 Nov 2026, 10:00');
  });

  it('escapes a hostile name in the share email body', async () => {
    await sendUserEmail('friend@example.test', 'x', 'shareEmail', { sharerName: '<b>Boss</b>', resourceKind: 'a map' });
    expect(fake.sent[0].html).toContain('&lt;b&gt;Boss&lt;/b&gt; shared a map with you');
    expect(fake.sent[0].html).not.toContain('<b>Boss</b>');
  });
});
