// The better-auth settings production gets (auth.js), read from the real config:
// cookies, the rate limiter on the database, and how it finds the client IP.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Production refuses to load the email module without its keys; nothing is sent here
vi.mock('../src/services/email/emailHandler.js', () => ({
  sendUserEmail: vi.fn(),
  sendUserVerificationEmail: vi.fn(),
  sendUserPasswordResetEmail: vi.fn(),
  sendUserChangeEmailConfirmation: vi.fn(),
  sendContactEmail: vi.fn(),
}));

let auth;
let ctx;

beforeAll(async () => {
  vi.stubEnv('NODE_ENV', 'production');
  ({ auth } = await import('../src/auth.js'));
  ctx = await auth.$context;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('in production', () => {
  it('sets every cookie Secure, SameSite=None, httpOnly, with the __Secure- prefix', () => {
    const { sessionToken, sessionData, dontRememberToken } = ctx.authCookies;
    for (const cookie of [sessionToken, sessionData, dontRememberToken]) {
      expect(cookie.name.startsWith('__Secure-better-auth.')).toBe(true);
      expect(cookie.attributes).toMatchObject({ secure: true, sameSite: 'none', httpOnly: true, path: '/' });
    }
  });

  it('keeps better-auth\'s rate limiter on, in the database, under its own model', () => {
    expect(ctx.rateLimit).toMatchObject({ enabled: true, storage: 'database' });
    expect(auth.options.rateLimit.modelName).toBe('authRateLimit');
    expect(ctx.tables.rateLimit.modelName).toBe('authRateLimit');
    expect(Object.keys(ctx.tables.rateLimit.fields).sort()).toEqual(['count', 'key', 'lastRequest']);
  });

  it('reads the client IP from x-forwarded-for, IPv6 per /64', () => {
    expect(auth.options.advanced.ipAddress).toEqual({ ipAddressHeaders: ['x-forwarded-for'], ipv6Subnet: 64 });
  });

  it('never serves the session from a cookie cache', () => {
    expect(auth.options.session.cookieCache.enabled).toBe(false);
  });

  it('declares role and isActive as user fields nobody can set through better-auth', () => {
    expect(auth.options.user.additionalFields).toMatchObject({
      role: { type: 'string', input: false, defaultValue: 'USER' },
      isActive: { type: 'boolean', input: false, defaultValue: true },
    });
  });
});
