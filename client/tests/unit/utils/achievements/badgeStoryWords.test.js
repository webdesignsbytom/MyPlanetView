import { describe, expect, it } from 'vitest';
import {
  ordinal,
  photoHeadline,
  storyItemName,
  storyItemWhen,
  storyItemWhere,
  storyLabel,
  storyListHeading,
  storyShortfall,
} from '@/utils/achievements/badgeStoryWords';

const places = (measure, codes, extra = {}) => ({
  measure,
  kind: 'places',
  need: codes.length,
  have: codes.length,
  items: codes.map((code, i) => ({ code, on: `2020-0${i + 1}-01` })),
  earnedWith: codes.length - 1,
  ...extra,
});

describe('ordinal', () => {
  it('says the first ten in words, then in figures with their endings', () => {
    expect([1, 2, 3, 10].map(ordinal)).toEqual(['first', 'second', 'third', 'tenth']);
    expect([11, 12, 13, 21, 22, 23, 25, 101, 111, 1000].map(ordinal)).toEqual(['11th', '12th', '13th', '21st', '22nd', '23rd', '25th', '101st', '111th', '1,000th']);
  });
});

describe('a story’s label for the one that earned it', () => {
  it('names the count it reached, never a sentence round the place', () => {
    expect(storyLabel(places('countries', ['GB', 'IE', 'US', 'NL', 'ES', 'FR', 'PT', 'GR', 'TR', 'MA']))).toBe('Your tenth country');
    expect(storyLabel(places('countries', ['GB']))).toBe('Your first country');
    expect(storyLabel(places('countries', ['GB']), { name: 'Ann' })).toBe('Ann’s first country');
    expect(storyLabel(places('continent', ['MA'], { continent: 'AFRICA' }))).toBe('Your first country in Africa');
    expect(storyLabel({ ...places('inhabitedContinents', ['FR', 'JP']), items: [{ code: 'FR', continent: 'EUROPE' }, { code: 'BR', continent: 'SOUTH_AMERICA' }] })).toBe(
      'Your sixth continent: South America',
    );
    expect(storyLabel(places('place', ['AQ'], { code: 'AQ' }))).toBe('You made it to');
    expect(storyLabel(places('place', ['AQ'], { code: 'AQ' }), { name: 'Bo' })).toBe('Bo made it to');
    expect(storyLabel(places('region', ['GB', 'IE'], { region: 'british-isles' }))).toBe('The last of the British Isles');
    expect(storyLabel(places('allCountries', ['FR']))).toBe('The last country on the map');
  });

  it('labels stamps, medals, One Shots and themes', () => {
    const one = (measure, kind, item, extra = {}) => ({ measure, kind, need: 1, have: 1, items: [item], earnedWith: 0, ...extra });
    expect(storyLabel({ ...one('landmarks', 'stamps', { name: 'Eiffel Tower' }), need: 10, items: Array(10).fill({ name: 'X' }), earnedWith: 9 })).toBe('Your tenth passport stamp');
    expect(storyLabel({ ...one('unesco', 'stamps', {}), need: 25, items: Array(25).fill({}), earnedWith: 24 })).toBe('Your 25th World Heritage Site');
    expect(storyLabel(one('collection', 'stamps', {}, { place: 'IE', tier: 'bronze' }))).toBe('Won Ireland’s bronze');
    expect(storyLabel(one('oneShotsWildlife', 'oneShots', { itemKey: 'puffin' }))).toBe('Your first animal');
    expect(storyLabel(one('oneShotsWonders', 'oneShots', {}))).toBe('Your first wonder of nature');
    expect(storyLabel(one('oneShotsJourneys', 'oneShots', {}))).toBe('Your first great journey');
    expect(storyLabel({ ...one('bigFive', 'oneShots', {}), need: 5, items: Array(5).fill({}), earnedWith: 4 })).toBe('The last of the Big Five');
    expect(storyLabel({ ...one('themes', 'themes', {}), need: 3, items: Array(3).fill({}), earnedWith: 2 })).toBe('Your third monthly theme');
  });

  it('has none while nothing has earned it', () => {
    expect(storyLabel({ ...places('countries', ['GB']), need: 5, earnedWith: null })).toBeNull();
  });
});

