// services/travel/achievements.js: how a map's facts are gathered and how badges and goals
// are awarded, with the queries and the counting rules faked (the rules have their own
// tests: badges.test.js, goals.test.js; the routes run against Postgres in
// tests/integration/achievements.test.js).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({
  findMapVisitsForStats: vi.fn(),
  countMapPhotos: vi.fn(),
  findMapSplitUk: vi.fn(),
  findMapTravellers: vi.fn(),
  findFirstPhotoByCountry: vi.fn(),
  findLandmarksByIds: vi.fn(),
  findStamps: vi.fn(),
  findBadgeAwards: vi.fn(),
  createBadgeAwards: vi.fn(),
  findCompletedTripsForTravellers: vi.fn(),
  findGoals: vi.fn(),
  markGoalsAchieved: vi.fn(),
  continentsByCode: vi.fn(),
  countMapThemesEntered: vi.fn(),
  badgeProgress: vi.fn(),
  travellerBadges: vi.fn(),
  goalProgress: vi.fn(),
}));
const pick = (...names) => Object.fromEntries(names.map((n) => [n, fake[n]]));
vi.mock('../src/domain/maps.js', () => pick('findMapVisitsForStats', 'countMapPhotos', 'findMapSplitUk', 'findMapTravellers'));
vi.mock('../src/domain/passport.js', () => pick('findFirstPhotoByCountry', 'findLandmarksByIds', 'findStamps'));
vi.mock('../src/domain/achievements.js', () =>
  pick('findBadgeAwards', 'createBadgeAwards', 'findCompletedTripsForTravellers', 'findGoals', 'markGoalsAchieved')
);
vi.mock('../src/controllers/helpers/countries.js', () => pick('continentsByCode'));
vi.mock('../src/domain/themes.js', () => pick('countMapThemesEntered'));
vi.mock('../src/utils/badges.js', () => pick('badgeProgress', 'travellerBadges'));
vi.mock('../src/utils/goals.js', () => pick('goalProgress'));

const { countriesByContinent, stampsFrom, loadMapFacts, mapBadges, goalView, mapGoals, oneGoalView } = await import(
  '../src/services/travel/achievements.js'
);

const BIG_BEN = { id: 'lm-ben', countryCode: 'GB', latitude: 51.5007, longitude: -0.1246, isUnesco: true, name: 'Westminster' };
const EIFFEL = { id: 'lm-eiffel', countryCode: 'FR', latitude: 48.8584, longitude: 2.2945, isUnesco: false, name: 'Eiffel Tower' };
const stampRow = (landmarkId, extra = {}) => ({
  landmarkId,
  shotAt: '2025-06-01T10:00:00.000Z',
  photoId: `photo-${landmarkId}`,
  photoCount: 2n,
  confirmedAt: '2025-06-02T10:00:00.000Z',
  ...extra,
});

beforeEach(() => {
  for (const fn of Object.values(fake)) fn.mockReset();
  fake.continentsByCode.mockResolvedValue(
    new Map([
      ['FR', 'EUROPE'],
      ['GB', 'EUROPE'],
      ['JP', 'ASIA'],
      ['XN', null],
    ])
  );
  fake.findMapVisitsForStats.mockResolvedValue([]);
  fake.findFirstPhotoByCountry.mockResolvedValue(new Map());
  fake.findStamps.mockResolvedValue([]);
  fake.findLandmarksByIds.mockResolvedValue([BIG_BEN, EIFFEL]);
  fake.countMapPhotos.mockResolvedValue(0);
  fake.countMapThemesEntered.mockResolvedValue(0);
  fake.findMapSplitUk.mockResolvedValue(false);
  fake.findBadgeAwards.mockResolvedValue([]);
  fake.findMapTravellers.mockResolvedValue([]);
  fake.findCompletedTripsForTravellers.mockResolvedValue([]);
  fake.badgeProgress.mockReturnValue([]);
  fake.travellerBadges.mockReturnValue([]);
  fake.markGoalsAchieved.mockImplementation(async (ids) => ids);
});

