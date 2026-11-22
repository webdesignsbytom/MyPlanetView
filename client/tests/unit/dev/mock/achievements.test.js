import { beforeEach, describe, expect, it } from 'vitest';
import {
  BADGES,
  GOAL_MESSAGES,
  awardQuietly,
  badgeProgress,
  changesWhatsAsked,
  goalProgress,
  goalView,
  loadMapFacts,
  mapBadges,
  mapGoals,
  oneGoalView,
  parseGoalInput,
} from '@/dev/mock/achievements';
import { COUNTRIES } from '@/utils/map/countries';
import { countryExists } from '@/dev/mock/views';
import * as serverBadges from '../../../../../server/src/utils/badges.js';
import * as serverGoals from '../../../../../server/src/utils/goals.js';
import { HOME_MAP, JO_MAP, SAM_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const continentByCode = new Map(COUNTRIES.map((c) => [c.code, c.continent]));
const countriesByContinent = new Map();
for (const { code, continent } of COUNTRIES) if (continent) countriesByContinent.set(continent, [...(countriesByContinent.get(continent) ?? []), code]);

describe('the badges', () => {
  it('are the server’s, key for key', () => {
    expect(BADGES.map((b) => b.key)).toEqual(serverBadges.BADGE_KEYS);
  });

  it('count as the server counts them', () => {
    const cases = [
      { visited: new Set() },
      { visited: new Set(['FR', 'IT', 'ES', 'GB', 'US']), stamps: [{ isUnesco: true }, { isUnesco: false }], photos: 120, themes: 3 },
      { visited: new Set(['XE', 'XC', 'IE', 'AQ', 'XS', 'XN']), splitUk: true },
      { visited: new Set(COUNTRIES.map((c) => c.code)), photos: 1000, themes: 12 },
    ];
    for (const facts of cases) expect(badgeProgress(facts)).toEqual(serverBadges.badgeProgress({ ...facts, continentByCode }));
  });

  it('earn the first country badge with one country, and none for Antarctica alone', () => {
    const earned = (visited) => badgeProgress({ visited: new Set(visited) }).filter((b) => b.earned).map((b) => b.key);
    expect(earned(['FR'])).toEqual(expect.arrayContaining(['countries-1', 'continent-europe']));
    expect(earned(['AQ'])).toEqual(['antarctica']);
  });
});

describe('parseGoalInput', () => {
  const both = (body, existing = null) => [parseGoalInput(body, { existing }), serverGoals.parseGoalInput(body, { existing, isKnownCode: countryExists })];

  it('reads goals as the server does', () => {
    const bodies = [
      { kind: 'COUNTRY_COUNT', target: 10, title: ' Ten! ', deadline: '2027-12-31' },
      { kind: 'COUNTRY_COUNT', target: 0 },
      { kind: 'COUNTRY_COUNT', target: 251 },
      { kind: 'LANDMARK_COUNT', target: 2000 },
      { kind: 'COUNTRY_LIST', countryCodes: ['JP', 'PE'] },
      { kind: 'COUNTRY_LIST', countryCodes: ['JP', 'JP'] },
      { kind: 'COUNTRY_LIST', countryCodes: ['ZZ'] },
      { kind: 'COUNTRY_LIST', countryCodes: [] },
      { kind: 'REGION', region: 'british-isles' },
      { kind: 'REGION', region: 'atlantis' },
      { kind: 'REGION', region: 'EUROPE', target: 3 },
      { kind: 'COUNTRY_COUNT', target: 5, deadline: '2027-02-30' },
      { kind: 'COUNTRY_COUNT', target: 5, deadline: '1800-01-01' },
      { kind: 'TRIPS', target: 3 },
      null,
    ];
    for (const body of bodies) {
      const [mock, server] = both(body);
      expect(mock.ok).toBe(server.ok);
      if (mock.ok) expect(mock.data).toEqual({ ...server.data, ...(server.data.deadline ? { deadline: mock.data.deadline } : {}) });
    }
  });

  it('keeps a goal’s kind on a change, and only the fields its kind has', () => {
    const existing = { kind: 'COUNTRY_COUNT' };
    expect(parseGoalInput({ target: 12 }, { existing })).toEqual({ ok: true, data: { target: 12 } });
    expect(parseGoalInput({ kind: 'REGION' }, { existing }).ok).toBe(false);
    expect(parseGoalInput({ countryCodes: ['FR'] }, { existing }).ok).toBe(false);
    expect(parseGoalInput({ title: null }, { existing })).toEqual({ ok: true, data: { title: null } });
  });

  it('says whether a change asks for something else', () => {
    expect(changesWhatsAsked({ title: 'x' })).toBe(false);
    expect(changesWhatsAsked({ target: 3 })).toBe(true);
    expect(changesWhatsAsked({ deadline: null })).toBe(true);
    expect(['target', 'countryCodes', 'region', 'deadline'].every((f) => serverGoals.changesWhatsAsked({ [f]: 1 }) === changesWhatsAsked({ [f]: 1 }))).toBe(true);
  });
});

describe('goalProgress', () => {
  it('counts each kind as the server does', () => {
    const facts = {
      visited: new Set(['FR', 'IT', 'XE', 'IE']),
      firstVisitAt: new Map([['FR', new Date('2019-04-12')]]),
      firstPhotoAt: new Map([
        ['IT', new Date('2025-07-03')],
        ['ES', new Date('2018-08-05')],
      ]),
      stamps: [{ firstShotAt: new Date('2019-01-01') }, { firstShotAt: new Date('2026-01-01') }],
      splitUk: true,
      countriesByContinent,
    };
    const goals = [
      { kind: 'COUNTRY_COUNT', target: 3 },
      { kind: 'COUNTRY_COUNT', target: 3, deadline: '2020-01-01' },
      { kind: 'LANDMARK_COUNT', target: 2, deadline: '2025-12-31' },
      { kind: 'COUNTRY_LIST', countryCodes: ['GB', 'FR', 'PE'] },
      { kind: 'REGION', region: 'british-isles' },
      { kind: 'REGION', region: 'EUROPE' },
    ];
    const now = new Date('2026-11-23T00:00:00Z');
    for (const goal of goals) expect(goalProgress(goal, facts, now)).toEqual(serverGoals.goalProgress(goal, facts, now));
  });

  it('says a goal is missed once its deadline has passed unmet', () => {
    const facts = { visited: new Set(['FR']), firstPhotoAt: new Map(), stamps: [] };
    expect(goalProgress({ kind: 'COUNTRY_COUNT', target: 2, deadline: '2020-01-01' }, facts, new Date('2026-01-01'))).toMatchObject({ met: false, missed: true });
    expect(goalProgress({ kind: 'COUNTRY_COUNT', target: 1 }, facts)).toMatchObject({ have: 1, need: 1, met: true, missed: false });
  });
});

describe('the map’s facts', () => {
  it('counts the test user’s visits, photos, stamps and themes, hidden photos for editors only', () => {
    const owner = loadMapFacts(HOME_MAP, { includeHidden: true });
    const viewer = loadMapFacts(HOME_MAP, { includeHidden: false });
    expect([...owner.visited].sort()).toEqual(['ES', 'FR', 'GB', 'IE', 'IT', 'NL', 'PT', 'US']);
    expect(owner.photos).toBe(16);
    expect(viewer.photos).toBe(15);
    expect(owner.stamps).toHaveLength(13);
    expect(viewer.stamps).toHaveLength(12);
    expect(owner.themes).toBe(2);
    expect(owner.firstPhotoAt.get('FR').toISOString()).toBe('2019-04-12T19:40:00.000Z');
  });
});

describe('mapBadges', () => {
  it('awards what’s newly earned when an editor looks, once', () => {
    db().badgeAwards = db().badgeAwards.filter((a) => !(a.mapId === HOME_MAP && a.badgeKey === 'countries-5'));
    const first = mapBadges(HOME_MAP, { award: true });
    expect(first.newlyEarned).toEqual(['countries-5']);
    expect(first.badges.find((b) => b.key === 'countries-5').earnedAt).not.toBeNull();
    expect(mapBadges(HOME_MAP, { award: true }).newlyEarned).toEqual([]);
  });

  it('awards nothing when a viewer looks', () => {
    db().badgeAwards = db().badgeAwards.filter((a) => a.mapId !== SAM_MAP);
    const seen = mapBadges(SAM_MAP, { award: false });
    expect(seen.newlyEarned).toEqual([]);
    expect(db().badgeAwards.filter((a) => a.mapId === SAM_MAP)).toEqual([]);
    expect(seen.badges.find((b) => b.key === 'countries-1').earnedAt).toBeNull();
  });

  it('keeps an award full once given, even with a country unmarked', () => {
    db().visits = db().visits.filter((v) => v.mapId !== HOME_MAP);
    const badge = mapBadges(HOME_MAP, { award: true }).badges.find((b) => b.key === 'countries-5');
    expect(badge.have).toBe(badge.need);
  });

  it('lists each traveller’s own travel badges from the trips they went on', () => {
    const { travellers } = mapBadges(JO_MAP, { award: false });
    expect(travellers.map((t) => t.name)).toEqual(['Jo', 'Mia']);
    expect(travellers[0].badges.find((b) => b.key === 'countries-1')).toMatchObject({ earned: true });
  });
});

describe('goals', () => {
  it('lists the map’s goals oldest first with their progress', () => {
    const { goals, newlyAchieved } = mapGoals(HOME_MAP, { award: true });
    expect(goals.map((g) => g.id)).toEqual(['goal-isles', 'goal-ten', 'goal-bucket']);
    expect(goals[1].progress).toMatchObject({ have: 8, need: 10, met: false });
    expect(goals[2].progress).toMatchObject({ have: 0, need: 3, done: [] });
    expect(newlyAchieved).toEqual([]);
    expect(mapGoals('no-such-map', { award: true })).toEqual({ goals: [], newlyAchieved: [] });
  });

  it('marks a goal achieved the first time it’s met, when an editor looks', () => {
    const goal = db().goals.find((g) => g.id === 'goal-bucket');
    ['JP', 'PE', 'IS'].forEach((code) => (db().visits.find((v) => v.mapId === HOME_MAP && v.countryCode === code).status = 'VISITED'));
    expect(mapGoals(HOME_MAP, { award: false }).newlyAchieved).toEqual([]);
    expect(goal.achievedAt).toBeNull();
    // Three more countries make eleven, so the ten by 2027 is met too
    expect(mapGoals(HOME_MAP, { award: true }).newlyAchieved).toEqual(['goal-ten', 'goal-bucket']);
    expect(goal.achievedAt).not.toBeNull();
  });

  it('shows one goal with its progress, achieving it when met', () => {
    const goal = { id: 'g', mapId: HOME_MAP, kind: 'COUNTRY_COUNT', target: 2, achievedAt: null, createdAt: 'x' };
    const view = oneGoalView(goal);
    expect(view).toEqual(goalView(goal, view.progress));
    expect(view.progress.met).toBe(true);
    expect(goal.achievedAt).not.toBeNull();
  });

  it('says a full map in the server’s words', () => {
    expect(GOAL_MESSAGES.full).toBe('A map can have up to 50 goals. Delete one to add another.');
  });
});

describe('awardQuietly', () => {
  it('awards every earned badge and met goal on every map, dated when given, without doubling', () => {
    const store = db();
    store.badgeAwards = [];
    store.goals.forEach((g) => (g.achievedAt = null));
    awardQuietly(store, '2026-01-01T00:00:00.000Z');
    const count = store.badgeAwards.length;
    expect(store.badgeAwards.every((a) => a.earnedAt === '2026-01-01T00:00:00.000Z')).toBe(true);
    expect(store.badgeAwards.some((a) => a.mapId === SAM_MAP && a.badgeKey === 'countries-1')).toBe(true);
    expect(store.goals.find((g) => g.id === 'goal-isles').achievedAt).toBe('2026-01-01T00:00:00.000Z');
    awardQuietly(store, '2026-02-01T00:00:00.000Z');
    expect(store.badgeAwards).toHaveLength(count);
  });

  it('makes the lists a store lacks', () => {
    const bare = { maps: [], goals: undefined };
    awardQuietly(bare, 'x');
    expect(bare).toEqual({ maps: [], goals: [], badgeAwards: [] });
  });
});
