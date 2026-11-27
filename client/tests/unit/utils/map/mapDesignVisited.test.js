// How the map shows the places been to (src/utils/map/mapDesign.js; 25 Nov 2026, the user's wish:
// "all the countries I have visited or lived in turn the colour I selected", then gold, silver or
// bronze, then "the settings for country visited colours and metallic styles need to work on all
// the map types": the map's own, in every style, under the map page's wrapper)
import { describe, expect, it } from 'vitest';
import {
  EMPTY_DESIGN,
  FOIL_EDGE_ID,
  VISITED_FINISHES,
  VISITED_LOOKS,
  VISITED_LOOK_IDS,
  designCss,
  visitedCss,
  visitedFinishOf,
  visitedLookFrom,
  visitedLookOf,
} from '@/utils/map/mapDesign';

const NOT_POLES = ':not([data-code="XN"]):not([data-code="QN"]):not([data-code="XS"]):not([data-code="QS"]):not(:hover)';
const PLACES = `[data-map-page] svg [data-been="true"]${NOT_POLES}`;
const FILL_RULE = `${PLACES}{fill:var(--map-visited)}`;
const HIDE_BADGES = '[data-map-page] svg [data-visit-badge="fill"]{display:none}';

describe('the visited look', () => {
  it('is a badge, a colour, or both, a badge to start with', () => {
    expect(VISITED_LOOK_IDS).toEqual(['BADGE', 'COLOUR', 'BOTH']);
    expect(VISITED_LOOKS.map((look) => look.label)).toEqual(['A badge', 'A colour', 'A colour and a badge']);
    expect(visitedLookOf({ visitedLook: 'COLOUR' })).toBe('COLOUR');
    expect(visitedLookOf({ visitedLook: 'STICKER' })).toBe('BADGE');
    expect(visitedLookOf(null)).toBe('BADGE');
  });

  it('is the map’s, never a style’s design’s', () => {
    expect(EMPTY_DESIGN).not.toHaveProperty('visitedLook');
    // A design's colours say nothing of it
    expect(designCss({ visitedLook: 'COLOUR', visited: '#7c3aed', names: '#000000' })).toBe('[data-map-design]{--map-names:#000000}');
  });

  it('reads a map’s look, only what’s well formed', () => {
    expect(visitedLookFrom({ visitedLook: 'BOTH', visitedColour: '#7c3aed', visitedFinish: 'GOLD', name: 'Our trips' })).toEqual({
      visitedLook: 'BOTH',
      visitedColour: '#7c3aed',
      visitedFinish: 'GOLD',
    });
    expect(visitedLookFrom({ visitedLook: 'STICKER', visitedColour: 'purple;}', visitedFinish: 'PLATINUM' })).toEqual({
      visitedLook: 'BADGE',
      visitedColour: null,
      visitedFinish: null,
    });
    expect(visitedLookFrom(null)).toEqual({ visitedLook: 'BADGE', visitedColour: null, visitedFinish: null });
  });

  it('adds nothing while the places been to show as badges', () => {
    expect(visitedCss({ visitedLook: 'BADGE', visitedColour: '#7c3aed', visitedFinish: 'GOLD' })).toBe('');
    expect(visitedCss(null)).toBe('');
  });

  it('fills every place been to, but the poles, never under the pointer, on the map page whatever its style; alone, the badges go', () => {
    expect(visitedCss({ visitedLook: 'COLOUR' })).toBe(`${FILL_RULE} ${HIDE_BADGES}`);
    // Both keeps the badges
    expect(visitedCss({ visitedLook: 'BOTH' })).toBe(FILL_RULE);
  });

  it('uses the map’s colour when it has one, else the map style’s own', () => {
    expect(visitedCss({ visitedLook: 'COLOUR', visitedColour: '#7c3aed' })).toBe(`[data-map-page]{--map-visited:#7c3aed} ${FILL_RULE} ${HIDE_BADGES}`);
    // Never anything but a colour
    expect(visitedCss({ visitedLook: 'BOTH', visitedColour: 'purple;}body{x:y' })).toBe(FILL_RULE);
  });

  it('wins over a design’s colour for a country once it’s been to: more particular', () => {
    // (Portugal's colour goes to the Azores, its region, too)
    expect(designCss({ countries: { PT: '#ff0000' } })).toContain('[data-map-design] svg g[data-code="PT"]:not(:hover){fill:#ff0000}');
    // One attribute, svg and g, one attribute and :not(:hover) against one attribute, svg, the
    // been-to attribute and five :not()s
    const specificity = (selector) => (selector.match(/\[|:not\(/g) || []).length;
    expect(specificity(PLACES)).toBeGreaterThan(specificity('[data-map-design] svg g[data-code="PT"]:not(:hover)'));
  });
});

// A metallic finish (25 Nov 2026, the user's wish: "shiny colours like gold and silver"; real metal,
// not a gradient: a sheet of polished metal under the places been to, VisitedFoil)
describe('a metallic finish for the places been to', () => {
  const OVER_FOIL = `[data-map-page] svg:has([data-visited-foil]) [data-been="true"]${NOT_POLES}`;
  const OVER_MOVING_FOIL = `[data-map-page] svg[data-moving]:has([data-visited-foil]) [data-been="true"]${NOT_POLES}`;
  const MOVING = '[data-map-page] svg[data-moving] [data-visited-foil]{visibility:hidden}';
  const STILL = `[data-map-page] svg:not([data-moving]) [data-visited-foil]{filter:url(#${FOIL_EDGE_ID})}`;

  it('is gold, silver or bronze, each its picture of metal and its medal colour, or none', () => {
    expect(VISITED_FINISHES.map((finish) => [finish.id, finish.label, finish.colour])).toEqual([
      ['GOLD', 'Gold', '--medal-gold'],
      ['SILVER', 'Silver', '--medal-silver'],
      ['BRONZE', 'Bronze', '--medal-bronze'],
    ]);
    VISITED_FINISHES.forEach((finish) => expect(finish.texture).toContain(`foil-${finish.id.toLowerCase()}.webp`));
    expect(FOIL_EDGE_ID).toBe('mpv-foil-edge');
    expect(visitedFinishOf({ visitedFinish: 'SILVER' }).label).toBe('Silver');
    expect(visitedFinishOf({ visitedFinish: 'PLATINUM' })).toBeNull();
    expect(visitedFinishOf(null)).toBeNull();
  });

  it('lets the metal under the places been to show through them, lights its edges while the map is still, and puts it on the key', () => {
    const gold = VISITED_FINISHES[0];
    expect(visitedCss({ visitedLook: 'BOTH', visitedFinish: 'GOLD', visitedColour: '#7c3aed' })).toBe(
      [
        '[data-map-page]{--map-visited:#7c3aed}',
        // The metal's flat colour on a map with no sheet of metal; see-through over one
        `${PLACES}{fill:var(--medal-gold)}`,
        `${OVER_FOIL}{fill:transparent}`,
        // While the map moves, the metal's flat colour in the places, the sheet hidden (27 Nov
        // 2026, the user's report: on a phone it vanished while the map was dragged)
        `${OVER_MOVING_FOIL}{fill:var(--medal-gold)}`,
        MOVING,
        STILL,
        `[data-map-page] [data-key-visited-colour] [aria-hidden]{background:url("${gold.texture}") center/cover}`,
      ].join(' '),
    );
  });

  it('fills the places with the flat metal while the map moves, winning over the see-through rule', () => {
    const css = visitedCss({ visitedLook: 'COLOUR', visitedFinish: 'SILVER' });
    expect(css).toContain(`${OVER_MOVING_FOIL}{fill:var(--medal-silver)}`);
    expect(css).toContain(MOVING);
    const specificity = (selector) => (selector.match(/\[|:not\(/g) || []).length;
    expect(specificity(OVER_MOVING_FOIL)).toBeGreaterThan(specificity(OVER_FOIL));
    // Nothing of the kind without a finish
    expect(visitedCss({ visitedLook: 'COLOUR' })).not.toContain('data-moving');
  });

  it('hides the badges with the colour alone, as a plain colour does', () => {
    const css = visitedCss({ visitedLook: 'COLOUR', visitedFinish: 'BRONZE' });
    expect(css).toContain(`${PLACES}{fill:var(--medal-bronze)}`);
    expect(css).toContain(HIDE_BADGES);
    expect(css).toContain(STILL);
  });
});
