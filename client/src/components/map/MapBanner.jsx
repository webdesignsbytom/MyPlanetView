import React from 'react';
// Utils
import { initialOf, joinNames } from '@/utils/map/travellerNames';

const GROUP_TAGLINES = {
  SOLO: 'See the world!',
  COUPLE: 'Seeing the world together!',
  FAMILY: 'A family seeing the world!',
};

// The ribbon's notched tails, folded behind the parchment plate
const TAIL_CLASS = 'h-11 w-8 translate-y-2 bg-poster-red-deep';
const LEFT_TAIL = '[clip-path:polygon(0_0,100%_0,100%_100%,0_100%,45%_50%)]';
const RIGHT_TAIL = '[clip-path:polygon(0_0,100%_0,55%_50%,100%_100%,0_100%)]';
const INITIAL_CLASS =
  'grid h-10 w-10 -rotate-6 place-items-center rounded-full border-4 border-double border-poster-red bg-poster-paper font-travel text-lg text-poster-red';

// my_planet's user banner (OwnerDisplayContainer): the map's travellers on a parchment
// ribbon with notched red tails, the names in the travel face and their initials as
// rubber stamps, top centre. Hidden only with its switch in the map settings (no close
// stamp on the banner itself).
function MapBanner({ map }) {
  const names = map.travellers.map((t) => t.name).filter(Boolean);
  const people = names.length ? joinNames(names) : map.name;
  const firstTwo = names.slice(0, 2);

  return (
    <section aria-label='Map banner' className='pointer-events-auto relative grid grid-cols-a1a items-center'>
      <span aria-hidden='true' className={`-mr-3 ${TAIL_CLASS} ${LEFT_TAIL}`} />
      <div className='ticket-edge paper-aged relative z-10 grid grid-cols-a1a items-center gap-3 px-4 py-2 text-poster-ink'>
        <span aria-hidden='true' className={INITIAL_CLASS}>
          {initialOf(firstTwo[0] || map.name)}
        </span>
        <div className='grid text-center leading-tight'>
          <p className='font-travel text-2xl uppercase tracking-wide text-poster-red-deep'>{people}</p>
          <p className='text-sm'>{names.length ? map.name : GROUP_TAGLINES[map.groupType]}</p>
        </div>
        <span aria-hidden='true' className={INITIAL_CLASS}>
          {firstTwo[1] ? initialOf(firstTwo[1]) : '✈'}
        </span>
      </div>
      <span aria-hidden='true' className={`-ml-3 ${TAIL_CLASS} ${RIGHT_TAIL}`} />
    </section>
  );
}

export default MapBanner;
