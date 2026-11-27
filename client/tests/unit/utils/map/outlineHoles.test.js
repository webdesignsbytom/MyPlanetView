// @vitest-environment node
// Enclaves (27 Nov 2026, the user's report: Lesotho was South Africa's pink and couldn't be
// pressed): each hole in a place's outline is in the same path string as the ring round it, so
// the map (SVG, nonzero), the share cards and posters (canvas) and the visited finish's clip
// leave it empty, and the enclave inside is drawn and pressed as itself. The outline tool groups
// them (images/src/tools/lib/outlinePaths.mjs); this checks its rules and every outline file.
import { describe, expect, it } from 'vitest';
import { COUNTRY_SHAPES } from '@/utils/map/countryShapes';
import { UK_NATION_SHAPES } from '@/utils/map/ukNationShapes';
import { COUNTRIES } from '@/utils/map/countries';
import { projectToMap } from '@/utils/map/projection';
import { pathStrings, ringGroups, signedArea } from '../../../../../images/src/tools/lib/outlinePaths.mjs';

const DETAIL = import.meta.glob('/src/utils/map/detailShapes/*.js', { eager: true, import: 'default' });

const ringsOf = (d) =>
  d.split(/(?=M)/).map((sub) => {
    const n = sub.replace(/[MZ]/g, ' ').trim().split(/\s+/).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    return pts;
  });
// Every ring of a place, however its strings group them
const allRings = (list) => list.flatMap(ringsOf);
// Inside a place as SVG fills it (nonzero over one string's rings)
function filledAt(list, x, y) {
  return list.some((d) => {
    let winding = 0;
    for (const ring of ringsOf(d)) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi <= y && yj > y && (xj - xi) * (y - yi) - (x - xi) * (yj - yi) < 0) winding++;
        else if (yi > y && yj <= y && (xj - xi) * (y - yi) - (x - xi) * (yj - yi) > 0) winding--;
      }
    }
    return winding !== 0;
  });
}

const square = (x, y, size, clockwise = true) => {
  const pts = [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
  ];
  return clockwise ? pts : pts.reverse();
};

describe('ringGroups', () => {
  it('puts a ring winding the other way inside a bigger one with it, as its hole', () => {
    const outer = square(0, 0, 10);
    const hole = square(4, 4, 2, false);
    const island = square(20, 0, 3);
    expect(ringGroups([outer, island, hole])).toEqual([[outer, hole], [island]]);
    expect(pathStrings([outer, island, hole])).toEqual([`M 0 0 10 0 10 10 0 10 Z M 4 6 6 6 6 4 4 4 Z`, `M 20 0 23 0 23 3 20 3 Z`]);
    expect(Math.sign(signedArea(outer))).toBe(-Math.sign(signedArea(hole)));
  });

  it('leaves a ring that winds the same way, or lies outside, on its own', () => {
    const outer = square(0, 0, 10);
    const same = square(4, 4, 2);
    const away = square(30, 30, 2, false);
    expect(ringGroups([outer, same, away])).toEqual([[outer], [same], [away]]);
  });

  it('gives a hole to the smallest ring round it', () => {
    const big = square(0, 0, 100);
    const lake = square(10, 10, 50, false);
    const hole = square(20, 20, 5);
    // (a ring in a lake in a country: the lake's island, here only to choose the smallest)
    expect(ringGroups([big, hole]).length).toBe(2);
    expect(ringGroups([big, lake])).toEqual([[big, lake]]);
  });
});

describe('the map’s outlines', () => {
  const files = [
    ['countryShapes.js', COUNTRY_SHAPES],
    ['ukNationShapes.js', UK_NATION_SHAPES],
    ...Object.entries(DETAIL).map(([file, list]) => [file.split('/').pop(), { [file.slice(-5, -3)]: list }]),
  ];

  it('has every enclave’s hole with the ring round it, never as a shape of its own', () => {
    expect(Object.keys(DETAIL).length).toBeGreaterThan(200);
    for (const [file, shapes] of files) {
      for (const [code, list] of Object.entries(shapes)) {
        expect(pathStrings(allRings(list)), `${file} ${code}`).toEqual(list);
      }
    }
  });

  it('leaves Lesotho out of South Africa, and the enclaves out of the places round them', () => {
    const pin = (code) => {
      const place = COUNTRIES.find((c) => c.code === code);
      return { x: place.pinX, y: place.pinY };
    };
    const detail = (code) => DETAIL[`/src/utils/map/detailShapes/${code}.js`];
    for (const shapes of [COUNTRY_SHAPES, { ZA: detail('ZA'), LS: detail('LS') }]) {
      const { x, y } = pin('LS');
      expect(filledAt(shapes.LS, x, y)).toBe(true);
      expect(filledAt(shapes.ZA, x, y)).toBe(false);
    }
    // Johannesburg is still South Africa's
    const jo = projectToMap(-26.2, 28.05);
    expect(filledAt(COUNTRY_SHAPES.ZA, jo.x, jo.y)).toBe(true);
    // Madha (Oman's, inside the UAE) and Llívia (Spain's, inside France)
    const madha = projectToMap(25.28, 56.32);
    expect(filledAt(detail('AE'), madha.x, madha.y)).toBe(false);
    const llivia = projectToMap(42.465, 1.98);
    expect(filledAt(detail('FR'), llivia.x, llivia.y)).toBe(false);
    expect(filledAt(detail('ES'), llivia.x, llivia.y)).toBe(true);
  });
});
