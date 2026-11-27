import React, { useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaCheck, FaLock } from 'react-icons/fa';
// Hooks
import useLandmarkPhotos from '@/hooks/useLandmarkPhotos';
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import Button from '@/components/common/Button';
// Constants
import { PRICING_PAGE_URL } from '@/utils/constants/routes';
// Utils
import { POSTCARD_PHOTO_TABS, isFreePhotoGroup } from '@/utils/postcards/postcardRules';
import { landmarkPhotoInfo } from '@/utils/map/landmarkPhotoInfo';
import { isPictureFile, photoAsBlob, uploadPostcardPicture } from '@/utils/postcards/uploadPostcardPicture';
import { photoLabel } from '@/utils/photos/photoLabel';

const PICTURE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp';
const TILE = 'relative grid aspect-[3/2] w-full overflow-hidden border-4 bg-poster-cream shadow-paper';
const OWN_TILE = 'relative grid aspect-square w-full overflow-hidden border-4 bg-poster-cream shadow-paper';

// One of the place's photos on the map, or one from the device, sent for the card's front
function OwnPhotoField({ photoFilters, picture, onPicture, disabled }) {
  const uid = useId();
  const inputRef = useRef(null);
  const photos = usePhotoPage(photoFilters ?? { enabled: false });
  const [state, setState] = useState({ busy: false, progress: 0, error: '', fromId: null });
  const offered = (photos.photos || []).filter((p) => p.kind !== 'VIDEO' && (p.displayUrl || p.thumbUrl));

  const send = async (getBlob, fromId) => {
    setState({ busy: true, progress: 0, error: '', fromId });
    try {
      const blob = await getBlob();
      const sent = await uploadPostcardPicture(blob, (share) => setState((s) => ({ ...s, progress: Math.round(share * 100) })));
      onPicture({ ...sent, fromId });
      setState({ busy: false, progress: 100, error: '', fromId });
    } catch (err) {
      setState({ busy: false, progress: 0, error: err?.friendlyMessage || err?.message || 'That photo couldn’t be sent. Please try again.', fromId: null });
    }
  };

  return (
    <div className='grid gap-3' role='group' aria-labelledby={`${uid}-label`}>
      <p id={`${uid}-label`} className='text-sm font-medium'>
        Your photo
      </p>
      {picture?.previewUrl ? (
        <img src={picture.previewUrl} alt='The photo on your postcard' className='max-h-40 w-full border-2 border-poster-brown bg-field object-contain' data-postcard-own-photo='' />
      ) : null}
      {offered.length ? (
        <ul className='grid grid-cols-4 gap-2 sm:grid-cols-6' aria-label='Your photos from here'>
          {offered.map((photo) => {
            const on = picture?.fromId === photo.id;
            return (
              <li key={photo.id}>
                <button
                  type='button'
                  aria-pressed={on}
                  disabled={disabled || state.busy}
                  onClick={() => send(() => photoAsBlob(photo.displayUrl || photo.thumbUrl), photo.id)}
                  data-postcard-photo={photo.id}
                  className={`${OWN_TILE} disabled:cursor-wait ${on ? 'border-poster-red' : 'border-poster-cream'}`}
                >
                  <img src={photo.thumbUrl || photo.displayUrl} alt='' loading='lazy' draggable={false} className='h-full w-full object-cover' />
                  <span className='sr-only'>Use {photoLabel(photo)}</span>
                  {on ? (
                    <span className='absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-poster-cream bg-poster-red-strong text-xs text-poster-cream'>
                      <FaCheck aria-hidden='true' />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <input
        ref={inputRef}
        type='file'
        accept={PICTURE_ACCEPT}
        aria-label='Choose a photo from your device'
        tabIndex={-1}
        className='sr-only'
        data-postcard-file=''
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          e.target.value = '';
          if (!chosen) return;
          if (!isPictureFile(chosen)) {
            setState({ busy: false, progress: 0, error: /\.(heic|heif)$/i.test(chosen.name) ? 'That photo is an iPhone HEIC file. Please save it as a JPEG first.' : 'Please choose a photo.', fromId: null });
            return;
          }
          send(async () => chosen, 'device');
        }}
      />
      <Button quiet disabled={disabled || state.busy} onClick={() => inputRef.current?.click()}>
        {offered.length ? 'Or upload one from your device' : 'Upload a photo from your device'}
      </Button>
      <p className='text-sm' aria-live='polite'>
        {state.busy ? `Sending your photo… ${state.progress}%` : state.error}
      </p>
    </div>
  );
}

// One photo to choose: the landmark's small copy as its picture, its name under it
function PhotoTile({ item, photos, chosen, locked, disabled, onChoose }) {
  const info = landmarkPhotoInfo(photos, item.landmark.slug);
  return (
    <li className='grid gap-1'>
      <button
        type='button'
        aria-pressed={chosen}
        disabled={disabled || locked}
        onClick={() => onChoose(item)}
        data-postcard-pick={item.landmark.slug}
        className={`${TILE} disabled:cursor-not-allowed ${chosen ? 'border-poster-red' : 'border-poster-cream'} ${locked ? 'opacity-60' : ''}`}
      >
        {info ? <img src={info.webp} alt='' loading='lazy' draggable={false} className='h-full w-full object-cover' /> : null}
        <span className='sr-only'>
          {item.landmark.name}
          {locked ? ' (with Business and First Class)' : ''}
        </span>
        {chosen ? (
          <span className='absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-poster-cream bg-poster-red-strong text-xs text-poster-cream'>
            <FaCheck aria-hidden='true' />
          </span>
        ) : null}
        {locked ? (
          <span className='absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-poster-ink/70 text-xs text-poster-cream'>
            <FaLock aria-hidden='true' />
          </span>
        ) : null}
      </button>
      <span aria-hidden='true' className='line-clamp-2 text-center text-2xs leading-tight'>
        {item.landmark.name}
      </span>
    </li>
  );
}

/**
 * The photo across the postcard's front (27 Nov 2026, the user's wish: "a cool city photo, or a
 * wilderness photo, or a famous landmark photo"): the place's own photos in tabs, City,
 * Wilderness and Landmarks (each landmark's Commons photo, as big as a card: postcardPhotos.js),
 * and Your photo (one of the place's photos on the map, or one from the device). A city's and the
 * wilderness's are on every plan; a landmark's and your own on a paid one (`paidCards` false
 * locks them, saying which plans have them). A place with no city or wilderness photo offers its
 * travel poster. `landmarks` are the place's (useLandmarks), `items` those with a postcard photo
 * (`{ landmark, group }`); `choice` is `{ kind, landmarkId }`.
 */
function PostcardPictureFields({ items, choice, onChoose, picture, onPicture, paidCards, photoFilters, disabled = false }) {
  const uid = useId();
  const photos = useLandmarkPhotos();
  const byGroup = useMemo(() => {
    const groups = { c: [], w: [], l: [] };
    for (const item of items) groups[item.group]?.push(item);
    return groups;
  }, [items]);
  const hasFree = byGroup.c.length + byGroup.w.length > 0;
  const tabs = POSTCARD_PHOTO_TABS.filter((tab) => tab.value === 'own' || byGroup[tab.value].length || (tab.value === 'c' && !hasFree));
  const openFirst = () => {
    const picked = items.find((item) => item.landmark.id === choice.landmarkId);
    if (choice.kind === 'PHOTO') return 'own';
    return picked?.group ?? tabs[0]?.value ?? 'c';
  };
  const [tab, setTab] = useState(openFirst);
  const locked = (group) => !paidCards && !isFreePhotoGroup(group);
  const pick = (item) => onChoose({ kind: isFreePhotoGroup(item.group) ? 'COUNTRY' : 'LANDMARK', landmarkId: item.landmark.id, landmark: item.landmark });

  return (
    <div className='grid gap-3'>
      <p id={`${uid}-label`} className='text-sm font-medium'>
        The photo on the front
      </p>
      <div role='group' aria-labelledby={`${uid}-label`} className='grid grid-cols-2 gap-2'>
        {tabs.map((t) => {
          const count = t.value === 'own' ? null : byGroup[t.value].length;
          const isLocked = !paidCards && !t.free;
          return (
            <button
              key={t.value}
              type='button'
              aria-pressed={tab === t.value}
              onClick={() => setTab(t.value)}
              data-postcard-tab={t.value}
              className={`grid grid-flow-col items-center justify-center gap-1.5 border-2 px-2 py-1.5 text-sm font-semibold ${
                tab === t.value ? 'paper-aged border-poster-red text-poster-ink' : 'border-dashed border-poster-brown/60'
              }`}
            >
              {isLocked ? <FaLock aria-hidden='true' className='text-xs' /> : null}
              <span>{t.label}</span>
              {count ? <span className='text-xs font-normal'>({count})</span> : null}
            </button>
          );
        })}
      </div>

      {tab === 'own' ? (
        paidCards ? (
          <OwnPhotoField photoFilters={photoFilters} picture={picture} onPicture={onPicture} disabled={disabled} />
        ) : null
      ) : (
        <ul className='grid grid-cols-2 gap-2 sm:grid-cols-3' aria-label={`${tabs.find((t) => t.value === tab)?.label ?? ''} photos`}>
          {tab === 'c' && !hasFree ? (
            <li className='grid gap-1'>
              <button
                type='button'
                aria-pressed={choice.kind === 'COUNTRY' && !choice.landmarkId}
                disabled={disabled}
                onClick={() => onChoose({ kind: 'COUNTRY', landmarkId: null, landmark: null })}
                data-postcard-pick='poster'
                className={`${TILE} place-items-center px-2 text-center font-travel text-sm uppercase ${
                  choice.kind === 'COUNTRY' && !choice.landmarkId ? 'border-poster-red' : 'border-poster-cream'
                }`}
              >
                Its travel poster
              </button>
            </li>
          ) : null}
          {(byGroup[tab] || []).map((item) => (
            <PhotoTile
              key={item.landmark.id}
              item={item}
              photos={photos}
              chosen={choice.landmarkId === item.landmark.id}
              locked={locked(item.group)}
              disabled={disabled}
              onChoose={pick}
            />
          ))}
        </ul>
      )}
      {!paidCards && (tab === 'l' || tab === 'own') ? (
        <p className='text-sm' data-postcard-locked=''>
          Postcards of landmarks and of your own photos come with Business and First Class.{' '}
          <Link to={PRICING_PAGE_URL} target='_blank' rel='noopener noreferrer' className='font-semibold text-poster-red-deep underline underline-offset-2'>
            See the plans
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export default PostcardPictureFields;
