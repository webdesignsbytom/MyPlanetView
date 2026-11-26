// @vitest-environment node
// A place's outline on its own (src/utils/map/countryOutline.js; 24 Nov 2026, the user's wish:
// the celebration shows the country's outline above its models).
import { describe, expect, it } from 'vitest';
import { countryOutline } from '@/utils/map/countryOutline';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';

const box = (viewBox) => {
  const [x, y, width, height] = viewBox.split(' ').map(Number);
  return { x, y, width, height };
};

describe('countryOutline', () => {
  it('is the map’s own shapes, boxed for a viewBox with a little room round them', () => {
    const spain = countryOutline('ES');
    expect(spain.paths.every((d) => COUNTRY_SHAPES.ES.includes(d))).toBe(true);
    const b = box(spain.viewBox);
    // Iberia and the Balearics: a small part of the 2000-wide map
    expect(b.x).toBeGreaterThan(900);
    expect(b.x + b.width).toBeLessThan(1050);
  });

  // 24 Nov 2026, the user's wish: "just the main country outline, not the little outlying areas"
  it('is the main country alone, never its little or far-flung islands', () => {
    // France: the mainland, not Corsica, Saint Pierre and Miquelon or the Kerguelen Islands
    const france = countryOutline('FR');
    expect(france.paths).toHaveLength(1);
    expect(box(france.viewBox).x).toBeGreaterThan(950);
    expect(box(france.viewBox).width).toBeLessThan(80);
    // Chile without Easter Island, far out in the Pacific
    expect(box(countryOutline('CL').viewBox).x).toBeGreaterThan(540);
    // Great Britain and Northern Ireland, not the Hebrides or Shetland
    expect(countryOutline('GB').paths).toHaveLength(2);
  });

  it('keeps the big islands that are the country itself', () => {
    // Italy with Sicily and Sardinia; New Zealand's two islands; Japan's four
    expect(countryOutline('IT').paths).toHaveLength(3);
    expect(countryOutline('NZ').paths).toHaveLength(2);
    expect(countryOutline('JP').paths).toHaveLength(4);
    // Indonesia's big islands joining one by one
    const indonesia = countryOutline('ID');
    expect(indonesia.paths.length).toBeGreaterThanOrEqual(5);
    expect(indonesia.paths.length).toBeLessThan(COUNTRY_SHAPES.ID.length / 2);
    expect(box(indonesia.viewBox).width).toBeGreaterThan(250);
  });

  it('leaves out what lands elsewhere past the 180° line: Russia’s Chukotka tip, the far Aleutians', () => {
    const russia = box(countryOutline('RU').viewBox);
    expect(russia.x).toBeGreaterThan(1000);
    const usa = box(countryOutline('US').viewBox);
    // The mainland and Alaska, not the Aleutians beyond 180° at the map's far east
    expect(usa.x + usa.width).toBeLessThan(800);
  });

  it('draws a UK nation from its own shapes', () => {
    const scotland = countryOutline('XC');
    expect(scotland.paths.length).toBeGreaterThan(0);
    expect(box(scotland.viewBox).width).toBeLessThan(60);
  });

  it('is nothing for a place with no shape: a micro-state’s dot, a pole', () => {
    expect(countryOutline('MC')).toBeNull();
    expect(countryOutline('XN')).toBeNull();
    expect(countryOutline('ZZ')).toBeNull();
  });
});
