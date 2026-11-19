import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// Icons
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
// Api
import { deletePhoto, getPhoto } from '@/api/travelApi';
// Hooks
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PhotoAlbumViewer from './PhotoAlbumViewer';
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
// `locked`: an editor whose email address isn't verified yet sees the photo (and can
// download the original) but can't change it, and is told why.
//
// It opens at once (17 Nov 2026, the user's wish: a spinner after tapping a photo already
// on screen): `photo` is the photo as its gallery had it (with its screen-sized copy, the
// galleries ask for `display`), shown straight away over its thumbnail, while the photo's
// own reply (its themes, the download link, the landmark suggestions) loads behind it.
// `list` is the gallery it came from, `{ filters }` (a usePhotoPage list, read from the
// panel cache as it stands, paged on near the end) or `{ photos }`: Previous and Next under
// the photo step through it, as do the arrow keys and a swipe, and a tap on the photo shows
// it full screen (PhotoAlbumViewer), stepping through the same list.
const VIDEO_CHECK_EVERY_MS = 6000;
const NO_PHOTOS = [];
const SWIPE_PX = 50;
// Fetch the gallery's next page this close to the end of what's loaded
const LOAD_AHEAD = 3;

function PhotoViewer({ photoId, photo: openedWith = null, list = null, shareCode, canEdit = false, locked = false, trips, onChanged, onDeleted, onClose }) {
  // The photo on show: the one opened, then wherever Previous and Next have gone
  const [openedId, setOpenedId] = useState(photoId);
  const [currentId, setCurrentId] = useState(photoId);
  if (openedId !== photoId) {
    setOpenedId(photoId);
    setCurrentId(photoId);
  }
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);

  // The gallery: the list the panel already has (no fresh fetch), or a fixed one
  const paged = usePhotoPage({ ...(list?.filters || {}), enabled: Boolean(list?.filters), refresh: false });
  const listed = list?.filters ? paged.photos : list?.photos || NO_PHOTOS;
  // Until the list has it (a gallery still loading), the photo it was opened with
  const items = useMemo(() => {
    if (listed.some((p) => p.id === currentId)) return listed;
    return openedWith?.id === currentId ? [openedWith] : listed;
  }, [listed, currentId, openedWith]);
  const index = items.findIndex((p) => p.id === currentId);
  const hasMore = Boolean(list?.filters && paged.nextCursor);

  // Each photo's own reply, by id, kept for going back (and edits since)
  const [details, setDetails] = useState({});
  const [failed, setFailed] = useState({});
  const askedRef = useRef(new Set());
  useEffect(() => {
    if (askedRef.current.has(currentId)) return;
    askedRef.current.add(currentId);
    getPhoto(currentId, { shareCode }).then(
      ({ photo: loaded }) =>
        // An edit saved meanwhile is newer: it stays
        setDetails((prev) => (prev[currentId] ? prev : { ...prev, [currentId]: loaded })),
      (err) => {
        askedRef.current.delete(currentId);
        setFailed((prev) => ({ ...prev, [currentId]: err.friendlyMessage || 'This photo could not be opened.' }));
      },
    );
  }, [currentId, shareCode]);

  const item = index >= 0 ? items[index] : null;
  const own = details[currentId];
  const photo = item || own ? { ...item, ...own } : null;
  const loadError = failed[currentId] || null;

  const applyChange = (updated) => {
    setDetails((prev) => ({ ...prev, [currentId]: { ...prev[currentId], ...updated } }));
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
      const { photo: loaded } = await getPhoto(currentId, { shareCode });
      if (loaded.videoState !== 'PROCESSING') {
        setDetails((prev) => ({ ...prev, [currentId]: loaded }));
        onChangedRef.current?.(loaded);
      }
    } catch {
      // Left as it is; the next check tries again
    } finally {
      setChecking(false);
    }
  }, [currentId, shareCode]);
  useEffect(() => {
    if (!processing) return undefined;
    const timer = window.setInterval(checkVideo, VIDEO_CHECK_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [processing, checkVideo]);

  // Previous and Next: the photo changes, anything half done on the last one is let go
  const showAt = useCallback(
    (at) => {
      const next = items[at];
      if (!next) return;
      setCurrentId(next.id);
      setEditing(false);
      setConfirmingDelete(false);
      setActionError(null);
    },
    [items],
  );
  const step = useCallback((by) => showAt(index + by), [showAt, index]);

  // Near the end of what's loaded: the gallery's next page
  const { loadMore } = paged;
  useEffect(() => {
    if (hasMore && index >= items.length - LOAD_AHEAD) loadMore();
  }, [hasMore, index, items.length, loadMore]);

  // The pictures either side, so a step shows at once
  useEffect(() => {
    for (const near of [items[index + 1], items[index - 1]]) {
      const src = near && near.kind !== 'VIDEO' ? near.displayUrl || near.thumbUrl : null;
      if (src) new Image().src = src;
    }
  }, [items, index]);

  // The arrow keys step too, outside fields, a video's controls, the edit form and full screen
  const keysOn = !editing && !fullScreen;
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    if (!keysOn) return undefined;
    const onKeyDown = (e) => {
      const by = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!by || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.target?.closest?.('video, input, select, textarea')) return;
      e.preventDefault();
      stepRef.current(by);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [keysOn]);

  // A swipe across the photo steps (and isn't also a tap for full screen)
  const swipeRef = useRef(null);
  const swipedRef = useRef(false);

  const handleDelete = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      await deletePhoto(currentId);
      onDeleted?.(currentId);
      onClose();
    } catch (err) {
      setActionError(err.friendlyMessage || 'The photo could not be deleted.');
      setDeleting(false);
    }
  };

  const isVideo = photo?.kind === 'VIDEO';
  const noun = isVideo ? 'Video' : 'Photo';
  const title = photo?.caption || (photo?.takenAt ? `${noun} from ${formatDay(photo.takenAt)}` : noun);
  const count = items.length;
  // Its thumbnail (already on screen in the gallery) behind the screen-sized copy, which
  // paints over it once it has arrived
  const thumbBehind = photo?.thumbUrl && photo.displayUrl ? { backgroundImage: `url("${photo.thumbUrl}")` } : undefined;

  return (
    <Modal title={title} onClose={onClose} wide fill>
      {/* Opened with only its id (a passport stamp): nothing to show until its reply */}
      {!photo && !loadError ? (
        <div className='grid place-items-center py-10' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Opening photo…</span>
        </div>
      ) : null}
      {!photo ? <InlineAlert>{loadError}</InlineAlert> : null}

      {photo ? (
        <div className='grid gap-4 md:grid-cols-wide-narrow'>
          <div className='grid content-start gap-3'>
            {isVideo ? (
              <VideoPlayer key={photo.id} photo={photo} checking={checking} onRefresh={checkVideo} />
            ) : (
              <button
                type='button'
                aria-label={`Show ${title} full screen`}
                className='grid cursor-zoom-in touch-pan-y border-8 border-poster-cream bg-poster-cream shadow-paper'
                onPointerDown={(e) => {
                  swipedRef.current = false;
                  if (e.pointerType !== 'mouse') swipeRef.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerUp={(e) => {
                  const start = swipeRef.current;
                  swipeRef.current = null;
                  if (!start) return;
                  const dx = e.clientX - start.x;
                  if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - start.y) * 1.5) {
                    swipedRef.current = true;
                    step(dx < 0 ? 1 : -1);
                  }
                }}
                onPointerCancel={() => {
                  swipeRef.current = null;
                }}
                onClick={() => {
                  if (swipedRef.current) {
                    swipedRef.current = false;
                    return;
                  }
                  setFullScreen(true);
                }}
              >
                <img
                  key={photo.id}
                  src={photo.displayUrl || photo.thumbUrl}
                  alt={photo.caption || ''}
                  width={photo.width || undefined}
                  height={photo.height || undefined}
                  style={thumbBehind}
                  // The same height for every photo, portrait or landscape, so Previous and Next
                  // stay under the pointer as the photos change (19 Nov 2026, the audit)
                  className='h-[60vh] w-full bg-contain bg-center bg-no-repeat object-contain'
                />
              </button>
            )}

            {/* Previous and Next under the photo, never over it; at either end the button
                stays, switched off, so nothing moves */}
            {count > 1 ? (
              <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2'>
                <Button quiet onClick={() => step(-1)} disabled={index <= 0} ariaLabel='Previous photo'>
                  <IoChevronBack aria-hidden='true' className='self-center' />
                  <span>Previous</span>
                </Button>
                <p className='text-center text-sm' aria-live='polite'>
                  {`${index + 1} of ${count}${hasMore ? '+' : ''}`}
                </p>
                <Button quiet onClick={() => step(1)} disabled={index >= count - 1} ariaLabel='Next photo'>
                  <span>Next</span>
                  <IoChevronForward aria-hidden='true' className='self-center' />
                </Button>
              </div>
            ) : null}
          </div>

          {/* One column the details keep to: an auto column grew to their widest row, and
              its buttons ran 17px onto the dialog's edge (19 Nov 2026, the audit) */}
          <div className='grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4'>
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
            <InlineAlert>{loadError}</InlineAlert>

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
            {/* The monthly themes it's in, and entering this month's (editors; docs/API.md
                "Photo themes"): from the photo's own reply */}
            {editing || isVideo || !own ? null : <PhotoThemeLine photo={photo} canEdit={canEdit && !locked && !shareCode} onChanged={applyChange} />}

            <InlineAlert>{actionError}</InlineAlert>
            {canEdit && locked ? <VerifyFirstNote action='change or delete photos' /> : null}
            {/* One to a row on a phone, so nothing runs off the side; in a row from sm up,
                where the details run the dialog's width; stacked again from md, where they're
                the narrow column beside the photo (in a row they ran past its edge; 19 Nov
                2026, the audit) */}
            {canEdit && !editing ? (
              <div className='grid gap-2 sm:grid-row sm:justify-start md:grid-flow-row md:justify-items-start'>
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

      {/* Full screen: the same list, stepping it moves this viewer along too */}
      {fullScreen && photo ? (
        <PhotoAlbumViewer
          photos={index >= 0 ? items.map((p) => (p.id === currentId ? photo : p)) : [photo]}
          index={Math.max(index, 0)}
          onIndex={showAt}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onClose={() => setFullScreen(false)}
        />
      ) : null}
    </Modal>
  );
}

export default PhotoViewer;
