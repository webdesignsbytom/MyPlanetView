import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as apiRoutes from '@/utils/constants/apiRoutes';
import * as brand from '@/utils/constants/brandColours';
import * as constants from '@/utils/constants/constants';
import * as links from '@/utils/constants/links';
import * as clientPlans from '@/utils/constants/plans';
import * as clientRegions from '@/utils/constants/regions';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
// The server's copies, which the client's must match
import * as serverPlans from '../../../../../server/src/utils/constants/plans.js';
import * as serverRegions from '../../../../../server/src/utils/constants/regions.js';
import { BusinessUrl } from '../../../../../server/src/utils/constants/siteConstants.js';

const HEX = /^#[0-9a-f]{6}$/;

describe('apiRoutes', () => {
  const paths = Object.entries(apiRoutes).filter(([, value]) => typeof value === 'string');

  it('puts every endpoint under /api, but the offer cards’ /go', () => {
    for (const [name, path] of paths) {
      if (name === 'OFFER_CLICK_PATH') expect(path).toBe('/go');
      else expect(path, name).toMatch(/^\/api\/[a-z0-9/-]+$/);
    }
  });

  it('never names one endpoint twice', () => {
    const values = paths.map(([, path]) => path);
    expect(new Set(values).size).toBe(values.length);
  });

  it('uses better-auth’s own paths for the account actions', () => {
    for (const name of ['LOGIN_EMAIL_API', 'SIGNOUT_API', 'REGISTER_API', 'VERIFY_EMAIL_API', 'DELETE_ACCOUNT_API']) {
      expect(apiRoutes[name]).toMatch(/^\/api\/auth\//);
    }
  });

  it('encodes an invite token in its address', () => {
    expect(apiRoutes.inviteApi('a/b c')).toBe('/api/invites/a%2Fb%20c');
  });
});

describe('brandColours', () => {
  // Each token's light-mode value, as index.css first defines it
  const css = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/index.css'), 'utf8');
  const light = (token) => {
    const match = new RegExp(`--${token}:\\s*([^;]+);`).exec(css);
    if (!match) throw new Error(`No --${token} in index.css`);
    const value = match[1].trim();
    return (/^light-dark\(\s*([^,]+),/.exec(value)?.[1] ?? value).trim().toLowerCase();
  };

  it('keeps the page colours in step with the light-mode tokens', () => {
    expect(brand.BRAND_RED).toBe(light('colour6'));
    expect(brand.BRAND_GROUND).toBe(light('colour1'));
  });

  it('draws the share card in the World map’s and the poster’s light-mode colours', () => {
    const card = brand.SHARE_CARD_COLOURS;
    expect(card.frame).toBe(light('poster-red-deep'));
    expect(card.paper).toBe(light('paper-cream'));
    expect(card.strip).toBe(light('poster-paper'));
    expect(card.brown).toBe(light('poster-brown'));
    expect(card.ink).toBe(light('poster-ink'));
    expect(card.sea).toBe(light('map-sea'));
    expect(card.land).toBe(light('map-land'));
    expect(card.landEdge).toBe(light('map-land-edge'));
    expect(card.ice).toBe(light('map-ice'));
    expect(card.iceEdge).toBe(light('map-ice-edge'));
    expect(card.visits).toEqual([1, 2, 3, 4, 5, 6, 7].map((n) => light(`map-visit-${n}`)));
    // A country collection's medal (24 Nov 2026): the medals' tokens, and the poster's two reds
    for (const tier of ['bronze', 'silver', 'gold']) {
      expect(card.medals[tier]).toEqual({ face: light(`medal-${tier}`), rim: light(`medal-${tier}-edge`) });
    }
    expect(card.ribbon).toEqual([light('poster-red-deep'), light('poster-red')]);
    // A badge's sticker (25 Nov 2026): BadgeSticker's poster colours
    expect(card.sticker).toEqual({
      ring: light('poster-red'),
      face: light('poster-paper'),
      ink: light('poster-red-deep'),
      tick: light('poster-red'),
      tickInk: light('poster-cream'),
    });
  });

  it('has only six-digit hex colours, fixed', () => {
    const all = [
      brand.BRAND_RED,
      brand.BRAND_GROUND,
      brand.BRAND_GROUND_DARK,
      // Every colour however deep it's kept (the medals' metals, the sticker's parts)
      ...[brand.SHARE_CARD_COLOURS].flatMap(function colours(value) {
        return value && typeof value === 'object' ? Object.values(value).flatMap(colours) : [value];
      }),
      ...Object.values(brand.POSTER_COLOURS.atlas),
      ...Object.values(brand.POSTER_COLOURS.paper),
      ...Object.values(brand.COMPARE_COLOURS),
    ];
    for (const colour of all) expect(colour).toMatch(HEX);
    expect(Object.isFrozen(brand.SHARE_CARD_COLOURS)).toBe(true);
    expect(Object.isFrozen(brand.POSTER_COLOURS.paper)).toBe(true);
  });

  it('gives the two poster looks the same keys, and the compare groups three different hues', () => {
    expect(Object.keys(brand.POSTER_COLOURS.paper).sort()).toEqual(Object.keys(brand.POSTER_COLOURS.atlas).sort());
    expect(new Set(Object.values(brand.COMPARE_COLOURS)).size).toBe(3);
  });
});

describe('constants', () => {
  it('uses the same host as the server', () => {
    expect(constants.FULL_BUSINESS_URL).toBe(`https://${BusinessUrl}`);
    expect(constants.SHORT_BUSINESS_URL).toBe(BusinessUrl);
    expect(new URL(constants.FULL_BUSINESS_URL).host).toBe(constants.DISPLAY_BUSINESS_URL);
  });

  it('takes its theme colours from the brand file', () => {
    expect(constants.THEME_COLOUR).toBe(brand.BRAND_RED);
    expect(constants.THEME_COLOUR_DARK).toBe(brand.BRAND_GROUND_DARK);
    expect(constants.BACKGROUND_COLOUR).toBe(brand.BRAND_GROUND);
  });

  it('lists the address without empty lines', () => {
    expect(constants.ADDRESS_LINES).toEqual(['Byte Toast Studio', '70 Monksmead', 'Tavistock', 'Devon', 'PL19 8ER', 'United Kingdom']);
    expect(constants.ADDRESS_LINES.every(Boolean)).toBe(true);
  });

  it('builds the structured data ids and share images on the site’s host', () => {
    expect(constants.ORG_ID).toBe(`${constants.FULL_BUSINESS_URL}/#org`);
    expect(constants.WEBSITE_ID).toBe(`${constants.FULL_BUSINESS_URL}/#website`);
    for (const url of Object.values(constants.PAGE_MEDIA)) expect(url.startsWith(`${constants.FULL_BUSINESS_URL}/`)).toBe(true);
    expect(constants.PageMediaHelper('errorPreview')).toBe(constants.PAGE_MEDIA.errorPreview);
    expect(constants.PageMediaHelper('nothing-like-it')).toBe(`${constants.FULL_BUSINESS_URL}/brand/og-default.jpg`);
  });

  it('keeps the e-mail address on the site’s domain', () => {
    expect(constants.CompanyEmailAddress.endsWith(`@${constants.SHORT_BUSINESS_URL}`)).toBe(true);
  });
});

describe('links', () => {
  it('is an empty string or an https address for every link', () => {
    const values = Object.values(links).filter((value) => typeof value === 'string');
    expect(values.length).toBeGreaterThan(10);
    for (const value of values) expect(value === '' || /^https:\/\//.test(value)).toBe(true);
  });

  it('only puts real profile addresses in sameAs (there are none yet)', () => {
    expect(links.SOCIAL_URLS).toEqual([]);
  });
});

describe('plans', () => {
  it('is the same as the server’s copy, export for export', () => {
    const shared = Object.keys(serverPlans);
    expect(Object.keys(clientPlans).sort()).toEqual(shared.sort());
    for (const name of shared) {
      if (typeof serverPlans[name] === 'function') continue;
      expect(clientPlans[name], name).toEqual(serverPlans[name]);
    }
  });

  it('answers its helpers as the server does', () => {
    for (const id of ['FREE', 'REGULAR', 'PREMIUM', 'NOPE', undefined]) {
      expect(clientPlans.planOf(id)).toEqual(serverPlans.planOf(id));
      expect(clientPlans.planView(id)).toEqual(serverPlans.planView(id));
      expect(clientPlans.isTopPlan(id)).toBe(serverPlans.isTopPlan(id));
      expect(clientPlans.extraMapPriceText(id)).toBe(serverPlans.extraMapPriceText(id));
      expect(clientPlans.isPlanId(id)).toBe(serverPlans.isPlanId(id));
    }
    expect(clientPlans.pricesView()).toEqual(serverPlans.pricesView());
  });

  it('formats pence as pounds, whole pounds without pence', () => {
    expect(clientPlans.formatPence(399)).toBe('£3.99');
    expect(clientPlans.formatPence(3900)).toBe('£39');
    expect(clientPlans.formatPence(0)).toBe('£0');
    expect(clientPlans.formatPence(450)).toBe('£4.50');
  });

  it('ranks the plans, counts unknown ones as Economy and checks ids and intervals', () => {
    expect(clientPlans.planOf('NOPE').id).toBe('FREE');
    expect(clientPlans.isTopPlan('PREMIUM')).toBe(true);
    expect(clientPlans.isTopPlan('REGULAR')).toBe(false);
    expect(clientPlans.isPlanId('REGULAR')).toBe(true);
    expect(clientPlans.isPlanId('regular')).toBe(false);
    expect(clientPlans.isBillingInterval('YEAR')).toBe(true);
    expect(clientPlans.isBillingInterval(12)).toBe(false);
    expect(clientPlans.extraMapPriceText('PREMIUM')).toBe('An extra map costs £5.99 a month or £59 a year.');
    expect(clientPlans.planView('REGULAR')).toMatchObject({ id: 'REGULAR', name: 'Business', photosPerCountry: 200, keepsOriginals: true });
  });

  it('gives two free Economy maps beside the main one', () => {
    expect(clientPlans.FREE_ECONOMY_MAPS).toBe(clientPlans.FREE_MAPS - clientPlans.INCLUDED_MAPS);
    expect(clientPlans.FREE_ECONOMY_MAPS).toBe(2);
  });
});

describe('regions', () => {
  it('is the same as the server’s copy', () => {
    expect(clientRegions.REGIONS).toEqual(serverRegions.REGIONS);
    expect(clientRegions.REGION_KEYS).toEqual(serverRegions.REGION_KEYS);
    expect(clientRegions.INHABITED_CONTINENTS).toEqual(serverRegions.INHABITED_CONTINENTS);
  });

  it('names only places on the map, each once', () => {
    for (const [key, region] of Object.entries(clientRegions.REGIONS)) {
      for (const code of [...region.codes, ...(region.splitUkCodes || [])]) expect(COUNTRY_BY_CODE[code], `${key}: ${code}`).toBeDefined();
      expect(new Set(region.codes).size, key).toBe(region.codes.length);
    }
  });

  it('gives a region’s nations only on a map that splits the UK', () => {
    expect(clientRegions.regionCodesOnMap('british-isles', true)).toEqual(['XE', 'XC', 'XW', 'XI', 'IE']);
    expect(clientRegions.regionCodesOnMap('british-isles', false)).toEqual(['GB', 'IE']);
    expect(clientRegions.regionCodesOnMap('benelux', true)).toEqual(['BE', 'LU', 'NL']);
    expect(clientRegions.regionCodesOnMap('benelux', true)).toEqual(serverRegions.regionCodesOnMap('benelux', true));
  });
});