describe('an item’s words', () => {
  it('names each kind of thing', () => {
    expect(storyItemName({ kind: 'places' }, { code: 'GB' })).toBe('United Kingdom');
    expect(storyItemName({ kind: 'stamps' }, { name: 'Eiffel Tower' })).toBe('Eiffel Tower');
    expect(storyItemName({ kind: 'oneShots' }, { itemKey: 'puffin' })).toBe('Atlantic puffin');
    expect(storyItemName({ kind: 'oneShots' }, { itemKey: 'gone-now' })).toBe('gone-now');
    expect(storyItemName({ kind: 'themes' }, { title: 'Doors' })).toBe('Doors');
  });

  it('says when, as precisely as it was given, a traveller’s with the trip', () => {
    expect(storyItemWhen({ kind: 'places' }, { on: '2014-06-12' })).toBe('12 Jun 2014');
    expect(storyItemWhen({ kind: 'places' }, { on: null })).toBe('');
    expect(storyItemWhen({ kind: 'places' }, { on: '2025-03-08', trip: { title: 'Lisbon' } })).toBe('On Lisbon, 8 Mar 2025');
    expect(storyItemWhen({ kind: 'places' }, { on: null, trip: { title: 'Lisbon' } })).toBe('On Lisbon');
    expect(storyItemWhen({ kind: 'oneShots' }, { on: '2013-06-01', datePrecision: 'MONTH' })).toBe('June 2013');
    expect(storyItemWhen({ kind: 'oneShots' }, { on: '2013-01-01', datePrecision: 'YEAR' })).toBe('2013');
    expect(storyItemWhen({ kind: 'oneShots' }, { on: null, datePrecision: null })).toBe('');
    expect(storyItemWhen({ kind: 'themes' }, { month: '2026-03-01' })).toBe('March 2026');
  });

  it('says where a stamp or a sighting was, never a place’s own', () => {
    expect(storyItemWhere({ kind: 'stamps' }, { code: 'FR' })).toBe('France');
    expect(storyItemWhere({ kind: 'oneShots' }, { code: null })).toBe('');
    expect(storyItemWhere({ kind: 'places' }, { code: 'FR' })).toBe('');
  });
});

describe('the rest of the card', () => {
  it('says what put a photo badge’s count there', () => {
    expect(photoHeadline({ need: 100, photo: { video: false, addedOn: '2024-03-03' } })).toBe('Your 100th photo went on the map on 3 Mar 2024.');
    expect(photoHeadline({ need: 100, photo: { video: true, addedOn: '2024-03-03' } })).toBe('Your 100th photo or video went on the map on 3 Mar 2024.');
    expect(photoHeadline({ need: 100, photo: null })).toBeNull();
  });

  it('says when an earned badge has fewer to show than it took', () => {
    expect(storyShortfall({ kind: 'places', need: 10, have: 9, earnedWith: null })).toBe('It was earned with 10; 9 show on the map now.');
    expect(storyShortfall({ kind: 'places', need: 1, have: 0, earnedWith: null })).toBe('It was earned with 1; 0 show on the map now.');
    expect(storyShortfall({ kind: 'photos', need: 1000, have: 1, photo: null })).toBe('It was earned with 1,000; 1 shows on the map now.');
    expect(storyShortfall({ kind: 'places', need: 1, have: 1, earnedWith: 0 })).toBeNull();
    expect(storyShortfall({ kind: 'photos', need: 100, have: 100, photo: {} })).toBeNull();
  });

  it('heads a list of more than one, in the words of its kind', () => {
    expect(storyListHeading(places('countries', ['GB', 'IE']))).toBe('In the order you went');
    expect(storyListHeading(places('countries', ['GB']))).toBeNull();
    expect(storyListHeading({ kind: 'stamps', measure: 'landmarks', items: [{}, {}] })).toBe('In the order stamped');
    expect(storyListHeading({ kind: 'oneShots', measure: 'bigFive', items: [{}, {}] })).toBe('In the order seen');
    expect(storyListHeading({ kind: 'oneShots', measure: 'oneShotsJourneys', items: [{}, {}] })).toBe('In the order done');
    expect(storyListHeading({ kind: 'themes', measure: 'themes', items: [{}, {}] })).toBe('In the order entered');
    expect(storyListHeading({ kind: 'photos', measure: 'photos', items: [] })).toBeNull();
  });
});
