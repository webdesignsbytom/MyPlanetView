import React, { useId } from 'react';
// The stamps
import { ARC_PATH, PASSPORT_STAMPS, TILE_H, TILE_W, drawStamp } from './passportStampArt';

/**
 * The account page's backdrop: rubber-stamp outlines from passports (ovals, circles,
 * hexagons, an octagon, rectangles, a postal cancel), drawn once and repeated over the whole
 * poster frame as two SVG pattern layers (a fainter one shifted and turned beneath, so
 * stamps overlap and the repeat doesn't show), in two faint inks on its red. Decorative only.
 * Text is the travel face, set in SVG, so it follows the site's font; colours are the
 * poster tokens, so the black-and-white and dark themes follow too. (After a stock image the
 * user liked, cool-travel-passport-stamps.avif, redrawn rather than copied.)
 */
function StampBackdrop() {
  const id = useId();
  const stamps = `${id}-stamps`;
  const tile = `${id}-tile`;
  const faint = `${id}-faint`;
  const arc = `${id}-arc`;
  return (
    <svg aria-hidden='true' className='absolute inset-0 h-full w-full'>
      <defs>
        {/* The top of the immigration stamp's ring, for its curved word */}
        <path id={arc} d={ARC_PATH} />
        <g id={stamps}>
          {PASSPORT_STAMPS.map((stamp, i) => (
            <React.Fragment key={i}>{drawStamp(stamp, arc)}</React.Fragment>
          ))}
        </g>
        <pattern id={tile} width={TILE_W} height={TILE_H} patternUnits='userSpaceOnUse'>
          <use href={`#${stamps}`} />
        </pattern>
        {/* The same stamps again, shifted half a tile and turned a little, fainter: older
            stamps under the newer ones, as in a well-used passport, and no visible repeat */}
        <pattern id={faint} width={TILE_W} height={TILE_H} patternUnits='userSpaceOnUse' patternTransform='translate(430 290) rotate(-9)'>
          <use href={`#${stamps}`} />
        </pattern>
      </defs>
      <rect width='100%' height='100%' fill={`url(#${faint})`} opacity={0.45} />
      <rect width='100%' height='100%' fill={`url(#${tile})`} />
    </svg>
  );
}

export default StampBackdrop;
