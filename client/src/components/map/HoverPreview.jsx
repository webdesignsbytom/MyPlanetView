import React, { useEffect, useState } from 'react';
// Components
import PosterImage from './PosterImage';
import PosterPlaceholder from './PosterPlaceholder';
import Postmark from './Postmark';
import { PlaceBadgeIcon } from './StarBadge';
// Data
import { postersFor } from '@/utils/map/posterData';
// Utils
import { countryName } from '@/utils/map/countries';
import { VISIT_STATUS_LABELS, countsAsVisited } from '@/utils/map/visitStatus';

const CYCLE_MS = 2500;
const OFFSET = 18;

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
// and, if you have photos from there, a slideshow of them on a white photo border;
// otherwise its travel poster (or the placeholder card). It follows the pointer. Mouse and pen only; every listener and timer is cleared when the
// country changes or the box goes.
function HoverPreview({ code, status, thumbs = [], showPhotos }) {
  const [position, setPosition] = useState(null);
  const [index, setIndex] = useState(0);
  const photos = showPhotos ? thumbs : [];

  useEffect(() => {
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setPosition({ x: e.clientX, y: e.clientY }));
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  useEffect(() => {
    setIndex(0);
    if (photos.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % photos.length), CYCLE_MS);
    return () => clearInterval(timer);
  }, [code, photos.length]);

  if (!code || !position) return null;

  // Keep the box on screen: flip to the pointer's left near the right edge
  const flip = typeof window !== 'undefined' && position.x > window.innerWidth - 320;
  const style = {
    top: Math.max(position.y - 40, 8),
    left: flip ? undefined : position.x + OFFSET,
    right: flip ? window.innerWidth - position.x + OFFSET : undefined,
  };

  const current = photos[index % Math.max(photos.length, 1)];
  const [poster] = postersFor(code);
  const name = countryName(code);
  const starred = countsAsVisited(status);

  return (
    <div
      aria-hidden='true'
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
      <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 ${starred ? 'pr-6' : ''}`}>
        <p className={`break-words font-travel ${nameSize(name)} uppercase leading-tight tracking-wide text-colour6`}>{name}</p>
        <Postmark>{status ? VISIT_STATUS_LABELS[status] : 'Not been yet'}</Postmark>
      </div>
      {current ? (
        <div className='grid bg-poster-cream p-1.5 shadow-paper'>
          <img key={current.id} src={current.thumbUrl} alt='' className='aspect-[4/3] w-full object-cover' />
        </div>
      ) : showPhotos && poster ? (
        <div className='grid bg-poster-cream p-1.5 shadow-paper'>
          <PosterImage poster={poster} ratio='1/1' alt='' className='overflow-hidden' imgClassName='object-cover object-top' />
        </div>
      ) : showPhotos ? (
        <PosterPlaceholder countryName={name} compact />
      ) : null}
    </div>
  );
}

export default HoverPreview;
