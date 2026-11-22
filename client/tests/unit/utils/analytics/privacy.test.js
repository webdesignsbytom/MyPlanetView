import { describe, expect, it } from 'vitest';
import { isAnalyticsExcluded, redactUrl } from '@/utils/analytics/privacy';

const SITE = 'https://myplanetview.com';
const redact = (href) => redactUrl(href, SITE);

describe('isAnalyticsExcluded', () => {
  it('pauses analytics on every page with a secret in its address', () => {
    for (const path of [
      '/shared/K7QX-M2PA-9RTW',
      '/shared/K7QX-M2PA-9RTW/passport',
      '/challenges/join/CHA2-YR5R-DTRP',
      '/gift/ABCD-EFGH-JKLM',
      '/unsubscribe',
      '/invite/token123',
      '/reset-password/u1/t1',
      '/verify-email-address/u1/s1',
    ]) {
      expect(isAnalyticsExcluded(path), path).toBe(true);
    }
  });

  it('finds the secret whatever the case, as the router does', () => {
    expect(isAnalyticsExcluded('/Shared/K7QX-M2PA-9RTW')).toBe(true);
    expect(isAnalyticsExcluded('/INVITE/abc')).toBe(true);
  });

  it('leaves the other pages alone, even ones that start with the same letters', () => {
    for (const path of ['/', '/about', '/map', '/maps/abc', '/challenges', '/challenges/abc', '/gifts', '/sharedfolder', '/invites']) {
      expect(isAnalyticsExcluded(path), path).toBe(false);
    }
  });
});

describe('redactUrl', () => {
  it('turns this site’s secret and id addresses into their route patterns', () => {
    expect(redact(`${SITE}/shared/K7QX-M2PA-9RTW`)).toBe(`${SITE}/shared/:code`);
    expect(redact(`${SITE}/maps/0f9c/passport`)).toBe(`${SITE}/maps/:mapId/passport`);
    expect(redact(`${SITE}/shared/K7QX/passport`)).toBe(`${SITE}/shared/:code/passport`);
    expect(redact(`${SITE}/maps/0f9c`)).toBe(`${SITE}/maps/:mapId`);
    expect(redact(`${SITE}/trips/t-1`)).toBe(`${SITE}/trips/:tripId`);
    expect(redact(`${SITE}/invite/secret-token`)).toBe(`${SITE}/invite/:token`);
    expect(redact(`${SITE}/reset-password/u1/t1`)).toBe(`${SITE}/reset-password/:userId/:token`);
    expect(redact(`${SITE}/verify-email-address/u1/s1`)).toBe(`${SITE}/verify-email-address/:userId/:uniqueString`);
    expect(redact(`${SITE}/gift/ABCD-EFGH-JKLM`)).toBe(`${SITE}/gift/:code`);
  });

  it('tells a challenge’s join link from the challenge itself', () => {
    expect(redact(`${SITE}/challenges/join/CHA2-YR5R-DTRP`)).toBe(`${SITE}/challenges/join/:code`);
    expect(redact(`${SITE}/challenges/c-123`)).toBe(`${SITE}/challenges/:challengeId`);
    expect(redact(`${SITE}/challenges`)).toBe(`${SITE}/challenges`);
  });

  it('covers anything deeper under a pattern without a tail', () => {
    expect(redact(`${SITE}/shared/K7QX/photos/p1`)).toBe(`${SITE}/shared/:code`);
    expect(redact(`${SITE}/maps/0f9c/recap/2026`)).toBe(`${SITE}/maps/:mapId`);
  });

  it('matches the patterns whatever the case', () => {
    expect(redact(`${SITE}/Shared/K7QX-M2PA-9RTW`)).toBe(`${SITE}/shared/:code`);
    expect(redact(`${SITE}/MAPS/abc/Passport`)).toBe(`${SITE}/maps/:mapId/passport`);
  });

  it('keeps a page without an id as it is', () => {
    expect(redact(`${SITE}/about`)).toBe(`${SITE}/about`);
    expect(redact(`${SITE}/`)).toBe(`${SITE}/`);
  });

  it('keeps only the campaign tags of the query, and never the hash', () => {
    expect(redact(`${SITE}/pricing?utm_source=news&token=abc&utm_campaign=xmas#plans`)).toBe(`${SITE}/pricing?utm_source=news&utm_campaign=xmas`);
    expect(redact(`${SITE}/unsubscribe?u=user&t=signed`)).toBe(`${SITE}/unsubscribe`);
    expect(redact(`${SITE}/shared/K7QX?utm_medium=email`)).toBe(`${SITE}/shared/:code?utm_medium=email`);
  });

  it('cuts another site’s address to its origin', () => {
    expect(redact('https://mail.example.com/inbox/42?q=secret')).toBe('https://mail.example.com/');
  });

  it('reads a relative address against this site', () => {
    expect(redact('/maps/abc')).toBe(`${SITE}/maps/:mapId`);
  });

  it('gives nothing for no address, an unreadable one or one with no origin', () => {
    expect(redact('')).toBe('');
    expect(redact(undefined)).toBe('');
    expect(redact('http://')).toBe('');
    expect(redact('data:text/plain,hello')).toBe('');
  });

  it('defaults to the page’s own origin', () => {
    expect(redactUrl(`${window.location.origin}/trips/abc`)).toBe(`${window.location.origin}/trips/:tripId`);
  });
});
