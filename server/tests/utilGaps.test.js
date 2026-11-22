// Exports of pure utils that their own test files don't touch yet: small helpers and the
// constants other rules lean on (the relationships CLAUDE.md promises between them).
import { describe, expect, it } from 'vitest';
import { hasAtLeast, ROLES, SHARE_ROLES, TRIP_SHARE_ROLES, LINK_ACCESS } from '../src/utils/access.js';
import { dayKey, parseChallengeMapId } from '../src/utils/challenges.js';
import { FRONTEND_ORIGINS, parseOrigins } from '../src/utils/config.js';
import { countryAtMapPoint } from '../src/utils/countryLookup.js';
import { projectToMap } from '../src/utils/projection.js';
import { exportUploadView } from '../src/utils/dataExport.js';
import { giftPricePence, GIFT_PLANS } from '../src/utils/gifts.js';
import { isMapLocked, mapSlots } from '../src/utils/mapSlots.js';
import { checkVideoAllowed, checkVideoSizes, checkVideoCap, VIDEO_MESSAGES } from '../src/utils/planLimits.js';
import { isPlanId, isBillingInterval, planOf } from '../src/utils/constants/plans.js';
import { regionCodesOnMap, REGION_KEYS } from '../src/utils/constants/regions.js';
import { sanitizeText, sanitizeEmail, clampInt, coerceBoolean } from '../src/utils/sanitize.js';
import { isEndedStatus, stripeIdOf } from '../src/utils/stripeState.js';
import { maxTravellersFor, isOneOf, isPixelSize, GROUP_TYPES, MAX_TRAVELLERS } from '../src/utils/travelValidation.js';
import { landmarkPlace, UK_NATION_NAMES, UK_NATION_CODES } from '../src/utils/ukNations.js';
import * as media from '../src/utils/constants/mediaConstants.js';
import * as site from '../src/utils/constants/siteConstants.js';

describe('access: hasAtLeast and the role lists', () => {
  it('ranks viewer < editor < co-owner < owner', () => {
    expect(hasAtLeast('OWNER', 'CO_OWNER')).toBe(true);
    expect(hasAtLeast('CO_OWNER', 'EDITOR')).toBe(true);
    expect(hasAtLeast('EDITOR', 'EDITOR')).toBe(true);
    expect(hasAtLeast('EDITOR', 'CO_OWNER')).toBe(false);
    expect(hasAtLeast('VIEWER', 'EDITOR')).toBe(false);
    expect(hasAtLeast(null, 'VIEWER')).toBe(false);
    expect(hasAtLeast(undefined, 'VIEWER')).toBe(false);
  });

  it('never grants the owner role, and a trip has no co-owners', () => {
    expect(SHARE_ROLES).not.toContain(ROLES.OWNER);
    expect(TRIP_SHARE_ROLES).toEqual(['VIEWER', 'EDITOR']);
    expect(Object.values(LINK_ACCESS)).toEqual(['RESTRICTED', 'ANYONE_WITH_LINK']);
  });
});

