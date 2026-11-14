import React, { useEffect, useState } from 'react';
// Components
import ResponsiveImage from '@/components/common/ResponsiveImage';
import PosterPlaceholder from './PosterPlaceholder';
// Data
import { postersFor } from '@/utils/map/posterData';
// Utils
import { countryName } from '@/utils/map/countries';
import { VISIT_STATUS_LABELS, countsAsVisited } from '@/utils/map/visitStatus';
import { StarBadgeIcon } from './StarBadge';

const CYCLE_MS = 2500;
const OFFSET = 18;

// my_planet's hover box: the country's name and, if you have photos from there, a
// slideshow of them; otherwise its travel poster (or the placeholder card). It follows
// the pointer. Mouse and pen only; every listener and timer is cleared when the
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

  return (
    <div
      aria-hidden='true'
      style={style}
      className='pointer-events-none fixed z-20 grid w-64 gap-2 rounded-lg border-2 border-map-edge bg-map-panel p-3 text-map-ink shadow-lift'
    >
      {/* Visited: the map's star badge, stuck on the card's corner like a travel sticker */}
      {countsAsVisited(status) ? (
        <StarBadgeIcon lived={status === 'LIVED'} className='absolute -right-4 -top-4 h-12 w-12 rotate-12 drop-shadow-md' />
      ) : null}
      <div className='grid gap-0.5 rounded-md px-6 text-center shadow-lift-sm'>
        <p className='font-travel text-xl leading-tight'>{name}</p>
        <p className='text-xs opacity-80'>{status ? VISIT_STATUS_LABELS[status] : 'Not been yet'}</p>
      </div>
      {current ? (
        <img
          key={current.id}
          src={current.thumbUrl}
          alt=''
          className='aspect-[4/3] w-full rounded-md border-2 border-map-edge object-cover'
        />
      ) : showPhotos && poster ? (
        <ResponsiveImage
          folder='posters'
          name={poster.name}
          ratio='1/1'
          alt=''
          sizes='16rem'
          className='overflow-hidden rounded-md border-2 border-map-edge'
          imgClassName='object-cover object-top'
        />
      ) : showPhotos ? (
        <PosterPlaceholder countryName={name} compact />
      ) : null}
    </div>
  );
}

export default HoverPreview;
