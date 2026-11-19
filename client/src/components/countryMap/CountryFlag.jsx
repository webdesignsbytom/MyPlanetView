import React, { useEffect, useState } from 'react';

// The map's places whose flag file has another name: the UK's nations (flag-icons' gb-eng…)
const FILE_OF = { XE: 'xe', XC: 'xc', XW: 'xw', XI: 'xi' };

/**
 * A country's flag (18 Nov 2026, the user's wish), from public/flags/<code>.svg (4:3 SVGs),
 * fetched only when shown. Nothing shows until it has loaded, or at all when there's no file.
 */
function CountryFlag({ code, name, className = 'h-10 w-[3.25rem]' }) {
  const [shown, setShown] = useState(false);
  useEffect(() => setShown(false), [code]);
  const file = FILE_OF[code] ?? code.toLowerCase();
  return (
    <img
      src={`/flags/${file}.svg`}
      alt={`Flag of ${name}`}
      onLoad={() => setShown(true)}
      onError={() => setShown(false)}
      className={`${className} object-cover shadow-paper ${shown ? '' : 'hidden'}`}
    />
  );
}

export default CountryFlag;
