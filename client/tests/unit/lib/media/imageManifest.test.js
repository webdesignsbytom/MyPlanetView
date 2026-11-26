import { describe, expect, it } from 'vitest';
import { getImageSets } from '@/lib/media/imageManifest';

// The real files under src/assets/images/: old-map-800|1200|1792 in avif, webp and jpg;
// regular-949 in all three; detailed-949 in avif and webp only
describe('getImageSets', () => {
  it('builds a srcSet per format, narrowest first', () => {
    const sets = getImageSets('old-map');
    for (const set of [sets.avifSet, sets.webpSet, sets.jpgSet]) {
      expect(set.split(', ').map((part) => part.split(' ')[1])).toEqual(['800w', '1200w', '1792w']);
    }
    expect(sets.avifSet).toMatch(/old-map-800\.avif/);
    expect(sets.webpSet).toMatch(/old-map-1792\.webp/);
    expect(sets.byFormat.avif.map((item) => item.width)).toEqual([800, 1200, 1792]);
  });

  it('leaves a format out when there are no files of it', () => {
    const sets = getImageSets('detailed');
    expect(sets.jpgSet).toBeUndefined();
    expect(sets.webpSet).toMatch(/detailed-949\.webp 949w/);
    expect(sets.pick('jpg')).toBeUndefined();
  });

  it('finds nothing for a name with no files', () => {
    const sets = getImageSets('no-such-picture');
    expect([sets.avifSet, sets.webpSet, sets.jpgSet]).toEqual([undefined, undefined, undefined]);
    expect(sets.pick('webp', 800)).toBeUndefined();
  });

  it('matches the whole name, not one that only ends the same', () => {
    // "map" must not pick up "old-map-800"
    expect(getImageSets('map').avifSet).toBeUndefined();
  });

  it('picks the largest by default, or the width nearest the one asked for', () => {
    const sets = getImageSets('old-map');
    expect(sets.pick('webp')).toMatch(/old-map-1792\.webp/);
    expect(sets.pick('webp', 900)).toMatch(/old-map-800\.webp/);
    expect(sets.pick('avif', 1300)).toMatch(/old-map-1200\.avif/);
    expect(sets.pick('jpeg', 2000)).toMatch(/old-map-1792\.jpg/);
  });

  it('only looks inside the folder it’s given', () => {
    expect(getImageSets('old-map', { dir: '/src/assets/images/map-styles' }).webpSet).toMatch(/old-map-800/);
    expect(getImageSets('old-map', { dir: '/src/assets/images/brand' }).webpSet).toBeUndefined();
  });

  it('keeps a background’s set apart from the Settings cards’ strips cut from it (preview-<name>)', () => {
    const background = getImageSets('old-map', { dir: '/src/assets/images/map-styles' });
    expect(background.byFormat.webp.map((item) => item.width)).toEqual([800, 1200, 1792]);
    expect(background.webpSet).not.toMatch(/preview-/);
    const strip = getImageSets('preview-old-map', { dir: '/src/assets/images/map-styles' });
    expect(strip.byFormat.avif.map((item) => item.width)).toEqual([320, 640]);
    expect(strip.byFormat.webp.map((item) => item.width)).toEqual([320, 640]);
  });

  it('never lists the home hero’s sets', () => {
    expect(getImageSets('home-hero-desktop').avifSet).toBeUndefined();
  });
});
