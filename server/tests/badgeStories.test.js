import { describe, it, expect } from 'vitest';
import { STORY_KINDS, badgeStory, mapPlaces, oneShotItems, stampItems, storyBadge, travellerPlaces } from '../src/utils/badgeStories.js';
import { BADGES } from '../src/utils/badges.js';


const continentByCode = new Map([
  ['FR', 'EUROPE'], ['DK', 'EUROPE'], ['NO', 'EUROPE'], ['SE', 'EUROPE'], ['IE', 'EUROPE'], ['GB', 'EUROPE'],
  ['XE', 'EUROPE'], ['XC', 'EUROPE'], ['XW', 'EUROPE'], ['XI', 'EUROPE'],
  ['JP', 'ASIA'], ['KE', 'AFRICA'], ['US', 'NORTH_AMERICA'], ['XH', null], ['BR', 'SOUTH_AMERICA'], ['AU', 'OCEANIA'],
  ['AQ', 'ANTARCTICA'], ['XS', 'ANTARCTICA'],
]);
const place = (code, on = null) => ({ code, on });
const codes = (story) => story.items.map((item) => item.code);

describe('storyBadge', () => {
  it('names every fixed badge and a country collection’s tier, and nothing else', () => {
    for (const badge of BADGES) expect(storyBadge(badge.key)?.key, badge.key).toBe(badge.key);
    for (const badge of BADGES) expect(STORY_KINDS[badge.measure], badge.key).toBeTruthy();
    expect(storyBadge('collect-IT-gold')).toEqual({ key: 'collect-IT-gold', group: 'collections', measure: 'collection', place: 'IT', tier: 'gold' });
    expect(storyBadge('countries-7')).toBeNull();
    expect(storyBadge('collect-it-gold')).toBeNull();
    expect(storyBadge('')).toBeNull();
  });

  it('gives one traveller only the travel badges', () => {
    expect(storyBadge('continent-europe', { traveller: true })?.key).toBe('continent-europe');
    expect(storyBadge('region-scandinavia', { traveller: true })?.key).toBe('region-scandinavia');
    expect(storyBadge('landmarks-1', { traveller: true })).toBeNull();
    expect(storyBadge('collect-IT-gold', { traveller: true })).toBeNull();
  });
});

describe('mapPlaces', () => {
  it('lists the places visited or lived in, in the passport’s order, each dated by its first visit', () => {
    const places = mapPlaces({
      visits: [
        // Undated, marked first: after every dated place
        { countryCode: 'JP', status: 'VISITED', firstVisitedOn: null, createdAt: new Date('2026-11-01T10:00:00Z') },
        { countryCode: 'FR', status: 'VISITED', firstVisitedOn: new Date('2019-06-01'), createdAt: new Date('2026-01-01') },
        // Lived in since 1990, its first photo from 2019: entered in 1990
        { countryCode: 'GB', status: 'LIVED', firstVisitedOn: new Date('1990-01-14'), createdAt: new Date('2026-01-01') },
        // Not counted
        { countryCode: 'PE', status: 'WANT_TO_GO', firstVisitedOn: null, createdAt: new Date('2026-01-01') },
        // A photo earlier than the day set
        { countryCode: 'KE', status: 'VISITED', firstVisitedOn: new Date('2024-03-01'), createdAt: new Date('2026-01-01') },
      ],
      firstPhotoAt: new Map([
        ['GB', new Date('2019-02-02')],
        ['KE', new Date('2023-12-30T12:00:00Z')],
      ]),
    });
    expect(places).toEqual([place('GB', '1990-01-14'), place('FR', '2019-06-01'), place('KE', '2023-12-30'), place('JP', null)]);
  });
});

describe('travellerPlaces', () => {
  const trips = [
    { id: 't-2', title: 'Kenya', travellerIds: ['a', 'b'], countryCodes: ['KE', 'FR'], startDate: '2023-01-01', endDate: '2023-01-20' },
    { id: 't-1', title: 'Paris', travellerIds: ['a'], countryCodes: ['FR'], startDate: '2019-05-01', endDate: '2019-05-04' },
    { id: 't-3', title: 'Undated', travellerIds: ['a'], countryCodes: ['XS'], startDate: null, endDate: null },
  ];

  it('takes each place once, from the first trip that went there, in the order the trips earn badges', () => {
    expect(travellerPlaces(trips, 'a')).toEqual([
      { code: 'FR', on: '2019-05-04', trip: { id: 't-1', title: 'Paris' } },
      { code: 'KE', on: '2023-01-20', trip: { id: 't-2', title: 'Kenya' } },
      // The South Pole brings Antarctica, as a visit does
      { code: 'XS', on: null, trip: { id: 't-3', title: 'Undated' } },
      { code: 'AQ', on: null, trip: { id: 't-3', title: 'Undated' } },
    ]);
  });

  it('leaves out the trips the traveller wasn’t on', () => {
    expect(travellerPlaces(trips, 'b').map((p) => p.code)).toEqual(['KE', 'FR']);
    expect(travellerPlaces(trips, 'c')).toEqual([]);
  });
});

