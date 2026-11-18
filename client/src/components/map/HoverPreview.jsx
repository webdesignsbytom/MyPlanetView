import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
// Components
import PosterImage from './PosterImage';
import PosterPlaceholder from './PosterPlaceholder';
import Postmark from './Postmark';
import { PlaceBadgeIcon } from './StarBadge';
// Data
import { postersFor } from '@/utils/map/posterData';
// Utils
import { countryName } from '@/utils/map/countries';
import { regionParent } from '@/utils/map/regionPlaces';
import { VISIT_STATUS_LABELS, countsAsVisited } from '@/utils/map/visitStatus';
import { takeHoverPoint } from '@/utils/map/hoverPoint';

const OFFSET = 18;
// The card's top sits this far above the pointer, so the pointer is beside its header
const LIFT = 40;
// Kept clear of the screen's top and bottom edges
const MARGIN = 8;
// A finger's card (a long press: CountryLayer) clears the fingertip by this much
const FINGER = 36;
const CARD_WIDTH = 256; // w-64

// A finger's card: above the finger, centred on it, or below when there's no room above
function fingerTop(y, height) {
  const above = y - FINGER - height;
  return above >= MARGIN ? above : y + FINGER;
}

// Where the card's top goes: beside the pointer, or, when the card wouldn't fit below
// the pointer, above it (its bottom just over the pointer); never off the top
function cardTop(pointerY, height, screenHeight) {
  const beside = pointerY - LIFT;
  const top = beside + height <= screenHeight - MARGIN ? beside : pointerY - OFFSET - height;
  return Math.max(top, MARGIN);
}

// The name shares its row with the postmark, and a word can't wrap, so the longest
// word sets the size. Measured in the travel face against the 140 px name cell of a
// starred card, the narrowest (14 Nov 2026), leaving at least 7 px spare for every country:
// "Cameroon" fits at 2xl, "Macedonia" needs xl, "Herzegovina" lg, "Liechtenstein" base.
function nameSize(name) {
  const longest = Math.max(0, ...String(name).split(/[\s-]+/).map((word) => word.length));
  if (longest <= 8) return 'text-2xl';
  if (longest <= 9) return 'text-xl';
  if (longest <= 11) return 'text-lg';
  return 'text-base';
}

// my_planet's hover box, as a postcard: the country's name in the travel face, its
// status as a postmark, the star badge stuck on the corner like a stamp when visited,
// and the country's travel poster (or the placeholder card) with `showPoster` (the setting
// "Country posters on hover"). Always the poster, visited or not: never the map's own
// photos (17 Nov 2026, the user's wish; it was a slideshow of the newest ones from there).
// It follows the pointer, and goes above it near the bottom of the screen, where it
// wouldn't fit below. Mouse and pen only; every listener is cleared when the box goes.
// A region (Bali, Tasmania: regionPlaces.js) says so above its name, a "Region" stamp and
// the country it's part of (18 Nov 2026, the user's wish; the line under its poster on how
// the map stood with that country went the same day, the user's wish).
function HoverPreview({ code, status, showPoster }) {
  // A long press starts at the finger (`touch`); a mouse at its first move
  const [position, setPosition] = useState(() => {
    const at = takeHoverPoint();
    return at ? { ...at, touch: true } : null;
  });
  const boxRef = useRef(null);

  // The card's height depends on what it shows (a poster or not), so its
  // top is set once it's laid out and before it's painted: no frame off the screen
  const positionRef = useRef(null);
  useLayoutEffect(() => {
    positionRef.current = position;
    const box = boxRef.current;
    if (!box || !position) return;
    box.style.top = `${position.touch ? fingerTop(position.y, box.offsetHeight) : cardTop(position.y, box.offsetHeight, window.innerHeight)}px`;
  });

  // ...and again whenever its size changes: a poster's box is drawn square until its image
  // arrives, then grows to the poster's own shape (17 Nov 2026: a 2:3 poster near the bottom
  // of the screen ran off it)
  const shown = Boolean(code && position);
  useEffect(() => {
    const box = boxRef.current;
    if (!shown || !box || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      const at = positionRef.current;
      if (at) box.style.top = `${at.touch ? fingerTop(at.y, box.offsetHeight) : cardTop(at.y, box.offsetHeight, window.innerHeight)}px`;
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [shown]);

  useEffect(() => {
    let frame = 0;
    const onMove = (e) => {
      if (e.pointerType === 'touch') return; // a finger's card stays put (it hides when the finger moves)
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPosition({ x: e.clientX, y: e.clientY }));
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  if (!code || !position) return null;

  // Keep the box on screen: flip to the pointer's left near the right edge (its top is
  // set in the layout effect above, which can measure it)
  // A finger's card is centred over it, kept on the screen
  const flip = !position.touch && typeof window !== 'undefined' && position.x > window.innerWidth - 320;
  const style = position.touch
    ? { left: Math.max(MARGIN, Math.min(position.x - CARD_WIDTH / 2, window.innerWidth - CARD_WIDTH - MARGIN)) }
    : {
        left: flip ? undefined : position.x + OFFSET,
        right: flip ? window.innerWidth - position.x + OFFSET : undefined,
      };

  const [poster] = postersFor(code);
  const name = countryName(code);
  const parent = regionParent(code);
  const starred = countsAsVisited(status);

  return (
    <div
      ref={boxRef}
      aria-hidden='true'
      data-hover-card={code}
      style={style}
      className='pointer-events-none fixed z-20 grid w-64 grid-cols-1 gap-3 border-2 border-poster-brown bg-paper-cream p-3 text-colour4 shadow-paper'
    >
      {/* Visited: the map's badge (the star, or a special place's expedition stamp), stuck
          on the card's corner like a stamp */}
      {starred ? (
        <PlaceBadgeIcon code={code} lived={status === 'LIVED'} className='absolute -right-4 -top-4 h-12 w-12 rotate-12 drop-shadow-md' />
      ) : null}
      {/* minmax(0, 1fr): a long name must never widen the card (and the poster with it).
          pr-6 keeps the postmark clear of the star; with no star it goes to the edge. */}
      {parent ? (
        <p className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 font-travel text-xs uppercase tracking-wide text-poster-brown ${starred ? 'pr-6' : ''}`}>
          <span className='-rotate-3 border-2 border-double border-poster-brown px-1.5 py-0.5'>Region</span>
          <span className='break-words'>of {countryName(parent)}</span>
        </p>
      ) : null}
      <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 ${starred ? 'pr-6' : ''}`}>
        <p className={`break-words font-travel ${nameSize(name)} uppercase leading-tight tracking-wide text-colour6`}>{name}</p>
        <Postmark>{status ? VISIT_STATUS_LABELS[status] : 'Not been yet'}</Postmark>
      </div>
      {showPoster && poster ? (
        // The whole poster at its own shape, with no mat: the posters have their own
        // printed border (17 Nov 2026, the user's wish; it was cropped square on a cream mat)
        <PosterImage poster={poster} alt='' className='overflow-hidden shadow-paper' />
      ) : showPoster ? (
        <PosterPlaceholder countryName={name} compact />
      ) : null}
    </div>
  );
}

export default HoverPreview;
