import React, { memo } from 'react';
// Utils
import { countryFillClass, countsAsVisited } from '@/utils/map/visitStatus';

// One country's shapes (islands are separate paths). Re-renders only when its own
// status or selection changes; hover is pure CSS. data-been feeds the visited /
// not-visited filters (CountryLayer fades one group with CSS, no re-render).
function CountryShape({ code, paths, status, selected }) {
  return (
    <g
      data-code={code}
      data-been={countsAsVisited(status) ? 'true' : 'false'}
      className={`cursor-pointer transition-colors hover:fill-map-hover ${countryFillClass(code, status)} ${
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
