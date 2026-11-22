import { describe, expect, it } from 'vitest';
import {
  GOAL_KINDS,
  GOAL_KIND_OPTIONS,
  GOAL_LIST_MAX,
  GOAL_REGIONS,
  GOAL_REGION_GROUPS,
  GOAL_TARGET_MAX,
  GOAL_TITLE_MAX,
  GOALS_PER_MAP,
  goalFraction,
  goalName,
  goalProgressText,
  goalState,
  goalStateText,
  goalStillToGo,
  listNames,
  nearestGoal,
  regionCountryCodes,
  regionName,
} from '@/utils/achievements/goals';
import { PLAIN_COUNTRIES } from '@/utils/map/countries';
// The server's limits: the client keeps a copy
import * as serverGoals from '../../../../../server/src/utils/goals.js';

describe('the limits', () => {
  it('match the server’s', () => {
    expect(GOAL_KINDS).toEqual(serverGoals.GOAL_KINDS);
    expect(GOALS_PER_MAP).toBe(serverGoals.GOALS_PER_MAP);
    expect(GOAL_TITLE_MAX).toBe(serverGoals.GOAL_TITLE_MAX);
    expect(GOAL_LIST_MAX).toBe(serverGoals.GOAL_LIST_MAX);
    expect({ ...GOAL_TARGET_MAX }).toEqual({ ...serverGoals.GOAL_TARGET_MAX });
    expect(GOAL_REGIONS).toEqual(serverGoals.GOAL_REGIONS);
  });

  it('offers every kind on the form, and every region and continent in the picker', () => {
    expect(GOAL_KIND_OPTIONS.map((option) => option.value).sort()).toEqual([...GOAL_KINDS].sort());
    const offered = GOAL_REGION_GROUPS.flatMap((group) => group.options.map((option) => option.value));
    expect(offered.sort()).toEqual([...GOAL_REGIONS].sort());
    expect(GOAL_REGION_GROUPS.map((group) => group.label)).toEqual(['Continents', 'Regions']);
  });
});

describe('listNames', () => {
  it('lists one, two and a few names in words', () => {
    expect(listNames([])).toBe('');
    expect(listNames(['JP'])).toBe('Japan');
    expect(listNames(['JP', 'PE'])).toBe('Japan and Peru');
    expect(listNames(['JP', 'PE', 'IS'])).toBe('Japan, Peru and Iceland');
  });

  it('counts the rest past the most it names', () => {
    expect(listNames(['JP', 'PE', 'IS', 'FR', 'BE', 'NL'])).toBe('Japan, Peru, Iceland and 3 more');
    expect(listNames(['JP', 'PE', 'IS', 'FR'], 4)).toBe('Japan, Peru, Iceland and France');
    expect(listNames(['JP', 'PE', 'IS'], 2)).toBe('Japan and 2 more');
  });

  it('keeps a code it doesn’t know as it is', () => {
    expect(listNames(['ZZ', 'JP'])).toBe('ZZ and Japan');
  });
});

describe('regionName', () => {
  it('names a region, a continent, or gives the key back', () => {
    expect(regionName('benelux')).toBe('Benelux');
    expect(regionName('SOUTH_AMERICA')).toBe('South America');
    expect(regionName('atlantis')).toBe('atlantis');
  });
});

describe('goalName', () => {
  it('uses the goal’s own title first', () => {
    expect(goalName({ title: 'Our bucket list', kind: 'COUNTRY_COUNT', target: 10 })).toBe('Our bucket list');
  });

  it('words each kind without a title', () => {
    expect(goalName({ kind: 'COUNTRY_COUNT', target: 1 })).toBe('1 country');
    expect(goalName({ kind: 'COUNTRY_COUNT', target: 30 })).toBe('30 countries');
    expect(goalName({ kind: 'LANDMARK_COUNT', target: 12 })).toBe('12 landmark stamps');
    expect(goalName({ kind: 'COUNTRY_LIST', countryCodes: ['JP', 'PE'] })).toBe('Bucket list: Japan and Peru');
    expect(goalName({ kind: 'COUNTRY_LIST' })).toBe('Bucket list: ');
    expect(goalName({ kind: 'REGION', region: 'caribbean' })).toBe('Every country in the Caribbean islands');
    expect(goalName({ kind: 'REGION', region: 'EUROPE' })).toBe('Every country in Europe');
    expect(goalName({ kind: 'SOMETHING_NEW' })).toBe('Goal');
  });
});

describe('goalProgressText', () => {
  it('counts in the goal’s own unit', () => {
    expect(goalProgressText({ kind: 'COUNTRY_COUNT', progress: { have: 8, need: 10 } })).toBe('8 of 10 countries');
    expect(goalProgressText({ kind: 'REGION', progress: { have: 2, need: 3 } })).toBe('2 of 3 countries');
    expect(goalProgressText({ kind: 'COUNTRY_LIST', progress: { have: 1, need: 3 } })).toBe('1 of 3 places');
    expect(goalProgressText({ kind: 'LANDMARK_COUNT', progress: { have: 12, need: 50 } })).toBe('12 of 50 stamps');
  });

  it('starts from nothing without progress', () => {
    expect(goalProgressText({ kind: 'COUNTRY_COUNT' })).toBe('0 of 0 countries');
  });
});

