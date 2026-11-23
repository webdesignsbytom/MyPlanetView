// "Welcome home": which trip the map's tag is for, and the closed ones it remembers
// (utils/trips/tripHome.js).
import { describe, expect, it } from 'vitest';
import { HOME_CLOSED_MAX, HOME_TAG_DAYS, daysSinceEnd, justBackTrip, parseClosed, withClosed } from '@/utils/trips/tripHome';

const TODAY = '2026-11-23';
const trip = (id, endDate, over = {}) => ({ id, title: id, status: 'COMPLETED', startDate: '2026-11-01', endDate, ...over });

describe('daysSinceEnd', () => {
  it('is 1 the day after the trip’s last day, 0 on it', () => {
    expect(daysSinceEnd('2026-11-22', TODAY)).toBe(1);
    expect(daysSinceEnd('2026-11-23', TODAY)).toBe(0);
    expect(daysSinceEnd('2026-10-31', TODAY)).toBe(23);
  });
});

describe('justBackTrip', () => {
  it('is the trip that ended last, from the day after, for two weeks', () => {
    expect(HOME_TAG_DAYS).toBe(14);
    const trips = [trip('older', '2026-11-15'), trip('latest', '2026-11-20'), trip('upcoming', '2026-12-01', { status: 'PLANNED' })];
    expect(justBackTrip(trips, TODAY).id).toBe('latest');
    expect(justBackTrip([trip('yesterday', '2026-11-22')], TODAY).id).toBe('yesterday');
    expect(justBackTrip([trip('fortnight', '2026-11-09')], TODAY).id).toBe('fortnight');
  });

  it('is nothing while a trip is still going, once two weeks have passed, or without an end', () => {
    expect(justBackTrip([trip('today', TODAY)], TODAY)).toBeNull();
    expect(justBackTrip([trip('old', '2026-11-08')], TODAY)).toBeNull();
    expect(justBackTrip([trip('undated', null)], TODAY)).toBeNull();
    expect(justBackTrip(null, TODAY)).toBeNull();
  });

  it('counts a trip by its dates, whatever its status says', () => {
    expect(justBackTrip([trip('forgot', '2026-11-21', { status: 'PLANNED' })], TODAY).id).toBe('forgot');
  });

  it('skips a closed one, and a group trip the viewer wasn’t on', () => {
    const trips = [trip('closed', '2026-11-22'), trip('shown', '2026-11-20'), trip('notMine', '2026-11-21', { linked: true, canOpen: false })];
    expect(justBackTrip(trips, TODAY, { closed: ['closed'] }).id).toBe('shown');
    expect(justBackTrip(trips, TODAY, { closed: ['closed', 'shown'] })).toBeNull();
  });

  it('shows the email’s trip whenever it has ended, closed or long ago', () => {
    const trips = [trip('emailed', '2026-10-01'), trip('latest', '2026-11-22')];
    expect(justBackTrip(trips, TODAY, { forcedId: 'emailed', closed: ['emailed'] }).id).toBe('emailed');
    // One not over yet, or not in the list, falls back to the usual pick
    expect(justBackTrip([...trips, trip('future', '2026-12-01')], TODAY, { forcedId: 'future' }).id).toBe('latest');
    expect(justBackTrip(trips, TODAY, { forcedId: 'gone' }).id).toBe('latest');
  });

  it('picks by title when two ended the same day', () => {
    expect(justBackTrip([trip('Rome', '2026-11-20'), trip('Nice', '2026-11-20')], TODAY).id).toBe('Nice');
  });
});

describe('the closed list', () => {
  it('reads a stored list of ids, and nothing else', () => {
    expect(parseClosed('["a","b"]')).toEqual(['a', 'b']);
    expect(parseClosed('["a",3,null]')).toEqual(['a']);
    expect(parseClosed('{"a":1}')).toEqual([]);
    expect(parseClosed('not json')).toEqual([]);
    expect(parseClosed(null)).toEqual([]);
  });

  it('adds a trip once, newest last, keeping the newest few', () => {
    expect(withClosed(['a', 'b'], 'a')).toEqual(['b', 'a']);
    const many = Array.from({ length: HOME_CLOSED_MAX }, (_, i) => `t${i}`);
    const next = withClosed(many, 'new');
    expect(next).toHaveLength(HOME_CLOSED_MAX);
    expect(next[0]).toBe('t1');
    expect(next.at(-1)).toBe('new');
  });
});
