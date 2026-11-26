import React from 'react';
// Components
import SupporterBadge from '@/components/plans/SupporterBadge';

// The ribbon's parts behind the band, as a vintage banner draws them. The tails hang a
// little lower than the band (top-3, -bottom-3) and reach under it; the folds are the
// ribbon's back showing where it turns under the band's lower corners. Shades of the
// banner's colour (--banner: the poster's deep red, or the map style's own), darker the
// further back.
const TAIL = 'absolute -bottom-3 top-3 w-15 bg-[var(--banner-tail)]';
const LEFT_TAIL = `${TAIL} -left-12 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,30%_50%)]`;
const RIGHT_TAIL = `${TAIL} -right-12 [clip-path:polygon(0_0,100%_0,70%_50%,100%_100%,0_100%)]`;
const FOLD = 'absolute top-full h-3 w-3 bg-[var(--banner-fold)]';

/**
 * my_planet's user banner (OwnerDisplayContainer), top centre on wide screens, where it
 * takes the title tag's place (MapExperience): a ribbon banner, a deep-red band stitched
 * along its edges, with swallowtail tails folded behind it and a shadow that follows its
 * shape. The map's name alone, in cream travel lettering between two stars (the user's
 * wish, 16 Nov 2026: the travellers' names over the map's name said the same thing twice,
 * and a second line wasn't needed at all). Hidden with its switch in the map settings, and
 * the title tag shows instead. A paying member's supporter badge (`supporter`, 24 Nov 2026,
 * the user's wish) hangs under the band's middle, for everyone who opens the map, share
 * links too.
 */
function MapBanner({ map, supporter = null }) {

  return (
    <section aria-label='Map banner' className='pointer-events-auto grid gap-4 px-12 pb-3 [filter:drop-shadow(0_4px_5px_var(--cover-shade))]'>
      <div className='relative grid'>
        <span aria-hidden='true' className={LEFT_TAIL} />
        <span aria-hidden='true' className={RIGHT_TAIL} />
        <span aria-hidden='true' className={`${FOLD} left-0 [clip-path:polygon(0_0,100%_0,100%_100%)]`} />
        <span aria-hidden='true' className={`${FOLD} right-0 [clip-path:polygon(0_0,100%_0,0_100%)]`} />
        <div className='relative grid bg-[var(--banner)] p-1 text-[var(--banner-ink)]'>
          <div className='grid grid-cols-a1a items-center gap-3 border-y border-dashed border-[color-mix(in_oklab,var(--banner-ink)_50%,transparent)] px-5 py-1'>
            <span aria-hidden='true' className='text-xs'>
              ★
            </span>
            <p className='text-center font-travel text-2xl uppercase leading-tight tracking-wide'>{map.name}</p>
            <span aria-hidden='true' className='text-xs'>
              ★
            </span>
          </div>
        </div>
      </div>
      {/* The section's gap keeps it clear of the tails, which hang 0.75rem below the band; the
          map either side of it still takes presses */}
      {supporter ? (
        <div className='pointer-events-none grid justify-items-center'>
          <SupporterBadge supporter={supporter} />
        </div>
      ) : null}
    </section>
  );
}

export default MapBanner;
