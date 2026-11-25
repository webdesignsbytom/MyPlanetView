// What goes on a share card (utils/shareCard/cardOptions.js): a whole map's, and one trip's
// (the "Welcome home" tag, 23 Nov 2026).
import { describe, expect, it } from 'vitest';
import { FaGlobeAsia, FaLandmark } from 'react-icons/fa';
import {
  awardCardOptions,
  badgeCardOptions,
  collectionCardOptions,
  goalCardOptions,
  mapCardOptions,
  oneShotsCardOptions,
  mapCardStats,
  tripCardOptions,
  tripDayCount,
} from '@/utils/shareCard/cardOptions';
import { iconShape } from '@/utils/shareCard/iconShape';
import { formatDay } from '@/utils/functions/dates';

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

// What the award pop-up shares (25 Nov 2026, the user's wish)
const MAP = {
  name: 'Our map',
  splitUk: false,
  stats: { countries: 12, continents: 4, landmarks: 9 },
  visits: [
    { countryCode: 'FR', status: 'VISITED' },
    { countryCode: 'GB', status: 'LIVED' },
    { countryCode: 'IE', status: 'VISITED' },
    { countryCode: 'JP', status: 'WANT_TO_GO' },
  ],
};

describe('badgeCardOptions', () => {
  it('draws the badge’s sticker where the map goes, with its name, what it’s for, the day and the map’s numbers', () => {
    const card = badgeCardOptions({ key: 'continent-asia', group: 'continents', earnedAt: '2026-11-25T10:00:00.000Z' }, MAP);
    expect(card).toMatchObject({
      kicker: `Badge earned ${formatDay('2026-11-25T10:00:00.000Z')}`,
      title: 'Asia',
      note: 'A first country in Asia.',
      highlight: [],
      stats: mapCardStats(MAP.stats),
      fileName: 'my-planet-view-badge-continent-asia.png',
      shareText: 'New badge on my travel map: Asia! 12 countries so far.',
      dialogTitle: 'Share your badge',
    });
    expect(card.badge).toEqual({ icon: iconShape(FaGlobeAsia), short: '' });
  });

  it('keeps a count badge’s number, and only the first sentence of what it’s for', () => {
    const card = badgeCardOptions({ key: 'countries-10', group: 'countries' }, MAP);
    expect(card.kicker).toBe('New badge');
    expect(card.badge.short).toBe('10');
    expect(card.note).toBe('10 countries visited or lived in.');
  });

  it('copes with a key alone and no map', () => {
    const card = badgeCardOptions({ key: 'landmarks-1' });
    expect(card.title).toBe('First stamp');
    expect(card.stats).toEqual([]);
    expect(card.shareText).toBe('New badge on my travel map: First stamp! 0 countries so far.');
    expect(card.badge.icon.paths.length).toBeGreaterThan(0);
  });
});

describe('goalCardOptions', () => {
  it('colours a list’s places, close up, with how many there were', () => {
    const goal = { id: 'g1', kind: 'COUNTRY_LIST', countryCodes: ['FR', 'IE'], title: 'Our bucket list', achievedAt: '2026-11-25T09:00:00.000Z', progress: { have: 2, need: 2, met: true } };
    const card = goalCardOptions(goal, MAP, { countries: { FR: '#aa0000' } });
    expect(card).toMatchObject({
      kicker: `Goal reached ${formatDay('2026-11-25T09:00:00.000Z')}`,
      title: 'Our bucket list',
      highlight: ['FR', 'IE'],
      mapView: 'fit',
      colours: { FR: '#aa0000' },
      shareText: 'Goal reached on my travel map: Our bucket list!',
      dialogTitle: 'Share your goal',
    });
    expect(card.stats).toEqual([
      { value: 2, label: 'places on the list' },
      { value: 12, label: 'countries' },
      { value: 4, label: 'continents' },
    ]);
  });

  it('colours a region’s countries been to, from the progress or the visits', () => {
    const goal = { kind: 'REGION', region: 'british-isles', progress: { have: 2, need: 2, done: ['GB', 'IE'] } };
    const card = goalCardOptions(goal, MAP);
    expect(card.title).toBe('Every country in the British Isles');
    expect(card.highlight).toEqual(['GB', 'IE']);
    expect(card.stats[0]).toEqual({ value: 2, label: 'countries in the British Isles' });
    const noDone = goalCardOptions({ kind: 'REGION', region: 'british-isles', progress: { have: 2, need: 2 } }, MAP);
    expect(noDone.highlight).toEqual(['GB', 'IE']);
  });

  it('shows the whole world for a count, every place been to coloured in', () => {
    const countries = goalCardOptions({ kind: 'COUNTRY_COUNT', target: 10, progress: { have: 12, need: 10 } }, MAP);
    expect(countries).toMatchObject({ kicker: 'Goal reached', title: '10 countries', highlight: ['FR', 'GB', 'IE'], mapView: 'world', colours: null });
    expect(countries.stats).toEqual(mapCardStats(MAP.stats));
    const stamps = goalCardOptions({ kind: 'LANDMARK_COUNT', target: 1, progress: { have: 1, need: 1 } }, MAP);
    expect(stamps.stats[0]).toEqual({ value: 1, label: 'landmark stamped' });
    expect(stamps.stats).toHaveLength(3);
  });
});

describe('awardCardOptions', () => {
  const badges = [
    { key: 'landmarks-1', group: 'landmarks', earnedAt: '2026-11-20T08:00:00.000Z' },
    { key: 'collect-MT-bronze', group: 'collections', place: 'MT', tier: 'bronze', have: 2, need: 1, earnedAt: '2026-11-25T08:00:00.000Z' },
    { key: 'collect-MT-silver', group: 'collections', place: 'MT', tier: 'silver', have: 2, need: 2, earnedAt: '2026-11-25T08:00:00.000Z' },
    { key: 'collect-MT-gold', group: 'collections', place: 'MT', tier: 'gold', have: 2, need: 3, earnedAt: null },
  ];

  it('gives a badge its sticker, with its group and day from the badges reply', () => {
    const card = awardCardOptions({ type: 'badge', key: 'landmarks-1' }, { badges, map: MAP });
    expect(card.title).toBe('First stamp');
    expect(card.badge.icon).toEqual(iconShape(FaLandmark));
    expect(card.kicker).toBe(`Badge earned ${formatDay('2026-11-20T08:00:00.000Z')}`);
  });

  it('gives a country collection’s tier its medal, the one announced', () => {
    const card = awardCardOptions({ type: 'badge', key: 'collect-MT-bronze' }, { badges, map: MAP });
    expect(card).toMatchObject({ kicker: 'Bronze medal', title: 'Malta', medal: 'bronze', dialogTitle: 'Share your medal' });
    expect(card.stats[0]).toEqual({ value: 2, label: 'landmarks stamped' });
    // Without the place's tiers (the badges not in yet): the badge's sticker
    expect(awardCardOptions({ type: 'badge', key: 'collect-MT-bronze' }, { map: MAP })).toMatchObject({ title: 'Bronze for Malta', dialogTitle: 'Share your badge' });
  });

  it('gives a goal its card', () => {
    const goal = { kind: 'COUNTRY_COUNT', target: 10, progress: { have: 12, need: 10 } };
    expect(awardCardOptions({ type: 'goal', goal }, { badges, map: MAP })).toEqual(goalCardOptions(goal, MAP));
  });
});
