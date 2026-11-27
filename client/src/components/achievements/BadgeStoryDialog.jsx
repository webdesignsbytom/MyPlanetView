import React, { useEffect, useId, useState } from 'react';
// Icons
import { FaStar } from 'react-icons/fa';
// Api
import { getBadgeStory } from '@/api/travelApi';
// Hooks
import useModalA11y from '@/hooks/useModalA11y';
import useOneShotPhotos from '@/hooks/useOneShotPhotos';
// Components
import Button from '@/components/common/Button';
import CloseStamp from '@/components/common/CloseStamp';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import EntryStamp from '@/components/passport/EntryStamp';
import LandmarkStamp from '@/components/passport/LandmarkStamp';
import OneShotPicture from '@/components/oneShots/OneShotPicture';
import CelebrationStars from '@/components/map/celebration/CelebrationStars';
import { StickerFace } from './BadgeSticker';
import { MedalFace } from './CollectionMedal';
// Utils
import { badgeWords } from '@/utils/achievements/badges';
import { collectionWords, parseCollectionKey } from '@/utils/achievements/collections';
import {
  photoHeadline,
  storyItemName,
  storyItemWhen,
  storyItemWhere,
  storyLabel,
  storyListHeading,
  storyShortfall,
} from '@/utils/achievements/badgeStoryWords';
import { oneShotPhotoInfo } from '@/utils/oneShots/oneShotPhotoInfo';
import { formatDay } from '@/utils/functions/dates';

// A long list shows its first few, then all of them on asking
const LIST_FIRST = 10;
const LIST_WHOLE_UP_TO = 12;

/** The one that earned it, as the passport shows it: its entry stamp, its landmark stamp, its photo. */
function EarnedPicture({ story, item, oneShotPhotos }) {
  if (story.kind === 'places') {
    return <EntryStamp countryCode={item.code} status={item.trip ? 'VISITED' : null} enteredOn={item.on} />;
  }
  if (story.kind === 'stamps') {
    return (
      <LandmarkStamp
        stamp={{
          landmarkId: item.landmarkId,
          name: item.name,
          isUnesco: item.isUnesco,
          stampedOn: item.on,
          ticked: item.ticked,
          photo: item.thumbUrl ? { thumbUrl: item.thumbUrl } : null,
        }}
      />
    );
  }
  if (story.kind === 'oneShots') {
    return (
      <span className='grid w-full -rotate-2 bg-poster-cream p-1.5 shadow-paper'>
        <OneShotPicture photo={oneShotPhotoInfo(oneShotPhotos, item.itemKey)} className='aspect-[4/3] w-full' />
      </span>
    );
  }
  return null;
}

/**
 * A badge's own card (27 Nov 2026, the user's wish: "click on a achieved badge and see a cool
 * looking container with the badge and what they did to earn it"): the sticker (or a country
 * collection's medal) popping out of a sunburst of stars, as the celebration's picture does, over
 * a ticket with its name, when it was earned and what it means, then "How you earned it": the one
 * that earned it, with its passport stamp, its photo or its picture, and the rest in order. The
 * server tells the story (GET …/badges/:key, docs/API.md "Badges and goals"), as the caller sees
 * the map. `where`: `{ mapId }` or `{ shareCode }`; `traveller`: `{ id, name }` for one person's
 * travel badge (their trips). Portalled by the panel, over everything; closes with its stamp,
 * "Carry on", Escape or a press outside it.
 */
