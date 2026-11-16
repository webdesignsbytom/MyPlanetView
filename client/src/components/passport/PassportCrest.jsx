import React, { useId } from 'react';

// Drawn on a 240 × 240 grid round its centre
const C = 120;
const WREATH_R = 97;
// The left branch's leaves, by angle round the centre (90° straight down, 180° due left):
// from the ribbon at the foot up to the top left. The right branch is its mirror image.
const LEAF_ANGLES = [104, 115, 126, 137, 148, 159, 170, 181, 192, 203, 214];
const rad = (deg) => (deg * Math.PI) / 180;
const at = (deg, r) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))];
const round = (n) => Math.round(n * 10) / 10;

// A pair of leaves on the branch: one pointing outwards, one inwards, both up the branch
const LEAVES = LEAF_ANGLES.flatMap((angle) => {
  const along = (Math.atan2(Math.cos(rad(angle)), -Math.sin(rad(angle))) * 180) / Math.PI;
  return [
    { at: at(angle + 2, WREATH_R + 6.5), turn: along - 32 },
    { at: at(angle + 2, WREATH_R - 6.5), turn: along + 32 },
  ].map((leaf) => ({ cx: round(leaf.at[0]), cy: round(leaf.at[1]), turn: round(leaf.turn) }));
});
// The stem: a straight tail from below the far side of the foot (so the two branches cross
// there, as a wreath's do), then round the circle to the top
const [stemFromX, stemFromY] = at(100, WREATH_R).map(round);
const [tailX, tailY] = [round(stemFromX + 28 * Math.cos(rad(20))), round(stemFromY + 28 * Math.sin(rad(20)))];
const [stemToX, stemToY] = at(222, WREATH_R).map(round);
const STEM = `M${tailX} ${tailY}L${stemFromX} ${stemFromY}A${WREATH_R} ${WREATH_R} 0 0 1 ${stemToX} ${stemToY}`;

// The compass rose's points: the four quarters long, the four between them short. Each is
// two triangles, one in bright foil and one in dark, as a compass card shades them.
function points(angles, length, halfWidth) {
  return angles.map((deg) => {
    const [dx, dy] = [Math.cos(rad(deg)), Math.sin(rad(deg))];
    const tip = `${round(C + dx * length)} ${round(C + dy * length)}`;
    const left = `${round(C - dy * halfWidth)} ${round(C + dx * halfWidth)}`;
    const right = `${round(C + dy * halfWidth)} ${round(C - dx * halfWidth)}`;
    return { key: deg, solid: `M${C} ${C}L${tip}L${left}Z`, open: `M${C} ${C}L${tip}L${right}Z` };
  });
}
const LONG_POINTS = points([-90, 0, 90, 180], 76, 12);
const SHORT_POINTS = points([-45, 45, 135, 225], 46, 8.5);

// A five-pointed star above the rose
const STAR = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 4 : 9.5;
  const deg = -90 + i * 36;
  return `${round(C + r * Math.cos(rad(deg)))} ${round(20 + r * Math.sin(rad(deg)))}`;
}).join('L');

/**
 * The passport's crest, foil-stamped on the cover as a real passport's coat of arms: a
 * compass rose over a globe, in a laurel wreath crossed at the foot, with a star above. The
 * foil (--foil-light, --foil, --foil-dark from the cover) shines across it, and a lighting
 * filter raises it off the leather. Decoration: the cover's words say what it is.
 */
function PassportCrest({ className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const foil = `url(#${id}-foil)`;
  const darkFoil = { fill: 'var(--foil-dark)' };

  return (
    <svg viewBox='0 0 240 240' aria-hidden='true' focusable='false' className={className}>
      <defs>
        <linearGradient id={`${id}-foil`} gradientUnits='userSpaceOnUse' x1='30' y1='10' x2='210' y2='230'>
          <stop offset='0' style={{ stopColor: 'var(--foil-light)' }} />
          <stop offset='0.3' style={{ stopColor: 'var(--foil)' }} />
          <stop offset='0.5' style={{ stopColor: 'var(--foil-dark)' }} />
          <stop offset='0.66' style={{ stopColor: 'var(--foil)' }} />
          <stop offset='0.84' style={{ stopColor: 'var(--foil-light)' }} />
          <stop offset='1' style={{ stopColor: 'var(--foil)' }} />
        </linearGradient>
        {/* Raised foil: a highlight where the light from the top left catches the edges, and
            a shadow cast down and to the right */}
        <filter id={`${id}-raise`} x='-5%' y='-5%' width='110%' height='110%'>
          <feGaussianBlur in='SourceAlpha' stdDeviation='1.1' result='bevel' />
          <feSpecularLighting in='bevel' surfaceScale='2.4' specularConstant='0.85' specularExponent='16' result='light'>
            <feDistantLight azimuth='225' elevation='42' />
          </feSpecularLighting>
          <feComposite in='light' in2='SourceAlpha' operator='in' result='shine' />
          <feComposite in='SourceGraphic' in2='shine' operator='arithmetic' k2='1' k3='0.55' result='lit' />
          <feOffset in='SourceAlpha' dx='0.9' dy='1.3' result='offset' />
          <feFlood style={{ floodColor: 'var(--cover-shade)' }} />
          <feComposite in2='offset' operator='in' result='shadow' />
          <feMerge>
            <feMergeNode in='shadow' />
            <feMergeNode in='lit' />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${id}-raise)`} fill={foil} stroke={foil} strokeLinejoin='round' strokeLinecap='round'>
        {/* The wreath, mirrored for the right-hand branch */}
        {[false, true].map((mirrored) => (
          <g key={String(mirrored)} transform={mirrored ? 'translate(240 0) scale(-1 1)' : undefined}>
            <path d={STEM} fill='none' strokeWidth='2.4' />
            {LEAVES.map((leaf) => (
              <ellipse
                key={`${leaf.cx}-${leaf.cy}`}
                cx={leaf.cx}
                cy={leaf.cy}
                rx='9'
                ry='3.6'
                stroke='none'
                transform={`rotate(${leaf.turn} ${leaf.cx} ${leaf.cy})`}
              />
            ))}
          </g>
        ))}

        {/* The globe: its rim, the equator and two parallels, and the meridians */}
        <g fill='none' strokeWidth='2'>
          <circle cx={C} cy={C} r='54' strokeWidth='3' />
          <path d='M66 120H174M73.2 93H166.8M73.2 147H166.8M120 66V174' />
          <ellipse cx={C} cy={C} rx='18' ry='54' />
          <ellipse cx={C} cy={C} rx='38' ry='54' />
        </g>

        {/* The compass rose */}
        <g strokeWidth='1.4'>
          {[...SHORT_POINTS, ...LONG_POINTS].map((point) => (
            <g key={point.key}>
              <path d={point.solid} />
              <path d={point.open} style={darkFoil} />
            </g>
          ))}
          <circle cx={C} cy={C} r='8' />
          <circle cx={C} cy={C} r='3.4' stroke='none' style={darkFoil} />
        </g>

        <path d={`M${STAR}Z`} stroke='none' />
      </g>
    </svg>
  );
}

export default PassportCrest;