describe('challenges: dayKey and parseChallengeMapId', () => {
  it('writes a moment as its UTC day', () => {
    expect(dayKey('2026-11-22T23:59:59.999Z')).toBe('2026-11-22');
    expect(dayKey(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01');
  });

  it('takes a map id only when it is a UUID', () => {
    const id = '3f6c1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b';
    expect(parseChallengeMapId(id)).toEqual({ ok: true, mapId: id });
    for (const value of ['map-1', '', null, 42, `${id}x`]) {
      expect(parseChallengeMapId(value)).toEqual({ ok: false, message: 'challengeMapInvalid' });
    }
  });
});

describe('config: FRONTEND_ORIGINS', () => {
  it('is FRONTEND_ORIGIN as origins', () => {
    expect(FRONTEND_ORIGINS).toEqual(parseOrigins(process.env.FRONTEND_ORIGIN));
    expect(FRONTEND_ORIGINS).toContain('http://localhost:5173');
  });
});

describe('countryLookup: countryAtMapPoint', () => {
  const at = (lat, lng) => {
    const { x, y } = projectToMap(lat, lng);
    return countryAtMapPoint(x, y);
  };

  it("finds the country under a point of the map's own drawing", () => {
    expect(at(48.8566, 2.3522)).toBe('FR');
    expect(at(-29.31, 27.48)).toBe('LS');
    expect(at(-26.2, 28.05)).toBe('ZA');
  });

  it('answers null far out at sea', () => {
    expect(at(0, -30)).toBeNull();
    expect(countryAtMapPoint(-500, -500)).toBeNull();
  });
});

describe("dataExport: exportUploadView", () => {
  it("is a photo's export view plus whose map it's on", () => {
    const photo = {
      id: '3f6c1a2b-0000-4000-8000-000000000000',
      mapId: 'map-9',
      map: { name: 'The Morgans', owner: { name: 'Alex' } },
      kind: 'PHOTO',
      caption: null,
      takenAt: new Date('2026-05-01T09:00:00Z'),
      createdAt: new Date('2026-05-02T09:00:00Z'),
      countryCode: 'ES',
      latitude: null,
      longitude: null,
      hidden: false,
      width: 4000,
      height: 3000,
      uploaderId: 'me',
      uploader: { name: 'Me' },
      variants: [],
      landmarks: [],
    };
    expect(exportUploadView(photo, { userId: 'me' })).toMatchObject({ mapId: 'map-9', map: 'The Morgans', mapOwner: 'Alex', uploadedByYou: true, countryCode: 'ES' });
    expect(exportUploadView({ ...photo, map: null }, { userId: 'me' })).toMatchObject({ map: null, mapOwner: null });
  });
});

describe('gifts: giftPricePence', () => {
  it("is a year of the plan at its yearly price", () => {
    for (const plan of GIFT_PLANS) {
      expect(giftPricePence(plan)).toBe(planOf(plan).price.YEAR);
      expect(giftPricePence(plan)).toBeGreaterThan(0);
    }
    expect(giftPricePence('PREMIUM')).toBeGreaterThan(giftPricePence('REGULAR'));
  });
});

describe('mapSlots: isMapLocked', () => {
  it('is true only for the maps beyond the slots', () => {
    const at = (days) => new Date(Date.UTC(2026, 0, days));
    const maps = [
      { id: 'main', isDefault: true, createdAt: at(1) },
      { id: 'two', isDefault: false, createdAt: at(2) },
      { id: 'three', isDefault: false, createdAt: at(3) },
      { id: 'four', isDefault: false, createdAt: at(4) },
    ];
    const slots = mapSlots({ maps, extraMapsPaid: 0, now: at(10) });
    expect(isMapLocked('main', slots)).toBe(false);
    expect(isMapLocked('four', slots)).toBe(true);
    expect(isMapLocked('elsewhere', slots)).toBe(false);
    expect(isMapLocked('four', mapSlots({ maps, extraMapsPaid: 1, now: at(10) }))).toBe(false);
  });
});

describe('planLimits: videos', () => {
  it('lets only First Class maps take videos', () => {
    expect(checkVideoAllowed('PREMIUM')).toBeNull();
    expect(checkVideoAllowed('REGULAR')).toBe(VIDEO_MESSAGES.notOnPlan);
    expect(checkVideoAllowed('FREE')).toBe(VIDEO_MESSAGES.notOnPlan);
    expect(checkVideoAllowed('NOT_A_PLAN')).toBe(VIDEO_MESSAGES.notOnPlan);
  });

  it('wants exactly a THUMB, a DISPLAY and the ORIGINAL', () => {
    expect(checkVideoSizes(['ORIGINAL', 'THUMB', 'DISPLAY'])).toBeNull();
    for (const sizes of [['THUMB', 'DISPLAY'], ['THUMB', 'DISPLAY', 'PRINT'], ['THUMB', 'DISPLAY', 'ORIGINAL', 'PRINT'], ['THUMB', 'THUMB', 'ORIGINAL'], []]) {
      expect(checkVideoSizes(sizes)).toBe(VIDEO_MESSAGES.sizes);
    }
  });

  it('caps videos per country apart from photos, with no upgrade line', () => {
    const cap = planOf('PREMIUM').limits.videosPerCountry;
    expect(cap).toBe(20);
    expect(checkVideoCap({ count: cap - 1, planId: 'PREMIUM', countryName: 'Iceland' })).toBeNull();
    expect(checkVideoCap({ count: cap, planId: 'PREMIUM', countryName: 'Iceland' })).toBe('20 of 20 videos of Iceland on this map.');
    expect(checkVideoCap({ count: cap - 1, adding: 2, planId: 'PREMIUM' })).toBe('19 of 20 videos with no country on this map.');
    expect(checkVideoCap({ count: 25, planId: 'PREMIUM', countryName: 'Iceland' })).toBe('20 of 20 videos of Iceland on this map.');
  });
});

describe('plans: isPlanId and isBillingInterval', () => {
  it('know the three plans and the two intervals, in capitals only', () => {
    for (const plan of ['FREE', 'REGULAR', 'PREMIUM']) expect(isPlanId(plan)).toBe(true);
    for (const value of ['premium', 'GOLD', '', null, 1]) expect(isPlanId(value)).toBe(false);
    expect(isBillingInterval('MONTH')).toBe(true);
    expect(isBillingInterval('YEAR')).toBe(true);
    for (const value of ['month', 'WEEK', undefined]) expect(isBillingInterval(value)).toBe(false);
  });
});

describe('regions: regionCodesOnMap', () => {
  it("gives the British Isles the UK's nations on a split map, and the UK otherwise", () => {
    expect(regionCodesOnMap('british-isles', false)).toEqual(['GB', 'IE']);
    expect(regionCodesOnMap('british-isles', true)).toEqual(['XE', 'XC', 'XW', 'XI', 'IE']);
  });

  it('gives a region without a split list the same codes either way', () => {
    const other = REGION_KEYS.find((key) => key !== 'british-isles');
    expect(regionCodesOnMap(other, true)).toEqual(regionCodesOnMap(other, false));
    expect(regionCodesOnMap(other, false).length).toBeGreaterThan(0);
  });
});

describe('sanitize: sanitizeText, sanitizeEmail, clampInt, coerceBoolean', () => {
  it('strips tags and control characters, trims and cuts to length, null when nothing is left', () => {
    expect(sanitizeText('  <b>Hello</b>\u0007 world ')).toBe('Hello world');
    expect(sanitizeText('Line one\nline two\ttab')).toBe('Line one\nline two\ttab');
    expect(sanitizeText('abcdef', { maxLength: 3 })).toBe('abc');
    expect(sanitizeText(42)).toBe('42');
    for (const value of [null, undefined, '', '   ', '<i></i>']) expect(sanitizeText(value)).toBeNull();
  });

  it('lower-cases a cleaned email field', () => {
    expect(sanitizeEmail(' Ada@Example.TEST ')).toBe('ada@example.test');
    expect(sanitizeEmail('')).toBeNull();
    expect(sanitizeEmail('x'.repeat(400)).length).toBe(320);
  });

  it('clamps whole numbers, with a fallback for anything else', () => {
    const range = { min: 1, max: 100, fallback: 20 };
    expect(clampInt('5', range)).toBe(5);
    expect(clampInt('5000', range)).toBe(100);
    expect(clampInt('-3', range)).toBe(1);
    expect(clampInt('7.9', range)).toBe(7);
    for (const value of [undefined, null, '', 'many']) expect(clampInt(value, range)).toBe(20);
  });

  it('reads true and false from query strings, else the fallback', () => {
    for (const value of [true, 'true', '1']) expect(coerceBoolean(value, false)).toBe(true);
    for (const value of [false, 'false', '0']) expect(coerceBoolean(value, true)).toBe(false);
    expect(coerceBoolean('yes')).toBe(true);
    expect(coerceBoolean(undefined, false)).toBe(false);
  });
});

describe('stripeState: isEndedStatus and stripeIdOf', () => {
  it('counts only canceled and incomplete_expired as ended', () => {
    expect(isEndedStatus('canceled')).toBe(true);
    expect(isEndedStatus('incomplete_expired')).toBe(true);
    for (const status of ['active', 'trialing', 'past_due', 'incomplete', 'unpaid', undefined]) expect(isEndedStatus(status)).toBe(false);
  });

  it("reads an id from a string or an expanded object", () => {
    expect(stripeIdOf('cus_1')).toBe('cus_1');
    expect(stripeIdOf({ id: 'sub_1', status: 'active' })).toBe('sub_1');
    expect(stripeIdOf(null)).toBeNull();
    expect(stripeIdOf({})).toBeNull();
  });
});

describe('travelValidation: maxTravellersFor, isOneOf, isPixelSize', () => {
  it('gives each kind of map its room', () => {
    expect(maxTravellersFor('SOLO')).toBe(1);
    expect(maxTravellersFor('COUPLE')).toBe(2);
    expect(maxTravellersFor('FAMILY')).toBe(MAX_TRAVELLERS);
    expect(maxTravellersFor('UNKNOWN')).toBe(MAX_TRAVELLERS);
  });

  it('matches a string in a list exactly', () => {
    expect(isOneOf('COUPLE', GROUP_TYPES)).toBe(true);
    expect(isOneOf('couple', GROUP_TYPES)).toBe(false);
    expect(isOneOf(['COUPLE'], GROUP_TYPES)).toBe(false);
  });

  it('takes a whole number of pixels from 1 to 100,000', () => {
    for (const value of [1, 4000, 100000]) expect(isPixelSize(value)).toBe(true);
    for (const value of [0, -1, 100001, 1.5, '4000', null]) expect(isPixelSize(value)).toBe(false);
  });
});

describe("ukNations: landmarkPlace and the nations' names", () => {
  const BIG_BEN = { countryCode: 'GB', latitude: 51.5007, longitude: -0.1246 };
  const EDINBURGH_CASTLE = { countryCode: 'GB', latitude: 55.9486, longitude: -3.1999 };

  it("puts a UK landmark in its nation on a split map, and in the UK otherwise", () => {
    expect(landmarkPlace(BIG_BEN, true)).toBe('XE');
    expect(landmarkPlace(EDINBURGH_CASTLE, true)).toBe('XC');
    expect(landmarkPlace(BIG_BEN, false)).toBe('GB');
  });

  it('leaves a landmark elsewhere in its country', () => {
    expect(landmarkPlace({ countryCode: 'FR', latitude: 48.8584, longitude: 2.2945 }, true)).toBe('FR');
  });

  it('names every nation', () => {
    expect(Object.keys(UK_NATION_NAMES).sort()).toEqual([...UK_NATION_CODES].sort());
  });
});

describe('media and site constants', () => {
  it('saves a photo before the clean-up could take its files', () => {
    expect(media.PHOTO_SAVE_WINDOW_MINUTES).toBeLessThan(media.ORPHAN_PHOTO_AGE_MINUTES);
    expect(media.PHOTO_UPLOAD_URL_TTL_SECONDS).toBeLessThan(media.PHOTO_SAVE_WINDOW_MINUTES * 60);
    expect(media.PHOTO_URL_TTL_SECONDS).toBe(2 * 60 * 60);
    expect(media.UNCONFIRMED_UPLOAD_LIMIT).toEqual({ photo: 60, generic: 20 });
  });

  it('gives every photo type an extension, and never HEIC or SVG', () => {
    for (const types of Object.values(media.PHOTO_CONTENT_TYPES)) {
      for (const type of types) expect(media.PHOTO_EXTENSIONS[type], type).toBeTruthy();
    }
    for (const type of media.VIDEO_CONTENT_TYPES) expect(media.PHOTO_EXTENSIONS[type], type).toBeTruthy();
    expect(JSON.stringify(media.PHOTO_CONTENT_TYPES)).not.toMatch(/heic|svg/i);
    expect(media.PHOTO_CONTENT_TYPES.PRINT).toEqual(['image/jpeg']);
    expect(media.BucketNamespace).toBe('myplanetview');
    expect(media.MAX_UPLOAD_BYTES.IMAGE).toBe(5 * 1024 * 1024);
    expect(media.VIDEO_MAX_BYTES).toBe(500 * 1024 * 1024);
  });

  it("builds every link from the site's address (the local one outside production)", () => {
    expect(site.FrontendUrl).toBe('http://localhost:5173');
    expect(site.BusinessSiteUrl).toBe(`https://${site.BusinessUrl}`);
    expect(site.LogoUrl).toBe(`${site.BusinessSiteUrl}/brand/logo.png`);
    expect(site.UserEmailVerificationUrl).toBe('http://localhost:5173/verify-email-address');
    expect(site.UserResetPasswordUrl).toBe('http://localhost:5173/reset-password');
    expect(site.SharedPageUrl).toBe('http://localhost:5173/shared');
    expect(site.InviteAcceptUrl).toBe('http://localhost:5173/invite');
    expect(site.MapPageUrl).toBe('http://localhost:5173/maps');
    expect(site.TripPageUrl).toBe('http://localhost:5173/trips');
  });
});
