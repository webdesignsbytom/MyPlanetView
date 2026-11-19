// The passport stamps the account page's backdrop (StampBackdrop) and the map's loading
// screen (StampLoading) draw: rubber-stamp outlines from passports, laid out on one tile.
import React from 'react';

// The tile the stamps repeat on (user units = CSS pixels)
export const TILE_W = 880;
export const TILE_H = 600;

// The two inks: cream and deep red on the poster's red, faint, so the page's paperwork reads
// over them (the user's wish, 16 Nov 2026: "a background of outlines of stamps")
export const INK = {
  cream: { line: 'stroke-poster-cream', text: 'fill-poster-cream', fade: 'opacity-30' },
  deep: { line: 'stroke-poster-red-deep', text: 'fill-poster-red-deep', fade: 'opacity-50' },
  // Green, for one stamp on the map's loading screen (a stamp's `loadingInk`; 18 Nov 2026, the user's wish)
  green: { line: 'stroke-poster-green', text: 'fill-poster-green', fade: 'opacity-50' },
};

const PLANE = 'M0-6 1.4-2 7 0 1.4 2 0 6-1 2-5 1.6-6.2 3.4-7.2 3.4-6.2 0-7.2-3.4-6.2-3.4-5-1.6-1-2Z';
const STAR = '0,-9 2.6,-3 9,-2.8 4,1.6 5.6,8 0,4.4 -5.6,8 -4,1.6 -9,-2.8 -2.6,-3';
const ANCHOR = 'M0-7V7M-6 1C-6 6 6 6 6 1M-3.5-3.5H3.5';

// A rosette's scalloped edge: 24 bumps round a 62-unit circle (the Sydney stamp)
const SCALLOP = (() => {
  const bumps = 24;
  const r = 62;
  const at = (radius, turn) => `${(radius * Math.cos(turn * 2 * Math.PI)).toFixed(1)} ${(radius * Math.sin(turn * 2 * Math.PI)).toFixed(1)}`;
  let d = `M${at(r, 0)}`;
  for (let i = 0; i < bumps; i++) d += `Q${at(r + 14, (i + 0.5) / bumps)} ${at(r, (i + 1) / bumps)}`;
  return `${d}Z`;
})();

// A word on a stamp, in the travel face, centred on x
const label = (ink, { y, size, spacing = 1, x = 0 }, word) => (
  <text x={x} y={y} fontSize={size} letterSpacing={spacing} textAnchor='middle' className={`font-travel ${ink.text}`}>
    {word}
  </text>
);

const lines = (ink) => `fill-none ${ink.line}`;

