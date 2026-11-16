import React, { useEffect, useState } from 'react';
// Api
import { clearStampPhoto, getPhotoPage, setStampPhoto } from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { formatDay } from '@/utils/functions/dates';

const PAGE_SIZE = 60;
const MOST_PAGES = 20; // 1,200 photos: more than any plan keeps of one country

const photoLabel = (photo) => photo.caption || (photo.takenAt ? `Photo from ${formatDay(photo.takenAt)}` : 'Photo');

/**
 * Choosing the photo a stamp shows (owner and editors; docs/API.md, "Passport"): any of the
 * landmark's confirmed photos on the map. There's no list of a landmark's photos, so this
 * pages through the country's photos and keeps those confirmed as this landmark.
 * "Use the first photo" goes back to the earliest. `onSaved` reloads the passport.
 */
function StampPhotoPicker({ mapId, countryCode, stamp, onSaved, onClose }) {
  const [list, setList] = useState({ photos: [], loading: true, error: null });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = [];
        let cursor;
        for (let page = 0; page < MOST_PAGES; page++) {
          const { photos, nextCursor } = await getPhotoPage({ mapId, country: countryCode, cursor, limit: PAGE_SIZE });
          if (cancelled) return;
          found.push(...photos.filter((photo) => photo.landmarks?.some((l) => l.id === stamp.landmarkId && l.confirmed)));
          if (!nextCursor) break;
          cursor = nextCursor;
        }
        setList({ photos: found, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setList({ photos: [], loading: false, error: err.friendlyMessage || 'The photos could not be loaded.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapId, countryCode, stamp.landmarkId]);

  const save = async (key, action) => {
    setBusy(key);
    setError(null);
    try {
      await action();
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
      setBusy(null);
    }
  };

  return (
    <Modal title={`Photo for ${stamp.name}`} onClose={onClose}>
      <p className='text-sm'>
        Choose the photo the stamp shows, from the photos of {stamp.name} on this map.
        {stamp.photoChosen ? '' : ' It shows the earliest one now.'}
      </p>
      {list.loading ? (
        <div className='grid place-items-center py-6' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Finding the photos…</span>
        </div>
      ) : null}
      <InlineAlert>{list.error}</InlineAlert>
      {!list.loading && !list.error ? (
        <ul className='grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3'>
          {list.photos.map((photo) => {
            const showing = photo.id === stamp.photo.id;
            return (
              <li key={photo.id} className='grid'>
                <button
                  type='button'
                  aria-pressed={showing}
                  aria-label={`${photoLabel(photo)}${showing ? ' (on the stamp now)' : ''}`}
                  disabled={Boolean(busy)}
                  aria-busy={busy === photo.id ? 'true' : undefined}
                  onClick={() => (showing && stamp.photoChosen ? onClose() : save(photo.id, () => setStampPhoto(mapId, stamp.landmarkId, photo.id)))}
                  className={`grid gap-1 border-4 p-0.5 text-left text-xs shadow-paper transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-colour6 motion-reduce:transition-none ${
                    showing ? 'border-colour6' : 'border-poster-cream'
                  }`}
                >
                  {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' className='aspect-square w-full object-cover' /> : null}
                  <span aria-hidden='true' className='px-1 pb-0.5'>
                    {showing ? 'On the stamp' : photo.takenAt ? formatDay(photo.takenAt) : photoLabel(photo)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {stamp.photoChosen ? (
        <Button quiet busy={busy === 'first'} disabled={Boolean(busy)} onClick={() => save('first', () => clearStampPhoto(mapId, stamp.landmarkId))}>
          Use the first photo
        </Button>
      ) : null}
      <InlineAlert>{error}</InlineAlert>
    </Modal>
  );
}

export default StampPhotoPicker;
