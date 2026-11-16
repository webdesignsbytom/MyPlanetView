// The account checks wired into better-auth (src/auth.js), through the real app and
// the real better-auth, with an in-memory database in place of Postgres: the delete
// password, cleaned names, and the change-email confirmation to the current address.
// tests/integration/account.test.js covers the same against Postgres.
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';

// better-auth's own tables, in memory
const db = vi.hoisted(() => ({ user: [], session: [], account: [], verification: [] }));
vi.mock('better-auth/adapters/prisma', async () => {
  const { memoryAdapter } = await import('better-auth/adapters/memory');
  return { prismaAdapter: () => memoryAdapter(db) };
});

// Everything else the auth config touches in Postgres
vi.mock('../src/event/events.js', async (importOriginal) => ({
  ...(await importOriginal()),
  createAppEvent: vi.fn(async () => ({})),
}));
vi.mock('../src/domain/users.js', async (importOriginal) => ({
  ...(await importOriginal()),
  findUserStatusById: vi.fn(async (id) => ({ id, isActive: true })),
  findOwnedAvatarKeys: vi.fn(async () => []),
  clearUserAvatar: vi.fn(async () => {}),
}));
vi.mock('../src/services/travel/maps.js', async (importOriginal) => ({
  ...(await importOriginal()),
  ensureDefaultMap: vi.fn(async () => {}),
}));
vi.mock('../src/services/travel/accounts.js', async (importOriginal) => ({
  ...(await importOriginal()),
  acceptInvitesForVerifiedUser: vi.fn(async () => 0),
  releaseTravelDataForDeletedUser: vi.fn(async () => {}),
}));
// No subscription to end (the cancelling itself: tests/integration/billing.test.js)
vi.mock('../src/services/billing/subscriptions.js', async (importOriginal) => ({
  ...(await importOriginal()),
  endSubscriptionOfDeletedAccount: vi.fn(async () => false),
}));

// Emails are recorded, not sent
const sent = vi.hoisted(() => []);
vi.mock('../src/services/email/emailHandler.js', () => {
  const record = (kind) => async (to, subject, template, context) => {
    sent.push({ kind, to, subject, template, context });
    return true;
  };
  return {
    sendUserEmail: record('user'),
    sendUserVerificationEmail: record('verify'),
    sendUserPasswordResetEmail: record('reset'),
    sendUserChangeEmailConfirmation: record('change-email'),
    sendContactEmail: record('contact'),
  };
});

const { default: app } = await import('../src/server.js');

const { auth } = await import('../src/auth.js');
const { PASSWORD_RULES_MESSAGE } = await import('../src/utils/passwordRules.js');

const ORIGIN = 'http://localhost:5173';
// Meets the password rules (utils/passwordRules.js)
const PASSWORD = 'Unit-Test-Password-1';
const NEW_PASSWORD = 'Another-Password-2';
let counter = 0;
const newEmail = (label) => `auth-hooks-${++counter}-${label}@example.test`;
const userRow = (email) => db.user.find((u) => u.email === email);
const tokenOf = (link) => new URL(link).pathname.split('/').pop();

async function signUp(label, name = label) {
  const email = newEmail(label);
  const agent = request.agent(app).set('Origin', ORIGIN);
  const res = await agent.post('/api/auth/sign-up/email').send({ email, password: PASSWORD, name });
  return { agent, email, res };
}

beforeAll(() => {
  // better-auth and the request logger are chatty
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  sent.length = 0;
});

describe('names', () => {
  it('are cleaned at sign-up: one line, no control characters, 80 at most', async () => {
    const { email, res } = await signUp('named', `  Evil\r\nBcc: x@example.test\u{202E}${'y'.repeat(200)}`);
    expect(res.status).toBe(200);
    const { name } = userRow(email);
    expect(name).toHaveLength(80);
    expect(name.startsWith('Evil Bcc: x@example.test y')).toBe(true);
    expect(name).not.toMatch(/[\r\n\u{202E}]/u);
  });

  it('refuse a sign-up with nothing usable', async () => {
    const { email, res } = await signUp('blank', ' \r\n\t ');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Enter your name.');
    expect(userRow(email)).toBeUndefined();
  });

  it('are cleaned on update-user too, and other fields pass untouched', async () => {
    const { agent, email } = await signUp('renamer');
    expect((await agent.post('/api/auth/update-user').send({ name: ' New\nName ' })).status).toBe(200);
    expect(userRow(email).name).toBe('New Name');

    const bad = await agent.post('/api/auth/update-user').send({ name: '\u0000' });
    expect(bad.status).toBe(400);
    expect(userRow(email).name).toBe('New Name');
  });
});

