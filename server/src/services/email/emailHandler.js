import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Constants
import { BusinessName } from '../../utils/constants/siteConstants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Email goes out through Resend (resend.com). It needs RESEND_API_KEY and EMAIL_FROM, an
// address on a domain verified in Resend. Until myplanetview.com is verified there,
// EMAIL_FROM=onboarding@resend.dev works, but only delivers to the Resend account's own address.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const canSend = Boolean(RESEND_API_KEY && EMAIL_FROM);

// Production refuses to start without them, so a deploy can't quietly drop every email.
// Locally the server starts anyway, and each email is logged instead of sent.
if (process.env.NODE_ENV === 'production' && !canSend) {
  throw new Error('RESEND_API_KEY and EMAIL_FROM must be set to send email');
}

// Each kind of email and the folder its templates live in
const EMAIL_PROFILES = {
  userAdmin: { templatesDir: 'users' }, // share invites
  userVerify: { templatesDir: 'users' },
  userReset: { templatesDir: 'users' },
  userChangeEmail: { templatesDir: 'users' }, // to the current address before an email change
  memories: { templatesDir: 'users' }, // "On this day" (docs/API.md "Emails"), with an unsubscribe link
  contact: { templatesDir: 'contact' },
};

// The Resend SDK and Handlebars load on the first email, not at start-up: most requests
// send none, and both slow a cold start.
let clientPromise = null;
const getClient = () =>
  (clientPromise ??= import('resend')
    .then(({ Resend }) => new Resend(RESEND_API_KEY))
    .catch((err) => {
      clientPromise = null;
      throw err;
    }));

let handlebarsPromise = null;
const getHandlebars = () =>
  (handlebarsPromise ??= import('handlebars')
    .then((mod) => mod.default ?? mod)
    .catch((err) => {
      handlebarsPromise = null;
      throw err;
    }));

// Compiled templates, by file. Template names come from the code, never from a request.
const TEMPLATE_NAME = /^[A-Za-z0-9-]+$/;
const templateCache = new Map();

async function renderTemplate(templatesDir, template, context) {
  if (!TEMPLATE_NAME.test(template)) throw new Error(`Bad template name: "${template}"`);
  const file = path.join(__dirname, templatesDir, `${template}.handlebars`);
  let compiled = templateCache.get(file);
  if (!compiled) {
    const Handlebars = await getHandlebars();
    compiled = Handlebars.compile(await fs.readFile(file, 'utf8'));
    templateCache.set(file, compiled);
  }
  return compiled(context);
}

// The links a person acts on, logged when running locally without Resend (to verify a
// test account, say)
const ACTION_LINKS = ['confirmationUrl', 'resetUrl', 'actionUrl'];

function logInsteadOfSending(profileKey, recipient, subject, context) {
  console.log(`[email:${profileKey}] not sent (no RESEND_API_KEY / EMAIL_FROM): "${subject}" to ${recipient}`);
  for (const key of ACTION_LINKS) {
    if (context[key]) console.log(`  ${key}: ${context[key]}`);
  }
}

const MAX_SEND_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1000, 3000]; // wait before attempt 2, then attempt 3

// Retry what may pass a moment later: network failures, Resend's rate limit and its own
// errors. Never a quota, address, key or validation error.
const isRetryable = (error) =>
  error.statusCode == null || error.statusCode >= 500 || error.name === 'rate_limit_exceeded';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Send one email. Never throws: returns true once Resend accepts it, false otherwise.
async function sendEmail(profileKey, recipient, subject, template, context = {}, { replyTo, headers } = {}) {
  let html;
  try {
    const profile = EMAIL_PROFILES[profileKey];
    if (!profile) throw new Error(`Unknown email profile: "${profileKey}"`);
    if (!recipient) throw new Error('No recipient');
    html = await renderTemplate(profile.templatesDir, template, context);
  } catch (err) {
    console.error(`[email:${profileKey}] failed to send "${template}" to ${recipient}:`, err);
    return false;
  }

  if (!canSend) {
    logInsteadOfSending(profileKey, recipient, subject, context);
    return false;
  }

  const payload = {
    from: `${BusinessName} <${EMAIL_FROM}>`,
    to: recipient,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
    // List-Unsubscribe and its one-click partner, on emails people can stop (docs/API.md "Emails")
    ...(headers ? { headers } : {}),
  };
  // One key for every attempt, so a retry after a lost reply can't send the email twice
  const idempotencyKey = `${profileKey}-${template}-${crypto.randomUUID()}`;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    let error;
    try {
      ({ error } = await (await getClient()).emails.send(payload, { idempotencyKey }));
    } catch (err) {
      error = { name: 'application_error', statusCode: null, message: err?.message || String(err) };
    }

    if (!error) {
      console.log(`[email:${profileKey}] sent "${template}" to ${recipient}`);
      return true;
    }

    const willRetry = attempt < MAX_SEND_ATTEMPTS && isRetryable(error);
    console.error(
      `[email:${profileKey}] failed to send "${template}" to ${recipient}` +
        ` (attempt ${attempt}/${MAX_SEND_ATTEMPTS}${willRetry ? ', retrying...' : ''}):`,
      `${error.name} ${error.statusCode ?? ''} ${error.message}`.trim()
    );
    if (!willRetry) return false;
    await sleep(RETRY_DELAY_MS[attempt - 1]);
  }

  return false;
}

// Per-profile send wrappers (the rest of the server only uses these)
export const sendUserEmail = (recipient, subject, template, context) =>
  sendEmail('userAdmin', recipient, subject, template, context);

export const sendUserVerificationEmail = (recipient, subject, template, context) =>
  sendEmail('userVerify', recipient, subject, template, context);

export const sendUserPasswordResetEmail = (recipient, subject, template, context) =>
  sendEmail('userReset', recipient, subject, template, context);

export const sendUserChangeEmailConfirmation = (recipient, subject, template, context) =>
  sendEmail('userChangeEmail', recipient, subject, template, context);

// "On this day" (docs/API.md "Emails"): `headers` carries List-Unsubscribe
export const sendMemoryEmail = (recipient, subject, template, context, { headers } = {}) =>
  sendEmail('memories', recipient, subject, template, context, { headers });

// Replying to a contact-form notification goes to the person who sent the form
export const sendContactEmail = (recipient, subject, template, context = {}) =>
  sendEmail('contact', recipient, subject, template, context, {
    replyTo: typeof context.email === 'string' && context.email.includes('@') ? context.email : undefined,
  });
