// Mocks for the integration tests: only the private bucket's network calls and
// email sending. Presigned URLs are still signed for real (that's local maths).
import { vi } from 'vitest';

// What the "browser" has put in the private bucket: key -> { bytes, contentType }
// and every email "sent". Shared through globalThis so the tests can read them.
vi.hoisted(() => {
  globalThis.__fakeR2 ??= new Map();
  globalThis.__sentEmails ??= [];
});

vi.mock('../../src/services/s3/s3private.js', async (importOriginal) => {
  const actual = await importOriginal();
  const send = async (command) => {
    const name = command?.constructor?.name;
    const key = command?.input?.Key;
    if (name === 'HeadObjectCommand') {
      const stored = globalThis.__fakeR2.get(key);
      if (!stored) {
        const err = new Error('NotFound');
        err.name = 'NotFound';
        err.$metadata = { httpStatusCode: 404 };
        throw err;
      }
      return { ContentLength: stored.bytes, ContentType: stored.contentType };
    }
    if (name === 'DeleteObjectCommand') {
      globalThis.__fakeR2.delete(key);
      return {};
    }
    throw new Error(`Unexpected private-bucket command in a test: ${name}`);
  };
  const client = { send };
  return { ...actual, default: client, s3Private: client };
});

vi.mock('../../src/services/email/emailHandler.js', () => {
  const record = (kind) => async (to, subject, template, context) => {
    globalThis.__sentEmails.push({ kind, to, subject, template, context });
    return true;
  };
  return {
    sendUserEmail: record('user'),
    sendUserVerificationEmail: record('verify'),
    sendUserPasswordResetEmail: record('reset'),
    sendContactEmail: record('contact'),
  };
});