describe('deleting the account', () => {
  it('needs the password, and the right one', async () => {
    const { agent, email } = await signUp('leaver');

    for (const body of [{}, { password: '' }, { token: 'anything' }]) {
      const res = await agent.post('/api/auth/delete-user').send(body);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Enter your password to delete your account.');
    }
    expect((await agent.post('/api/auth/delete-user').send({ password: 'wrong-password-123' })).status).toBe(400);
    expect(userRow(email)).toBeDefined();

    expect((await agent.post('/api/auth/delete-user').send({ password: PASSWORD })).status).toBe(200);
    expect(userRow(email)).toBeUndefined();
  });
});

describe('changing the email address', () => {
  it('asks a verified account to confirm from its current address first', async () => {
    const { agent, email } = await signUp('mover');
    userRow(email).emailVerified = true;
    sent.length = 0;
    const target = newEmail('moved');

    expect((await agent.post('/api/auth/change-email').send({ newEmail: target })).status).toBe(200);
    await vi.waitFor(() => expect(sent.filter((e) => e.kind === 'change-email')).toHaveLength(1));
    const confirm = sent.find((e) => e.kind === 'change-email');
    expect(confirm).toMatchObject({ to: email, template: 'userChangeEmailConfirmation' });
    expect(confirm.context).toMatchObject({ email, newEmail: target });
    expect(confirm.context.confirmationUrl).toMatch(/\/verify-email-address\/[^/]+\/[^/?]+\?change=confirm$/);
    // Nothing for the new address yet, and no change
    expect(sent.some((e) => e.to === target)).toBe(false);
    expect(userRow(email)).toBeDefined();

    // The current address confirms: the usual verification goes to the new one
    expect((await agent.get(`/api/auth/verify-email?token=${tokenOf(confirm.context.confirmationUrl)}`)).status).toBe(200);
    await vi.waitFor(() => expect(sent.filter((e) => e.to === target && e.kind === 'verify')).toHaveLength(1));
    expect(userRow(email)).toBeDefined();

    // Clicking that makes the change
    const verify = sent.find((e) => e.to === target && e.kind === 'verify');
    expect((await agent.get(`/api/auth/verify-email?token=${tokenOf(verify.context.confirmationUrl)}`)).status).toBe(200);
    expect(userRow(email)).toBeUndefined();
    expect(userRow(target)).toMatchObject({ emailVerified: true });
  });

  it('sends an unverified account straight to the new address', async () => {
    const { agent, email } = await signUp('newmover');
    sent.length = 0;
    const target = newEmail('fresh');

    expect((await agent.post('/api/auth/change-email').send({ newEmail: target })).status).toBe(200);
    await vi.waitFor(() => expect(sent.filter((e) => e.to === target && e.kind === 'verify')).toHaveLength(1));
    expect(sent.some((e) => e.to === email)).toBe(false);
  });
});

