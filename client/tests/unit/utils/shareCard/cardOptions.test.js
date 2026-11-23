// What goes on a share card (utils/shareCard/cardOptions.js): a whole map's, and one trip's
// (the "Welcome home" tag, 23 Nov 2026).
import { describe, expect, it } from 'vitest';
import { mapCardOptions, mapCardStats, tripCardOptions, tripDayCount } from '@/utils/shareCard/cardOptions';

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
