// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { HOME_DRAFT_PLACES } from '@/utils/homeDraft/destinations';

describe('the home page draft’s destinations', () => {
  it('lists twenty places, each once', () => {
    expect(HOME_DRAFT_PLACES).toHaveLength(20);
    expect(new Set(HOME_DRAFT_PLACES.map((place) => place.id)).size).toBe(20);
    expect(new Set(HOME_DRAFT_PLACES.map((place) => place.country)).size).toBe(20);
  });

  it('gives each a three-digit country code, words, a position and a photo', () => {
    for (const place of HOME_DRAFT_PLACES) {
      expect(place.id).toMatch(/^\d{3}$/);
      expect(place.site.length, place.id).toBeGreaterThan(0);
      expect(place.detail, place.id).toMatch(/\.$/);
      const [lon, lat] = place.point;
      expect(Math.abs(lon), place.id).toBeLessThanOrEqual(180);
      expect(Math.abs(lat), place.id).toBeLessThanOrEqual(90);
      expect(place.image, place.id).toMatch(new RegExp(`${place.id}\\.jpg`));
    }
  });

  it('has a smaller card photo for the three the page opens with only', () => {
    const withCards = HOME_DRAFT_PLACES.filter((place) => place.cardImage).map((place) => place.id);
    expect(withCards.sort()).toEqual(['036', '392', '764']);
    for (const id of withCards) {
      expect(HOME_DRAFT_PLACES.find((place) => place.id === id).cardImage).toMatch(new RegExp(`${id}-card\\.webp`));
    }
  });
});
