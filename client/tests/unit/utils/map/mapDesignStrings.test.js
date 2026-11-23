// A map design's colour for the strings between places (src/utils/map/mapDesign.js;
// docs/API.md "Strings", "Map designs")
import { describe, expect, it } from 'vitest';
import { EMPTY_DESIGN, designCss } from '@/utils/map/mapDesign';

describe('the strings’ colour in a design', () => {
  it('starts as the style’s usual one', () => {
    expect(EMPTY_DESIGN.string).toBeNull();
    expect(designCss({ string: null })).toBe('');
  });

  it('sets --map-string, which the strings read, with the other tokens', () => {
    expect(designCss({ string: '#1d4ed8' })).toBe('[data-map-design]{--map-string:#1d4ed8}');
    expect(designCss({ names: '#000000', hover: '#00ff00', string: '#1d4ed8' })).toBe(
      '[data-map-design]{--map-names:#000000;--map-hover:#00ff00;--map-string:#1d4ed8}',
    );
  });

  it('lets nothing but "#rrggbb" in', () => {
    for (const string of ['red', '#FFF', 'url(x)', '#1d4ed8;}body{x:y', 12]) expect(designCss({ string })).toBe('');
  });
});
