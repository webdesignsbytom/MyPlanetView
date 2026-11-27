// What a postcard is drawn from (utils/postcards/postcardArt.js): a photo covering its front (a
// city's, the wilderness's, a landmark's or the sender's own), the place's poster when it has none
import { describe, expect, it } from 'vitest';
import { placeModel, placeOutline, placePoster, postcardArt, postcardPhotoGroup, postcardPhotoUrl } from '@/utils/postcards/postcardArt';
import { SHARE_CARD_COLOURS } from '@/utils/constants/brandColours';
import { pastelNumberFor } from '@/utils/map/visitStatus';

const PHOTOS = {
  LICENCES: [['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/']],
  LANDMARK_PHOTOS: {
    'eiffel-tower': [480, 640, 'A. Photographer', 0, 'Eiffel Tower.jpg'],
    'paris-banks-of-the-seine': [480, 320, 'B. Walker', 0, 'Seine.jpg'],
    nowhere: [480, 360, 'C. Snapper', 0, 'Nowhere.jpg'],
  },
};
const EIFFEL = { id: 'lm-1', name: 'Eiffel Tower', slug: 'eiffel-tower', wikidataId: 'Q243', countryCode: 'FR' };
const SEINE = { id: 'lm-2', name: 'Paris, Banks of the Seine', slug: 'paris-banks-of-the-seine', wikidataId: 'Q2233532', countryCode: 'FR' };
const NOWHERE = { id: 'lm-3', name: 'Nowhere', slug: 'nowhere', wikidataId: 'Q0', countryCode: 'FR' };

describe('the place’s own art', () => {
  it('finds its poster (a UK nation’s or a region’s own), as a picture for the canvas', () => {
    const france = placePoster('FR');
    expect(france.url).toMatch(/visitCountryPosters\/fr-.+-800\.webp(\?canvas=1)?$/);
    expect(france.ratio).toBeCloseTo(2 / 3, 2);
    expect(placePoster('XC').url).toContain('visitCountryPosters/xc-');
    expect(placePoster('XB').url).toContain('visitCountryPosters/xb-');
    expect(placePoster('ZZ')).toBeNull();
  });

  it('finds its outline, its country’s for a place with none of its own', () => {
    expect(placeOutline('FR').paths.length).toBeGreaterThan(0);
    expect(placeOutline('XG')).toEqual(placeOutline('IN'));
    expect(placeOutline('XN')).toBeNull();
  });

  it('picks its best-known model: the country guide’s first landmark that has one, not the tallest or the first by name', () => {
    expect(placeModel('JP')).toMatchObject({ id: 'mount-fuji', name: 'Mount Fuji' });
    expect(placeModel('FR')).toMatchObject({ id: 'eiffel-tower' });
    expect(placeModel('FR').url).toBeTruthy();
    expect(placeModel('FR').aspect).toBeGreaterThan(0);
    // A UK nation's own (Wales: Caernarfon Castle), a region's country's
    expect(placeModel('XW').id).toMatch(/caernarfon/);
    expect(placeModel('XB')).toEqual(placeModel('ID'));
    expect(placeModel('XN')).toBeNull();
  });
});

describe('the postcards’ own photos', () => {
  it('knows each one’s group (a city, the wilderness or a landmark) and its 1200-wide picture', () => {
    expect(postcardPhotoGroup('paris-banks-of-the-seine')).toBe('c');
    expect(postcardPhotoGroup('mount-fuji')).toBe('w');
    expect(postcardPhotoGroup('eiffel-tower')).toBe('l');
    expect(postcardPhotoGroup('nowhere')).toBeNull();
    expect(postcardPhotoUrl('eiffel-tower')).toMatch(/postcardPhotos\/eiffel-tower-1200\.webp(\?canvas=1)?$/);
    expect(postcardPhotoUrl('nowhere')).toBeNull();
  });
});

