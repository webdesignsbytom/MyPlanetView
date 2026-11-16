// What logs keep (docs/AUDIT.md D5): no share codes, tokens or query values in
// AppEvent.path or the request log, and no email addresses in events.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const saved = vi.hoisted(() => []);
vi.mock('../src/event/events.js', async (importOriginal) => ({
  ...(await importOriginal()),
  createAppEvent: vi.fn(async (event) => {
    saved.push(event);
    return event;
  }),
}));

const { redactUrl } = await import('../src/utils/redactUrl.js');
const { emailRef } = await import('../src/utils/emailRef.js');
const userEvents = await import('../src/event/userUtils.js');
const contactEvents = await import('../src/event/contactUtils.js');
const { createGenericErrorEvent, NotFoundEvent } = await import('../src/event/errorUtils.js');

beforeEach(() => {
  saved.length = 0;
});

describe('redactUrl', () => {
  it('hides share codes, invite tokens and better-auth link tokens in the path', () => {
    expect(redactUrl('/api/shared/K7QX-M2PA-9RTW')).toBe('/api/shared/:code');
    expect(redactUrl('/api/challenges/join/K7QX-M2PA-9RTW')).toBe('/api/challenges/join/:code');
    expect(redactUrl('/api/challenges/0b6c1d6e-1f7a-4a53-9a5e-2f8d6f1c9a10/me')).toBe('/api/challenges/0b6c1d6e-1f7a-4a53-9a5e-2f8d6f1c9a10/me');
    expect(redactUrl('/api/shared/K7QXM2PA9RTW/photos/0b6c1d6e-1f7a-4a53-9a5e-2f8d6f1c9a10')).toBe(
      '/api/shared/:code/photos/0b6c1d6e-1f7a-4a53-9a5e-2f8d6f1c9a10'
    );
    expect(redactUrl('/api/invites/abcDEF123_-xyz')).toBe('/api/invites/:token');
    expect(redactUrl('/api/invites/accept')).toBe('/api/invites/accept');
    expect(redactUrl('/api/auth/reset-password/Tok3n?callbackURL=https%3A%2F%2Fsite%2Freset')).toBe(
      '/api/auth/reset-password/:token?callbackURL=:redacted'
    );
  });

  it('keeps query names but only harmless values', () => {
    expect(redactUrl('/api/auth/verify-email?token=eyJhbGciOi.x.y&callbackURL=/x')).toBe(
      '/api/auth/verify-email?token=:redacted&callbackURL=:redacted'
    );
    expect(redactUrl('/api/maps/m1/photos?country=JP&limit=30&cursor=abc')).toBe('/api/maps/m1/photos?country=JP&limit=30&cursor=abc');
    expect(redactUrl('/api/users/admin?search=ada%40example.test&page=2')).toBe('/api/users/admin?search=:redacted&page=2');
    expect(redactUrl('/api/media-services/get-url?key=myplanetview/contact/anon/x.png')).toBe(
      '/api/media-services/get-url?key=:redacted'
    );
    expect(redactUrl('/x?secretwithoutvalue')).toBe('/x?:redacted');
  });

  it('drops the fragment, leaves plain paths alone and is stable when repeated', () => {
    expect(redactUrl('/api/maps/abc#frag')).toBe('/api/maps/abc');
    expect(redactUrl('/api/countries')).toBe('/api/countries');
    const once = redactUrl('/api/shared/ABCD?token=t');
    expect(redactUrl(once)).toBe(once);
    expect(redactUrl(null)).toBeNull();
    expect(redactUrl(`/api/maps?${'a=b&'.repeat(400)}`).length).toBeLessThanOrEqual(501);
  });
});

describe('emailRef', () => {
  it('is short, stable and case-blind, and never contains the address', () => {
    const ref = emailRef('Ada@Example.test');
    expect(ref).toMatch(/^email#[0-9a-f]{12}$/);
    expect(emailRef(' ada@example.test ')).toBe(ref);
    expect(emailRef('eve@example.test')).not.toBe(ref);
    expect(ref).not.toMatch(/ada|example/);
    expect(emailRef('')).toBeNull();
    expect(emailRef(undefined)).toBeNull();
  });
});

describe('events never keep an email address', () => {
  const ada = { id: 'user-1', email: 'ada@example.test', role: 'USER' };
  const everything = () => JSON.stringify(saved);

  it('user events name people by id', async () => {
    await userEvents.createUserRegisterSuccessEvent({ target: ada });
    await userEvents.createUserGetByIdSuccessEvent({ user: { id: 'admin' }, target: ada });
    await userEvents.createUserUpdateRequestedEvent({ user: ada, next: { email: 'new@example.test' } });
    await userEvents.createUserRegisterRequestedEvent({ email: 'ada@example.test' });
    await userEvents.createUserPasswordResetRequestRequestedEvent({ email: 'ada@example.test' });
    await userEvents.createUserResendVerificationSuccessEvent({ user: ada, userId: ada.id, email: ada.email });
    await userEvents.createUserDeleteRequestedEvent({ user: ada });
    await userEvents.createAdminDeleteUserSuccessEvent({ admin: { id: 'admin' }, target: ada });
    expect(saved).toHaveLength(8);
    expect(everything()).not.toMatch(/@example\.test/);
    expect(saved[0]).toMatchObject({ targetId: 'user-1' });
    expect(saved[3].message).toMatch(/email#[0-9a-f]{12}/);
  });

  it('contact events name the form by id', async () => {
    await contactEvents.createContactCreateRequestedEvent({ user: null, email: 'ada@example.test' });
    await contactEvents.createContactCreateSuccessEvent({ user: null, id: 'form-1', email: 'ada@example.test' });
    expect(everything()).not.toMatch(/@example\.test/);
    expect(saved[1].message).toContain('id=form-1');
  });

  it('an error without a message names the user by id', async () => {
    const event = new NotFoundEvent(ada, 'maps');
    event.message = '';
    await createGenericErrorEvent(event);
    expect(saved[0].message).toBe('An unknown error occurred for user user-1');
    expect(everything()).not.toMatch(/@example\.test/);
  });
});
