import React from 'react';
// Hooks
import useLandmarks from '@/hooks/useLandmarks';

// The landmarks we know of in one country (the ones photos get matched to).
function CountryLandmarks({ countryCode }) {
  const { landmarks, loading, error } = useLandmarks(countryCode);

  if (loading) return <p className='text-sm opacity-80'>Loading landmarks…</p>;
  if (error) return <p className='text-sm opacity-80'>{error}</p>;
  if (!landmarks.length) return null;

  return (
    <section className='grid gap-2' aria-labelledby={`landmarks-${countryCode}`}>
      <h3 id={`landmarks-${countryCode}`} className='text-sm font-semibold'>
        Landmarks
      </h3>
      <ul className='grid gap-1 text-sm'>
        {landmarks.map((landmark) => (
          <li key={landmark.id}>{landmark.name}</li>
        ))}
      </ul>
    </section>
  );
}

export default CountryLandmarks;
