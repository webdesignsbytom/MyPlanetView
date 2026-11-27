import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { MAP_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import HomeDraftFeatures from './HomeDraftFeatures';

/**
 * The draft's left-hand side: the title, the tagline, the features and the button to start,
 * which signs up, or opens your map once you're signed in (as the real home page's does).
 */
export default function HomeDraftIntro() {
  const { user } = useAuth();

  return (
    <section className='intro'>
      <h1 id='home-draft-heading'>
        <span>Picture Your</span> <strong>Travel</strong>
      </h1>
      <p className='tagline'>Map · Collect · Plan · Share</p>
      {/* What the site is, in a sentence (the user's words, 27 Nov 2026) */}
      <p className='lede'>One map for a lifetime of travel: every country, photo and trip, kept private.</p>
      <HomeDraftFeatures />
      <Link to={user ? MAP_PAGE_URL : SIGN_UP_PAGE_URL} className='cta'>
        {user ? 'Open Your Travel Map' : 'Start Your Travel Map'} <span aria-hidden='true'>→</span>
      </Link>
    </section>
  );
}
