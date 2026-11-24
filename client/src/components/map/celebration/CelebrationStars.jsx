import React, { useId, useMemo } from 'react';
// Utils
import { burstStars } from '@/utils/map/celebrations';

// A five-pointed star (viewBox 0 0 24 24)
const STAR = 'M12 1.5l3.1 6.9 7.4.8-5.6 5 1.6 7.3L12 17.8l-6.5 3.7 1.6-7.3-5.6-5 7.4-.8z';

// The sunburst's rays: thin wedges from the middle, every 22.5°, fading out towards their ends
const RAY_COUNT = 16;
const RAYS = Array.from({ length: RAY_COUNT }, (_, index) => {
  const at = (index / RAY_COUNT) * Math.PI * 2;
  const point = (angle) => `${Math.round(Math.cos(angle) * 1400) / 10},${Math.round(Math.sin(angle) * 1400) / 10}`;
  return `0,0 ${point(at - 0.07)} ${point(at + 0.07)}`;
});

/**
 * The celebration's stars (CelebrationDialog): a gold sunburst turning slowly behind the
 * picture, and stars bursting out from its middle to their places, then twinkling (each
 * place's own, from `seed`: utils/map/celebrations.js burstStars). With reduced motion they
 * stand still in their places. Decorative. The stars' inks are on their <svg>s, so a map
 * style's own poster colours (the starry night's navy) never reach them.
 */
function CelebrationStars({ seed }) {
  const fadeId = useId();
  const stars = useMemo(() => burstStars(seed), [seed]);
  return (
    <div aria-hidden='true' className='pointer-events-none absolute inset-0 grid place-items-center' data-celebration-stars=''>
      <svg viewBox='-100 -100 200 200' className='absolute h-[26rem] w-[26rem] max-w-none text-poster-gold-light opacity-60 motion-safe:animate-rays-turn'>
        <defs>
          <radialGradient id={fadeId} cx='0' cy='0' r='100' gradientUnits='userSpaceOnUse'>
            <stop offset='0.15' stopColor='currentColor' stopOpacity='0.7' />
            <stop offset='1' stopColor='currentColor' stopOpacity='0' />
          </radialGradient>
        </defs>
        <g fill={`url(#${fadeId})`}>
          {RAYS.map((points) => (
            <polygon key={points} points={points} />
          ))}
        </g>
      </svg>
      {stars.map((star) => (
        <span
          key={star.id}
          className='absolute grid [transform:translate(var(--star-x),var(--star-y))_rotate(var(--star-spin))] motion-safe:animate-star-burst'
          style={{
            '--star-x': `${star.x}rem`,
            '--star-y': `${star.y}rem`,
            '--star-spin': `${star.spin}deg`,
            '--star-delay': `${star.delay}ms`,
            width: `${star.size}rem`,
            height: `${star.size}rem`,
          }}
        >
          <svg viewBox='0 0 24 24' className={`h-full w-full drop-shadow ${star.ink}`}>
            <path d={STAR} fill='currentColor' />
          </svg>
        </span>
      ))}
    </div>
  );
}

export default CelebrationStars;
