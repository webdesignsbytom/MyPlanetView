import React, { memo, useEffect, useId, useState } from 'react';
// Utils
import { REFERENCE_PX_PER_UNIT, projectToMap } from '@/utils/map/projection';
import { sunAndMoonAt } from '@/utils/map/skyPositions';

// Their size on screen in CSS pixels, whatever the zoom: the glow's reach, and the solid disc
const SUN_PX = 34;
const MOON_PX = 20;
const UPDATE_MS = 60_000;

const stop = (offset, colour, opacity = 1) => (
  <stop offset={offset} style={{ stopColor: `var(${colour})`, stopOpacity: opacity }} />
);

/**
 * The sun and the moon (the animated style's "Sun and moon" setting), each over the point
 * on the Earth where it's overhead right now (utils/map/skyPositions.js), moved once a
 * minute. Drawn on the map itself, so they pan and zoom with it, at a fixed size on screen
 * (`zoom` is pixels per map unit: useMapViewport). Over the countries, under the badges,
 * names and pins; never catching a press. Decorative; nothing animates, so they stay for
 * reduced motion too.
 */
function SkyBodies({ zoom }) {
  const [sky, setSky] = useState(() => sunAndMoonAt(new Date()));
  const id = useId();

  useEffect(() => {
    const timer = setInterval(() => setSky(sunAndMoonAt(new Date())), UPDATE_MS);
    return () => clearInterval(timer);
  }, []);

  const unitsPerPx = 1 / (Math.max(zoom, 1e-3) * REFERENCE_PX_PER_UNIT);
  const sun = projectToMap(sky.sun.latitude, sky.sun.longitude);
  const moon = projectToMap(sky.moon.latitude, sky.moon.longitude);
  const sunGlow = `${id}-sun`;
  const moonGlow = `${id}-moon`;

  return (
    <g aria-hidden='true' className='pointer-events-none'>
      <defs>
        {/* A bright disc fading into its glow, as the old screen sun's shadow did */}
        <radialGradient id={sunGlow}>
          {stop('0%', '--sky-sun')}
          {stop('55%', '--sky-sun')}
          {stop('62%', '--sky-sun-glow', 0.9)}
          {stop('100%', '--sky-sun-glow', 0)}
        </radialGradient>
        <radialGradient id={moonGlow}>
          {stop('0%', '--sky-moon')}
          {stop('70%', '--sky-moon')}
          {stop('76%', '--sky-moon-glow')}
          {stop('100%', '--sky-moon-glow', 0)}
        </radialGradient>
      </defs>
      {sun ? <circle data-sky-body='sun' cx={sun.x} cy={sun.y} r={SUN_PX * unitsPerPx} fill={`url(#${sunGlow})`} /> : null}
      {moon ? <circle data-sky-body='moon' cx={moon.x} cy={moon.y} r={MOON_PX * unitsPerPx} fill={`url(#${moonGlow})`} /> : null}
    </g>
  );
}

export default memo(SkyBodies);
