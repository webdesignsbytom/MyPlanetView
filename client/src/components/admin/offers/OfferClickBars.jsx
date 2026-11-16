import React from 'react';
// Utils
import { CLICK_DAYS, clicksWord, dailyClicks, shortDay } from '@/utils/offers/offerAdmin';

const BAR = 4;
const GAP = 2;
const HEIGHT = 32;

// An offer's clicks per day as a row of thin bars, oldest on the left, in the theme's ocean
// blue on a faint baseline; each day says its count on hover. The numbers are in words
// too: the label sums it up, and the offer's card lists the days with clicks.
function OfferClickBars({ byDay, since, days = CLICK_DAYS }) {
  const series = dailyClicks(byDay, since, days);
  const max = Math.max(1, ...series.map((d) => d.count));
  const busiest = series.reduce((best, d) => (d.count > best.count ? d : best), series[0]);
  const width = days * (BAR + GAP);
  const label = `Clicks per day, ${shortDay(series[0].day)} to ${shortDay(series[series.length - 1].day)}: most on ${shortDay(busiest.day)}, ${clicksWord(busiest.count)}.`;

  return (
    <div className='grid min-w-0 gap-1'>
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        preserveAspectRatio='none'
        role='img'
        aria-label={label}
        className='h-8 w-full'
      >
        <line x1='0' x2={width} y1={HEIGHT - 0.5} y2={HEIGHT - 0.5} className='stroke-poster-brown/40' strokeWidth='1' />
        {series.map(({ day, count }, i) => {
          const h = count ? Math.max(3, (count / max) * (HEIGHT - 2)) : 0;
          const x = i * (BAR + GAP) + GAP / 2;
          return (
            <g key={day}>
              <title>{`${shortDay(day)}: ${clicksWord(count)}`}</title>
              {/* The whole column answers the hover, not only the bar */}
              <rect x={x - GAP / 2} y='0' width={BAR + GAP} height={HEIGHT} className='fill-transparent' />
              {h ? <rect x={x} y={HEIGHT - h} width={BAR} height={h} rx='1' className='fill-colour7' /> : null}
            </g>
          );
        })}
      </svg>
      <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 text-xs opacity-80' aria-hidden='true'>
        <span>{shortDay(series[0].day)}</span>
        <span className='text-center'>most {busiest.count.toLocaleString('en-GB')} a day</span>
        <span>{shortDay(series[series.length - 1].day)}</span>
      </div>
    </div>
  );
}

export default OfferClickBars;
