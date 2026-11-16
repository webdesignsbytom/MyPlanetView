import React, { useId } from 'react';

// The tile the stamps repeat on (user units = CSS pixels)
const TILE_W = 880;
const TILE_H = 600;

// The two inks: cream and deep red on the poster's red, faint, so the page's paperwork reads
// over them (the user's wish, 16 Nov 2026: "a background of outlines of stamps")
const INK = {
  cream: { line: 'stroke-poster-cream', text: 'fill-poster-cream', fade: 'opacity-30' },
  deep: { line: 'stroke-poster-red-deep', text: 'fill-poster-red-deep', fade: 'opacity-50' },
};

const PLANE = 'M0-6 1.4-2 7 0 1.4 2 0 6-1 2-5 1.6-6.2 3.4-7.2 3.4-6.2 0-7.2-3.4-6.2-3.4-5-1.6-1-2Z';
const STAR = '0,-9 2.6,-3 9,-2.8 4,1.6 5.6,8 0,4.4 -5.6,8 -4,1.6 -9,-2.8 -2.6,-3';
const ANCHOR = 'M0-7V7M-6 1C-6 6 6 6 6 1M-3.5-3.5H3.5';

function Text({ ink, y, size, spacing = 1, children, x = 0 }) {
  return (
    <text x={x} y={y} fontSize={size} letterSpacing={spacing} textAnchor='middle' className={`font-travel ${ink.text}`}>
      {children}
    </text>
  );
}

function Stamp({ x, y, rotate, ink, children }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} className={ink.fade}>
      {children}
    </g>
  );
}

