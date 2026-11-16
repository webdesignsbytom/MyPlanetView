import React, { Suspense, lazy, useState } from 'react';
// Api
import { getPhoto } from '@/api/travelApi';
// Components
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import CheckboxInput from '@/components/ui/CheckboxInput';
// Utils
import { googleMapsUrl, spotAudience, spotText } from '@/utils/moments/momentSpots';

const MomentSpotPicker = lazy(() => import('./MomentSpotPicker'));

const LOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 };

/**
 * A moment's pin, in its form (docs/API.md "Moments", "A pin on the map"): optional. Set
 * from one of the moment's photos that knows where it was taken (`photos`, the chosen ones;
 * an editor's photo detail has its position), from the device's location (asked only on a
 * press), or by tapping the map (MomentSpotPicker). Whether everyone the map is shared with
 * sees the exact spot is the pin's own choice, off by default (only the owner and editors
 * see it then). `value` is `{ latitude, longitude, shared }` or null; `onChange` gets the
 * same.
 */
function MomentSpotField({ idPrefix, value, onChange, photos = [], countryCode }) {
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState(null);
  const [picking, setPicking] = useState(false);
  const pin = (spot) => onChange({ latitude: spot.latitude, longitude: spot.longitude, shared: value?.shared ?? false });

  const fromPhoto = async () => {
    setBusy('photo');
    setNote(null);
    try {
      for (const chosen of photos) {
        const { photo } = await getPhoto(chosen.id);
        if (Number.isFinite(photo?.latitude) && Number.isFinite(photo?.longitude)) {
          pin(photo);
          return;
        }
      }
      setNote('None of the moment’s photos says where it was taken. Tap the map instead.');
    } catch (err) {
      setNote(err.friendlyMessage || 'The photos could not be read just now.');
    } finally {
      setBusy(null);
    }
  };

  const fromDevice = () => {
    setNote(null);
    if (!navigator.geolocation) {
      setNote('This browser can’t say where it is. Tap the map instead.');
      return;
    }
    setBusy('device');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBusy(null);
        pin(coords);
      },
      (err) => {
        setBusy(null);
        setNote(
          err.code === err.PERMISSION_DENIED
            ? 'Your device didn’t share where it is. You can allow it in the browser’s settings, or tap the map instead.'
            : 'Where you are couldn’t be found just now. Try again, or tap the map instead.',
        );
      },
      LOCATION_OPTIONS,
    );
  };

  return (
    <fieldset className='grid gap-2'>
      <legend className='text-sm font-semibold'>Pin it on the map</legend>
      {value ? (
        <div className='grid gap-1.5'>
          <p className='text-sm'>
            Pinned at {spotText(value)} ·{' '}
            <a href={googleMapsUrl(value)} target='_blank' rel='noopener noreferrer' referrerPolicy='no-referrer' className='underline'>
              Check it on Google Maps<span className='sr-only'> (opens in a new tab)</span>
            </a>
          </p>
          <CheckboxInput
            id={`${idPrefix}-shared`}
            checked={value.shared}
            onChange={(e) => onChange({ ...value, shared: e.target.checked })}
            label='Show the exact spot to everyone the map is shared with'
          />
          <p className='text-xs opacity-80'>{spotAudience(value.shared)}.</p>
        </div>
      ) : (
        <p className='text-sm'>Optional: put the moment on its exact spot.</p>
      )}
      {/* One to a row below wide screens (a phone); side by side on wide ones (lg, as
          MomentForm's fields), each cell wide enough for the longest ("Use a photo's
          location"), so a button never spills into the next */}
      <div className='grid gap-2 lg:grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))]'>
        <Button small quiet onClick={fromPhoto} disabled={!photos.length || Boolean(busy)} busy={busy === 'photo'}>
          Use a photo’s location
        </Button>
        <Button small quiet onClick={fromDevice} disabled={Boolean(busy)} busy={busy === 'device'}>
          Use where I am now
        </Button>
        <Button small quiet onClick={() => setPicking(true)} disabled={!countryCode || Boolean(busy)}>
          Tap the map
        </Button>
        {value ? (
          <Button small quiet onClick={() => onChange(null)}>
            Take the pin off
          </Button>
        ) : null}
      </div>
      <InlineAlert>{note}</InlineAlert>
      {picking ? (
        <Suspense fallback={null}>
          <MomentSpotPicker
            countryCode={countryCode}
            value={value}
            onPick={(spot) => {
              pin(spot);
              setPicking(false);
            }}
            onClose={() => setPicking(false)}
          />
        </Suspense>
      ) : null}
    </fieldset>
  );
}

export default MomentSpotField;
