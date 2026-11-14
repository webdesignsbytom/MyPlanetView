import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendContactEmail } from '../src/services/email/emailHandler.js';

// Fake nodemailer transport (real templates still render)
const sentEmails = [];

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => {
      const plugins = {};
      const transporter = {
        use(step, plugin) {
          (plugins[step] ||= []).push(plugin);
          return transporter;
        },
        async sendMail(mailOptions) {
          const mail = { data: { ...mailOptions } };
          for (const plugin of plugins.compile || []) {
            await new Promise((resolve, reject) => {
              plugin(mail, (err) => (err ? reject(err) : resolve()));
            });
          }
          sentEmails.push(mail.data);
          return { messageId: 'test-message-id' };
        },
      };
      return transporter;
    },
  },
}));

beforeEach(() => {
  sentEmails.length = 0;
});

describe('emailHandler — real templates, faked transport', () => {
  it('renders the real contactFormNotification.handlebars with the given data', async () => {
    const ok = await sendContactEmail(
      'admin@example.test',
      'New Contact Form Received',
      'contactFormNotification',
      {
        title: 'New Contact Form Received',
        name: 'Ada Lovelace',
        email: 'ada@example.test',
        message: 'Hello from the contact form',
        businessName: 'Test Co',
        businessUrl: 'https://example.test',
        year: 2026,
      }
    );

    expect(ok).toBe(true);
    expect(sentEmails).toHaveLength(1);

    const [sent] = sentEmails;
    expect(sent.to).toBe('admin@example.test');
    expect(sent.subject).toBe('New Contact Form Received');
    // Template rendered with data
    expect(sent.html).toContain('Ada Lovelace');
    expect(sent.html).toContain('ada@example.test');
    expect(sent.html).toContain('Hello from the contact form');
    expect(sent.html).toContain('Test Co');
  });

  it('omits the image block when no image was attached (handlebars {{#if}})', async () => {
    await sendContactEmail('admin@example.test', 'x', 'contactFormNotification', {
      name: 'Ada Lovelace',
      email: 'ada@example.test',
      message: 'no image attached',
      businessName: 'Test Co',
      businessUrl: 'https://example.test',
      year: 2026,
      // imageUrl deliberately omitted
    });

    const [sent] = sentEmails;
    expect(sent.html).not.toContain('<img');
  });

  it('returns false (does not throw) for a template that does not exist', async () => {
    const ok = await sendContactEmail('admin@example.test', 'x', 'does-not-exist', {});
    expect(ok).toBe(false);
    expect(sentEmails).toHaveLength(0);
  });
});
