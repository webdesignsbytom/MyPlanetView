// The passport stamps the account page's backdrop (StampBackdrop), the empty map panels
// (PanelEmptyState) and the map's loading screen (StampLoading) draw: rubber-stamp outlines
// from passports, every one a country's (19 Nov 2026, the user's wish: no stamp for nowhere).
// Each is a shape (SHAPES) with its words; nine are laid out on one tile for the backdrops,
// and the loading screen presses those and many more, every one a different place.
import React from 'react';

// The tile the stamps repeat on (user units = CSS pixels)
export const TILE_W = 880;
export const TILE_H = 600;

// The two inks: cream and deep red on the poster's red, faint, so the page's paperwork reads
// over them (the user's wish, 16 Nov 2026: "a background of outlines of stamps")
export const INK = {
  cream: { line: 'stroke-poster-cream', text: 'fill-poster-cream', fade: 'opacity-30' },
  deep: { line: 'stroke-poster-red-deep', text: 'fill-poster-red-deep', fade: 'opacity-50' },
  // Green and orange, for the map's loading screen (a stamp's `loadingInk`; 18 and 19 Nov
  // 2026, the user's wish)
  green: { line: 'stroke-poster-green', text: 'fill-poster-green', fade: 'opacity-50' },
  orange: { line: 'stroke-poster-orange', text: 'fill-poster-orange', fade: 'opacity-50' },
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

// The travel face's advance per character, in ems (measured in Chromium, 19 Nov 2026); other
// capitals are about 0.64 and figures 0.72
const ADVANCE = { ' ': 0.28, '.': 0.36, "'": 0.26, I: 0.47, L: 0.45, S: 0.47, M: 0.83, W: 0.85, 1: 0.59 };

// A word's size and spacing, set smaller when it would run wider than `max` (a long name on a
// stamp made for a short one)
function fitted(word, size, spacing, max) {
  let ems = 0;
  for (const ch of word) ems += ADVANCE[ch] ?? (ch >= '0' && ch <= '9' ? 0.72 : 0.64);
  const width = ems * size + spacing * (word.length - 1);
  if (!max || width <= max) return { size, spacing };
  const shrink = max / width;
  return { size: +(size * shrink).toFixed(2), spacing: +(spacing * shrink).toFixed(2) };
}

// A word on a stamp, in the travel face, centred on x, never wider than `max`
const label = (ink, { y, size, spacing = 1, x = 0, max }, word) => {
  const fit = fitted(word, size, spacing, max);
  return (
    <text x={x} y={y} fontSize={fit.size} letterSpacing={fit.spacing} textAnchor='middle' className={`font-travel ${ink.text}`}>
      {word}
    </text>
  );
};

const lines = (ink) => `fill-none ${ink.line}`;

// The shapes, each drawn round 0,0 from its ink, its words (`s`: country, place, date and
// a word such as ARRIVAL, as the shape uses them) and `arc`, the id of the ring path a
// curved word follows
const SHAPES = {
  // A double oval with planes either side (Tokyo)
  oval: (c, s) => (
    <>
      <ellipse rx={120} ry={62} strokeWidth={4} className={lines(c)} />
      <ellipse rx={110} ry={53} strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: -26, size: 11, spacing: 3, max: 140 }, s.country)}
      {label(c, { y: 6, size: 34, spacing: 6, max: 150 }, s.place)}
      <line x1={-70} x2={70} y1={14} y2={14} strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: 28, size: 9, spacing: 2, max: 160 }, s.word ?? 'INTERNATIONAL AIRPORT')}
      {label(c, { y: 46, size: 16, spacing: 3, max: 132 }, s.date)}
      <path d={PLANE} transform='translate(-88 -2) rotate(-20)' className={c.text} />
      <path d={PLANE} transform='translate(88 -2) rotate(20)' className={c.text} />
    </>
  ),
  // A double ring, the country curved round its top, and a star (Casablanca)
  ring: (c, s, arc) => {
    const curved = fitted(s.country, 12, 2, 160);
    return (
      <>
        <circle r={70} strokeWidth={4} className={lines(c)} />
        <circle r={61} strokeWidth={1.5} className={lines(c)} />
        <text fontSize={curved.size} letterSpacing={curved.spacing} className={`font-travel ${c.text}`}>
          <textPath href={`#${arc}`} startOffset='50%' textAnchor='middle'>
            {s.country}
          </textPath>
        </text>
        <polygon points={STAR} transform='translate(0 -18)' className={c.text} />
        <line x1={-44} x2={44} y1={-4} y2={-4} strokeWidth={1.5} className={lines(c)} />
        {label(c, { y: 14, size: 18, spacing: 2, max: 96 }, s.word ?? 'ARRIVAL')}
        <line x1={-44} x2={44} y1={22} y2={22} strokeWidth={1.5} className={lines(c)} />
        {label(c, { y: 38, size: 10, spacing: 2, max: 88 }, s.place)}
      </>
    );
  },
  // An elongated hexagon (Rome)
  hexagon: (c, s) => (
    <>
      <polygon points='-120,0 -96,-58 96,-58 120,0 96,58 -96,58' strokeWidth={4} className={lines(c)} />
      <polygon points='-110,0 -90,-49 90,-49 110,0 90,49 -90,49' strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: -30, size: 9, spacing: 2, max: 176 }, s.country)}
      {label(c, { y: -10, size: 14, spacing: 3, max: 176 }, s.word ?? 'ARRIVAL')}
      {label(c, { y: 8, size: 12, spacing: 2, max: 176 }, s.date)}
      {label(c, { y: 36, size: 28, spacing: 6, max: 130 }, s.place)}
      <path d={PLANE} transform='translate(-78 14) rotate(-30)' className={c.text} />
      <path d={PLANE} transform='translate(78 14) rotate(30)' className={c.text} />
    </>
  ),
  // A rounded square with a dashed date box (Singapore); `lines` are the two small lines
  square: (c, s) => (
    <>
      <rect x={-95} y={-85} width={190} height={170} rx={16} strokeWidth={4} className={lines(c)} />
      <rect x={-86} y={-76} width={172} height={152} rx={10} strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: -46, size: 20, spacing: 3, max: 160 }, s.place)}
      <rect x={-62} y={-34} width={124} height={30} strokeWidth={1.5} strokeDasharray='4 3' className={lines(c)} />
      {label(c, { y: -13, size: 16, spacing: 2, max: 120 }, s.date)}
      {label(c, { y: 18, size: 13, spacing: 4, max: 160 }, s.word ?? 'ARRIVAL')}
      {label(c, { x: -24, y: 42, size: 9, spacing: 1, max: 100 }, s.lines?.[0] ?? 'INTERNATIONAL')}
      {label(c, { x: -24, y: 56, size: 9, spacing: 1, max: 100 }, s.lines?.[1] ?? 'AIRPORT')}
      <circle cx={50} cy={48} r={14} strokeWidth={1.5} className={lines(c)} />
      <path d={PLANE} transform='translate(50 48)' className={c.text} />
    </>
  ),
  // A double rectangle (Ulaanbaatar)
  rectangle: (c, s) => (
    <>
      <rect x={-140} y={-70} width={280} height={140} rx={6} strokeWidth={4} className={lines(c)} />
      <rect x={-130} y={-60} width={260} height={120} rx={3} strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: -38, size: 10, spacing: 2, max: 240 }, s.country)}
      {label(c, { y: -12, size: 22, spacing: 3, max: 240 }, s.date)}
      {label(c, { y: 22, size: 32, spacing: 4, max: 240 }, s.place)}
      {label(c, { y: 44, size: 12, spacing: 6, max: 240 }, s.word ?? 'IMMIGRATION')}
    </>
  ),
  // A double octagon with an anchor, for a port (Kotor)
  octagon: (c, s) => (
    <>
      <polygon points='-33,-80 33,-80 80,-33 80,33 33,80 -33,80 -80,33 -80,-33' strokeWidth={4} className={lines(c)} />
      <polygon points='-29,-70 29,-70 70,-29 70,29 29,70 -29,70 -70,29 -70,-29' strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: -4, size: 24, spacing: 3, max: 132 }, s.place)}
      {label(c, { y: 24, size: 20, spacing: 4, max: 120 }, s.country)}
      <path d={ANCHOR} transform='translate(0 -42)' strokeWidth={2} className={lines(c)} />
    </>
  ),
  // A wide oval with anchors either side, for a port (San Francisco)
  anchors: (c, s) => (
    <>
      <ellipse rx={130} ry={58} strokeWidth={4} className={lines(c)} />
      <ellipse rx={120} ry={49} strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: -24, size: 13, spacing: 3, max: 150 }, s.word ?? 'ARRIVAL')}
      {label(c, { y: -4, size: 15, spacing: 2, max: 150 }, s.date)}
      {label(c, { y: 22, size: 20, spacing: 2, max: 176 }, s.place)}
      {label(c, { y: 38, size: 8, spacing: 2, max: 160 }, s.country)}
      <path d={ANCHOR} transform='translate(-92 0)' strokeWidth={2} className={lines(c)} />
      <path d={ANCHOR} transform='translate(92 0)' strokeWidth={2} className={lines(c)} />
    </>
  ),
  // A double triangle with a star at its peak (Cairo; 19 Nov 2026, the user's wish)
  triangle: (c, s) => (
    <>
      <polygon points='0,-92 106,76 -106,76' strokeWidth={4} className={lines(c)} />
      <polygon points='0,-75 89.7,67 -89.7,67' strokeWidth={1.5} className={lines(c)} />
      <polygon points={STAR} transform='translate(0 -44) scale(0.8)' className={c.text} />
      {label(c, { y: -14, size: 11, spacing: 2, max: 62 }, s.word ?? 'ARRIVAL')}
      {label(c, { y: 20, size: 22, spacing: 2, max: 96 }, s.place)}
      <line x1={-56} x2={56} y1={28} y2={28} strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: 46, size: 12, spacing: 2, max: 128 }, s.country)}
      {label(c, { y: 60, size: 10, spacing: 1.5, max: 140 }, s.date)}
    </>
  ),
  // A scalloped rosette with a star (Sydney)
  rosette: (c, s) => (
    <>
      <path d={SCALLOP} strokeWidth={3.5} className={lines(c)} />
      <circle r={56} strokeWidth={1.5} className={lines(c)} />
      <polygon points={STAR} transform='translate(0 -40) scale(0.75)' className={c.text} />
      {label(c, { y: -18, size: 11, spacing: 3, max: 96 }, s.country)}
      {label(c, { y: 8, size: 22, spacing: 3, max: 92 }, s.place)}
      <line x1={-40} x2={40} y1={16} y2={16} strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: 32, size: 11, spacing: 1.5, max: 88 }, s.date)}
    </>
  ),
  // A double diamond with a star at its top
  diamond: (c, s) => (
    <>
      <polygon points='0,-92 124,0 0,92 -124,0' strokeWidth={4} className={lines(c)} />
      <polygon points='0,-81 109,0 0,81 -109,0' strokeWidth={1.5} className={lines(c)} />
      <polygon points={STAR} transform='translate(0 -50) scale(0.6)' className={c.text} />
      {label(c, { y: -22, size: 11, spacing: 2, max: 116 }, s.country)}
      {label(c, { y: 10, size: 24, spacing: 3, max: 164 }, s.place)}
      {label(c, { y: 34, size: 12, spacing: 2, max: 104 }, s.date)}
    </>
  ),
  // A double ring with a swallowtail banner across it, the place on the banner
  band: (c, s) => (
    <>
      <path d='M-69.7-18A72 72 0 0 1 69.7-18M69.7 18A72 72 0 0 1-69.7 18' strokeWidth={4} className={lines(c)} />
      <path d='M-60.4-18A63 63 0 0 1 60.4-18M60.4 18A63 63 0 0 1-60.4 18' strokeWidth={1.5} className={lines(c)} />
      <polygon points='-114,-18 114,-18 102,0 114,18 -114,18 -102,0' strokeWidth={3} className={lines(c)} />
      {label(c, { y: -40, size: 9, spacing: 2, max: 76 }, s.word ?? 'ARRIVAL')}
      {label(c, { y: -26, size: 12, spacing: 1.5, max: 98 }, s.date)}
      {label(c, { y: 9, size: 22, spacing: 3, max: 184 }, s.place)}
      {label(c, { y: 40, size: 12, spacing: 2, max: 92 }, s.country)}
    </>
  ),
  // A long double pill with a star at each end
  pill: (c, s) => (
    <>
      <rect x={-140} y={-46} width={280} height={92} rx={46} strokeWidth={4} className={lines(c)} />
      <rect x={-131} y={-37} width={262} height={74} rx={37} strokeWidth={1.5} className={lines(c)} />
      {label(c, { y: -14, size: 12, spacing: 4, max: 190 }, s.country)}
      {label(c, { y: 11, size: 22, spacing: 3, max: 186 }, s.place)}
      {label(c, { x: -44, y: 28, size: 9, spacing: 2, max: 70 }, s.word ?? 'ARRIVAL')}
      {label(c, { x: 44, y: 28, size: 9, spacing: 1.5, max: 76 }, s.date)}
      <polygon points={STAR} transform='translate(-112 -2) scale(0.7)' className={c.text} />
      <polygon points={STAR} transform='translate(112 -2) scale(0.7)' className={c.text} />
    </>
  ),
};

