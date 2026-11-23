import { describe, expect, it } from 'vitest';
import { BADGE_GROUPS, badgeGroupLabel, badgeWords } from '@/utils/achievements/badges';
// The server's list of badges (the client words each key)
import { BADGES } from '../../../../../server/src/utils/badges.js';

describe('badgeWords', () => {
  it('names every badge the server can award, with a description', () => {
    for (const { key } of BADGES) {
      const words = badgeWords(key);
      expect(words.name, key).not.toBe(key.replace(/-/g, ' '));
      expect(words.description.length, key).toBeGreaterThan(10);
    }
  });

  it('puts every server badge in a group the suitcase shows', () => {
    const groups = new Set(BADGE_GROUPS.map((group) => group.id));
    for (const { key, group } of BADGES) expect(groups.has(group), `${key} in ${group}`).toBe(true);
  });

  it('words the country counts with the number on the sticker', () => {
    expect(badgeWords('countries-1')).toEqual({ name: 'First country', short: '1', description: 'Your first country visited or lived in.' });
    expect(badgeWords('countries-25')).toMatchObject({ name: '25 countries', short: '25' });
    expect(badgeWords('countries-25').description).toBe('25 countries visited or lived in. Antarctica and the poles count apart.');
  });

  it('names a continent badge by the continent', () => {
    expect(badgeWords('continent-north-america')).toEqual({
      name: 'North America',
      description: 'A first country in North America.',
    });
    expect(badgeWords('continent-europe').name).toBe('Europe');
  });

  it('lists every country of a region, and the UK nations where a map splits the UK', () => {
    const benelux = badgeWords('region-benelux');
    expect(benelux.name).toBe('Benelux');
    expect(benelux.description).toBe('Every country in Benelux: Belgium, Luxembourg and Netherlands.');

    const isles = badgeWords('region-british-isles');
    expect(isles.name).toBe('British Isles');
    expect(isles.description).toMatch(/^Every country in the British Isles: United Kingdom and Ireland\./);
    expect(isles.description).toContain('On a map that shows the UK as its nations: England, Scotland, Wales, Northern Ireland and Ireland.');
  });

  it('drops a leading "The" from a region badge’s name', () => {
    expect(badgeWords('region-caribbean').name).toBe('Caribbean islands');
    expect(badgeWords('region-caribbean').description).toMatch(/^Every country in the Caribbean islands: /);
  });

  it('still shows a badge it doesn’t know, under a plain name', () => {
    expect(badgeWords('visited-the-moon')).toEqual({ name: 'visited the moon', description: '' });
  });
});

describe('badgeGroupLabel', () => {
  it('labels each group, and falls back to the id', () => {
    expect(badgeGroupLabel('themes')).toBe('Monthly themes');
    expect(badgeGroupLabel('special')).toBe('Special places');
    expect(badgeGroupLabel('mystery')).toBe('mystery');
  });

  it('keeps the groups in the suitcase’s order', () => {
    expect(BADGE_GROUPS.map((group) => group.id)).toEqual(['countries', 'continents', 'special', 'regions', 'landmarks', 'collections', 'oneShots', 'photos', 'themes']);
  });

  // 24 Nov 2026: the World Heritage tiers up to 250, and the country collections
  it('names the new World Heritage tiers and each country’s medals', () => {
    expect(badgeWords('unesco-250')).toEqual({ name: '250 World Heritage Sites', short: '250', description: '250 UNESCO World Heritage Sites stamped.' });
    expect(badgeWords('collect-MT-bronze').name).toBe('Bronze for Malta');
    expect(badgeWords('collect-MT-bronze').description).toMatch(/^A quarter of Malta’s landmarks/);
  });
});
