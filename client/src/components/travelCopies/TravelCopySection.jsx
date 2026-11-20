import React, { Suspense, lazy, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { withdrawTravelCopy } from '@/api/travelCopiesApi';
// Hooks
import useMapTravelCopies from '@/hooks/useMapTravelCopies';
// Components
import MapActionButton from '@/components/map/MapActionButton';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { copyContents, copyStatusText } from '@/utils/travelCopies/travelCopyWords';

// The dialogs download when they're first opened
const TravelCopyDialog = lazy(() => import('./TravelCopyDialog'));
const TravelCopyReviewDialog = lazy(() => import('./TravelCopyReviewDialog'));

const ROW = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm';
const LINK = 'text-xs font-semibold text-poster-red-deep underline underline-offset-2';

function RequestLine({ title, status }) {
  return (
    <span className='grid'>
      <span className='font-medium'>{title}</span>
      <span className='text-xs opacity-80'>{status}</span>
    </span>
  );
}

/**
 * Settings, "This map", for its owner or a co-owner (docs/API.md, "Travel copies"): "Bring
 * your travels" from another map they're on (TravelCopyDialog), their requests and how each
 * stands (a waiting one can be withdrawn), and the requests to copy from this map, each
 * opening TravelCopyReviewDialog. Approved copies are carried on while it's open
 * (useMapTravelCopies).
 */
function TravelCopySection({ map }) {
  const copies = useMapTravelCopies(map.id);
  const [choosing, setChoosing] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [error, setError] = useState(null);

  const withdraw = async (request) => {
    setError(null);
    try {
      await withdrawTravelCopy(request.id);
      await copies.reload();
    } catch (err) {
      setError(err.friendlyMessage || 'The request couldn’t be withdrawn.');
    }
  };

  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='travel-copy-heading'>
      <h3 id='travel-copy-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Bring your travels
      </h3>
      <p className='text-sm opacity-80'>
        On someone else’s map too, such as your family’s? Pick the trips, moments and photos you’re in, and ask its owner for
        copies of your own on “{map.name}”.
      </p>
      <span className='grid'>
        <MapActionButton quiet onClick={() => setChoosing(true)}>
          Choose travels to bring
        </MapActionButton>
      </span>

      {copies.outgoing.length ? (
        <ul className='grid gap-2' aria-label='Your requests'>
          {copies.outgoing.map((r) => (
            <li key={r.id} className={ROW}>
              <RequestLine title={`From “${r.fromMap.name}”: ${copyContents(r)}`} status={copyStatusText(r)} />
              {r.canCancel ? (
                <button type='button' onClick={() => withdraw(r)} className={LINK}>
                  Withdraw
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {copies.incoming.length ? (
        <div className='grid gap-2'>
          <h4 className='font-travel text-base uppercase tracking-wide text-poster-brown'>Requests to copy from this map</h4>
          <ul className='grid gap-2' aria-label='Requests to copy from this map'>
            {copies.incoming.map((r) => (
              <li key={r.id} className={ROW}>
                <RequestLine
                  title={`${r.requestedBy.name || 'Someone'}, as ${r.traveller.name}: ${copyContents(r)}`}
                  status={copyStatusText(r)}
                />
                {r.canDecide ? (
                  <button type='button' onClick={() => setReviewing(r.id)} className={LINK}>
                    Review
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <InlineAlert>{error || copies.error}</InlineAlert>

      {choosing
        ? createPortal(
            <Suspense fallback={null}>
              <TravelCopyDialog toMap={map} onClose={() => setChoosing(false)} onRequested={() => copies.reload()} />
            </Suspense>,
            document.body,
          )
        : null}
      {reviewing
        ? createPortal(
            <Suspense fallback={null}>
              <TravelCopyReviewDialog requestId={reviewing} onClose={() => setReviewing(null)} onChanged={copies.put} />
            </Suspense>,
            document.body,
          )
        : null}
    </section>
  );
}

export default TravelCopySection;