// The stamps laid out on one 880×600 tile (the backdrops): where each sits, its turn and ink,
// its shape and words. The map's loading screen presses these too.
export const PASSPORT_STAMPS = [
  { x: 150, y: 112, rotate: -8, ink: 'cream', shape: 'oval', country: 'JAPAN', place: 'TOKYO', date: '29.11.2021' },
  // It was an "IMMIGRATION / ARRIVAL / CUSTOMS" ring, for no country (19 Nov 2026, the user's wish)
  { x: 420, y: 128, rotate: 8, ink: 'deep', shape: 'ring', country: 'KINGDOM OF MOROCCO', place: 'CASABLANCA' },
  { x: 700, y: 110, rotate: 10, ink: 'cream', shape: 'hexagon', country: 'REPUBBLICA ITALIANA', date: '25.10.2018', place: 'ROME' },
  { x: 142, y: 334, rotate: 5, ink: 'deep', shape: 'square', place: 'SINGAPORE', date: '19.07.2021', word: 'DEPARTURE' },
  // New York and Venice until 19 Nov 2026 (the user's wish: one stamp for Italy, one for the USA)
  { x: 452, y: 332, rotate: -4, ink: 'cream', shape: 'rectangle', country: 'MONGOLIA', date: '31 MAY 2019', place: 'ULAANBAATAR' },
  { x: 752, y: 330, rotate: 8, ink: 'deep', shape: 'octagon', place: 'KOTOR', country: 'MONTENEGRO' },
  // Green on the map's loading screen
  {
    x: 262,
    y: 512,
    rotate: -12,
    ink: 'cream',
    loadingInk: 'green',
    shape: 'anchors',
    date: '16.12.2016',
    place: 'SAN FRANCISCO',
    country: 'UNITED STATES OF AMERICA',
  },
  // It was a little plane stamp, for no country (19 Nov 2026, the user's wish: a triangle)
  { x: 566, y: 508, rotate: -6, ink: 'deep', shape: 'triangle', place: 'CAIRO', country: 'EGYPT', date: '12.03.2019' },
  { x: 770, y: 520, rotate: -10, ink: 'cream', shape: 'rosette', country: 'AUSTRALIA', place: 'SYDNEY', date: '09.02.2023' },
];