describe('postcardArt', () => {
  it('covers a country’s card with its poster when it carries no photo, its model on the stamp', () => {
    const art = postcardArt({ kind: 'COUNTRY', countryCode: 'FR', landmark: null, pictureUrl: null });
    expect(art).toMatchObject({ kind: 'COUNTRY', placeName: 'France', subtitle: null, stamp: 'model', credit: null });
    expect(art.poster.url).toContain('visitCountryPosters/fr-');
    expect(art.cover).toEqual({ url: art.poster.url, isPoster: true });
    expect(art.stampModel.id).toBe('eiffel-tower');
    expect(art.outline.paths.length).toBeGreaterThan(0);
    expect(art.colour).toBe(SHARE_CARD_COLOURS.visits[pastelNumberFor('FR') - 1]);
  });

  it('covers a country’s card with its city’s photo, named and credited', () => {
    const art = postcardArt({ kind: 'COUNTRY', countryCode: 'FR', landmark: SEINE, pictureUrl: null }, PHOTOS);
    expect(art).toMatchObject({ kind: 'COUNTRY', placeName: 'France', subtitle: 'Paris, Banks of the Seine', credit: 'Photo: B. Walker, CC BY-SA 4.0' });
    expect(art.cover).toEqual({ url: postcardPhotoUrl('paris-banks-of-the-seine'), isPoster: false });
    // The credit waits for the credits' chunk; the photo doesn't
    const early = postcardArt({ kind: 'COUNTRY', countryCode: 'FR', landmark: SEINE }, null);
    expect(early.cover.url).toBe(art.cover.url);
    expect(early.credit).toBeNull();
  });

  it('covers a landmark’s card with its photo, its own model on the stamp', () => {
    const art = postcardArt({ kind: 'LANDMARK', countryCode: 'FR', landmark: EIFFEL, pictureUrl: null }, PHOTOS);
    expect(art).toMatchObject({ kind: 'LANDMARK', subtitle: 'Eiffel Tower', credit: 'Photo: A. Photographer, CC BY-SA 4.0', stamp: 'model' });
    expect(art.cover.url).toMatch(/postcardPhotos\/eiffel-tower-1200\.webp/);
    expect(art.stampModel.id).toBe('eiffel-tower');
  });

  it('falls back to the landmark list’s smaller photo, then the poster, and the place’s model on the stamp', () => {
    const art = postcardArt({ kind: 'LANDMARK', countryCode: 'FR', landmark: NOWHERE }, PHOTOS);
    expect(art.cover).toMatchObject({ url: expect.stringMatching(/landmarkPhotos\/nowhere-480\.webp/), isPoster: false });
    expect(art.credit).toBe('Photo: C. Snapper, CC BY-SA 4.0');
    expect(art.stampModel.id).toBe('eiffel-tower');
    const bare = postcardArt({ kind: 'LANDMARK', countryCode: 'FR', landmark: NOWHERE }, null);
    expect(bare.cover).toMatchObject({ isPoster: true });
    expect(bare.credit).toBeNull();
    // A place with no poster and no photo: nothing to cover it, the card's own colour then
    expect(postcardArt({ kind: 'COUNTRY', countryCode: 'ZZ' }).cover).toBeNull();
  });

  it('covers a photo card with the sender’s own photo, uncredited', () => {
    const art = postcardArt({ kind: 'PHOTO', countryCode: 'IT', landmark: null, pictureUrl: 'https://signed/x.webp?X-Amz-Signature=1' }, PHOTOS);
    expect(art).toMatchObject({ kind: 'PHOTO', placeName: 'Italy', subtitle: null, credit: null });
    expect(art.cover).toEqual({ url: 'https://signed/x.webp?X-Amz-Signature=1', isPoster: false });
  });

  it('shows the place’s own card when the landmark or the photo has gone', () => {
    expect(postcardArt({ kind: 'LANDMARK', countryCode: 'FR', landmark: null }).kind).toBe('COUNTRY');
    expect(postcardArt({ kind: 'PHOTO', countryCode: 'FR', pictureUrl: null }).kind).toBe('COUNTRY');
  });

  it('asks for another site’s public file under a marked address, never touching a signed one', () => {
    const art = postcardArt({ kind: 'COUNTRY', countryCode: 'FR' });
    // In the tests the media comes from /local-media (this site's own), left as it is
    expect(art.poster.url.startsWith('/local-media/') || art.poster.url.endsWith('?canvas=1')).toBe(true);
    expect(postcardArt({ kind: 'PHOTO', countryCode: 'FR', pictureUrl: 'https://b/x?X-Amz-Signature=1' }).cover.url).not.toContain('canvas=1');
  });
});
