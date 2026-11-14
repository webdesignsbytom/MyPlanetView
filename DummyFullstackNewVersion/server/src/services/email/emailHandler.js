import 'dotenv/config';
import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
// Constants
import { BusinessName } from '../../utils/constants/siteConstants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT) {
  throw new Error('Environment variable EMAIL_HOST or EMAIL_PORT is missing');
}

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT, 10) || 465;

// Email profiles (mailbox credentials + templates folder)
const EMAIL_PROFILES = {
  userAdmin: {
    userEnv: 'USER_ADMIN_EMAIL',
    passEnv: 'USER_ADMIN_PASS',
    templatesDir: 'users',
  },
  userVerify: {
    userEnv: 'USER_VERIFY_EMAIL',
    passEnv: 'USER_VERIFY_PASS',
    templatesDir: 'users',
  },
  userReset: {
    userEnv: 'USER_RESET_EMAIL',
    passEnv: 'USER_RESET_PASS',
    templatesDir: 'users',
  },
  contact: {
    userEnv: 'CONTACT_ADMIN_EMAIL',
    passEnv: 'CONTACT_ADMIN_PASS',
    templatesDir: 'contact',
  },
};

// Lazily created, cached transporters
const transporterCache = new Map();

function getTransporter(profileKey) {
  if (transporterCache.has(profileKey)) return transporterCache.get(profileKey);

  const profile = EMAIL_PROFILES[profileKey];
  if (!profile) {
    throw new Error(`Unknown email profile: "${profileKey}"`);
  }

  const user = process.env[profile.userEnv];
  const pass = process.env[profile.passEnv];
  if (!user || !pass) {
    throw new Error(
      `Missing ${profile.userEnv}/${profile.passEnv} for email profile "${profileKey}"`
    );
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // SSL for 465, TLS for 587
    auth: { user, pass },
    // Fail fast (nodemailer default is 2 min)
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  transporter.use(
    'compile',
    hbs({
      viewEngine: {
        extname: '.hbs',
        partialsDir: path.join(__dirname, profile.templatesDir),
        defaultLayout: false,
      },
      viewPath: path.join(__dirname, profile.templatesDir),
    })
  );

  const entry = { transporter, fromEmail: user };
  transporterCache.set(profileKey, entry);
  return entry;
}

const MAX_SEND_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1000, 3000]; // wait before attempt 2, then attempt 3

// Retry network-level errors only
const RETRYABLE_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNECTION',
  'ESOCKET',
  'ECONNRESET',
  'EDNS',
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Send email (retries transient failures)
async function sendEmail(profileKey, recipient, subject, template, context = {}) {
  let transporter, fromEmail;
  try {
    ({ transporter, fromEmail } = getTransporter(profileKey));
  } catch (err) {
    console.error(
      `[email:${profileKey}] failed to send "${template}" to ${recipient}:`,
      err
    );
    return false;
  }

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      await transporter.sendMail({
        from: `"${BusinessName}" <${fromEmail}>`,
        to: recipient,
        subject,
        template, // matches the .hbs template file name
        context, // data for template rendering
      });

      console.log(`[email:${profileKey}] sent "${template}" to ${recipient}`);
      return true;
    } catch (err) {
      const willRetry =
        attempt < MAX_SEND_ATTEMPTS && RETRYABLE_ERROR_CODES.has(err?.code);

      console.error(
        `[email:${profileKey}] failed to send "${template}" to ${recipient}` +
          ` (attempt ${attempt}/${MAX_SEND_ATTEMPTS}${willRetry ? ', retrying...' : ''}):`,
        err
      );

      if (!willRetry) return false;
      await sleep(RETRY_DELAY_MS[attempt - 1]);
    }
  }

  return false;
}

// Per-profile send wrappers
export const sendUserEmail = (recipient, subject, template, context) =>
  sendEmail('userAdmin', recipient, subject, template, context);

export const sendUserVerificationEmail = (recipient, subject, template, context) =>
  sendEmail('userVerify', recipient, subject, template, context);

export const sendUserPasswordResetEmail = (recipient, subject, template, context) =>
  sendEmail('userReset', recipient, subject, template, context);

export const sendContactEmail = (recipient, subject, template, context) =>
  sendEmail('contact', recipient, subject, template, context);

