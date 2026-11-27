// The photos a postcard's front can have from a place (utils/postcards/postcardPhotoItems.js), and
// the client's list of them (postcardPhotos.js, by slug) against the server's (postcardPhotos.json,
// by Wikidata item), both written by images/src/tools/postcard-photos.mjs
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { photoItems } from '@/utils/postcards/postcardPhotoItems';
import { POSTCARD_PHOTOS } from '@/utils/postcards/postcardPhotos';
import { LANDMARK_ROWS } from '@/dev/mock/views';
import SERVER_PHOTOS from '../../../../../server/src/data/postcardPhotos.json' with { type: 'json' };

const lm = (name, wikidataId, slug, countryCode = 'FR') => ({ id: `lm-${slug}`, name, slug, wikidataId, countryCode });
const FRANCE = [
  lm('Amiens Cathedral', 'Q106934', 'amiens-cathedral'),
  lm('Paris, Banks of the Seine', 'Q2233532', 'paris-banks-of-the-seine'),
  lm('Gulf of Porto', 'Q15728421', 'gulf-of-porto'),
  lm('Eiffel Tower', 'Q243', 'eiffel-tower'),
  lm('Episcopal City of Albi', 'Q1778266', 'episcopal-city-of-albi'),
  lm('Chartres Cathedral', 'Q180274', 'chartres-cathedral'),
  lm('A place with no photo', 'Q0', 'no-photo'),
];

describe('photoItems', () => {
  it('gives the place’s landmarks with a card-sized photo: cities, then the wilderness, then landmarks', () => {
    const items = photoItems(FRANCE, 'FR');
    expect(items.map((item) => [item.landmark.slug, item.group])).toEqual([
      // No city on the guide's list: A to Z
      ['episcopal-city-of-albi', 'c'],
      ['paris-banks-of-the-seine', 'c'],
      ['gulf-of-porto', 'w'],
      // The guide's best-known first, in its order (the Eiffel Tower, Chartres, Amiens)
      ['eiffel-tower', 'l'],
      ['chartres-cathedral', 'l'],
      ['amiens-cathedral', 'l'],
    ]);
    expect(items[0].landmark).toBe(FRANCE[4]);
  });

  it('ranks a UK nation’s and a region’s by their country’s list, and is empty with none', () => {
    const uk = [lm('Stonehenge', 'Q39671', 'stonehenge', 'GB'), lm('Big Ben', 'Q41225', 'big-ben', 'GB')].filter((l) => POSTCARD_PHOTOS[l.slug]);
    expect(photoItems(uk, 'XE').map((item) => item.landmark.slug)).toEqual(photoItems(uk, 'GB').map((item) => item.landmark.slug));
    expect(photoItems([], 'FR')).toEqual([]);
    expect(photoItems([FRANCE[6]], 'FR')).toEqual([]);
  });
});

describe('the client’s and the server’s lists of postcard photos', () => {
  it('name the same landmarks in the same groups', () => {
    const byWikidata = new Map(LANDMARK_ROWS.map((row) => [row.wikidataId, row.slug]));
    const fromServer = Object.fromEntries(Object.entries(SERVER_PHOTOS).map(([wikidataId, group]) => [byWikidata.get(wikidataId), group]));
    expect(Object.keys(fromServer)).not.toContain('undefined');
    expect(fromServer).toEqual({ ...POSTCARD_PHOTOS });
    expect(new Set(Object.values(POSTCARD_PHOTOS))).toEqual(new Set(['c', 'w', 'l']));
  });
});