describe('goalState and goalStateText', () => {
  it('is reached once achieved or met', () => {
    expect(goalState({ achievedAt: '2026-03-12T10:00:00Z' })).toBe('reached');
    expect(goalState({ progress: { met: true } })).toBe('reached');
    expect(goalStateText({ achievedAt: '2026-03-12T10:00:00Z' })).toBe('Reached 12 Mar 2026');
    expect(goalStateText({ progress: { met: true } })).toBe('Reached');
  });

  it('is missed once its deadline passed unmet', () => {
    const goal = { deadline: '2026-01-01', progress: { missed: true } };
    expect(goalState(goal)).toBe('missed');
    expect(goalStateText(goal)).toBe('Missed: the deadline was 1 Jan 2026');
  });

  it('is still going otherwise, with or without a deadline', () => {
    expect(goalState({ progress: { have: 1, need: 2 } })).toBe('going');
    expect(goalStateText({ deadline: '2027-12-31' })).toBe('By 31 Dec 2027');
    expect(goalStateText({})).toBe('No deadline');
  });

  it('counts a reached goal as reached even past its deadline', () => {
    expect(goalState({ achievedAt: '2026-01-02', progress: { missed: true } })).toBe('reached');
  });
});

describe('goalFraction', () => {
  it('is the share done, at most 1, and 0 with nothing asked', () => {
    expect(goalFraction({ progress: { have: 3, need: 4 } })).toBe(0.75);
    expect(goalFraction({ progress: { have: 9, need: 4 } })).toBe(1);
    expect(goalFraction({ progress: { have: 3, need: 0 } })).toBe(0);
    expect(goalFraction({})).toBe(0);
  });
});

describe('nearestGoal', () => {
  const goal = (id, have, need, extra = {}) => ({ id, progress: { have, need }, createdAt: `2026-01-0${id}`, ...extra });

  it('picks the unmet goal nearest done', () => {
    expect(nearestGoal([goal(1, 1, 10), goal(2, 8, 10), goal(3, 9, 10)]).id).toBe(3);
  });

  it('leaves out reached and missed goals', () => {
    const goals = [goal(1, 9, 10, { achievedAt: '2026-02-01' }), goal(2, 9, 10, { progress: { have: 9, need: 10, missed: true } }), goal(3, 1, 10)];
    expect(nearestGoal(goals).id).toBe(3);
  });

  it('breaks a tie on the earlier deadline, a goal with one before one without', () => {
    expect(nearestGoal([goal(1, 1, 2), goal(2, 1, 2, { deadline: '2027-06-01' }), goal(3, 1, 2, { deadline: '2027-01-01' })]).id).toBe(3);
    expect(nearestGoal([goal(1, 1, 2), goal(2, 1, 2, { deadline: '2028-01-01' })]).id).toBe(2);
  });

  it('then on the oldest', () => {
    expect(nearestGoal([goal(3, 1, 2), goal(1, 1, 2), goal(2, 1, 2)]).id).toBe(1);
  });

  it('is null with nothing to show, and leaves the list as it was', () => {
    expect(nearestGoal()).toBeNull();
    expect(nearestGoal([goal(1, 2, 2, { achievedAt: '2026-01-01' })])).toBeNull();
    const goals = [goal(1, 1, 10), goal(2, 5, 10)];
    nearestGoal(goals);
    expect(goals.map((g) => g.id)).toEqual([1, 2]);
  });
});

describe('regionCountryCodes and goalStillToGo', () => {
  it('gives a region’s countries, and the UK nations on a split map', () => {
    expect(regionCountryCodes('benelux')).toEqual(['BE', 'LU', 'NL']);
    expect(regionCountryCodes('british-isles')).toEqual(['GB', 'IE']);
    expect(regionCountryCodes('british-isles', true)).toEqual(['XE', 'XC', 'XW', 'XI', 'IE']);
  });

  it('gives a continent’s countries, special places left out', () => {
    const europe = regionCountryCodes('EUROPE');
    expect(europe).toEqual(PLAIN_COUNTRIES.filter((c) => c.continent === 'EUROPE').map((c) => c.code));
    expect(europe).toContain('GB');
    expect(regionCountryCodes('EUROPE', true)).toContain('XE');
    expect(regionCountryCodes('EUROPE', true)).not.toContain('GB');
    expect(regionCountryCodes('SOUTH_AMERICA')).not.toContain('AQ');
  });

  it('lists the places a list or region goal still needs', () => {
    expect(goalStillToGo({ kind: 'COUNTRY_LIST', countryCodes: ['JP', 'PE', 'IS'], progress: { done: ['PE'] } })).toEqual(['JP', 'IS']);
    expect(goalStillToGo({ kind: 'REGION', region: 'benelux', progress: { done: ['NL'] } })).toEqual(['BE', 'LU']);
    expect(goalStillToGo({ kind: 'REGION', region: 'british-isles', progress: { done: ['IE'] } }, true)).toEqual(['XE', 'XC', 'XW', 'XI']);
    expect(goalStillToGo({ kind: 'COUNTRY_LIST' })).toEqual([]);
  });

  it('has nothing to list for the counts', () => {
    expect(goalStillToGo({ kind: 'COUNTRY_COUNT', target: 10 })).toEqual([]);
    expect(goalStillToGo({ kind: 'LANDMARK_COUNT', target: 10 })).toEqual([]);
  });
});