describe('badgeStory', () => {
  const places = ['FR', 'AQ', 'XH', 'JP', 'KE', 'XN', 'US', 'DK', 'BR', 'AU', 'SE', 'NO'].map((code, i) => place(code, `2020-01-${String(i + 1).padStart(2, '0')}`));

  it('names the Nth country as the one that earned a count, leaving out special places and regions', () => {
    const story = badgeStory('countries-5', { places, continentByCode });
    expect(story).toMatchObject({ key: 'countries-5', group: 'countries', measure: 'countries', kind: 'places', need: 5, have: 5, earnedWith: 4 });
    expect(codes(story)).toEqual(['FR', 'JP', 'KE', 'US', 'DK']);
    expect(story.items[4]).toEqual(place('DK', '2020-01-08'));
  });

  it('lists what there is, with nothing marked as earning it, while there are fewer than it needs', () => {
    const story = badgeStory('countries-10', { places: places.slice(0, 4), continentByCode });
    expect(story).toMatchObject({ need: 10, have: 2, earnedWith: null });
    expect(codes(story)).toEqual(['FR', 'JP']);
  });

  it('counts the UK’s nations, not the UK, on a map that splits it', () => {
    const split = [place('GB'), place('XE'), place('XC'), place('FR')];
    expect(codes(badgeStory('countries-5', { places: split, continentByCode, splitUk: true }))).toEqual(['XE', 'XC', 'FR']);
    expect(codes(badgeStory('countries-5', { places: split, continentByCode, splitUk: false }))).toEqual(['GB', 'FR']);
  });

  it('gives a continent its first country, and six continents the country that opened each', () => {
    const africa = badgeStory('continent-africa', { places, continentByCode });
    expect(africa).toMatchObject({ measure: 'continent', continent: 'AFRICA', need: 1, earnedWith: 0 });
    expect(codes(africa)).toEqual(['KE']);
    const six = badgeStory('continents-all', { places, continentByCode });
    expect(six).toMatchObject({ need: 6, earnedWith: 5 });
    expect(six.items.map((i) => [i.code, i.continent])).toEqual([
      ['FR', 'EUROPE'], ['JP', 'ASIA'], ['KE', 'AFRICA'], ['US', 'NORTH_AMERICA'], ['BR', 'SOUTH_AMERICA'], ['AU', 'OCEANIA'],
    ]);
  });

  it('gives a special place itself', () => {
    expect(badgeStory('antarctica', { places, continentByCode })).toMatchObject({ measure: 'place', code: 'AQ', items: [place('AQ', '2020-01-02')], earnedWith: 0 });
    expect(badgeStory('south-pole', { places, continentByCode })).toMatchObject({ code: 'XS', items: [], have: 0, earnedWith: null });
  });

  it('gives a region its places in the order visited, the last completing it', () => {
    const story = badgeStory('region-scandinavia', { places, continentByCode });
    expect(story).toMatchObject({ measure: 'region', region: 'scandinavia', need: 3, earnedWith: 2 });
    expect(codes(story)).toEqual(['DK', 'SE', 'NO']);
    // On a split map, the British Isles are the four nations and Ireland
    expect(badgeStory('region-british-isles', { places: [place('IE')], continentByCode, splitUk: true })).toMatchObject({ need: 5, have: 1 });
  });

  it('needs every country the map shows for “All countries”', () => {
    const story = badgeStory('countries-all', { places, continentByCode });
    // FR, DK, NO, SE, IE, GB, JP, KE, US, BR, AU (the nations count only on a split map)
    expect(story.need).toBe(11);
    expect(story.earnedWith).toBeNull();
  });

  const stamps = [
    { landmarkId: 'l-1', name: 'Eiffel Tower', code: 'FR', isUnesco: false, on: '2014-06-01', ticked: false },
    { landmarkId: 'l-2', name: 'Banks of the Seine', code: 'FR', isUnesco: true, on: '2014-06-02', ticked: false },
    { landmarkId: 'l-3', name: 'Mount Fuji', code: 'JP', isUnesco: true, on: '2018-04-01', ticked: true },
  ];

  it('gives stamps, World Heritage Sites and a place’s collection their stamps in order', () => {
    expect(badgeStory('landmarks-1', { stamps })).toMatchObject({ kind: 'stamps', earnedWith: 0, items: [stamps[0]] });
    expect(badgeStory('unesco-5', { stamps })).toMatchObject({ need: 5, have: 2, earnedWith: null, items: [stamps[1], stamps[2]] });
    // France has 4 landmarks: bronze needs 1, silver 2, gold 4
    const totals = new Map([['FR', 4]]);
    expect(badgeStory('collect-FR-silver', { stamps, landmarkTotals: totals })).toMatchObject({
      group: 'collections',
      measure: 'collection',
      place: 'FR',
      tier: 'silver',
      need: 2,
      earnedWith: 1,
      items: [stamps[0], stamps[1]],
    });
    // A place with one landmark has gold alone
    expect(badgeStory('collect-JP-bronze', { stamps, landmarkTotals: new Map([['JP', 1]]) })).toBeNull();
    expect(badgeStory('collect-JP-gold', { stamps, landmarkTotals: new Map([['JP', 1]]) })).toMatchObject({ need: 1, earnedWith: 0 });
  });

  it('gives Life’s One Shots each list’s ticks, and the Big Five the five', () => {
    const oneShots = ['lion', 'northern-lights', 'leopard', 'african-elephant', 'african-buffalo', 'puffin', 'rhino'].map((itemKey, i) => ({
      itemKey,
      code: 'KE',
      on: `2024-02-0${i + 1}`,
      datePrecision: 'DAY',
    }));
    const wildlife = badgeStory('oneshots-wildlife-1', { oneShots });
    expect(wildlife).toMatchObject({ kind: 'oneShots', need: 1, earnedWith: 0 });
    expect(wildlife.items.map((t) => t.itemKey)).toEqual(['lion']);
    const five = badgeStory('big-five', { oneShots });
    expect(five.items.map((t) => t.itemKey)).toEqual(['lion', 'leopard', 'african-elephant', 'african-buffalo', 'rhino']);
    expect(five.earnedWith).toBe(4);
  });

  it('gives the themes entered, in order', () => {
    const themes = ['Doors', 'Worst weather', 'Reflections'].map((title, i) => ({ title, month: `2026-0${i + 1}-01`, on: `2026-0${i + 1}-05` }));
    expect(badgeStory('themes-3', { themes })).toMatchObject({ kind: 'themes', need: 3, earnedWith: 2, items: themes });
  });

  it('gives a photo count the photo that reached it, once it has', () => {
    const photo = { id: 'p-100', video: false, code: 'FR', addedOn: '2024-01-01', takenOn: '2023-12-31', thumbUrl: null };
    expect(badgeStory('photos-100', { photos: 120, photo })).toMatchObject({ kind: 'photos', need: 100, have: 100, items: [], earnedWith: null, photo });
    expect(badgeStory('photos-100', { photos: 99, photo })).toMatchObject({ have: 99, photo: null });
  });

  it('knows no other badge', () => {
    expect(badgeStory('nope', { places })).toBeNull();
  });
});

