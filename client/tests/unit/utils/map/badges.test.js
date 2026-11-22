// @vitest-environment node
// The visit badges (src/utils/map/badges.js): which symbol a place wears, and the sizes of
// badges, pole markers and moment marks by zoom.
import { describe, expect, it } from 'vitest';
import { BADGE_IDS, MOMENT_MARK_ID, badgeIdFor, badgeRadius, badgeRadiusFor, momentMarkPlace, poleMarkerRadius } from '@/utils/map/badges';

describe('badgeIdFor', () => {
  it('gives a country the star sticker, visited or lived in', () => {
    expect(badgeIdFor('FR', 'VISITED')).toBe(BADGE_IDS.VISITED);
    expect(badgeIdFor('FR', 'LIVED')).toBe(BADGE_IDS.LIVED);
  });

  it('gives a special place the gold expedition stamp', () => {
    expect(badgeIdFor('AQ', 'VISITED')).toBe(BADGE_IDS.EXPEDITION_VISITED);
    expect(badgeIdFor('XN', 'LIVED')).toBe(BADGE_IDS.EXPEDITION_LIVED);
    expect(badgeIdFor('QS', 'VISITED')).toBe(BADGE_IDS.EXPEDITION_VISITED);
  });

  it('gives a region and a UK nation the star, as a country', () => {
    expect(badgeIdFor('XB', 'VISITED')).toBe(BADGE_IDS.VISITED);
    expect(badgeIdFor('XE', 'LIVED')).toBe(BADGE_IDS.LIVED);
  });

  it('gives nothing for “want to go” or no status', () => {
    expect(badgeIdFor('FR', 'WANT_TO_GO')).toBeNull();
    expect(badgeIdFor('AQ', undefined)).toBeNull();
  });

  it('has a different symbol id for each badge', () => {
    const ids = Object.values(BADGE_IDS);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(MOMENT_MARK_ID);
  });
});

describe('the sizes by zoom', () => {
  it('make a badge 9 units at world view, growing on screen slower than the zoom', () => {
    expect(badgeRadius(1)).toBe(9);
    expect(badgeRadius(4)).toBe(4.5);
    // On screen it's radius × zoom: bigger as you zoom in
    expect(badgeRadius(4) * 4).toBeGreaterThan(badgeRadius(1) * 1);
  });

  it('make a region’s badge three quarters of a country’s', () => {
    expect(badgeRadiusFor('XB', 4)).toBe(badgeRadius(4) * 0.75);
    expect(badgeRadiusFor('FR', 4)).toBe(badgeRadius(4));
    expect(badgeRadiusFor('AQ', 1)).toBe(9);
  });

  it('draw a pole’s compass rose a little bigger than a badge', () => {
    expect(poleMarkerRadius(1)).toBe(11);
    expect(poleMarkerRadius(4)).toBe(5.5);
    expect(poleMarkerRadius(9)).toBeGreaterThan(badgeRadius(9));
  });
});

describe('momentMarkPlace', () => {
  it('sits up and to the right of the badge’s centre, a little smaller than the badge', () => {
    const r = badgeRadius(1);
    const place = momentMarkPlace(100, 200, 1);
    expect(place.x).toBeCloseTo(100 + r * 0.45, 10);
    expect(place.y).toBeCloseTo(200 - r * 1.25, 10);
    expect(place.height).toBeCloseTo(r * 1.35, 10);
    expect(place.width).toBeCloseTo((place.height * 16) / 18, 10);
  });

  it('shrinks in map units with the badge as the map zooms in', () => {
    expect(momentMarkPlace(0, 0, 4).height).toBeCloseTo(momentMarkPlace(0, 0, 1).height / 2, 10);
  });
});