function BadgeStoryDialog({ badge, where, traveller = null, onClose }) {
  const titleId = useId();
  const textId = useId();
  const howId = useId();
  const dialogRef = useModalA11y(onClose);
  const [state, setState] = useState({ story: null, error: null, loading: true });
  const [wholeList, setWholeList] = useState(false);
  const collection = parseCollectionKey(badge.key);
  const words = collection ? collectionWords(badge.key) : badgeWords(badge.key);
  const travellerId = traveller?.id ?? null;
  const { mapId = null, shareCode = null } = where || {};

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { story } = await getBadgeStory({ mapId, shareCode }, badge.key, { travellerId });
        if (live) setState({ story, error: null, loading: false });
      } catch (err) {
        if (live) setState({ story: null, error: err.friendlyMessage || 'What earned this badge could not be loaded.', loading: false });
      }
    })();
    return () => {
      live = false;
    };
  }, [mapId, shareCode, badge.key, travellerId]);

  const { story } = state;
  const oneShotPhotos = useOneShotPhotos({ enabled: story?.kind === 'oneShots' });
  const earned = story && story.earnedWith !== null ? story.items[story.earnedWith] : null;
  const label = story ? storyLabel(story, { name: traveller?.name ?? null }) : null;
  const listHeading = story ? storyListHeading(story) : null;
  const shortfall = story ? storyShortfall(story) : null;
  const long = story && story.items.length > LIST_WHOLE_UP_TO && !wholeList;
  const listed = story ? (long ? story.items.slice(0, LIST_FIRST) : story.items) : [];

  return (
    <div
      className='fixed inset-0 z-60 grid grid-rows-[minmax(0,1fr)] place-items-center overflow-hidden bg-scrim px-4 py-6'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={textId}
        data-badge-story={badge.key}
        className='grid max-h-full w-full max-w-md grid-rows-[auto_minmax(0,1fr)] justify-items-center'
      >
        {/* The badge on the dimmed page, the stars bursting out round it */}
        <div aria-hidden='true' className='relative grid h-40 w-full place-items-center sideways:h-28'>
          <CelebrationStars seed={badge.key} />
          {collection ? (
            <MedalFace tier={collection.tier} earned large className='motion-safe:animate-model-pop' />
          ) : (
            <StickerFace badge={badge} earned large className='motion-safe:animate-model-pop' />
          )}
        </div>

        <div className='ticket-edge paper-fields relative grid max-h-full w-full grid-rows-[minmax(0,1fr)] overflow-hidden bg-paper-cream text-colour4 shadow-paper'>
          <div className='grid min-h-0 content-start gap-4 overflow-y-auto overscroll-contain px-5 pb-5 pt-4' data-badge-story-body=''>
            <div className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3'>
              <div className='grid content-start justify-items-start gap-2'>
                <p className='font-travel text-lg uppercase tracking-wide text-poster-red-deep'>
                  {traveller ? `${traveller.name}’s badge` : 'Badge earned'}
                </p>
                <h2 id={titleId} className='font-travel text-2xl leading-tight text-colour6 [overflow-wrap:anywhere]'>
                  {words?.name}
                </h2>
                {/* The day, as a rubber stamp's words */}
                <p className='-rotate-2 rounded border-2 border-poster-red-deep px-2 py-0.5 font-travel text-sm uppercase tracking-wide text-poster-red-deep' data-badge-earned-on=''>
                  {badge.earnedAt ? `Earned ${formatDay(badge.earnedAt)}` : 'Earned'}
                </p>
              </div>
              <CloseStamp label='Close' onClick={onClose} small />
            </div>
            <p id={textId} className='text-sm'>
              {words?.description}
            </p>

            <section className='grid gap-3' aria-labelledby={howId} aria-busy={state.loading}>
              <h3 id={howId} className='border-b-2 border-dashed border-poster-brown/50 pb-1 font-travel text-sm uppercase tracking-xl text-poster-brown'>
                How you earned it
              </h3>
              {state.loading ? (
                <div className='grid place-items-center py-4' role='status'>
                  <LoadingSpinner md />
                  <span className='sr-only'>Finding what earned it…</span>
                </div>
              ) : null}
              <InlineAlert>{state.error}</InlineAlert>

              {/* The one that earned it */}
              {earned ? (
                <div className='grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 rounded-lg border-2 border-poster-brown/40 bg-poster-paper/60 p-3' data-badge-earned-with=''>
                  <div className='grid content-start gap-1'>
                    <p className='font-travel text-xs uppercase tracking-wide text-poster-red-deep'>{label}</p>
                    <p className='text-lg font-semibold leading-tight [overflow-wrap:anywhere]'>{storyItemName(story, earned)}</p>
                    {storyItemWhen(story, earned) ? <p className='text-sm'>{storyItemWhen(story, earned)}</p> : null}
                    {storyItemWhere(story, earned) ? <p className='text-sm'>{storyItemWhere(story, earned)}</p> : null}
                  </div>
                  {/* Room round it: a tilted stamp's corners rise past its box */}
                  <div aria-hidden='true' className='grid p-1.5'>
                    <EarnedPicture story={story} item={earned} oneShotPhotos={oneShotPhotos} />
                  </div>
                </div>
              ) : null}

              {/* A photo badge: the photo that reached the number */}
              {story?.kind === 'photos' && story.photo ? (
                <div className='grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 rounded-lg border-2 border-poster-brown/40 bg-poster-paper/60 p-3' data-badge-earned-with=''>
                  <p className='text-sm font-medium'>{photoHeadline(story)}</p>
                  {story.photo.thumbUrl ? (
                    <span aria-hidden='true' className='grid rotate-2 bg-poster-cream p-1.5 shadow-paper'>
                      <img src={story.photo.thumbUrl} alt='' className='block aspect-square w-full object-cover' referrerPolicy='no-referrer' />
                    </span>
                  ) : null}
                </div>
              ) : null}

              {shortfall ? <p className='text-sm'>{shortfall}</p> : null}

              {/* All of them, in order */}
              {listHeading ? (
                <div className='grid gap-2'>
                  <p className='text-sm font-semibold'>{listHeading}</p>
                  <ol className='grid gap-0.5' data-badge-story-list=''>
                    {listed.map((item, index) => {
                      const isIt = index === story.earnedWith;
                      const when = storyItemWhen(story, item);
                      const where = storyItemWhere(story, item);
                      return (
                        // One line each where it fits: the number, the name (and where), the day
                        <li
                          key={item.landmarkId || item.itemKey || item.code || `${item.title}-${item.month}`}
                          className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-x-2 rounded-md border-2 px-2 py-0.5 ${
                            isIt ? 'border-poster-red-deep bg-poster-paper font-semibold' : 'border-transparent odd:bg-poster-paper/40'
                          }`}
                          data-earned-it={isIt ? '' : undefined}
                        >
                          <span aria-hidden='true' className='font-travel text-sm text-poster-brown'>
                            {index + 1}
                          </span>
                          <span className='text-sm leading-snug [overflow-wrap:anywhere]'>
                            {storyItemName(story, item)}
                            {where ? <span className='text-2xs font-normal'> · {where}</span> : null}
                          </span>
                          <span className='grid max-w-[11rem] grid-flow-col items-baseline gap-1 text-right text-2xs leading-snug'>
                            {isIt ? <FaStar aria-hidden='true' className='self-center text-poster-red-deep' /> : null}
                            <span>{when}</span>
                            {isIt ? <span className='sr-only'>: the one that earned it</span> : null}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  {long ? (
                    <button type='button' onClick={() => setWholeList(true)} className='justify-self-start text-sm underline underline-offset-4 hover:no-underline'>
                      Show all {story.items.length}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </section>

            <Button onClick={onClose}>Carry on</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BadgeStoryDialog;
