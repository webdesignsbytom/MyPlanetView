import React, { useEffect, useState } from 'react';
// Utils
import { skyPositions } from '@/utils/map/skyPositions';

// The sun and moon over the animated sea, placed by the time of day and moved once a
// minute. Decorative only; nothing animates, so it stays for reduced motion too.
function SunMoon() {
  const [sky, setSky] = useState(() => skyPositions(new Date()));

  useEffect(() => {
    const timer = setInterval(() => setSky(skyPositions(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div aria-hidden='true' className='pointer-events-none absolute inset-0 overflow-hidden'>
      <span
        className='absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 sky-sun-ball'
        style={{ left: `${sky.sun.x}%`, top: `${sky.sun.y}%` }}
      />
      <span
        className='absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 sky-moon-ball'
        style={{ left: `${sky.moon.x}%`, top: `${sky.moon.y}%` }}
      />
    </div>
  );
}

export default SunMoon;
