import React from 'react';
// Icons
import { IoClose } from 'react-icons/io5';
// Utils
import { initialOf, joinNames } from '@/utils/map/travellerNames';

const GROUP_TAGLINES = {
  SOLO: 'See the world!',
  COUPLE: 'Seeing the world together!',
  FAMILY: 'A family seeing the world!',
};

// my_planet's user banner (OwnerDisplayContainer): the map's travellers on a red
// poster strip, top centre. Hidden with the "Map banner" setting, or its own button.
function MapBanner({ map, onHide }) {
  const names = map.travellers.map((t) => t.name).filter(Boolean);
  const people = names.length ? joinNames(names) : map.name;
  const firstTwo = names.slice(0, 2);

  return (
    <section
      aria-label='Map banner'
      className='pointer-events-auto relative grid grid-cols-a1a items-center gap-2 rounded-lg border-2 border-poster-ink bg-poster-red p-2 text-poster-ink shadow-lift'
    >
      <span aria-hidden='true' className='grid h-10 w-10 place-items-center rounded-full border-2 border-poster-ink bg-poster-paper font-travel text-lg'>
        {initialOf(firstTwo[0] || map.name)}
      </span>
      <div className='grid rounded bg-poster-cream px-4 py-1 text-center leading-tight'>
        <p className='font-travel text-xl'>{people}</p>
        <p className='text-sm'>{names.length ? map.name : GROUP_TAGLINES[map.groupType]}</p>
      </div>
      <span aria-hidden='true' className='grid h-10 w-10 place-items-center rounded-full border-2 border-poster-ink bg-poster-paper font-travel text-lg'>
        {firstTwo[1] ? initialOf(firstTwo[1]) : '✈'}
      </span>
      {onHide ? (
        <button
          type='button'
          onClick={onHide}
          aria-label='Hide the map banner'
          title='Hide the banner (turn it back on in Settings)'
          className='absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-poster-ink bg-poster-cream text-sm hover:brightness-95'
        >
          <IoClose aria-hidden='true' />
        </button>
      ) : null}
    </section>
  );
}

export default MapBanner;