describe('the service’s items', () => {
  it('puts stamps in the order stamped, by name on one day', () => {
    const at = (day) => new Date(`${day}T00:00:00Z`);
    const items = stampItems([
      { landmarkId: 'b', name: 'B', countryCode: 'FR', isUnesco: true, firstShotAt: at('2020-01-02'), ticked: false },
      { landmarkId: 'z', name: 'Z', countryCode: 'FR', isUnesco: false, firstShotAt: at('2020-01-01'), ticked: true },
      { landmarkId: 'a', name: 'A', countryCode: 'JP', isUnesco: false, firstShotAt: at('2020-01-01'), ticked: false },
    ]);
    expect(items).toEqual([
      { landmarkId: 'a', name: 'A', code: 'JP', isUnesco: false, on: '2020-01-01', ticked: false },
      { landmarkId: 'z', name: 'Z', code: 'FR', isUnesco: false, on: '2020-01-01', ticked: true },
      { landmarkId: 'b', name: 'B', code: 'FR', isUnesco: true, on: '2020-01-02', ticked: false },
    ]);
  });

  it('puts One Shots in the order seen, an undated one on the day it was ticked', () => {
    const items = oneShotItems([
      { itemKey: 'lion', seenOn: new Date('2024-03-01'), datePrecision: 'MONTH', countryCode: 'KE', createdAt: new Date('2026-01-01') },
      { itemKey: 'puffin', seenOn: null, datePrecision: null, countryCode: null, createdAt: new Date('2020-01-01') },
      { itemKey: 'rhino', seenOn: new Date('2013-06-01'), datePrecision: 'YEAR', countryCode: 'ZA', createdAt: new Date('2026-01-02') },
    ]);
    expect(items).toEqual([
      { itemKey: 'rhino', code: 'ZA', on: '2013-06-01', datePrecision: 'YEAR' },
      { itemKey: 'puffin', code: null, on: null, datePrecision: null },
      { itemKey: 'lion', code: 'KE', on: '2024-03-01', datePrecision: 'MONTH' },
    ]);
  });
});
