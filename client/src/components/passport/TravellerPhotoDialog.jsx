import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { updateTravellerPassport } from '@/api/travelApi';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PassportPortrait from './PassportPortrait';
// Utils
import { PORTRAIT_ZOOM_MAX, PORTRAIT_ZOOM_MIN, dragFocus } from '@/utils/passport/travellerDetails';
import { photoLabel } from '@/utils/photos/photoLabel';

const TILE = 'relative grid aspect-square w-full overflow-hidden border-4 bg-poster-cream shadow-paper';
const STEP = 0.02;
const clamp = (n) => Math.min(1, Math.max(0, n));

/**
 * Where the photo sits in the passport's box: dragged with a finger or the mouse (the photo
 * follows), the arrow keys, and zoomed with a slider; its focus stays put as it's zoomed
 * (utils/passport/travellerDetails.js). `crop` is `{ focusX, focusY, zoom }`.
 */
function PortraitCropper({ name, url, crop, onChange }) {
  const id = useId();
  const dragRef = useRef(null);
  const start = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, crop, width: e.currentTarget.clientWidth, height: e.currentTarget.clientHeight };
  };
  const move = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    onChange({ ...crop, ...dragFocus(drag.crop, { dx: e.clientX - drag.x, dy: e.clientY - drag.y, width: drag.width, height: drag.height }) });
  };
  const end = () => {
    dragRef.current = null;
  };
  // The arrow keys move the photo as a drag would: the focus the other way
  const onKeyDown = (e) => {
    const step = STEP / crop.zoom;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (!moves[e.key]) return;
    e.preventDefault();
    const [x, y] = moves[e.key];
    onChange({ ...crop, focusX: clamp(crop.focusX + x), focusY: clamp(crop.focusY + y) });
  };

  return (
    <div className='grid justify-items-center gap-3'>
      <div
        role='group'
        tabIndex={0}
        aria-label={`${name}’s passport photo: drag it, or use the arrow keys, to move it in the box`}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
        data-portrait-cropper=''
        className='grid w-48 cursor-grab touch-none select-none active:cursor-grabbing'
      >
        <PassportPortrait name={name} photo={{ source: 'MAP', url, ...crop }} className='aspect-[3/4] w-48' />
      </div>
      <div className='grid w-full max-w-xs grid-cols-[auto_minmax(0,1fr)] items-center gap-3'>
        <label htmlFor={`${id}-zoom`} className='text-sm'>
          Zoom
        </label>
        <input
          id={`${id}-zoom`}
          type='range'
          min={PORTRAIT_ZOOM_MIN}
          max={PORTRAIT_ZOOM_MAX}
          step='0.05'
          value={crop.zoom}
          aria-valuetext={`${crop.zoom.toFixed(1)} times`}
          onChange={(e) => onChange({ ...crop, zoom: Number(e.target.value) })}
          className='w-full cursor-pointer accent-colour6'
        />
      </div>
    </div>
  );
}

/**
 * A traveller's passport photo (25 Nov 2026, the user's wish: "improve passport page for user
 * avatars and info"; docs/API.md "Passport"): one of the map's photos (not a video or a hidden
 * one), then where it sits in the box. Saved for the map's editors; "Take the photo off" goes
 * back to their account's picture or initials. `onSaved` gets the traveller as the passport
 * shows them. Portalled, so it sits over the whole page.
 */
function TravellerPhotoDialog({ mapId, traveller, onSaved, onClose }) {
  const current = traveller.photo?.source === 'MAP' ? traveller.photo : null;
  const [chosen, setChosen] = useState(current ? { id: current.photoId, url: current.url } : null);
  const [crop, setCrop] = useState({ focusX: current?.focusX ?? 0.5, focusY: current?.focusY ?? 0.5, zoom: current?.zoom ?? 1 });
  const [choosing, setChoosing] = useState(!current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const photos = usePhotoPage({ mapId, display: true, limit: 60 });
  const offered = photos.photos.filter((photo) => photo.kind !== 'VIDEO' && !photo.hidden);

  const pick = (photo) => {
    setChosen({ id: photo.id, url: photo.displayUrl || photo.thumbUrl });
    setCrop({ focusX: 0.5, focusY: 0.5, zoom: 1 });
    setChoosing(false);
  };
  const send = async (photo) => {
    setBusy(true);
    setError('');
    try {
      const { traveller: saved } = await updateTravellerPassport(mapId, traveller.id, { photo });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err?.friendlyMessage || 'The photo couldn’t be saved.');
      setBusy(false);
    }
  };

  return createPortal(
    <Modal title={`${traveller.name}’s passport photo`} onClose={onClose}>
      {choosing || !chosen ? (
        <div className='grid gap-3'>
          <p className='text-sm'>Choose a photo of {traveller.name} from the map’s photos. You’ll place it in the box next.</p>
          {offered.length ? (
            <ul className='grid grid-cols-3 gap-2 sm:grid-cols-4' aria-label='The map’s photos'>
              {offered.map((photo) => (
                <li key={photo.id}>
                  <button type='button' onClick={() => pick(photo)} className={`${TILE} border-poster-cream hover:border-poster-red`} data-portrait-choice={photo.id}>
                    {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' loading='lazy' draggable={false} className='h-full w-full object-cover' /> : null}
                    <span className='sr-only'>{photoLabel(photo)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : photos.loading ? null : (
            <p className='text-sm opacity-80'>{photos.error || 'No photos on the map yet. Add one of them first.'}</p>
          )}
          {photos.loading ? (
            <div className='grid place-items-center py-2' role='status'>
              <LoadingSpinner />
              <span className='sr-only'>Loading photos…</span>
            </div>
          ) : null}
          {photos.nextCursor && !photos.loading ? (
            <button type='button' onClick={photos.loadMore} className='justify-self-start text-sm font-medium underline underline-offset-2'>
              Show more photos
            </button>
          ) : null}
          <div className='grid gap-2 sm:grid-cols-2'>
            {chosen ? (
              <Button quiet onClick={() => setChoosing(false)}>
                Back to the photo
              </Button>
            ) : null}
            <Button quiet onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className='grid gap-4'>
          <PortraitCropper name={traveller.name} url={chosen.url} crop={crop} onChange={setCrop} />
          <button type='button' onClick={() => setChoosing(true)} className='justify-self-center text-sm font-medium underline underline-offset-2'>
            Choose another photo
          </button>
          <InlineAlert>{error}</InlineAlert>
          <div className='grid gap-2 sm:grid-cols-2'>
            {current ? (
              <Button quiet danger busy={busy} onClick={() => send(null)}>
                Take the photo off
              </Button>
            ) : (
              <Button quiet onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button busy={busy} onClick={() => send({ photoId: chosen.id, ...crop })}>
              Save the photo
            </Button>
          </div>
        </div>
      )}
    </Modal>,
    document.body,
  );
}

export default TravellerPhotoDialog;
