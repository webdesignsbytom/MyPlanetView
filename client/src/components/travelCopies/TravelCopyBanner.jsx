import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { getMapTravelCopies } from '@/api/travelCopiesApi';
// Components
import LuggageTag from '@/components/map/LuggageTag';

const TravelCopyReviewDialog = lazy(() => import('./TravelCopyReviewDialog'));

/**
 * On a map, for its owner or a co-owner: a luggage tag when someone asks for copies of their
 * travels from it (docs/API.md, "Travel copies"), opening the request to approve or decline.
 * Every request is also in Settings, "This map".
 */
function TravelCopyBanner({ mapId }) {
  const [waiting, setWaiting] = useState([]);
  const [reviewing, setReviewing] = useState(null);

  useEffect(() => {
    let alive = true;
    getMapTravelCopies(mapId)
      .then(({ incoming = [] }) => alive && setWaiting(incoming.filter((r) => r.status === 'PENDING' && r.canDecide)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mapId]);

  const first = waiting[0];
  return (
    <>
      {first ? (
        <LuggageTag as='section' aria-label='A request to copy travels' className='max-w-[min(24rem,calc(100vw-1.5rem))] text-sm'>
          <span className='grid gap-1'>
            <span className='font-semibold'>
              {first.requestedBy.name || 'Someone'} asks for copies of their travels as {first.traveller.name}.
            </span>
            {waiting.length > 1 ? (
              <span className='text-xs'>
                And {waiting.length - 1} more {waiting.length === 2 ? 'request' : 'requests'}, in Settings, “This map”.
              </span>
            ) : null}
            <button
              type='button'
              onClick={() => setReviewing(first.id)}
              className='justify-self-start text-xs font-semibold text-poster-red-deep underline underline-offset-2'
            >
              Review it
            </button>
          </span>
        </LuggageTag>
      ) : null}
      {reviewing
        ? createPortal(
            <Suspense fallback={null}>
              <TravelCopyReviewDialog
                requestId={reviewing}
                onClose={() => setReviewing(null)}
                // Answered: off the tag
                onChanged={(r) => r.status !== 'PENDING' && setWaiting((list) => list.filter((w) => w.id !== r.id))}
              />
            </Suspense>,
            document.body,
          )
        : null}
    </>
  );
}

export default TravelCopyBanner;
