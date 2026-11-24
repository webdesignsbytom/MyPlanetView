// What goes on a share card (utils/shareCard/cardOptions.js): a whole map's, and one trip's
// (the "Welcome home" tag, 23 Nov 2026).
import { describe, expect, it } from 'vitest';
import { collectionCardOptions, mapCardOptions, oneShotsCardOptions, mapCardStats, tripCardOptions, tripDayCount } from '@/utils/shareCard/cardOptions';

describe('mapCardOptions', () => {
  it('colours the places visited or lived in, with the map’s counts', () => {
    const map = {
      name: 'Our map',
      splitUk: true,
      stats: { countries: 3, continents: 2, landmarks: 4 },
      visits: [
        { countryCode: 'FR', status: 'VISITED' },
        { countryCode: 'PT', status: 'LIVED' },
        { countryCode: 'JP', status: 'WANT_TO_GO' },
      ],
    };
    const card = mapCardOptions(map, { countries: { FR: '#aa0000' } });
    expect(card).toMatchObject({ kicker: 'My travel map', title: 'Our map', highlight: ['FR', 'PT'], splitUk: true, colours: { FR: '#aa0000' } });
    expect(card.stats).toEqual(mapCardStats(map.stats));
    expect(card.shareText).toBe('My travel map: 3 countries so far.');
  });
});

describe('tripDayCount', () => {
  it('counts both the first and the last day', () => {
    expect(tripDayCount('2026-11-01', '2026-11-12')).toBe(12);
    expect(tripDayCount('2026-11-01', '2026-11-01')).toBe(1);
    expect(tripDayCount('2026-02-27', '2026-03-02')).toBe(4);
  });
  it('is null without both, or the wrong way round', () => {
    expect(tripDayCount(null, '2026-11-12')).toBeNull();
    expect(tripDayCount('2026-11-12', '2026-11-01')).toBeNull();
  });
});

describe('tripCardOptions', () => {
  const trip = { id: 't', title: 'Japan and Korea', startDate: '2026-11-01', endDate: '2026-11-12', countryCodes: ['JP', 'KR'], photoCount: 30 };

  // 24 Nov 2026, the user's wish: a trip's places close up, never a speck on the world
  it('asks for its places close up', () => {
    expect(tripCardOptions(trip, {}).mapView).toBe('fit');
  });

  it('colours the trip’s countries, with its countries, days and photos', () => {
    const card = tripCardOptions(trip, { splitUk: false }, { countries: { JP: '#123456' } });
    expect(card).toMatchObject({
      kicker: 'My trip',
      title: 'Japan and Korea',
      highlight: ['JP', 'KR'],
      splitUk: false,
      colours: { JP: '#123456' },
      fileName: 'my-planet-view-trip.png',
      dialogTitle: 'Share a picture of your trip',
    });
    expect(card.stats).toEqual([
      { value: 2, label: 'countries' },
      { value: 12, label: 'days' },
      { value: 30, label: 'photos' },
    ]);
    expect(card.shareText).toBe('Just back from Japan and Korea: 2 countries in 12 days.');
  });

  it('leaves out what a trip doesn’t have', () => {
    const card = tripCardOptions({ title: 'A weekend away', startDate: '2026-11-21', endDate: '2026-11-22', countryCodes: ['FR'] }, null);
    expect(card.stats).toEqual([
      { value: 1, label: 'country' },
      { value: 2, label: 'days' },
    ]);
    expect(card.shareText).toBe('Just back from A weekend away: 2 days.');
    expect(card.colours).toBeNull();
    expect(card.splitUk).toBe(false);
    const bare = tripCardOptions({ title: 'Somewhere' }, {});
    expect(bare.stats).toEqual([]);
    expect(bare.highlight).toEqual([]);
    expect(bare.shareText).toBe('Just back from Somewhere.');
  });
});

// A country collection's medal (24 Nov 2026)
describe('collectionCardOptions', () => {
  const italy = { place: 'IT', name: 'Italy', have: 30, total: 58, best: 'silver' };

  it('draws the medal where the map goes, with how many of the place’s landmarks are stamped', () => {
    expect(collectionCardOptions(italy)).toEqual({
      kicker: 'Silver medal',
      title: 'Italy',
      medal: 'silver',
      highlight: [],
      stats: [
        { value: 30, label: 'landmarks stamped' },
        { value: 58, label: 'landmarks in Italy' },
      ],
      fileName: 'my-planet-view-it-silver.png',
      shareText: 'Silver for Italy: 30 of its 58 landmarks stamped in my travel passport.',
      dialogTitle: 'Share your medal',
    });
  });

  it('says every one for gold, and one landmark in the singular', () => {
    const vatican = collectionCardOptions({ place: 'VA', name: 'Vatican City', have: 1, total: 1, best: 'gold' });
    expect(vatican.stats.map((stat) => stat.label)).toEqual(['landmark stamped', 'landmark in Vatican City']);
    expect(vatican.shareText).toBe('Gold for Vatican City: its landmark, stamped in my travel passport.');
    const japan = collectionCardOptions({ place: 'JP', name: 'Japan', have: 26, total: 26, best: 'gold' });
    expect(japan.shareText).toBe('Every one of Japan’s 26 landmarks, stamped in my travel passport.');
  });
});

// Life's One Shots (24 Nov 2026): the places seen in coloured, each list's count
describe('oneShotsCardOptions', () => {
  it('colours where they were seen, with how many of each list', () => {
    const ticks = [
      { itemKey: 'lion', countryCode: 'KE' },
      { itemKey: 'leopard', countryCode: 'KE' },
      { itemKey: 'northern-lights', countryCode: 'NO' },
      { itemKey: 'equator', countryCode: null },
    ];
    expect(oneShotsCardOptions({ name: 'Our map', splitUk: true }, ticks)).toEqual({
      kicker: 'Life’s One Shots',
      title: 'Our map',
      highlight: ['KE', 'NO'],
      stats: [
        { value: 2, label: 'animals' },
        { value: 1, label: 'wonder' },
        { value: 1, label: 'journey' },
      ],
      splitUk: true,
      colours: null,
      fileName: 'my-planet-view-one-shots.png',
      shareText: 'Life’s One Shots so far: 2 animals, 1 wonder and 1 journey.',
      dialogTitle: 'Share Life’s One Shots',
    });
  });
});
