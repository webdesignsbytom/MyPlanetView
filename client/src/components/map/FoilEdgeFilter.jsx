import React, { memo } from 'react';
// Utils
import { FOIL_EDGE_ID } from '@/utils/map/mapDesign';
import { REFERENCE_PX_PER_UNIT } from '@/utils/map/projection';

// How wide the lit edge is on screen, in CSS pixels: the soft slope the light catches
const EDGE_PX = 1.8;
// The light: from the top left, fairly low, so one side of each piece shines and the other falls
// into shadow; how high the edge stands, and how tight the highlight is
const LIGHT = { azimuth: 225, elevation: 42 };
const RELIEF = 3;
const SHINE = 24;

/**
 * A metallic finish's lit edge (25 Nov 2026, the user's wish: gold, silver and bronze that look like
 * real metal): each place been to stands as a raised piece of metal, its edge catching the light on
 * one side and in shadow on the other. A filter on the place's own outline: its alpha, softened to
 * a slope, lit twice (diffuse light shades the slopes, a specular highlight shines on the ones
 * facing the light), each kept inside the outline. utils/map/mapDesign.js visitedRules puts it on
 * the places been to only while the map is still (useMapViewport's data-moving), as it doubled
 * the cost of every frame of a pan.
 *
 * In the world map's own SVG, as its slope is a few pixels on screen at every zoom: `zoom` is the
 * map's (in steps, so it re-renders a few times a doubling). The lights are white, the filter's
 * default.
 */
function FoilEdgeFilter({ zoom }) {
  const slope = EDGE_PX / (zoom * REFERENCE_PX_PER_UNIT);
  return (
    <defs>
      <filter id={FOIL_EDGE_ID} x='-2%' y='-2%' width='104%' height='104%' colorInterpolationFilters='sRGB' data-foil-edge>
        <feGaussianBlur in='SourceAlpha' stdDeviation={slope} result='slope' />
        <feSpecularLighting in='slope' surfaceScale={RELIEF} specularConstant='1' specularExponent={SHINE} result='shine'>
          <feDistantLight {...LIGHT} />
        </feSpecularLighting>
        <feComposite in='shine' in2='SourceAlpha' operator='in' result='shineInside' />
        <feDiffuseLighting in='slope' surfaceScale={RELIEF} diffuseConstant='1' result='shade'>
          <feDistantLight {...LIGHT} />
        </feDiffuseLighting>
        <feComposite in='shade' in2='SourceAlpha' operator='in' result='shadeInside' />
        {/* The metal times the shade (a flat top, lit at 42°, comes out as it was), then the shine */}
        <feComposite in='SourceGraphic' in2='shadeInside' operator='arithmetic' k1='0.5' k2='0.68' k3='0' k4='0' result='shaded' />
        <feComposite in='shaded' in2='shineInside' operator='arithmetic' k1='0' k2='1' k3='0.7' k4='0' />
      </filter>
    </defs>
  );
}

export default memo(FoilEdgeFilter);