// Every stamp the map's loading screen presses: the tile's nine and these, each a different
// country (19 Nov 2026, the user's wish: no stamp again and again, no country twice)
const STAMP_LIST = [
  ...PASSPORT_STAMPS,
  { shape: 'oval', ink: 'deep', country: 'REPUBLIC OF KOREA', place: 'SEOUL', word: 'INCHEON AIRPORT', date: '14.04.2019' },
  { shape: 'oval', ink: 'cream', country: 'KINGDOM OF THAILAND', place: 'BANGKOK', word: 'SUVARNABHUMI AIRPORT', date: '03.01.2020' },
  { shape: 'oval', ink: 'deep', country: 'REPUBLIC OF INDIA', place: 'DELHI', word: 'INDIRA GANDHI AIRPORT', date: '22.02.2018' },
  { shape: 'oval', ink: 'cream', country: 'BRAZIL', place: 'SAO PAULO', word: 'GUARULHOS AIRPORT', date: '11.06.2014' },
  { shape: 'oval', ink: 'deep', country: 'TURKEY', place: 'ISTANBUL', word: 'ISTANBUL AIRPORT', date: '30.08.2022' },
  { shape: 'oval', ink: 'cream', country: 'CHINA', place: 'BEIJING', word: 'CAPITAL AIRPORT', date: '05.10.2019' },
  { shape: 'oval', ink: 'deep', country: 'PHILIPPINES', place: 'MANILA', word: 'NINOY AQUINO AIRPORT', date: '17.03.2024' },

  { shape: 'ring', ink: 'cream', country: 'REPUBLIC OF KENYA', place: 'NAIROBI' },
  { shape: 'ring', ink: 'deep', country: 'KINGDOM OF SWEDEN', place: 'STOCKHOLM', word: 'ENTRY' },
  { shape: 'ring', ink: 'cream', country: 'REPUBLIC OF CHILE', place: 'SANTIAGO' },
  { shape: 'ring', ink: 'deep', country: 'JORDAN', place: 'AMMAN', word: 'VISA' },
  { shape: 'ring', ink: 'cream', country: 'REPUBLIC OF GHANA', place: 'ACCRA' },
  { shape: 'ring', ink: 'deep', country: 'NEPAL', place: 'KATHMANDU', word: 'ENTRY' },
  { shape: 'ring', ink: 'cream', country: 'REPUBLICA DE CUBA', place: 'LA HABANA', word: 'ENTRADA' },

  { shape: 'hexagon', ink: 'deep', country: 'REPUBLIQUE FRANCAISE', date: '07.07.2017', place: 'PARIS' },
  { shape: 'hexagon', ink: 'cream', country: 'BUNDESREPUBLIK DEUTSCHLAND', word: 'EINREISE', date: '21.09.2019', place: 'BERLIN' },
  { shape: 'hexagon', ink: 'deep', country: 'KINGDOM OF SPAIN', date: '02.05.2016', place: 'MADRID' },
  { shape: 'hexagon', ink: 'cream', country: 'HELLENIC REPUBLIC', date: '19.06.2023', place: 'ATHENS' },
  { shape: 'hexagon', ink: 'deep', country: 'KINGDOM OF THE NETHERLANDS', word: 'AANKOMST', date: '28.04.2015', place: 'AMSTERDAM' },
  { shape: 'hexagon', ink: 'cream', country: 'REPUBLICA DEL PERU', word: 'ENTRADA', date: '12.11.2017', place: 'LIMA' },

  { shape: 'square', ink: 'cream', place: 'MALDIVES', date: '08.12.2022', lines: ['VELANA', 'AIRPORT'] },
  { shape: 'square', ink: 'deep', place: 'ICELAND', date: '26.01.2020', word: 'ENTRY', lines: ['KEFLAVIK', 'AIRPORT'] },
  { shape: 'square', ink: 'cream', place: 'QATAR', date: '14.02.2023', word: 'DEPARTURE', lines: ['HAMAD', 'AIRPORT'] },
  { shape: 'square', ink: 'deep', place: 'FIJI', date: '04.08.2018', lines: ['NADI', 'AIRPORT'] },
  { shape: 'square', ink: 'cream', place: 'JAMAICA', date: '23.03.2016', lines: ['MONTEGO BAY', 'AIRPORT'] },
  { shape: 'square', ink: 'deep', place: 'MAURITIUS', date: '10.10.2021', word: 'DEPARTURE' },

  { shape: 'rectangle', ink: 'deep', country: 'UNITED KINGDOM', date: '12 AUG 2017', place: 'LONDON', word: 'LEAVE TO ENTER' },
  { shape: 'rectangle', ink: 'cream', country: 'CANADA', date: '04 JUL 2022', place: 'TORONTO', word: 'ADMITTED' },
  { shape: 'rectangle', ink: 'deep', country: 'REPUBLICA ARGENTINA', date: '18 MAR 2016', place: 'BUENOS AIRES', word: 'MIGRACIONES' },
  { shape: 'rectangle', ink: 'cream', country: 'SOUTH AFRICA', date: '09 OCT 2018', place: 'CAPE TOWN', word: 'ADMITTED' },
  { shape: 'rectangle', ink: 'deep', country: 'REPUBLIC OF INDONESIA', date: '27 JUN 2023', place: 'DENPASAR' },
  { shape: 'rectangle', ink: 'cream', country: 'NEW ZEALAND', date: '15 JAN 2024', place: 'AUCKLAND', word: 'ARRIVED' },
  { shape: 'rectangle', ink: 'deep', country: 'IRELAND', date: '01 SEP 2015', place: 'DUBLIN' },

  { shape: 'octagon', ink: 'cream', place: 'LISBON', country: 'PORTUGAL' },
  { shape: 'octagon', ink: 'deep', place: 'VALLETTA', country: 'MALTA' },
  { shape: 'octagon', ink: 'cream', place: 'BERGEN', country: 'NORWAY' },
  { shape: 'octagon', ink: 'deep', place: 'COPENHAGEN', country: 'DENMARK' },
  { shape: 'octagon', ink: 'cream', place: 'ZANZIBAR', country: 'TANZANIA' },
  { shape: 'octagon', ink: 'deep', place: 'TALLINN', country: 'ESTONIA' },
  { shape: 'octagon', ink: 'cream', place: 'CARTAGENA', country: 'COLOMBIA' },

  { shape: 'anchors', ink: 'deep', date: '21.04.2019', place: 'HALONG BAY', country: 'VIETNAM' },
  { shape: 'anchors', ink: 'cream', word: 'ENTRADA', date: '06.01.2017', place: 'MONTEVIDEO', country: 'URUGUAY' },
  { shape: 'anchors', ink: 'deep', date: '13.07.2021', place: 'HELSINKI', country: 'FINLAND' },
  { shape: 'anchors', ink: 'cream', date: '29.02.2020', place: 'PORT OF SPAIN', country: 'TRINIDAD AND TOBAGO' },
  { shape: 'anchors', ink: 'deep', word: 'ENTRY', date: '16.08.2018', place: 'DUBROVNIK', country: 'CROATIA' },
  { shape: 'anchors', ink: 'cream', date: '03.11.2022', place: 'VICTORIA', country: 'SEYCHELLES' },

  { shape: 'triangle', ink: 'cream', word: 'ENTRADA', place: 'CANCUN', country: 'MEXICO', date: '24.12.2019' },
  { shape: 'triangle', ink: 'deep', word: 'ENTRY', place: 'ZURICH', country: 'SWITZERLAND', date: '09.01.2018' },
  { shape: 'triangle', ink: 'cream', place: 'LA PAZ', country: 'BOLIVIA', date: '15.05.2015' },
  { shape: 'triangle', ink: 'deep', word: 'VISA', place: 'PARO', country: 'BHUTAN', date: '02.10.2023' },
  { shape: 'triangle', ink: 'cream', place: 'SIEM REAP', country: 'CAMBODIA', date: '20.11.2016' },

  { shape: 'rosette', ink: 'deep', country: 'AUSTRIA', place: 'VIENNA', date: '31.12.2018' },
  { shape: 'rosette', ink: 'cream', country: 'CZECHIA', place: 'PRAGUE', date: '14.03.2017' },
  { shape: 'rosette', ink: 'deep', country: 'HUNGARY', place: 'BUDAPEST', date: '08.09.2021' },
  { shape: 'rosette', ink: 'cream', country: 'BELGIUM', place: 'BRUSSELS', date: '25.05.2014' },
  { shape: 'rosette', ink: 'deep', country: 'SRI LANKA', place: 'COLOMBO', date: '18.01.2024' },
  { shape: 'rosette', ink: 'cream', country: 'ETHIOPIA', place: 'ADDIS ABABA', date: '06.06.2019' },

  { shape: 'diamond', ink: 'cream', country: 'POLAND', place: 'KRAKOW', date: '22.07.2016' },
  { shape: 'diamond', ink: 'deep', country: 'UNITED ARAB EMIRATES', place: 'DUBAI', date: '11.11.2021' },
  { shape: 'diamond', ink: 'cream', country: 'OMAN', place: 'MUSCAT', date: '27.02.2019' },
  { shape: 'diamond', ink: 'deep', country: 'ROMANIA', place: 'BUCHAREST', date: '13.08.2015' },
  { shape: 'diamond', ink: 'cream', country: 'GEORGIA', place: 'TBILISI', date: '04.05.2022' },
  { shape: 'diamond', ink: 'deep', country: 'UZBEKISTAN', place: 'SAMARKAND', date: '19.09.2023' },

  { shape: 'band', ink: 'deep', date: '16.04.2018', place: 'KUALA LUMPUR', country: 'MALAYSIA' },
  { shape: 'band', ink: 'cream', word: 'ENTRY', date: '07.12.2019', place: 'VIENTIANE', country: 'LAOS' },
  { shape: 'band', ink: 'deep', word: 'ENTRADA', date: '21.08.2016', place: 'QUITO', country: 'ECUADOR' },
  { shape: 'band', ink: 'cream', date: '30.10.2017', place: 'TUNIS', country: 'TUNISIA' },
  { shape: 'band', ink: 'deep', word: 'ADMITTED', date: '12.04.2023', place: 'NASSAU', country: 'BAHAMAS' },
  { shape: 'band', ink: 'cream', date: '25.01.2015', place: 'DAKAR', country: 'SENEGAL' },

  { shape: 'pill', ink: 'cream', country: 'SLOVENIA', place: 'LJUBLJANA', date: '03.06.2019' },
  { shape: 'pill', ink: 'deep', country: 'LITHUANIA', place: 'VILNIUS', date: '17.10.2022' },
  { shape: 'pill', ink: 'cream', country: 'LATVIA', place: 'RIGA', date: '09.03.2018' },
  { shape: 'pill', ink: 'deep', country: 'SERBIA', place: 'BELGRADE', word: 'ENTRY', date: '28.07.2016' },
  { shape: 'pill', ink: 'cream', country: 'NAMIBIA', place: 'WINDHOEK', date: '14.09.2017' },
  { shape: 'pill', ink: 'deep', country: 'COSTA RICA', place: 'SAN JOSE', word: 'ENTRADA', date: '01.02.2024' },
  { shape: 'pill', ink: 'cream', country: 'BULGARIA', place: 'SOFIA', date: '22.06.2020' },
];

// On the loading screen they print in four inks in turn, a quarter each, so no one colour
// crowds the screen (19 Nov 2026, the user's wish: too many red and white ones); San
// Francisco keeps its green. Their `ink` stays for the backdrops.
const LOADING_INKS = ['cream', 'deep', 'green', 'orange'];
export const LOADING_STAMPS = STAMP_LIST.map((stamp, i) => ({ ...stamp, loadingInk: stamp.loadingInk ?? LOADING_INKS[i % LOADING_INKS.length] }));

// The ring path a curved country follows, for a <defs>: give it the id passed as `arc`
export const ARC_PATH = 'M-52 6A52 52 0 0 1 52 6';

// One stamp from the lists, placed and inked (`fade` replaces its ink's faintness, `inkKey`
// its ink: deep red for every stamp on cream paper, where the cream ink wouldn't show)
export function drawStamp(stamp, arc, fade, inkKey) {
  const ink = INK[inkKey || stamp.ink];
  return (
    <g transform={`translate(${stamp.x} ${stamp.y}) rotate(${stamp.rotate})`} className={fade ?? ink.fade}>
      {SHAPES[stamp.shape](ink, stamp, arc)}
    </g>
  );
}
