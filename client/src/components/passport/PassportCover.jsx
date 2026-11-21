import React from 'react';
// Components
import PassportChipMark from './PassportChipMark';
import PassportCrest from './PassportCrest';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Utils
import { passportCover } from '@/utils/passport/passportBook';

/**
 * The passport's cover, closed, as a real one: pebbled leather (by the owner's plan, `map.plan`:
 * Economy burgundy, Business navy, First Class black) foil-stamped in a book serif with the
 * site's name, the crest, "Passport", the map's name as a personalised line, the class it
 * travels in and the electronic passport's mark. A crease runs beside the spine. Business adds
 * a frame pressed blind into the leather, First Class a double one in foil. The leather and foil
 * colours come from the book's passport-* class. On wide screens it's one page wide, the shape
 * of a passport, and opens on its own spine.
 */
// `map.traveller`: one traveller's own passport, which carries their name instead of the map's
function PassportCover({ map, headingId }) {
  const cover = passportCover(map.plan);
  return (
    <section
      aria-labelledby={headingId}
      data-cover={map.plan?.id || 'FREE'}
      className='passport-board relative grid aspect-[88/125] w-full grid-rows-[auto_minmax(0,1fr)_auto] justify-items-center pb-7 pl-11 pr-8 pt-10 text-center font-passport md:aspect-auto md:h-full md:w-1/2'
    >
      {/* The spine's rounded edge, and the hinge crease pressed in beside it */}
      <span aria-hidden='true' className='pointer-events-none absolute inset-y-0 left-0 w-5 bg-[linear-gradient(to_right,var(--cover-shade),transparent)]' />
      <span aria-hidden='true' className='pointer-events-none absolute inset-y-0 left-5 w-[3px] bg-[linear-gradient(to_right,var(--cover-shade),var(--cover-sheen))]' />
      {cover.frame === 'blind' ? (
        <span
          aria-hidden='true'
          className='pointer-events-none absolute inset-y-4 left-9 right-4 border border-[var(--cover-shade)] shadow-[inset_1px_1px_0_var(--cover-sheen),1px_1px_0_var(--cover-sheen)]'
        />
      ) : null}
      {cover.frame === 'foil' ? (
        <span
          aria-hidden='true'
          className='foil-raise pointer-events-none absolute inset-y-4 left-9 right-4 border-2 border-[var(--foil)] outline outline-1 outline-offset-[3px] outline-[var(--foil)]'
        />
      ) : null}

      <p className='foil-text pl-[0.45em] text-sm font-bold uppercase tracking-3xl'>{CompanyName}</p>

      <div className='grid content-center justify-items-center gap-5'>
        <PassportCrest className='w-[min(66%,14rem)]' />
        <h2 id={headingId} className='foil-text pl-[0.3em] text-3xl font-bold uppercase leading-none tracking-2xl sm:text-4xl'>
          Passport
        </h2>
      </div>

      <div className='grid justify-items-center gap-2.5'>
        <p className='foil-text max-w-full text-balance break-words pl-[0.2em] text-sm font-bold uppercase tracking-xl'>{map.traveller?.name ?? map.name}</p>
        <p className='foil-text pl-[0.45em] text-2xs font-bold uppercase tracking-3xl'>{cover.label}</p>
        <PassportChipMark className='foil-raise w-10 text-[var(--foil)]' />
      </div>
    </section>
  );
}

export default PassportCover;
