import React, { memo } from 'react';
// Utils
import { countryFillClass, countsAsVisited } from '@/utils/map/visitStatus';

// One country's shapes (islands are separate paths). Re-renders only when its own
// status, planned trip or selection changes; hover is pure CSS. data-been feeds the visited /
// not-visited filters (CountryLayer fades one group with CSS, no re-render). `planned`: a
// planned trip goes there (its outline; data-planned for the tests).
function CountryShape({ code, paths, status, planned = false, selected }) {
  return (
    <g
      data-code={code}
      data-been={countsAsVisited(status) ? 'true' : 'false'}
      data-planned={planned && !countsAsVisited(status) ? '' : undefined}
      className={`cursor-pointer transition-colors hover:fill-map-hover ${countryFillClass(code, status, planned)} ${
        selected ? 'stroke-map-ink stroke-[1.8]' : ''
      }`}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

export default memo(CountryShape);
