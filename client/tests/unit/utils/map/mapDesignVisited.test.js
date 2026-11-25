// How a map design shows the places been to (src/utils/map/mapDesign.js; 25 Nov 2026, the
// user's wish: "all the countries I have visited or lived in turn the colour I selected")
import { describe, expect, it } from 'vitest';
import { EMPTY_DESIGN, FOIL_EDGE_ID, VISITED_FINISHES, VISITED_LOOKS, VISITED_LOOK_IDS, designCss, visitedFinishOf, visitedLookOf } from '@/utils/map/mapDesign';

const FILL_RULE =
  '[data-map-design] svg [data-been="true"]:not([data-code="XN"]):not([data-code="QN"]):not([data-code="XS"]):not([data-code="QS"]):not(:hover){fill:var(--map-visited)}';
const HIDE_BADGES = '[data-map-design] svg [data-visit-badge="fill"]{display:none}';

describe('the visited look', () => {
  it('is a badge, a colour, or both, a badge to start with', () => {
    expect(VISITED_LOOK_IDS).toEqual(['BADGE', 'COLOUR', 'BOTH']);
    expect(VISITED_LOOKS.map((look) => look.label)).toEqual(['A badge', 'A colour', 'A colour and a badge']);
    expect(EMPTY_DESIGN).toMatchObject({ visitedLook: 'BADGE', visited: null });
    expect(visitedLookOf({ visitedLook: 'COLOUR' })).toBe('COLOUR');
    expect(visitedLookOf({ visitedLook: 'STICKER' })).toBe('BADGE');
    expect(visitedLookOf(null)).toBe('BADGE');
  });

  it('adds nothing while the places been to show as badges', () => {
    expect(designCss({ visitedLook: 'BADGE', visited: '#7c3aed' })).toBe('[data-map-design]{--map-visited:#7c3aed}');
    expect(designCss({ visited: null })).toBe('');
  });

  it('fills every place been to, but the poles, never under the pointer; alone, the badges go', () => {
    expect(designCss({ visitedLook: 'COLOUR' })).toBe(`${FILL_RULE} ${HIDE_BADGES}`);
    // Both keeps the badges
    expect(designCss({ visitedLook: 'BOTH' })).toBe(FILL_RULE);
  });

  it('uses the design’s colour when it has one, else the map style’s own', () => {
    expect(designCss({ visitedLook: 'COLOUR', visited: '#7c3aed' })).toBe(`[data-map-design]{--map-visited:#7c3aed} ${FILL_RULE} ${HIDE_BADGES}`);
    // Never anything but a colour
    expect(designCss({ visitedLook: 'BOTH', visited: 'purple;}body{x:y' })).toBe(FILL_RULE);
  });

  it('wins over a country’s own colour once it’s been to: its rule comes after, and is more particular', () => {
    const css = designCss({ visitedLook: 'COLOUR', countries: { PT: '#ff0000' } });
    const own = css.indexOf('[data-map-design] svg g[data-code="PT"]:not(:hover){fill:#ff0000}');
    expect(own).toBeGreaterThanOrEqual(0);
    expect(css.indexOf(FILL_RULE)).toBeGreaterThan(own);
  });
});

// A metallic finish (25 Nov 2026, the user's wish: "shiny colours like gold and silver"; real metal,
// not a gradient: a sheet of polished metal under the places been to, VisitedFoil)
describe('a metallic finish for the places been to', () => {
  const NOT_POLES = ':not([data-code="XN"]):not([data-code="QN"]):not([data-code="XS"]):not([data-code="QS"]):not(:hover)';
  const PLACES = `[data-map-design] svg [data-been="true"]${NOT_POLES}`;
  const OVER_FOIL = `[data-map-design] svg:has([data-visited-foil]) [data-been="true"]${NOT_POLES}`;
  const STILL = `[data-map-design] svg:not([data-moving]) [data-visited-foil]{filter:url(#${FOIL_EDGE_ID})}`;

  it('is gold, silver or bronze, each its picture of metal and its medal colour, or none', () => {
    expect(VISITED_FINISHES.map((finish) => [finish.id, finish.label, finish.colour])).toEqual([
      ['GOLD', 'Gold', '--medal-gold'],
      ['SILVER', 'Silver', '--medal-silver'],
      ['BRONZE', 'Bronze', '--medal-bronze'],
    ]);
    VISITED_FINISHES.forEach((finish) => expect(finish.texture).toContain(`foil-${finish.id.toLowerCase()}.webp`));
    expect(FOIL_EDGE_ID).toBe('mpv-foil-edge');
    expect(EMPTY_DESIGN.visitedFinish).toBeNull();
    expect(visitedFinishOf({ visitedFinish: 'SILVER' }).label).toBe('Silver');
    expect(visitedFinishOf({ visitedFinish: 'PLATINUM' })).toBeNull();
    expect(visitedFinishOf(null)).toBeNull();
  });

  it('lets the metal under the places been to show through them, lights its edges while the map is still, and puts it on the key', () => {
    const gold = VISITED_FINISHES[0];
    expect(designCss({ visitedLook: 'BOTH', visitedFinish: 'GOLD', visited: '#7c3aed' })).toBe(
      [
        '[data-map-design]{--map-visited:#7c3aed}',
        // The metal's flat colour on a map with no sheet of metal; see-through over one
        `${PLACES}{fill:var(--medal-gold)}`,
        `${OVER_FOIL}{fill:transparent}`,
        STILL,
        `[data-map-design] [data-key-visited-colour] [aria-hidden]{background:url("${gold.texture}") center/cover}`,
      ].join(' '),
    );
  });

  it('hides the badges with the colour alone, as a plain colour does', () => {
    const css = designCss({ visitedLook: 'COLOUR', visitedFinish: 'BRONZE' });
    expect(css).toContain(`${PLACES}{fill:var(--medal-bronze)}`);
    expect(css).toContain('[data-visit-badge="fill"]{display:none}');
    expect(css).toContain(STILL);
  });

  it('shows nothing while the places been to show as badges', () => {
    expect(designCss({ visitedLook: 'BADGE', visitedFinish: 'GOLD' })).toBe('');
  });
});
