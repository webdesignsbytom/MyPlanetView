import React from 'react';
// Context
import { useAuth } from '@/auth/AuthContext';
// Constants
import { MAP_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppLink from '@/components/common/AppLink';

// The big round, rustic travel-stamp button from my_planet's tickets: sign up, or
// straight to your map once you're signed in.
function HomeStartButton() {
  const { user } = useAuth();
  const signedIn = Boolean(user);

  return (
    <AppLink
      to={signedIn ? MAP_PAGE_URL : SIGN_UP_PAGE_URL}
      label={signedIn ? 'Open your map' : 'Start your map'}
      description={signedIn ? 'Go to your My Planet View map' : 'Sign up for a free My Planet View map'}
      className='grid size-36 -rotate-6 place-items-center rounded-full border-8 border-double border-poster-brown bg-poster-paper p-4 text-center font-travel text-2xl leading-none text-poster-ink shadow-lift outline-4 outline-offset-4 outline-poster-red transition hover:rotate-0 hover:brightness-105 active:scale-95 sm:size-44 sm:text-3xl'
    />
  );
}

export default HomeStartButton;
