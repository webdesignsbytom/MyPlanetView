// What a postcard is drawn from (utils/postcards/postcardArt.js): the site's own art, by its kind
import { describe, expect, it } from 'vitest';
import { placeModel, placeOutline, placePoster, postcardArt } from '@/utils/postcards/postcardArt';
import { SHARE_CARD_COLOURS } from '@/utils/constants/brandColours';
import { pastelNumberFor } from '@/utils/map/visitStatus';

const PHOTOS = {
  LICENCES: [['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/']],
  LANDMARK_PHOTOS: { 'eiffel-tower': [480, 640, 'A. Photographer', 0, 'Eiffel Tower.jpg'] },
};
const EIFFEL = { id: 'lm-1', name: 'Eiffel Tower', slug: 'eiffel-tower', wikidataId: 'Q243', countryCode: 'FR' };

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

describe('postcardArt', () => {
  it('draws a country’s card from its poster, outline, model and pastel', () => {
    const art = postcardArt({ kind: 'COUNTRY', countryCode: 'FR', landmark: null, pictureUrl: null });
    expect(art).toMatchObject({ kind: 'COUNTRY', placeName: 'France', landmarkName: null, landmarkPhoto: null, photoUrl: null, stamp: 'model', credit: null });
    expect(art.poster.url).toContain('visitCountryPosters/fr-');
    expect(art.model.id).toBe('eiffel-tower');
    expect(art.stampModel).toEqual(art.model);
    expect(art.colour).toBe(SHARE_CARD_COLOURS.visits[pastelNumberFor('FR') - 1]);
  });

  it('draws a landmark’s from its photo (credited) and its own model', () => {
    const art = postcardArt({ kind: 'LANDMARK', countryCode: 'FR', landmark: EIFFEL, pictureUrl: null }, PHOTOS);
    expect(art).toMatchObject({ kind: 'LANDMARK', landmarkName: 'Eiffel Tower', credit: 'Photo: A. Photographer, CC BY-SA 4.0' });
    expect(art.landmarkPhoto.url).toMatch(/landmarkPhotos\/eiffel-tower-480\.webp/);
    expect(art.model.id).toBe('eiffel-tower');
    // Before the credits arrive: no photo yet, the model alone
    expect(postcardArt({ kind: 'LANDMARK', countryCode: 'FR', landmark: EIFFEL }, null).landmarkPhoto).toBeNull();
    // A landmark with no model of its own: none on the front, the place's on the stamp
    const other = postcardArt({ kind: 'LANDMARK', countryCode: 'FR', landmark: { ...EIFFEL, wikidataId: 'Q0', slug: 'nowhere' } }, PHOTOS);
    expect(other.model).toBeNull();
    expect(other.stampModel.id).toBe('eiffel-tower');
  });

  it('draws a photo card from the sender’s own photo', () => {
    const art = postcardArt({ kind: 'PHOTO', countryCode: 'IT', landmark: null, pictureUrl: 'https://signed/x.webp?X-Amz-Signature=1' });
    expect(art).toMatchObject({ kind: 'PHOTO', placeName: 'Italy', photoUrl: 'https://signed/x.webp?X-Amz-Signature=1' });
  });

  it('shows the place’s own picture when the landmark or the photo has gone', () => {
    expect(postcardArt({ kind: 'LANDMARK', countryCode: 'FR', landmark: null }).kind).toBe('COUNTRY');
    expect(postcardArt({ kind: 'PHOTO', countryCode: 'FR', pictureUrl: null }).kind).toBe('COUNTRY');
  });

  it('asks for another site’s public file under a marked address, never touching a signed one', () => {
    const art = postcardArt({ kind: 'COUNTRY', countryCode: 'FR' });
    // In the tests the media comes from /local-media (this site's own), left as it is
    expect(art.poster.url.startsWith('/local-media/') || art.poster.url.endsWith('?canvas=1')).toBe(true);
    expect(postcardArt({ kind: 'PHOTO', countryCode: 'FR', pictureUrl: 'https://b/x?X-Amz-Signature=1' }).photoUrl).not.toContain('canvas=1');
  });
});