describe('countriesByContinent', () => {
  it('groups the codes by continent, leaving out places on none', async () => {
    const byContinent = await countriesByContinent();
    expect([...byContinent.entries()]).toEqual([
      ['EUROPE', ['FR', 'GB']],
      ['ASIA', ['JP']],
    ]);
  });
});

describe('stampsFrom', () => {
  it("gives each stamp its landmark's place, name and mark, with dates and counts as values", async () => {
    const [stamp] = await stampsFrom([stampRow('lm-eiffel')], false);
    expect(stamp).toEqual({
      landmarkId: 'lm-eiffel',
      countryCode: 'FR',
      isUnesco: false,
      name: 'Eiffel Tower',
      firstShotAt: new Date('2025-06-01T10:00:00.000Z'),
      photoId: 'photo-lm-eiffel',
      photoCount: 2,
      confirmedAt: new Date('2025-06-02T10:00:00.000Z'),
      ticked: false,
    });
    expect(fake.findLandmarksByIds).toHaveBeenCalledWith(['lm-eiffel']);
  });

  // 23 Nov 2026: a landmark ticked "been here" with no photo is a stamp too
  it('marks a stamp with no photo as ticked', async () => {
    const [stamp] = await stampsFrom([stampRow('lm-eiffel', { photoId: null, photoCount: 0 })], false);
    expect(stamp).toMatchObject({ landmarkId: 'lm-eiffel', photoId: null, photoCount: 0, ticked: true });
  });

  it("puts a UK landmark in its nation on a map that splits the UK, and in GB otherwise", async () => {
    expect((await stampsFrom([stampRow('lm-ben')], true))[0].countryCode).toBe('XE');
    expect((await stampsFrom([stampRow('lm-ben')], false))[0].countryCode).toBe('GB');
  });

  it('drops a stamp whose landmark is gone, and keeps a missing confirmation as null', async () => {
    const stamps = await stampsFrom([stampRow('lm-gone'), stampRow('lm-ben', { confirmedAt: null })], false);
    expect(stamps.map((s) => s.landmarkId)).toEqual(['lm-ben']);
    expect(stamps[0].confirmedAt).toBeNull();
  });
});

describe('loadMapFacts', () => {
  it('counts only visited and lived-in countries, dated by their first visit or else when marked', async () => {
    fake.findMapVisitsForStats.mockResolvedValue([
      { countryCode: 'FR', status: 'VISITED', firstVisitedOn: '2019-04-01', createdAt: new Date('2024-01-01') },
      { countryCode: 'JP', status: 'LIVED', firstVisitedOn: null, createdAt: new Date('2024-02-02') },
      { countryCode: 'IT', status: 'WANT_TO_GO', firstVisitedOn: null, createdAt: new Date('2024-03-03') },
    ]);
    fake.findStamps.mockResolvedValue([stampRow('lm-ben')]);
    fake.findMapSplitUk.mockResolvedValue(true);
    fake.countMapPhotos.mockResolvedValue(12);
    fake.countMapThemesEntered.mockResolvedValue(3);

    const facts = await loadMapFacts('map-1', { includeHidden: true });
    expect(facts.visits).toHaveLength(3);
    expect([...facts.visited]).toEqual(['FR', 'JP']);
    expect(facts.firstVisitAt).toEqual(new Map([['FR', new Date('2019-04-01')], ['JP', new Date('2024-02-02')]]));
    expect(facts).toMatchObject({ photos: 12, themes: 3, splitUk: true });
    expect(facts.stamps.map((s) => s.countryCode)).toEqual(['XE']);
    expect(facts.countriesByContinent.get('EUROPE')).toEqual(['FR', 'GB']);
    expect(facts.continentByCode.get('JP')).toBe('ASIA');
  });

  it("passes on whether hidden photos count (the owner's and editors' view)", async () => {
    await loadMapFacts('map-1', { includeHidden: false });
    for (const fn of [fake.findFirstPhotoByCountry, fake.findStamps, fake.countMapPhotos, fake.countMapThemesEntered]) {
      expect(fn).toHaveBeenCalledWith('map-1', { includeHidden: false });
    }
  });
});