// The stamps, laid out on one 880×600 tile: where each sits, its turn and ink, and
// how it's drawn (`arc` is the id of the ring path the immigration stamp's word follows)
export const PASSPORT_STAMPS = [
  // Tokyo: a double oval
  {
    x: 150,
    y: 112,
    rotate: -8,
    ink: 'cream',
    draw: (c) => (
      <>
        <ellipse rx={120} ry={62} strokeWidth={4} className={lines(c)} />
        <ellipse rx={110} ry={53} strokeWidth={1.5} className={lines(c)} />
        {label(c, { y: -26, size: 11, spacing: 3 }, 'JAPAN')}
        {label(c, { y: 6, size: 34, spacing: 6 }, 'TOKYO')}
        <line x1={-70} x2={70} y1={14} y2={14} strokeWidth={1.5} className={lines(c)} />
        {label(c, { y: 28, size: 9, spacing: 2 }, 'INTERNATIONAL AIRPORT')}
        {label(c, { y: 46, size: 16, spacing: 3 }, '29.11.2021')}
        <path d={PLANE} transform='translate(-88 -2) rotate(-20)' className={c.text} />
        <path d={PLANE} transform='translate(88 -2) rotate(20)' className={c.text} />
      </>
    ),
  },
  // Immigration: a double ring with a curved word and a star
  {
    x: 420,
    y: 128,
    rotate: 8,
    ink: 'deep',
    draw: (d, arc) => (
      <>
        <circle r={70} strokeWidth={4} className={lines(d)} />
        <circle r={61} strokeWidth={1.5} className={lines(d)} />
        <text fontSize={12} letterSpacing={2} className={`font-travel ${d.text}`}>
          <textPath href={`#${arc}`} startOffset='50%' textAnchor='middle'>
            IMMIGRATION
          </textPath>
        </text>
        <polygon points={STAR} transform='translate(0 -18)' className={d.text} />
        <line x1={-44} x2={44} y1={-4} y2={-4} strokeWidth={1.5} className={lines(d)} />
        {label(d, { y: 14, size: 18, spacing: 2 }, 'ARRIVAL')}
        <line x1={-44} x2={44} y1={22} y2={22} strokeWidth={1.5} className={lines(d)} />
        {label(d, { y: 38, size: 10, spacing: 2 }, 'CUSTOMS')}
      </>
    ),
  },
  // Rome: an elongated hexagon
  {
    x: 700,
    y: 110,
    rotate: 10,
    ink: 'cream',
    draw: (c) => (
      <>
        <polygon points='-120,0 -96,-58 96,-58 120,0 96,58 -96,58' strokeWidth={4} className={lines(c)} />
        <polygon points='-110,0 -90,-49 90,-49 110,0 90,49 -90,49' strokeWidth={1.5} className={lines(c)} />
        {label(c, { y: -30, size: 9, spacing: 2 }, 'REPUBBLICA ITALIANA')}
        {label(c, { y: -10, size: 14, spacing: 3 }, 'ARRIVAL')}
        {label(c, { y: 8, size: 12, spacing: 2 }, '25.10.2018')}
        {label(c, { y: 36, size: 28, spacing: 6 }, 'ROME')}
        <path d={PLANE} transform='translate(-78 14) rotate(-30)' className={c.text} />
        <path d={PLANE} transform='translate(78 14) rotate(30)' className={c.text} />
      </>
    ),
  },
  // Singapore: a rounded square with a dashed date box
  {
    x: 142,
    y: 334,
    rotate: 5,
    ink: 'deep',
    draw: (d) => (
      <>
        <rect x={-95} y={-85} width={190} height={170} rx={16} strokeWidth={4} className={lines(d)} />
        <rect x={-86} y={-76} width={172} height={152} rx={10} strokeWidth={1.5} className={lines(d)} />
        {label(d, { y: -46, size: 20, spacing: 3 }, 'SINGAPORE')}
        <rect x={-62} y={-34} width={124} height={30} strokeWidth={1.5} strokeDasharray='4 3' className={lines(d)} />
        {label(d, { y: -13, size: 16, spacing: 2 }, '19.07.2021')}
        {label(d, { y: 18, size: 13, spacing: 4 }, 'DEPARTURE')}
        {label(d, { x: -24, y: 42, size: 9, spacing: 1 }, 'INTERNATIONAL')}
        {label(d, { x: -24, y: 56, size: 9, spacing: 1 }, 'AIRPORT')}
        <circle cx={50} cy={48} r={14} strokeWidth={1.5} className={lines(d)} />
        <path d={PLANE} transform='translate(50 48)' className={d.text} />
      </>
    ),
  },
  // New York: a double rectangle
  {
    x: 452,
    y: 332,
    rotate: -4,
    ink: 'cream',
    draw: (c) => (
      <>
        <rect x={-140} y={-70} width={280} height={140} rx={6} strokeWidth={4} className={lines(c)} />
        <rect x={-130} y={-60} width={260} height={120} rx={3} strokeWidth={1.5} className={lines(c)} />
        {label(c, { y: -38, size: 10, spacing: 2 }, 'UNITED STATES OF AMERICA')}
        {label(c, { y: -12, size: 22, spacing: 3 }, '31 MAY 2019')}
        {label(c, { y: 22, size: 32, spacing: 4 }, 'NEW YORK')}
        {label(c, { y: 44, size: 12, spacing: 6 }, 'IMMIGRATION')}
      </>
    ),
  },
  // Venice: a double octagon
  {
    x: 752,
    y: 330,
    rotate: 8,
    ink: 'deep',
    draw: (d) => (
      <>
        <polygon points='-33,-80 33,-80 80,-33 80,33 33,80 -33,80 -80,33 -80,-33' strokeWidth={4} className={lines(d)} />
        <polygon points='-29,-70 29,-70 70,-29 70,29 29,70 -29,70 -70,29 -70,-29' strokeWidth={1.5} className={lines(d)} />
        {label(d, { y: -4, size: 24, spacing: 3 }, 'VENICE')}
        {label(d, { y: 24, size: 20, spacing: 4 }, 'ITALY')}
        <path d={ANCHOR} transform='translate(0 -42)' strokeWidth={2} className={lines(d)} />
      </>
    ),
  },
  // San Francisco: a tilted oval with anchors (green on the map's loading screen)
  {
    x: 262,
    y: 512,
    rotate: -12,
    ink: 'cream',
    loadingInk: 'green',
    draw: (c) => (
      <>
        <ellipse rx={130} ry={58} strokeWidth={4} className={lines(c)} />
        <ellipse rx={120} ry={49} strokeWidth={1.5} className={lines(c)} />
        {label(c, { y: -24, size: 13, spacing: 3 }, 'ARRIVAL')}
        {label(c, { y: -4, size: 15, spacing: 2 }, '16.12.2016')}
        {label(c, { y: 22, size: 20, spacing: 2 }, 'SAN FRANCISCO')}
        {label(c, { y: 38, size: 8, spacing: 2 }, 'UNITED STATES OF AMERICA')}
        <path d={ANCHOR} transform='translate(-92 0)' strokeWidth={2} className={lines(c)} />
        <path d={ANCHOR} transform='translate(92 0)' strokeWidth={2} className={lines(c)} />
      </>
    ),
  },
  // A little plane stamp
  {
    x: 566,
    y: 508,
    rotate: -6,
    ink: 'deep',
    draw: (d) => (
      <>
        <rect x={-38} y={-38} width={76} height={76} rx={12} strokeWidth={3} className={lines(d)} />
        <path d={PLANE} transform='scale(3.4) rotate(-35)' className={d.text} />
      </>
    ),
  },
  // Sydney: a scalloped rosette with a star (18 Nov 2026, the user's wish: it replaced a postal
  // cancel of wavy lines, which wasn't a country's stamp)
  {
    x: 770,
    y: 520,
    rotate: -10,
    ink: 'cream',
    draw: (c) => (
      <>
        <path d={SCALLOP} strokeWidth={3.5} className={lines(c)} />
        <circle r={56} strokeWidth={1.5} className={lines(c)} />
        <polygon points={STAR} transform='translate(0 -40) scale(0.75)' className={c.text} />
        {label(c, { y: -18, size: 11, spacing: 3 }, 'AUSTRALIA')}
        {label(c, { y: 8, size: 22, spacing: 3 }, 'SYDNEY')}
        <line x1={-40} x2={40} y1={16} y2={16} strokeWidth={1.5} className={lines(c)} />
        {label(c, { y: 32, size: 11, spacing: 1.5 }, '09.02.2023')}
      </>
    ),
  },
];

// The ring path the immigration stamp's word follows, for a <defs>: give it the id passed as `arc`
export const ARC_PATH = 'M-52 6A52 52 0 0 1 52 6';

// One stamp from the list, placed and inked (`fade` replaces its ink's faintness, `inkKey`
// its ink: deep red for every stamp on cream paper, where the cream ink wouldn't show)
export function drawStamp(stamp, arc, fade, inkKey) {
  const ink = INK[inkKey || stamp.ink];
  return (
    <g transform={`translate(${stamp.x} ${stamp.y}) rotate(${stamp.rotate})`} className={fade ?? ink.fade}>
      {stamp.draw(ink, arc)}
    </g>
  );
}
