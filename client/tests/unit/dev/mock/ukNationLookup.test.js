import { describe, expect, it } from 'vitest';
import { ukNationAt } from '@/dev/mock/ukNationLookup';
import { UK_NATION_OUTLINES } from '@/dev/mock/data/ukNations';
import * as server from '../../../../../server/src/utils/ukNations.js';
import serverOutlines from '../../../../../server/src/data/ukNations.json' with { type: 'json' };

const PLACES = [
  ['London', 51.5074, -0.1278, 'XE'],
  ['Manchester', 53.4808, -2.2426, 'XE'],
  ['Penzance', 50.1188, -5.5373, 'XE'],
  ['Edinburgh', 55.9533, -3.1883, 'XC'],
  ['Lerwick', 60.1546, -1.1494, 'XC'],
  ['Cardiff', 51.4816, -3.1791, 'XW'],
  ['Snowdon', 53.0685, -4.0763, 'XW'],
  ['Belfast', 54.5973, -5.9301, 'XI'],
  ['Derry', 54.9966, -7.3086, 'XI'],
];

describe('ukNationAt', () => {
  it.each(PLACES)('puts %s in its nation', (_, lat, lng, nation) => {
    expect(ukNationAt(lat, lng)).toBe(nation);
  });

  it('gives a point just off the coast its nearest nation, within half a degree', () => {
    expect(ukNationAt(50.9, 1.3)).toBe('XE');
  });

  it('gives nothing far from the nations, or for a position that isn’t one', () => {
    expect(ukNationAt(48.8566, 2.3522)).toBeNull();
    expect(ukNationAt(-54.28, -36.5)).toBeNull();
    expect(ukNationAt(Number.NaN, 0)).toBeNull();
    expect(ukNationAt(undefined, undefined)).toBeNull();
  });

  it('gives the server’s answers over the same outlines', () => {
    expect(UK_NATION_OUTLINES).toEqual(serverOutlines);
    for (let lat = 49.8; lat <= 61; lat += 0.37) {
      for (let lng = -8.5; lng <= 2; lng += 0.41) expect(ukNationAt(lat, lng)).toBe(server.ukNationAt(lat, lng));
    }
  });
});
