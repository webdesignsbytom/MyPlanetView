import React, { useEffect, useRef, useState } from 'react';
// Api
import { approveTravelCopy, continueTravelCopy, declineTravelCopy, getTravelCopy } from '@/api/travelCopiesApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { formatDay } from '@/utils/functions/dates';
import { copyContents, copyPlaceName, copyStatusText } from '@/utils/travelCopies/travelCopyWords';

const HEADING = 'font-travel text-base uppercase tracking-wide text-poster-brown';
const IDLE_WAIT_MS = 2000;

/**
 * A request to copy someone's travels from this map (docs/API.md, "Travel copies"), for its
 * owner or a co-owner: who asks, as which traveller, for which map, and what (the trips,
 * moments and photos per country). Approve starts the copy and carries it on while the dialog
 * is open (the person who asked, or the daily cron, finishes it otherwise); Decline says no.
 * `onChanged(request)` after either.
 */
function TravelCopyReviewDialog({ requestId, onClose, onChanged }) {
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    getTravelCopy(requestId)
      .then(({ request: loaded }) => alive.current && setRequest(loaded))
      .catch((err) => alive.current && setError(err.friendlyMessage || 'The request couldn’t be loaded.'));
    return () => {
      alive.current = false;
    };
  }, [requestId]);

  const update = (changed) => {
    setRequest((current) => ({ ...current, ...changed }));
    onChanged?.(changed);
  };

  const carryOn = async (approved) => {
    let current = approved;
    while (alive.current && current.status === 'APPROVED') {
      const before = current.progress.done;
      current = (await continueTravelCopy(current.id)).request;
      if (!alive.current) return;
      update(current);
      if (current.status === 'APPROVED' && current.progress.done === before) {
        await new Promise((resolve) => setTimeout(resolve, IDLE_WAIT_MS));
      }
    }
  };

  const decide = async (kind) => {
    setBusy(kind);
    setError(null);
    try {
      const { request: decided } = await (kind === 'approve' ? approveTravelCopy(requestId) : declineTravelCopy(requestId));
      if (!alive.current) return;
      update(decided);
      setBusy(null);
      if (decided.status === 'APPROVED') carryOn(decided).catch(() => {});
    } catch (err) {
      if (!alive.current) return;
      setError(err.friendlyMessage || 'That didn’t work. Please try again.');
      setBusy(null);
    }
  };

  const who = request?.requestedBy.name || 'Someone';

  return (
    <Modal title='Copy their travels?' onClose={onClose}>
      {!request ? (
        error ? (
          <InlineAlert>{error}</InlineAlert>
        ) : (
          <div className='grid place-items-center py-4' role='status'>
            <LoadingSpinner />
            <span className='sr-only'>Loading the request…</span>
          </div>
        )
      ) : (
        <div className='grid gap-4'>
          <p>
            <strong>{who}</strong> asks for copies of their travels as <strong>{request.traveller.name}</strong> on “
            {request.fromMap.name}”, for their own map “{request.toMap.name}”: {copyContents(request)}.
          </p>
          <p className='text-sm'>
            Nothing on your map changes: they get copies of their own to keep, with each photo’s place and date. Hidden photos and
            videos never go.
          </p>

          {request.tripList?.length ? (
            <section className='grid gap-1' aria-label='Trips'>
              <h3 className={HEADING}>Trips</h3>
              <ul className='grid gap-0.5 text-sm'>
                {request.tripList.map((t) => (
                  <li key={t.id}>
                    {t.title}
                    {t.startDate ? `, ${formatDay(t.startDate)}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {request.momentList?.length ? (
            <section className='grid gap-1' aria-label='Moments'>
              <h3 className={HEADING}>Moments</h3>
              <ul className='grid gap-0.5 text-sm'>
                {request.momentList.map((m) => (
                  <li key={m.id}>{m.title}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {request.countries?.length ? (
            <section className='grid gap-1' aria-label='Photos'>
              <h3 className={HEADING}>Photos</h3>
              <ul className='grid gap-0.5 text-sm'>
                {request.countries.map((c) => (
                  <li key={c.countryCode ?? 'none'}>
                    {copyPlaceName(c.countryCode)}: {c.photos}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {request.status !== 'PENDING' ? (
            <p className='font-medium' role='status'>
              {copyStatusText(request)}
            </p>
          ) : null}
          <InlineAlert>{error}</InlineAlert>
          {request.status === 'PENDING' && request.canDecide ? (
            <div className='grid gap-2 sm:grid-cols-2'>
              <Button busy={busy === 'approve'} disabled={Boolean(busy)} onClick={() => decide('approve')}>
                Approve and copy
              </Button>
              <Button quiet busy={busy === 'decline'} disabled={Boolean(busy)} onClick={() => decide('decline')}>
                Decline
              </Button>
            </div>
          ) : (
            <Button quiet onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}

export default TravelCopyReviewDialog;