describe('mapBadges', () => {
  const progress = [
    { key: 'countries-5', group: 'countries', have: 6, need: 5, earned: true },
    { key: 'countries-10', group: 'countries', have: 6, need: 10, earned: false },
    { key: 'photos-10', group: 'photos', have: 4, need: 10, earned: false },
  ];

  it('stores badges earned for the first time when awarding, and dates them as stored', async () => {
    fake.badgeProgress.mockReturnValue(progress);
    const stored = new Date('2026-11-20T09:00:00Z');
    fake.findBadgeAwards.mockResolvedValueOnce([]).mockResolvedValueOnce([{ badgeKey: 'countries-5', earnedAt: stored }]);

    const result = await mapBadges('map-1', { award: true });
    expect(fake.createBadgeAwards).toHaveBeenCalledWith('map-1', ['countries-5']);
    expect(result.newlyEarned).toEqual(['countries-5']);
    // An awarded badge shows as full
    expect(result.badges[0]).toEqual({ key: 'countries-5', group: 'countries', have: 5, need: 5, earnedAt: stored });
    expect(result.badges[1].earnedAt).toBeNull();
    // Counted with hidden photos
    expect(fake.findStamps).toHaveBeenCalledWith('map-1', { includeHidden: true });
  });

  it('never stores or announces a badge already awarded, and keeps it full though the map has less now', async () => {
    const earnedAt = new Date('2025-01-01T00:00:00Z');
    fake.badgeProgress.mockReturnValue([{ key: 'photos-10', group: 'photos', have: 4, need: 10, earned: false }]);
    fake.findBadgeAwards.mockResolvedValue([{ badgeKey: 'photos-10', earnedAt }]);
    const result = await mapBadges('map-1', { award: true });
    expect(fake.createBadgeAwards).not.toHaveBeenCalled();
    expect(result.newlyEarned).toEqual([]);
    expect(result.badges).toEqual([{ key: 'photos-10', group: 'photos', have: 10, need: 10, earnedAt }]);
  });

  it('awards nothing below editor, counting only what the caller sees', async () => {
    fake.badgeProgress.mockReturnValue(progress);
    const result = await mapBadges('map-1', { award: false });
    expect(fake.createBadgeAwards).not.toHaveBeenCalled();
    expect(result.newlyEarned).toEqual([]);
    expect(result.badges[0].earnedAt).toBeNull();
    expect(fake.findStamps).toHaveBeenCalledWith('map-1', { includeHidden: false });
  });

  it("lists each traveller's badges from the trips they were on, dated only once earned", async () => {
    fake.findMapTravellers.mockResolvedValue([{ id: 't-1', name: 'Sam' }, { id: 't-2', name: 'Alex' }]);
    const trips = [{ travellerIds: ['t-1'], countryCodes: ['FR'], startDate: '2025-05-01', endDate: '2025-05-09' }];
    fake.findCompletedTripsForTravellers.mockResolvedValue(trips);
    fake.findMapSplitUk.mockResolvedValue(true);
    fake.travellerBadges.mockImplementation(({ travellerId }) => [
      { key: 'countries-1', group: 'countries', have: travellerId === 't-1' ? 1 : 0, need: 1, earned: travellerId === 't-1', earnedOn: '2025-05-01' },
    ]);
    const { travellers } = await mapBadges('map-1', { award: false });
    expect(travellers).toEqual([
      { id: 't-1', name: 'Sam', badges: [{ key: 'countries-1', group: 'countries', have: 1, need: 1, earnedOn: '2025-05-01', earned: true }] },
      { id: 't-2', name: 'Alex', badges: [{ key: 'countries-1', group: 'countries', have: 0, need: 1, earnedOn: null, earned: false }] },
    ]);
    expect(fake.travellerBadges).toHaveBeenCalledWith(expect.objectContaining({ trips, travellerId: 't-1', splitUk: true }));
  });
});

