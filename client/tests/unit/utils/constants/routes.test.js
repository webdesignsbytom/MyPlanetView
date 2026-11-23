import { describe, expect, it } from 'vitest';
import * as routes from '@/utils/constants/routes';

const {
  ANALYTICS_EXCLUDED_PREFIXES,
  ANALYTICS_REDACTED_ROUTES,
  CLIENT_ONLY_ROUTE_PREFIXES,
  PUBLIC_STATIC_ROUTES,
} = routes;

const startsUnder = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

describe('PUBLIC_STATIC_ROUTES', () => {
  it('is the six indexed pages', () => {
    expect(PUBLIC_STATIC_ROUTES).toEqual(['/', '/about', '/faq', '/pricing', '/contact', '/user-agreements']);
  });

  it('has no page that is browser-only', () => {
    for (const route of PUBLIC_STATIC_ROUTES) {
      expect(CLIENT_ONLY_ROUTE_PREFIXES.some((prefix) => startsUnder(route, prefix)), route).toBe(false);
    }
  });
});

describe('CLIENT_ONLY_ROUTE_PREFIXES', () => {
  it('covers every signed-in, admin, share, invite and email-link page', () => {
    expect([...CLIENT_ONLY_ROUTE_PREFIXES].sort()).toEqual(
      [
        '/admin', '/account', '/login', '/sign-up', '/forgot-password', '/verify-email-address', '/reset-password',
        '/down-for-maintenance', '/map', '/maps', '/trips', '/welcome', '/shared', '/invite', '/challenges', '/gifts',
        '/gift', '/import', '/unsubscribe', '/compare', '/embed', '/guess',
      ].sort(),
    );
  });

  it('holds prefixes only, never a parameter', () => {
    for (const prefix of CLIENT_ONLY_ROUTE_PREFIXES) expect(prefix).toMatch(/^\/[a-z-]+$/);
  });

  it('covers every route with a parameter in it', () => {
    const withParams = Object.values(routes).filter((value) => typeof value === 'string' && value.includes('/:'));
    expect(withParams.length).toBeGreaterThan(5);
    for (const route of withParams) {
      expect(CLIENT_ONLY_ROUTE_PREFIXES.some((prefix) => startsUnder(route, prefix)), route).toBe(true);
    }
  });
});

describe('the analytics lists', () => {
  it('pauses analytics on the pages whose address holds a secret', () => {
    expect([...ANALYTICS_EXCLUDED_PREFIXES].sort()).toEqual(
      ['/shared', '/embed', '/guess', '/challenges/join', '/gift', '/unsubscribe', '/invite', '/reset-password', '/verify-email-address'].sort(),
    );
  });

  it('only pauses browser-only pages (a secret page is never pre-rendered)', () => {
    for (const prefix of ANALYTICS_EXCLUDED_PREFIXES) {
      expect(CLIENT_ONLY_ROUTE_PREFIXES.some((clientOnly) => startsUnder(prefix, clientOnly)), prefix).toBe(true);
    }
  });

  it('redacts every route with an id or a secret in its address', () => {
    const withParams = Object.values(routes).filter((value) => typeof value === 'string' && value.includes('/:'));
    expect([...ANALYTICS_REDACTED_ROUTES].sort()).toEqual([...new Set(withParams)].sort());
  });

  it('puts the challenge join link before the challenge page, so a join code is never read as an id', () => {
    expect(ANALYTICS_REDACTED_ROUTES.indexOf('/challenges/join/:code')).toBeLessThan(ANALYTICS_REDACTED_ROUTES.indexOf('/challenges/:challengeId'));
  });
});

describe('the path helpers', () => {
  it('build addresses with their ids encoded', () => {
    expect(routes.mapPath('a b/c')).toBe('/maps/a%20b%2Fc');
    expect(routes.mapPassportPath('m1')).toBe('/maps/m1/passport');
    expect(routes.sharedPassportPath('K7QX-M2PA')).toBe('/shared/K7QX-M2PA/passport');
    expect(routes.sharedPath('K7QX M2PA')).toBe('/shared/K7QX%20M2PA');
    expect(routes.embedPath('K7QX-M2PA')).toBe('/embed/K7QX-M2PA');
    expect(routes.guessPath('GWHR-2WAS')).toBe('/guess/GWHR-2WAS');
    expect(routes.isEmbedPath('/embed/K7QX-M2PA')).toBe(true);
    expect(routes.isEmbedPath('/EMBED/K7QX-M2PA')).toBe(true);
    expect(routes.isEmbedPath('/embedded')).toBe(false);
    expect(routes.isEmbedPath('/shared/K7QX-M2PA')).toBe(false);
    expect(routes.tripPath('t/1')).toBe('/trips/t%2F1');
    expect(routes.challengePath('c1')).toBe('/challenges/c1');
    expect(routes.challengeJoinPath('CHA2-YR5R')).toBe('/challenges/join/CHA2-YR5R');
    expect(routes.giftPath('ABCD EFGH')).toBe('/gift/ABCD%20EFGH');
    expect(routes.comparePath('m&1')).toBe('/compare?a=m%261');
    expect(routes.countryPagePath('spain')).toBe('/countries/spain');
    expect(routes.monthPagePath('june')).toBe('/where-to-go/june');
  });

  it('opens the importer with a map, or without one', () => {
    expect(routes.importPath('m 1')).toBe('/import?map=m%201');
    expect(routes.importPath()).toBe('/import');
  });

  it('points the legal links at the sections of one page', () => {
    expect(routes.TERMS_AND_CONDITIONS_PAGE_URL).toBe(`${routes.LEGAL_AGREEMENTS_PAGE_URL}#terms-and-conditions`);
    expect(routes.PRIVACY_POLICIES_PAGE_URL).toBe(`${routes.LEGAL_AGREEMENTS_PAGE_URL}#privacy-policy`);
  });
});
