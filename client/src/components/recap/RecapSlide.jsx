import React from 'react';
// Components
import PosterImage from '@/components/map/PosterImage';
import ShareCardPreview from '@/components/shareCard/ShareCardPreview';
// Utils
import { countryName } from '@/utils/map/countries';
import { postersFor } from '@/utils/map/posterData';
import { joinNames } from '@/utils/map/travellerNames';
import { formatDayRange } from '@/utils/functions/dates';

const count = (n) => Number(n || 0).toLocaleString('en-GB');
const word = (n, one, many) => (n === 1 ? one : many);
const MAX_POSTERS = 8;

// One slide of "Your year in travel" (YearRecapDialog), by `kind` (utils/recap/recap.js
// recapSlides): the cover, the places (their posters), the photos (a highlight from each
// country), the passport's stamps, the trips and moments, and the share card. The heading is
// the slide's name for screen readers and takes focus when the slide shows (`headingRef`).
function RecapSlide({ kind, recap, map, card, headingRef }) {
  const heading = (text) => (
    <h3 ref={headingRef} tabIndex={-1} className='font-travel text-3xl uppercase leading-tight tracking-wide text-poster-red-deep outline-none sm:text-4xl'>
      {text}
    </h3>
  );

  if (kind === 'cover') {
    return (
      <div className='grid justify-items-center gap-3 py-6 text-center'>
        <p className='font-semibold uppercase tracking-widest text-poster-brown'>Your year in travel</p>
        <h3 ref={headingRef} tabIndex={-1} className='font-travel text-7xl leading-none text-poster-red-deep outline-none sm:text-8xl'>
          {recap.year}
        </h3>
        <p className='max-w-md'>
          Here’s {recap.year} on “{map.name}”: the places, the photos and the stamps.
        </p>
      </div>
    );
  }

  if (kind === 'places') {
    const withPosters = recap.places.map((code) => ({ code, poster: postersFor(code)[0] })).filter((place) => place.poster);
    const others = recap.specialPlaces ? `, and ${count(recap.specialPlaces)} special ${word(recap.specialPlaces, 'place', 'places')}` : '';
    return (
      <div className='grid gap-3'>
        {heading(`${count(recap.countries)} ${word(recap.countries, 'country', 'countries')}`)}
        <p>
          On {count(recap.continents)} {word(recap.continents, 'continent', 'continents')}
          {others}.
          {recap.newCountries.length ? ` New this year: ${joinNames(recap.newCountries.map(countryName))}.` : ''}
        </p>
        {withPosters.length ? (
          <ul className='grid grid-cols-3 gap-2 sm:grid-cols-4' aria-label='Posters of the places'>
            {withPosters.slice(0, MAX_POSTERS).map(({ code, poster }) => (
              <li key={code} className='grid gap-1 text-center text-xs'>
                <PosterImage poster={poster} alt='' className='border-2 border-poster-brown' />
                <span>{countryName(code)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {withPosters.length > MAX_POSTERS ? <p className='text-sm'>And {count(withPosters.length - MAX_POSTERS)} more.</p> : null}
      </div>
    );
  }

  if (kind === 'photos') {
    const [top] = recap.topCountries;
    const videos = recap.videos ? ` and ${count(recap.videos)} ${word(recap.videos, 'video', 'videos')}` : '';
    return (
      <div className='grid gap-3'>
        {heading(`${count(recap.photos)} ${word(recap.photos, 'photo', 'photos')}${videos}`)}
        {top ? (
          <p>
            Most of them in {countryName(top.countryCode)}: {count(top.photos)}.
          </p>
        ) : null}
        {recap.highlights.length ? (
          <ul className='grid grid-cols-2 gap-2 sm:grid-cols-3' aria-label='A photo from each country'>
            {recap.highlights.map((photo) => (
              <li key={photo.id} className='grid gap-1 text-center text-xs'>
                <img
                  src={photo.displayUrl || photo.thumbUrl}
                  alt={photo.caption || `A photo from ${countryName(photo.countryCode)}`}
                  loading='lazy'
                  className='aspect-square w-full border-2 border-poster-brown object-cover'
                />
                <span>{countryName(photo.countryCode)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (kind === 'stamps') {
    const more = recap.stamps.count - recap.stamps.landmarks.length;
    return (
      <div className='grid gap-3'>
        {heading(`${count(recap.stamps.count)} ${word(recap.stamps.count, 'landmark', 'landmarks')} stamped`)}
        <p>New stamps in your passport, from the year’s photos:</p>
        <ul className='grid gap-1 sm:grid-cols-2'>
          {recap.stamps.landmarks.map((landmark) => (
            <li key={landmark.id} className='border-b border-dashed border-poster-brown/50 py-1'>
              <span className='font-medium'>{landmark.name}</span>
              <span className='text-sm opacity-80'>, {countryName(landmark.countryCode)}</span>
            </li>
          ))}
        </ul>
        {more > 0 ? <p className='text-sm'>And {count(more)} more.</p> : null}
      </div>
    );
  }

  if (kind === 'trips') {
    const parts = [
      recap.trips.length ? `${count(recap.trips.length)} ${word(recap.trips.length, 'trip', 'trips')}` : null,
      recap.moments ? `${count(recap.moments)} ${word(recap.moments, 'moment', 'moments')}` : null,
    ].filter(Boolean);
    return (
      <div className='grid gap-3'>
        {heading(parts.join(' and '))}
        {recap.trips.length ? (
          <ul className='grid gap-1'>
            {recap.trips.map((trip) => (
              <li key={trip.id} className='border-b border-dashed border-poster-brown/50 py-1'>
                <span className='font-medium'>{trip.title}</span>
                {trip.startDate ? <span className='text-sm opacity-80'>, {formatDayRange(trip.startDate, trip.endDate)}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {recap.moments ? (
          <p>
            And {count(recap.moments)} {word(recap.moments, 'moment', 'moments')} on the map’s timeline.
          </p>
        ) : null}
      </div>
    );
  }

  // The share card
  return (
    <div className='grid gap-3'>
      {heading(`Share your ${recap.year}`)}
      <p className='text-sm'>A picture of your year for Instagram, WhatsApp or anywhere you like: the places and counts, never your photos.</p>
      <ShareCardPreview card={card} />
    </div>
  );
}

export default RecapSlide;
