// The mock tells a badge's story as the server does (server/src/utils/badgeStories.js): the same
// facts give the same story, badge for badge.
import { beforeEach, describe, expect, it } from 'vitest';
import { STORY_KINDS, badgeStory, mapBadgeStory, mapPlaces, storyBadge, travellerPlaces } from '@/dev/mock/badgeStories';
import { BADGES } from '@/dev/mock/achievements';
import { COUNTRIES } from '@/utils/map/countries';
import * as server from '../../../../../server/src/utils/badgeStories.js';
import { HOME_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const continentByCode = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
const day = (i) => `20${String(10 + Math.floor(i / 12)).padStart(2, '0')}-${String((i % 12) + 1).padStart(2, '0')}-0${(i % 9) + 1}`;
const PLACES = ['GB', 'IE', 'XE', 'XC', 'FR', 'AQ', 'XS', 'XH', 'DK', 'SE', 'NO', 'JP', 'KE', 'MA', 'US', 'BR', 'AU', 'XN', 'NZ', 'EE', 'LV', 'LT'].map(
  (code, i) => ({ code, on: i % 5 === 4 ? null : day(i) }),
);
const STAMPS = ['FR', 'FR', 'IT', 'MT', 'MT', 'JP', 'FR', 'KE'].map((code, i) => ({
  landmarkId: `l-${i}`,
  name: `Landmark ${i}`,
  code,
  isUnesco: i % 2 === 0,
  on: day(i),
  ticked: i === 3,
}));
const ONE_SHOTS = ['lion', 'northern-lights', 'leopard', 'african-elephant', 'puffin', 'african-buffalo', 'rhino', 'trans-siberian'].map((itemKey, i) => ({
  itemKey,
  code: i % 3 ? 'KE' : null,
  on: day(i),
  datePrecision: ['DAY', 'MONTH', 'YEAR'][i % 3],
}));
const THEMES = ['Doors', 'Worst weather', 'Reflections', 'Markets'].map((title, i) => ({ title, month: `2026-0${i + 1}-01`, on: `2026-0${i + 1}-03` }));
const PHOTO = { id: 'p-100', video: false, code: 'FR', addedOn: '2024-01-01', takenOn: null, thumbUrl: null };
const TOTALS = new Map([['FR', 4], ['MT', 3], ['IT', 1], ['JP', 12]]);

describe('a badge’s story in the mock', () => {
  it('names the server’s badges and kinds', () => {
    for (const badge of BADGES) {
      expect(storyBadge(badge.key), badge.key).toEqual(server.storyBadge(badge.key));
      expect(STORY_KINDS[badge.measure], badge.key).toBe(server.STORY_KINDS[badge.measure]);
      expect(storyBadge(badge.key, { traveller: true }), badge.key).toEqual(server.storyBadge(badge.key, { traveller: true }));
    }
    expect(storyBadge('collect-FR-gold')).toEqual(server.storyBadge('collect-FR-gold'));
    expect(storyBadge('countries-7')).toBeNull();
  });

  it('tells every badge’s story as the server does, from the same facts', () => {
    const keys = [...BADGES.map((b) => b.key), 'collect-FR-bronze', 'collect-FR-silver', 'collect-FR-gold', 'collect-MT-silver', 'collect-IT-bronze', 'collect-IT-gold'];
    for (const splitUk of [false, true]) {
      for (const photos of [12, 120]) {
        const facts = { places: PLACES, stamps: STAMPS, oneShots: ONE_SHOTS, themes: THEMES, photos, photo: PHOTO, splitUk, continentByCode, landmarkTotals: TOTALS };
        for (const key of keys) expect(badgeStory(key, facts), `${key} split=${splitUk}`).toEqual(server.badgeStory(key, facts));
      }
    }
  });

  it('orders the map’s places and a traveller’s as the server does', () => {
    const visits = [
      { countryCode: 'JP', status: 'VISITED', firstVisitedOn: null, createdAt: '2026-11-01T10:00:00.000Z' },
      { countryCode: 'FR', status: 'LIVED', firstVisitedOn: '2019-06-01', createdAt: '2026-01-01T00:00:00.000Z' },
      { countryCode: 'PE', status: 'WANT_TO_GO', firstVisitedOn: null, createdAt: '2026-01-01T00:00:00.000Z' },
      { countryCode: 'KE', status: 'VISITED', firstVisitedOn: '2024-03-01', createdAt: '2026-01-01T00:00:00.000Z' },
    ];
    const firstPhotoAt = new Map([['KE', '2023-12-30T12:00:00.000Z']]);
    expect(mapPlaces({ visits, firstPhotoAt })).toEqual(server.mapPlaces({ visits, firstPhotoAt }));
    const trips = [
      { id: 't-2', title: 'Kenya', travellerIds: ['a'], countryCodes: ['KE', 'FR'], startDate: '2023-01-01', endDate: '2023-01-20' },
      { id: 't-1', title: 'Paris', travellerIds: ['a', 'b'], countryCodes: ['FR', 'XS'], startDate: '2019-05-01', endDate: null },
      { id: 't-3', title: 'None', travellerIds: ['a'], countryCodes: ['NO'], startDate: null, endDate: null },
    ];
    for (const who of ['a', 'b']) expect(travellerPlaces(trips, who)).toEqual(server.travellerPlaces(trips, who));
  });

  it('reads the store: the demo couple’s tenth country, and the stamp that earned the first', () => {
    const { story } = mapBadgeStory(HOME_MAP, 'countries-10', { includeHidden: true });
    expect(story).toMatchObject({ kind: 'places', need: 10, earnedWith: 9 });
    expect(story.items.slice(0, 3).map((i) => i.code)).toEqual(['GB', 'IE', 'US']);
    const stamp = mapBadgeStory(HOME_MAP, 'landmarks-1', { includeHidden: true }).story;
    expect(stamp.items[0]).toMatchObject({ code: expect.any(String), name: expect.any(String) });
    expect('thumbUrl' in stamp.items[0]).toBe(true);
  });

  it('knows no badge it doesn’t have, nor a traveller off the map', () => {
    expect(mapBadgeStory(HOME_MAP, 'nope', { includeHidden: true })).toEqual({ badgeNotFound: true });
    expect(mapBadgeStory(HOME_MAP, 'landmarks-1', { includeHidden: true, travellerId: 'trav-test' })).toEqual({ badgeNotFound: true });
    expect(mapBadgeStory(HOME_MAP, 'countries-1', { includeHidden: true, travellerId: 'nobody' })).toEqual({ travellerNotFound: true });
    expect(db().travellers.some((t) => t.id === 'trav-test')).toBe(true);
    expect(mapBadgeStory(HOME_MAP, 'countries-1', { includeHidden: true, travellerId: 'trav-test' }).story.items[0]).toMatchObject({
      trip: { id: expect.any(String), title: expect.any(String) },
    });
  });
});