describe('passwords', () => {
  const WEAK = ['aaaaaaaa', 'Short-1', 'alllowercase-1', 'NoNumbers-here', 'NoSpecial123', 'Has/Slash-1', `Quote'Mark-1`, String.raw`Back\slash-1`, 'Double"Quote-1'];

  it('refuse a sign-up that breaks the rules, with the rules in the message', async () => {
    for (const password of WEAK) {
      const email = newEmail('weak');
      const res = await request(app)
        .post('/api/auth/sign-up/email')
        .set('Origin', ORIGIN)
        .send({ email, password, name: 'Weak' });
      expect(res.status, password).toBe(400);
      expect(res.body.message).toBe(PASSWORD_RULES_MESSAGE);
      expect(userRow(email)).toBeUndefined();
    }
  });

  it('refuse one over 128 characters', async () => {
    const email = newEmail('long');
    const res = await request(app)
      .post('/api/auth/sign-up/email')
      .set('Origin', ORIGIN)
      .send({ email, password: `Aa1-${'x'.repeat(125)}`, name: 'Long' });
    expect(res.status).toBe(400);
    expect(userRow(email)).toBeUndefined();
  });

  it('apply to change-password', async () => {
    const { agent } = await signUp('changer');
    const weak = await agent.post('/api/auth/change-password').send({ currentPassword: PASSWORD, newPassword: 'password1' });
    expect(weak.status).toBe(400);
    expect(weak.body.message).toBe(PASSWORD_RULES_MESSAGE);

    const ok = await agent.post('/api/auth/change-password').send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(ok.status).toBe(200);
  });

  it('apply to reset-password', async () => {
    const { email } = await signUp('forgetful');
    sent.length = 0;
    expect((await request(app).post('/api/auth/request-password-reset').set('Origin', ORIGIN).send({ email })).status).toBe(200);
    await vi.waitFor(() => expect(sent.filter((e) => e.kind === 'reset')).toHaveLength(1));
    const token = tokenOf(sent.find((e) => e.kind === 'reset').context.resetUrl);

    const weak = await request(app).post('/api/auth/reset-password').set('Origin', ORIGIN).send({ token, newPassword: 'aaaaaaaa' });
    expect(weak.status).toBe(400);
    expect(weak.body.message).toBe(PASSWORD_RULES_MESSAGE);

    // The token wasn't spent by the refused attempt
    const ok = await request(app).post('/api/auth/reset-password').set('Origin', ORIGIN).send({ token, newPassword: NEW_PASSWORD });
    expect(ok.status).toBe(200);
    const signIn = await request(app).post('/api/auth/sign-in/email').set('Origin', ORIGIN).send({ email, password: NEW_PASSWORD });
    expect(signIn.status).toBe(200);
  });

  it('leave server-side sign-ups alone (the seed keeps its simple passwords)', async () => {
    const email = newEmail('seeded');
    await auth.api.signUpEmail({ body: { email, password: '12345678', name: 'Seeded' } });
    expect(userRow(email)).toBeDefined();
  });
});

describe('role and isActive', () => {
  const cookieOf = (res) => (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
  const sessionFor = (cookie) => auth.api.getSession({ headers: new Headers({ cookie }) });

  it('get their defaults at sign-up, whatever the body says', async () => {
    const email = newEmail('climber');
    const res = await request(app)
      .post('/api/auth/sign-up/email')
      .set('Origin', ORIGIN)
      .send({ email, password: PASSWORD, name: 'Climber', role: 'DEVELOPER', isActive: false });
    expect(res.status).toBe(200);
    expect(userRow(email)).toMatchObject({ role: 'USER', isActive: true });
  });

  it('cannot be changed through update-user', async () => {
    const { agent, email } = await signUp('promoter');
    const res = await agent.post('/api/auth/update-user').send({ role: 'ADMIN' });
    expect(res.status).toBe(400);
    expect(userRow(email).role).toBe('USER');
  });

  it('come with the session, read from the database every time (no cookie cache)', async () => {
    const { email, res } = await signUp('reader');
    const cookie = cookieOf(res);

    expect((await sessionFor(cookie)).user).toMatchObject({ email, role: 'USER', isActive: true });
    userRow(email).role = 'ADMIN';
    expect((await sessionFor(cookie)).user.role).toBe('ADMIN');
    userRow(email).isActive = false;
    expect((await sessionFor(cookie)).user.isActive).toBe(false);
  });

  it('decide validateAuthentication: a deactivated user is refused at once', async () => {
    const { validateAuthentication, attachUserIfPresent } = await import('../src/middleware/auth.js');
    const { email, res } = await signUp('gatekeeper');
    const run = async (middleware) => {
      const req = { headers: { cookie: cookieOf(res) } };
      const out = { statusCode: null, body: null, nextCalled: false };
      const resMock = {
        status(code) {
          out.statusCode = code;
          return this;
        },
        json(body) {
          out.body = body;
          return this;
        },
      };
      await middleware(req, resMock, () => {
        out.nextCalled = true;
      });
      return { ...out, user: req.user };
    };

    const allowed = await run(validateAuthentication);
    expect(allowed.nextCalled).toBe(true);
    expect(allowed.user).toMatchObject({ email, role: 'USER', isActive: true });

    userRow(email).isActive = false;
    const refused = await run(validateAuthentication);
    expect(refused.nextCalled).toBe(false);
    expect(refused.statusCode).toBe(403);
    expect(refused.body.message).toBe('This account has been deactivated. Please contact support.');

    // Optional auth: stays anonymous
    const anonymous = await run(attachUserIfPresent);
    expect(anonymous.nextCalled).toBe(true);
    expect(anonymous.user).toBeUndefined();
  });
});
