// @vitest-environment node
// Life's One Shots' words: the lists, their groups, progress and a tick's when and where.
import { describe, expect, it } from 'vitest';
import {
  ONE_SHOT_LIST_LABELS,
  oneShotGroupLabel,
  oneShotGroups,
  oneShotProgress,
  oneShotsInPlace,
  progressWords,
  seenWords,
} from '@/utils/oneShots/oneShotWords';

describe('the lists and groups', () => {
  it('name the lists and each group, the journeys’ water apart from the wonders’', () => {
    expect(ONE_SHOT_LIST_LABELS).toEqual({ WILDLIFE: 'Wildlife', WONDERS: 'Nature’s wonders', JOURNEYS: 'Journeys and feats' });
    expect(oneShotGroupLabel('WONDERS', 'water')).toBe('Water and ice');
    expect(oneShotGroupLabel('JOURNEYS', 'water')).toBe('On the water');
    expect(oneShotGroupLabel('WONDERS', 'volcanoes')).toBe('Volcanoes');
  });

  it('give a list’s items in their groups, in order', () => {
    const groups = oneShotGroups('WONDERS');
    expect(groups.map((g) => g.group)).toEqual(['sky', 'volcanoes', 'water', 'land']);
    expect(groups[1].items.map((item) => item.key)).toContain('erupting-volcano');
  });
});

describe('progress', () => {
  it('counts each list from the ticks, in words', () => {
    const progress = oneShotProgress([{ itemKey: 'lion' }, { itemKey: 'northern-lights' }, { itemKey: 'lion' }]);
    expect(progress.WILDLIFE).toEqual({ have: 1, total: 80 });
    expect(progress.JOURNEYS).toEqual({ have: 0, total: 43 });
    expect(progressWords('WILDLIFE', progress.WILDLIFE)).toBe('1 of 80 animals');
    expect(progressWords('JOURNEYS', progress.JOURNEYS)).toBe('0 of 43 journeys and feats');
  });
});

describe('seenWords', () => {
  it('says when and where, as much as is known', () => {
    expect(seenWords({ seenOn: '2024-03-01', datePrecision: 'MONTH', countryCode: 'KE' })).toBe('March 2024, in Kenya');
    expect(seenWords({ seenOn: null, countryCode: 'KE' })).toBe('In Kenya');
    expect(seenWords({ seenOn: '2019', datePrecision: 'YEAR' })).toBe('2019');
    expect(seenWords({})).toBe('');
    expect(seenWords(null)).toBe('');
  });
});

describe('oneShotsInPlace', () => {
  it('lists what was seen there, and what’s usually seen there still to see', () => {
    const { seen, toSee } = oneShotsInPlace('IS', [{ itemKey: 'puffin', countryCode: 'IS' }]);
    expect(seen.map((s) => s.item.key)).toEqual(['puffin']);
    expect(toSee.map((item) => item.key)).toEqual(expect.arrayContaining(['northern-lights', 'geyser', 'silfra']));
    expect(toSee.map((item) => item.key)).not.toContain('puffin');
  });

  it('leaves out an item seen somewhere else: it isn’t seen here, nor still to see', () => {
    const { seen, toSee } = oneShotsInPlace('IS', [
      { itemKey: 'puffin', countryCode: 'IE' },
      { itemKey: 'northern-lights', countryCode: null },
    ]);
    expect(seen).toEqual([]);
    expect(toSee.map((item) => item.key)).not.toContain('puffin');
    expect(toSee.map((item) => item.key)).not.toContain('northern-lights');
  });

  it('reads a UK nation as the UK, and lists a tick there the catalogue doesn’t place there', () => {
    const { seen, toSee } = oneShotsInPlace('XC', [{ itemKey: 'orca', countryCode: 'XC' }]);
    expect(toSee.map((item) => item.key)).toContain('puffin');
    expect(seen.map((s) => s.item.key)).toEqual(['orca']);
  });

  it('has nothing for a place with no items', () => {
    expect(oneShotsInPlace('LU', [])).toEqual({ seen: [], toSee: [] });
  });
});
