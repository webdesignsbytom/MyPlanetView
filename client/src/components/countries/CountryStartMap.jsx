import React from 'react';
// Context
import { useAuth } from '@/auth/AuthContext';
// Constants
import { MAP_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppLink from '@/components/common/AppLink';

/**
 * "Start your map", at the foot of the country guides: sign up, or open your map once
 * signed in. The first render is signed out, as the pre-rendered page is. `named` is the
 * country as a sentence says it ("the United States"); none on the index.
 */
function CountryStartMap({ named }) {
  const { user } = useAuth();
  const text = named
    ? `Colour in ${named} and every other country you've been to, add your photos and plan the next trip. Your map is private and free to start.`
    : "Colour in every country you've been to, add your photos and plan the next trip. Your map is private and free to start.";

  return (
    <section
      aria-labelledby='country-start-heading'
      className='ticket-edge grid w-full overflow-hidden rounded-lg bg-paper-cream px-6 py-8 text-colour4 sm:px-8'
    >
      <div className='grid w-full items-center justify-items-center gap-6 rounded-lg border-4 border-double border-colour9 p-6 text-center sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:justify-items-start lg:gap-x-12 lg:text-left'>
        <div className='grid gap-y-3'>
          <h2 id='country-start-heading' className='font-travel text-3xl uppercase leading-tight tracking-wide text-colour6 sm:text-4xl'>
            {user ? (named ? 'Add it to your map' : 'Back to your map') : 'Start your map'}
          </h2>
          <p className='max-w-prose leading-relaxed'>{text}</p>
        </div>
        <AppLink
          to={user ? MAP_PAGE_URL : SIGN_UP_PAGE_URL}
          label={user ? 'Open your map' : 'Start your map'}
          className='btn-poster lg:justify-self-end'
        />
      </div>
    </section>
  );
}

export default CountryStartMap;
