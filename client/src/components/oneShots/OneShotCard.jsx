import React from 'react';
import { FaCheck } from 'react-icons/fa';
// Components
import OneShotPicture from './OneShotPicture';
// Utils
import { ONE_SHOT_TICK_WORDS, seenWords } from '@/utils/oneShots/oneShotWords';

/**
 * One item of Life's One Shots in its list (OneShotsPanel): its photo as a print (the map's
 * own photo of it once its tick has one, else the Commons photo), its name,
 * and whether the map has it ("Seen: March 2024, in Kenya", "Done", "Not yet"). Pressing it opens
 * the item (OneShotDialog). A ticked one wears a red check stamp; the words say so too.
 */
function OneShotCard({ item, photo, tick, onOpen }) {
  const ticked = Boolean(tick);
  const when = ticked ? seenWords(tick) : '';
  return (
    <li className='group grid' data-one-shot={item.key} data-ticked={ticked ? '' : undefined}>
      <button
        type='button'
        onClick={() => onOpen(item.key)}
        className='grid content-start gap-1.5 rounded-sm p-1 text-left transition hover:bg-colour9/10'
        aria-label={`${item.name}: ${ticked ? `ticked${when ? `, ${when}` : ''}` : 'not yet'}`}
      >
        <span className='relative block'>
          <OneShotPicture
            photo={photo}
            ownUrl={tick?.photo?.thumbUrl || null}
            className={`aspect-[4/3] w-full border-4 border-poster-cream shadow-paper transition-transform group-odd:-rotate-1 group-even:rotate-1 ${ticked ? '' : 'opacity-75 grayscale-[40%]'}`}
          />
          {ticked ? (
            <span
              aria-hidden='true'
              className='absolute -right-1.5 -top-1.5 grid h-7 w-7 -rotate-12 place-items-center rounded-full border-2 border-poster-cream bg-poster-red text-sm text-poster-red-ink shadow-paper'
            >
              <FaCheck />
            </span>
          ) : null}
        </span>
        <span className='text-sm font-medium leading-snug'>{item.name}</span>
        <span className={`text-xs leading-snug ${ticked ? 'font-semibold text-poster-red-deep' : 'opacity-75'}`}>
          {ticked ? (when ? `${ONE_SHOT_TICK_WORDS[item.list]}: ${when}` : ONE_SHOT_TICK_WORDS[item.list]) : 'Not yet'}
        </span>
      </button>
    </li>
  );
}

export default OneShotCard;