describe('goalView', () => {
  it('sends the deadline as a day, and the progress beside the fields', () => {
    const goal = {
      id: 'g-1',
      mapId: 'map-1',
      kind: 'COUNTRY_COUNT',
      title: 'Twenty by thirty',
      target: 20,
      countryCodes: [],
      region: null,
      deadline: new Date('2030-12-31T00:00:00Z'),
      achievedAt: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const progress = { have: 6, need: 20, met: false };
    expect(goalView(goal, progress)).toEqual({
      id: 'g-1',
      kind: 'COUNTRY_COUNT',
      title: 'Twenty by thirty',
      target: 20,
      countryCodes: [],
      region: null,
      deadline: '2030-12-31',
      achievedAt: null,
      createdAt: goal.createdAt,
      progress,
    });
    expect(goalView({ ...goal, deadline: null }, progress).deadline).toBeNull();
  });
});

describe('mapGoals', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  const goal = (id, extra = {}) => ({ id, mapId: 'map-1', kind: 'COUNTRY_COUNT', title: id, target: 5, deadline: null, achievedAt: null, ...extra });

  it('answers at once for a map with no goals, without counting anything', async () => {
    fake.findGoals.mockResolvedValue([]);
    expect(await mapGoals('map-1', { award: true, now })).toEqual({ goals: [], newlyAchieved: [] });
    expect(fake.findMapVisitsForStats).not.toHaveBeenCalled();
  });

  it('marks goals met for the first time when awarding, and announces only those', async () => {
    const before = new Date('2026-01-01T00:00:00Z');
    fake.findGoals.mockResolvedValue([goal('met'), goal('unmet'), goal('old', { achievedAt: before })]);
    fake.goalProgress.mockImplementation((g) => ({ met: g.id !== 'unmet' }));
    const result = await mapGoals('map-1', { award: true, now });
    expect(fake.markGoalsAchieved).toHaveBeenCalledWith(['met'], now);
    expect(result.newlyAchieved).toEqual(['met']);
    expect(result.goals.map((g) => [g.id, g.achievedAt])).toEqual([
      ['met', now],
      ['unmet', null],
      ['old', before],
    ]);
  });

  it("shows a goal another request marked meanwhile as achieved, though it isn't announced here", async () => {
    fake.findGoals.mockResolvedValue([goal('raced')]);
    fake.goalProgress.mockReturnValue({ met: true });
    fake.markGoalsAchieved.mockResolvedValue([]);
    const result = await mapGoals('map-1', { award: true, now });
    expect(result.newlyAchieved).toEqual([]);
    expect(result.goals[0].achievedAt).toEqual(now);
  });

  it('marks nothing below editor', async () => {
    fake.findGoals.mockResolvedValue([goal('met')]);
    fake.goalProgress.mockReturnValue({ met: true });
    const result = await mapGoals('map-1', { award: false, now });
    expect(fake.markGoalsAchieved).not.toHaveBeenCalled();
    expect(result).toMatchObject({ newlyAchieved: [], goals: [{ id: 'met', achievedAt: null }] });
  });
});

describe('oneGoalView', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  const goal = { id: 'g-1', mapId: 'map-1', kind: 'COUNTRY_COUNT', title: 'Five', target: 5, deadline: null, achievedAt: null };

  it('marks a goal met by a change as achieved, when awarding', async () => {
    fake.goalProgress.mockReturnValue({ met: true });
    const view = await oneGoalView(goal, { award: true, now });
    expect(fake.markGoalsAchieved).toHaveBeenCalledWith(['g-1'], now);
    expect(view.achievedAt).toEqual(now);
    expect(fake.findMapVisitsForStats).toHaveBeenCalledWith('map-1');
  });

  it("leaves an unmet goal, an achieved one and a viewer's view alone", async () => {
    fake.goalProgress.mockReturnValue({ met: false });
    expect((await oneGoalView(goal, { award: true, now })).achievedAt).toBeNull();
    fake.goalProgress.mockReturnValue({ met: true });
    const achievedAt = new Date('2026-01-01T00:00:00Z');
    expect((await oneGoalView({ ...goal, achievedAt }, { award: true, now })).achievedAt).toEqual(achievedAt);
    expect((await oneGoalView(goal, { award: false, now })).achievedAt).toBeNull();
    expect(fake.markGoalsAchieved).not.toHaveBeenCalled();
  });
});
