import React, { useMemo, useState } from 'react';
import { FaLandmark } from 'react-icons/fa';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';
import useLandmarkPhotos from '@/hooks/useLandmarkPhotos';
import useLandmarkMarks from '@/hooks/useLandmarkMarks';
// Components
import LandmarkCard from './LandmarkCard';
// Utils
import { landmarkPhotoInfo } from '@/utils/map/landmarkPhotoInfo';

// How many show before "Show all": Italy has 58, China 61
const FIRST = 6;

// The landmarks we know of in one country (the ones photos get matched to, and the
// passport's stamps), A–Z, each with its photo from Wikimedia Commons and that photo's
// credit (LandmarkCard), the UNESCO World Heritage Sites marked. A long list shows its
// first few, with a button for the rest. `moments` (the country's, as the panel has them)
// puts the landmarks where something happened first, each card naming its moments.
// It's also the country's checklist (docs/API.md "Collecting"): how many the map has been to
// (stamped in the passport, or ticked "been here"), and each card's tick for editors.
function CountryLandmarks({ countryCode, moments = [] }) {
  const { landmarks: allLandmarks, loading, error } = useLandmarks(countryCode);
  const marks = useLandmarkMarks();
  const [tickError, setTickError] = useState('');
  const momentsByLandmark = useMemo(() => {
    const byId = new Map();
    for (const moment of moments) {
      if (!moment.landmark?.id) continue;
      if (!byId.has(moment.landmark.id)) byId.set(moment.landmark.id, []);
      byId.get(moment.landmark.id).push(moment);
    }
    return byId;
  }, [moments]);
  // Landmarks with moments first (A–Z), then the rest (A–Z)
  const landmarks = useMemo(
    () => [...allLandmarks.filter((l) => momentsByLandmark.has(l.id)), ...allLandmarks.filter((l) => !momentsByLandmark.has(l.id))],
    [allLandmarks, momentsByLandmark],
  );
  const photos = useLandmarkPhotos();
  const [all, setAll] = useState(false);

  if (loading) return <p className='text-sm opacity-80'>Loading landmarks…</p>;
  if (error) return <p className='text-sm opacity-80'>{error}</p>;
  if (!landmarks.length) return null;

  const shown = all ? landmarks : landmarks.slice(0, FIRST);
  const listId = `landmarks-list-${countryCode}`;
  const beenTo = landmarks.filter((l) => marks.stamped.has(l.id) || marks.ticked.has(l.id)).length;
  const toggle = marks.onToggle
    ? (landmarkId, been) => {
        setTickError('');
        marks.onToggle(landmarkId, been).catch((err) => setTickError(err?.friendlyMessage || 'That couldn’t be saved. Please try again.'));
      }
    : null;
  return (
    <section className='grid gap-3' aria-labelledby={`landmarks-${countryCode}`}>
      <h3 id={`landmarks-${countryCode}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Landmarks <span className='font-main text-sm normal-case tracking-normal'>({landmarks.length})</span>
      </h3>
      <p className='text-sm' data-landmark-progress={beenTo}>
        Been to {beenTo} of {landmarks.length}
        {toggle ? ': tick the ones you’ve seen, photo or not.' : '.'}
      </p>
      {tickError ? (
        <p role='alert' className='text-sm font-medium text-status-critical'>
          {tickError}
        </p>
      ) : null}
      <ul id={listId} className='grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-4 gap-y-5'>
        {shown.map((landmark) => (
          <LandmarkCard
            key={landmark.id}
            landmark={landmark}
            photo={landmarkPhotoInfo(photos, landmark.slug)}
            moments={momentsByLandmark.get(landmark.id)}
            // A tick first: it can be taken off (a photo's stamp stays, and shows then)
            mark={marks.ticked.has(landmark.id) ? 'ticked' : marks.stamped.has(landmark.id) ? 'stamped' : null}
            onToggle={toggle}
          />
        ))}
      </ul>
      {landmarks.length > FIRST ? (
        <button
          type='button'
          aria-expanded={all}
          aria-controls={listId}
          onClick={() => setAll((open) => !open)}
          className='justify-self-start text-sm font-semibold text-colour6 underline underline-offset-2'
        >
          {all ? 'Show fewer' : `Show all ${landmarks.length} landmarks`}
        </button>
      ) : null}
      {landmarks.some((landmark) => landmark.isUnesco) ? (
        <p className='grid grid-cols-[1rem_minmax(0,1fr)] items-baseline gap-2 text-xs opacity-80' aria-hidden='true'>
          <FaLandmark className='h-3 w-3 text-colour9' />
          <span>UNESCO World Heritage Site</span>
        </p>
      ) : null}
    </section>
  );
}

export default CountryLandmarks;