const lines = (ink) => `fill-none ${ink.line}`;

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
  const c = INK.cream;
  const d = INK.deep;

  return (
    <svg aria-hidden='true' className='absolute inset-0 h-full w-full'>
      <defs>
        {/* The top of the immigration stamp's ring, for its curved word */}
        <path id={arc} d='M-52 6A52 52 0 0 1 52 6' />
        <g id={stamps}>
          {/* Tokyo: a double oval */}
          <Stamp x={150} y={112} rotate={-8} ink={c}>
            <ellipse rx={120} ry={62} strokeWidth={4} className={lines(c)} />
            <ellipse rx={110} ry={53} strokeWidth={1.5} className={lines(c)} />
            <Text ink={c} y={-26} size={11} spacing={3}>JAPAN</Text>
            <Text ink={c} y={6} size={34} spacing={6}>TOKYO</Text>
            <line x1={-70} x2={70} y1={14} y2={14} strokeWidth={1.5} className={lines(c)} />
            <Text ink={c} y={28} size={9} spacing={2}>INTERNATIONAL AIRPORT</Text>
            <Text ink={c} y={46} size={16} spacing={3}>29.11.2021</Text>
            <path d={PLANE} transform='translate(-88 -2) rotate(-20)' className={c.text} />
            <path d={PLANE} transform='translate(88 -2) rotate(20)' className={c.text} />
          </Stamp>

          {/* Immigration: a double ring with a curved word and a star */}
          <Stamp x={420} y={128} rotate={8} ink={d}>
            <circle r={70} strokeWidth={4} className={lines(d)} />
            <circle r={61} strokeWidth={1.5} className={lines(d)} />
            <text fontSize={12} letterSpacing={2} className={`font-travel ${d.text}`}>
              <textPath href={`#${arc}`} startOffset='50%' textAnchor='middle'>
                IMMIGRATION
              </textPath>
            </text>
            <polygon points={STAR} transform='translate(0 -18)' className={d.text} />
            <line x1={-44} x2={44} y1={-4} y2={-4} strokeWidth={1.5} className={lines(d)} />
            <Text ink={d} y={14} size={18} spacing={2}>ARRIVAL</Text>
            <line x1={-44} x2={44} y1={22} y2={22} strokeWidth={1.5} className={lines(d)} />
            <Text ink={d} y={38} size={10} spacing={2}>CUSTOMS</Text>
          </Stamp>

          {/* Rome: an elongated hexagon */}
          <Stamp x={700} y={110} rotate={10} ink={c}>
            <polygon points='-120,0 -96,-58 96,-58 120,0 96,58 -96,58' strokeWidth={4} className={lines(c)} />
            <polygon points='-110,0 -90,-49 90,-49 110,0 90,49 -90,49' strokeWidth={1.5} className={lines(c)} />
            <Text ink={c} y={-30} size={9} spacing={2}>REPUBBLICA ITALIANA</Text>
            <Text ink={c} y={-10} size={14} spacing={3}>ARRIVAL</Text>
            <Text ink={c} y={8} size={12} spacing={2}>25.10.2018</Text>
            <Text ink={c} y={36} size={28} spacing={6}>ROME</Text>
            <path d={PLANE} transform='translate(-78 14) rotate(-30)' className={c.text} />
            <path d={PLANE} transform='translate(78 14) rotate(30)' className={c.text} />
          </Stamp>

          {/* Singapore: a rounded square with a dashed date box */}
          <Stamp x={142} y={334} rotate={5} ink={d}>
            <rect x={-95} y={-85} width={190} height={170} rx={16} strokeWidth={4} className={lines(d)} />
            <rect x={-86} y={-76} width={172} height={152} rx={10} strokeWidth={1.5} className={lines(d)} />
            <Text ink={d} y={-46} size={20} spacing={3}>SINGAPORE</Text>
            <rect x={-62} y={-34} width={124} height={30} strokeWidth={1.5} strokeDasharray='4 3' className={lines(d)} />
            <Text ink={d} y={-13} size={16} spacing={2}>19.07.2021</Text>
            <Text ink={d} y={18} size={13} spacing={4}>DEPARTURE</Text>
            <Text ink={d} x={-24} y={42} size={9} spacing={1}>INTERNATIONAL</Text>
            <Text ink={d} x={-24} y={56} size={9} spacing={1}>AIRPORT</Text>
            <circle cx={50} cy={48} r={14} strokeWidth={1.5} className={lines(d)} />
            <path d={PLANE} transform='translate(50 48)' className={d.text} />
          </Stamp>

          {/* New York: a double rectangle */}
          <Stamp x={452} y={332} rotate={-4} ink={c}>
            <rect x={-140} y={-70} width={280} height={140} rx={6} strokeWidth={4} className={lines(c)} />
            <rect x={-130} y={-60} width={260} height={120} rx={3} strokeWidth={1.5} className={lines(c)} />
            <Text ink={c} y={-38} size={10} spacing={2}>UNITED STATES OF AMERICA</Text>
            <Text ink={c} y={-12} size={22} spacing={3}>31 MAY 2019</Text>
            <Text ink={c} y={22} size={32} spacing={4}>NEW YORK</Text>
            <Text ink={c} y={44} size={12} spacing={6}>IMMIGRATION</Text>
          </Stamp>

          {/* Venice: a double octagon */}
          <Stamp x={752} y={330} rotate={8} ink={d}>
            <polygon points='-33,-80 33,-80 80,-33 80,33 33,80 -33,80 -80,33 -80,-33' strokeWidth={4} className={lines(d)} />
            <polygon points='-29,-70 29,-70 70,-29 70,29 29,70 -29,70 -70,29 -70,-29' strokeWidth={1.5} className={lines(d)} />
            <Text ink={d} y={-4} size={24} spacing={3}>VENICE</Text>
            <Text ink={d} y={24} size={20} spacing={4}>ITALY</Text>
            <path d={ANCHOR} transform='translate(0 -42)' strokeWidth={2} className={lines(d)} />
          </Stamp>

          {/* San Francisco: a tilted oval with anchors */}
          <Stamp x={262} y={512} rotate={-12} ink={c}>
            <ellipse rx={130} ry={58} strokeWidth={4} className={lines(c)} />
            <ellipse rx={120} ry={49} strokeWidth={1.5} className={lines(c)} />
            <Text ink={c} y={-24} size={13} spacing={3}>ARRIVAL</Text>
            <Text ink={c} y={-4} size={15} spacing={2}>16.12.2016</Text>
            <Text ink={c} y={22} size={20} spacing={2}>SAN FRANCISCO</Text>
            <Text ink={c} y={38} size={8} spacing={2}>UNITED STATES OF AMERICA</Text>
            <path d={ANCHOR} transform='translate(-92 0)' strokeWidth={2} className={lines(c)} />
            <path d={ANCHOR} transform='translate(92 0)' strokeWidth={2} className={lines(c)} />
          </Stamp>

          {/* A little plane stamp */}
          <Stamp x={566} y={508} rotate={-6} ink={d}>
            <rect x={-38} y={-38} width={76} height={76} rx={12} strokeWidth={3} className={lines(d)} />
            <path d={PLANE} transform='scale(3.4) rotate(-35)' className={d.text} />
          </Stamp>

          {/* A postal cancel: wavy lines */}
          <Stamp x={770} y={520} rotate={-4} ink={c}>
            {[-24, -8, 8, 24].map((dy) => (
              <path key={dy} d={`M-80 ${dy}q10-10 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0`} strokeWidth={2.5} className={lines(c)} />
            ))}
          </Stamp>
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
