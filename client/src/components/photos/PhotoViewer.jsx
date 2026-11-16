import React, { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { deletePhoto, getPhoto } from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PhotoEditForm from './PhotoEditForm';
import PhotoLandmarkList from './PhotoLandmarkList';
import PhotoThemeLine from '@/components/themes/PhotoThemeLine';
import VideoPlayer from './VideoPlayer';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';
import { formatVideoLength } from '@/utils/photos/videoLength';

// One photo, large. Editors can change it, confirm landmark matches, download the best
// copy kept (the original, which keeps its location, or on an Economy map the print copy:
// `bestCopy`) and delete it. Link visitors pass `shareCode`.
// A video (First Class; docs/API.md, "Videos") plays from Cloudflare Stream (VideoPlayer);
// one still converting says so and is checked again every few seconds. It has no
// landmark tools (landmark stamps come from photos) and no download: Stream keeps no
// original file to hand back.
const VIDEO_CHECK_EVERY_MS = 6000;
// `locked`: an editor whose email address isn't verified yet sees the photo (and can
// download the original) but can't change it, and is told why.
function PhotoViewer({ photoId, shareCode, canEdit = false, locked = false, trips, onChanged, onDeleted, onClose }) {
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPhoto(null);
    setError(null);
    getPhoto(photoId, { shareCode })
      .then(({ photo: loaded }) => {
        if (!cancelled) setPhoto(loaded);
      })
      .catch((err) => {
        if (!cancelled) setError(err.friendlyMessage || 'This photo could not be opened.');
      });
    return () => {
      cancelled = true;
    };
  }, [photoId, shareCode]);

  const applyChange = (updated) => {
    setPhoto((prev) => ({ ...prev, ...updated }));
    onChanged?.(updated);
  };

  // A video Cloudflare is still converting (editors only): opening it again asks Stream on
  // the server, so ask now and then while it's open, and when "Check now" is pressed. A
  // change (ready, or failed) also goes to the gallery.
  const [checking, setChecking] = useState(false);
  const processing = photo?.kind === 'VIDEO' && photo.videoState === 'PROCESSING';
  // The latest onChanged, so the timer below isn't restarted by every parent render
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  });
  const checkVideo = useCallback(async () => {
    setChecking(true);
    try {
      const { photo: loaded } = await getPhoto(photoId, { shareCode });
      if (loaded.videoState !== 'PROCESSING') {
        setPhoto(loaded);
        onChangedRef.current?.(loaded);
      }
    } catch {
      // Left as it is; the next check tries again
    } finally {
      setChecking(false);
    }
  }, [photoId, shareCode]);
  useEffect(() => {
    if (!processing) return undefined;
    const timer = window.setInterval(checkVideo, VIDEO_CHECK_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [processing, checkVideo]);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deletePhoto(photoId);
      onDeleted?.(photoId);
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'The photo could not be deleted.');
      setDeleting(false);
    }
  };

  const isVideo = photo?.kind === 'VIDEO';
  const noun = isVideo ? 'Video' : 'Photo';
  const title = photo?.caption || (photo?.takenAt ? `${noun} from ${formatDay(photo.takenAt)}` : noun);

  return (
    <Modal title={title} onClose={onClose} wide>
      {!photo && !error ? (
        <div className='grid place-items-center py-10' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Opening photo…</span>
        </div>
      ) : null}
      <InlineAlert>{error}</InlineAlert>

      {photo ? (
        <div className='grid gap-4 md:grid-cols-wide-narrow'>
          {isVideo ? (
            <VideoPlayer photo={photo} checking={checking} onRefresh={checkVideo} />
          ) : (
            <img
              src={photo.displayUrl}
              alt={photo.caption || ''}
              className='max-h-[70vh] w-full border-8 border-poster-cream bg-poster-cream object-contain shadow-paper'
            />
          )}
          <div className='grid content-start gap-4'>
            <dl className='grid gap-1 text-sm'>
              {photo.takenAt ? (
                <div className='grid grid-cols-reg gap-2'>
                  <dt className='font-medium'>Taken</dt>
                  <dd>{formatDay(photo.takenAt)}</dd>
                </div>
              ) : null}
              {isVideo && photo.durationS ? (
                <div className='grid grid-cols-reg gap-2'>
                  <dt className='font-medium'>Length</dt>
                  <dd>{formatVideoLength(photo.durationS)}</dd>
                </div>
              ) : null}
              {photo.countryCode ? (
                <div className='grid grid-cols-reg gap-2'>
                  <dt className='font-medium'>Country</dt>
                  <dd>{countryName(photo.countryCode)}</dd>
                </div>
              ) : null}
              {photo.hidden ? <p className='text-status-warning'>Hidden from viewers</p> : null}
            </dl>

            {editing ? (
              <PhotoEditForm
                photo={photo}
                trips={trips}
                onCancel={() => setEditing(false)}
                onSaved={(saved) => {
                  applyChange(saved);
                  setEditing(false);
                }}
              />
            ) : isVideo ? null : (
              <PhotoLandmarkList photo={photo} canEdit={canEdit && !locked} onChanged={applyChange} />
            )}
            {/* The monthly themes it's in, and entering this month's (editors; docs/API.md "Photo themes") */}
            {editing || isVideo ? null : <PhotoThemeLine photo={photo} canEdit={canEdit && !locked && !shareCode} onChanged={applyChange} />}

            {canEdit && locked ? <VerifyFirstNote action='change or delete photos' /> : null}
            {/* One to a row on a phone, so nothing runs off the side; in a row from sm up */}
            {canEdit && !editing ? (
              <div className='grid gap-2 sm:grid-row sm:justify-start'>
                {locked ? null : (
                  <Button quiet onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                )}
                {photo.originalUrl ? (
                  <a
                    href={photo.originalUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='btn-paper [--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.375rem] [--btn-size:1.125rem]'
                  >
                    {photo.bestCopy === 'PRINT' ? 'Download print copy' : 'Download original'}
                  </a>
                ) : null}
                {locked ? null : confirmingDelete ? (
                  <span className='grid gap-2 text-sm sm:grid-row sm:items-center'>
                    Delete for good?
                    <Button danger busy={deleting} onClick={handleDelete}>
                      Yes, delete
                    </Button>
                    <Button quiet onClick={() => setConfirmingDelete(false)}>
                      Keep it
                    </Button>
                  </span>
                ) : (
                  <Button danger onClick={() => setConfirmingDelete(true)}>
                    Delete
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default PhotoViewer;
