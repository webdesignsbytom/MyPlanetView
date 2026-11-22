import { beforeEach, describe, expect, it } from 'vitest';
import { countryListPages } from '@/dev/mock/countryLists';
import { HOME_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const lists = (query, role = 'OWNER') =>
  countryListPages({ query, photos: db().photos.filter((p) => p.mapId === HOME_MAP), role, mapId: HOME_MAP, photoAccess: { mapRole: role } });

describe('countryListPages', () => {
  it('answers each country’s first page of photos and of moments', () => {
    const out = lists({ photos: 'FR,PT', moments: 'FR' });
    expect(Object.keys(out.photos)).toEqual(['FR', 'PT']);
    expect(out.photos.FR.photos.every((p) => p.countryCode === 'FR')).toBe(true);
    expect(out.photos.FR.photos.length).toBe(db().photos.filter((p) => p.mapId === HOME_MAP && p.countryCode === 'FR').length);
    expect(out.moments.FR.moments.map((m) => m.id)).toEqual(['moment-engaged']);
  });

  it('keeps the lists’ own rules: a viewer never gets hidden photos', () => {
    expect(lists({ photos: 'PT' }, 'OWNER').photos.PT.photos.map((p) => p.id)).toContain('photo-hidden');
    expect(lists({ photos: 'PT' }, 'VIEWER').photos.PT.photos).toEqual([]);
  });

  it('passes the page size and display copies on', () => {
    const out = lists({ photos: 'FR', limit: '1', display: '1' });
    expect(out.photos.FR.photos).toHaveLength(1);
    expect(out.photos.FR.photos[0].displayUrl).toMatch(/display\.webp$/);
    expect(out.photos.FR.nextCursor).toBe(out.photos.FR.photos[0].id);
  });

  it('answers empty lists for none asked, and lists each code once', () => {
    expect(lists({})).toEqual({ photos: {}, moments: {} });
    expect(Object.keys(lists({ photos: 'FR,FR' }).photos)).toEqual(['FR']);
  });

  it('refuses a list that isn’t two-letter codes, or one of more than 300', () => {
    for (const photos of ['fr', 'FRA', 'FR,', 5]) expect(lists({ photos }).error).toBe('Malformed data.');
    const many = Array.from({ length: 301 }, (_, i) => String.fromCharCode(65 + Math.floor(i / 26), 65 + (i % 26))).join(',');
    expect(lists({ moments: many }).error).toBe('Malformed data.');
  });

  it('passes a page’s own error on', () => {
    expect(lists({ moments: 'ZZ' }).error).toBe("That country isn't on the map.");
  });
});
