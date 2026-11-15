import React, { useEffect, useState } from 'react';
// Api
import { deletePhoto, getPhoto } from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PhotoEditForm from './PhotoEditForm';
import PhotoLandmarkList from './PhotoLandmarkList';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
// Utils
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';

// One photo, large. Editors can change it, confirm landmark matches, download the
// original (which keeps its location) and delete it. Link visitors pass `shareCode`.
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

  const title = photo?.caption || (photo?.takenAt ? `Photo from ${formatDay(photo.takenAt)}` : 'Photo');

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
          <img
            src={photo.displayUrl}
            alt={photo.caption || ''}
            className='max-h-[70vh] w-full border-8 border-poster-cream bg-poster-cream object-contain shadow-paper'
          />
          <div className='grid content-start gap-4'>
            <dl className='grid gap-1 text-sm'>
              {photo.takenAt ? (
                <div className='grid grid-cols-reg gap-2'>
                  <dt className='font-medium'>Taken</dt>
                  <dd>{formatDay(photo.takenAt)}</dd>
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
            ) : (
              <PhotoLandmarkList photo={photo} canEdit={canEdit && !locked} onChanged={applyChange} />
            )}

            {canEdit && locked ? <VerifyFirstNote action='change or delete photos' /> : null}
            {canEdit && !editing ? (
              <div className='grid grid-row-wrap gap-2'>
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
                    Download original
                  </a>
                ) : null}
                {locked ? null : confirmingDelete ? (
                  <span className='grid grid-row items-center gap-2 text-sm'>
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
