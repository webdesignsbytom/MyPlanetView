import React, { useState } from 'react';
import { FaLandmark } from 'react-icons/fa';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';
import useLandmarkPhotos from '@/hooks/useLandmarkPhotos';
// Components
import LandmarkCard from './LandmarkCard';
// Utils
import { landmarkPhotoInfo } from '@/utils/map/landmarkPhotoInfo';

// How many show before "Show all": Italy has 58, China 61
const FIRST = 6;

// The landmarks we know of in one country (the ones photos get matched to, and the
// passport's stamps), A–Z, each with its photo from Wikimedia Commons and that photo's
// credit (LandmarkCard), the UNESCO World Heritage Sites marked. A long list shows its
// first few, with a button for the rest.
function CountryLandmarks({ countryCode }) {
  const { landmarks, loading, error } = useLandmarks(countryCode);
  const photos = useLandmarkPhotos();
  const [all, setAll] = useState(false);

  if (loading) return <p className='text-sm opacity-80'>Loading landmarks…</p>;
  if (error) return <p className='text-sm opacity-80'>{error}</p>;
  if (!landmarks.length) return null;

  const shown = all ? landmarks : landmarks.slice(0, FIRST);
  const listId = `landmarks-list-${countryCode}`;
  return (
    <section className='grid gap-3' aria-labelledby={`landmarks-${countryCode}`}>
      <h3 id={`landmarks-${countryCode}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Landmarks <span className='font-main text-sm normal-case tracking-normal'>({landmarks.length})</span>
      </h3>
      <ul id={listId} className='grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-4 gap-y-5'>
        {shown.map((landmark) => (
          <LandmarkCard key={landmark.id} landmark={landmark} photo={landmarkPhotoInfo(photos, landmark.slug)} />
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
