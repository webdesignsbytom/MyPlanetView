import React, { useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaCamera, FaCheck, FaGlobeEurope, FaLandmark, FaLock } from 'react-icons/fa';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';
import useLandmarkPhotos from '@/hooks/useLandmarkPhotos';
import usePhotoPage from '@/hooks/usePhotoPage';
// Components
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Constants
import { PRICING_PAGE_URL } from '@/utils/constants/routes';
// Utils
import { POSTCARD_KIND_CHOICES } from '@/utils/postcards/postcardRules';
import { landmarkPhotoInfo } from '@/utils/map/landmarkPhotoInfo';
import { modelForLandmark } from '@/utils/map/celebrationModels';
import { isPictureFile, photoAsBlob, uploadPostcardPicture } from '@/utils/postcards/uploadPostcardPicture';
import { photoLabel } from '@/utils/photos/photoLabel';

const KIND_ICONS = { COUNTRY: FaGlobeEurope, LANDMARK: FaLandmark, PHOTO: FaCamera };
const PICTURE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp';
const TILE = 'relative grid aspect-square w-full overflow-hidden border-4 bg-poster-cream shadow-paper';

// The place's landmarks a card can show: those with a Commons photo or a little 3D model
function useCardLandmarks(code) {
  const { landmarks } = useLandmarks(code);
  const photos = useLandmarkPhotos();
  return useMemo(
    () => landmarks.filter((l) => landmarkPhotoInfo(photos, l.slug) || modelForLandmark(l)).sort((a, b) => a.name.localeCompare(b.name)),
    [landmarks, photos],
  );
}

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
                  className={`${TILE} disabled:cursor-wait ${on ? 'border-poster-red' : 'border-poster-cream'}`}
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

/**
 * What goes on the postcard's front (26 Nov 2026, the user's decisions): the place's own card
 * (its poster and outline, free on every plan), a landmark's (its photo and 3D model) or your
 * own photo (one of the place's photos on the map, or one from the device), both on a paid plan:
 * `paidCards` false locks them, saying which plans have them. Radio cards, then the landmark's
 * dropdown or the photo's chooser.
 */
function PostcardPictureFields({ code, kind, onKind, landmarkId, onLandmark, picture, onPicture, paidCards, photoFilters, disabled = false }) {
  const uid = useId();
  const landmarks = useCardLandmarks(code);
  const choices = POSTCARD_KIND_CHOICES.filter((choice) => choice.value !== 'LANDMARK' || landmarks.length);

  return (
    <div className='grid gap-4'>
      <fieldset className='grid gap-2'>
        <legend className='text-sm font-medium'>On the front</legend>
        {/* One to a row, the icon beside the words: the maker's column is narrow beside the card */}
        <div className='grid gap-2'>
          {choices.map((choice) => {
            const Icon = KIND_ICONS[choice.value];
            const locked = choice.value !== 'COUNTRY' && !paidCards;
            const chosen = kind === choice.value;
            return (
              <label
                key={choice.value}
                data-postcard-kind={choice.value}
                className={`relative grid grid-cols-[auto_minmax(0,1fr)] content-start items-center gap-x-3 gap-y-0.5 border-2 px-3 py-2 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 ${
                  locked ? 'cursor-not-allowed border-dashed border-poster-brown/40 opacity-70' : 'cursor-pointer'
                } ${chosen ? 'paper-aged border-poster-red text-poster-ink shadow-paper' : locked ? '' : 'border-dashed border-poster-brown/60 hover:border-solid hover:border-poster-brown'}`}
              >
                <input
                  type='radio'
                  name={`${uid}-kind`}
                  value={choice.value}
                  checked={chosen}
                  disabled={disabled || locked}
                  onChange={() => onKind(choice.value)}
                  className='sr-only'
                />
                <span
                  aria-hidden='true'
                  className={`row-span-2 grid h-10 w-10 place-items-center rounded-full border-2 text-lg ${
                    chosen ? 'border-poster-red bg-poster-red-deep text-poster-paper' : 'border-poster-brown/60 bg-paper-cream text-poster-brown'
                  }`}
                >
                  {locked ? <FaLock /> : <Icon />}
                </span>
                <span className='font-travel text-base uppercase leading-tight tracking-wide'>{choice.label}</span>
                <span className='text-xs opacity-80'>{locked ? 'With Business and First Class.' : choice.hint}</span>
              </label>
            );
          })}
        </div>
        {!paidCards ? (
          <p className='text-sm'>
            Postcards of landmarks and of your own photos come with Business and First Class.{' '}
            <Link to={PRICING_PAGE_URL} target='_blank' rel='noopener noreferrer' className='font-semibold text-poster-red-deep underline underline-offset-2'>
              See the plans
            </Link>
          </p>
        ) : null}
      </fieldset>

      {kind === 'LANDMARK' ? (
        <FormField id={`${uid}-landmark`} label='Which landmark?' align='start'>
          <PlainOptionSelect
            value={landmarkId || ''}
            onChange={(e) => onLandmark(e.target.value || null)}
            disabled={disabled}
            options={[{ value: '', label: 'Choose a landmark' }, ...landmarks.map((l) => ({ value: l.id, label: l.name }))]}
          />
        </FormField>
      ) : null}
      {kind === 'PHOTO' ? <OwnPhotoField photoFilters={photoFilters} picture={picture} onPicture={onPicture} disabled={disabled} /> : null}
    </div>
  );
}

export default PostcardPictureFields;
