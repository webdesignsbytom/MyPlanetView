import React from 'react';
import { Link } from 'react-router-dom';
// Components
import MonthStrip from '@/components/countries/MonthStrip';
// Constants
import { countryPagePath } from '@/utils/constants/routes';

/**
 * The Travel Desk's "When to go": a country guide's month strip (each month best, good or
 * avoid, said in words too), and a link to the guide. `guide` is a country index row;
 * `linkToGuide` is false on the guide's own page. Choosing the link closes the desk.
 */
function TravelDeskWhenToGo({ guide, linkToGuide = true, onLeave }) {
  const headingId = `travel-desk-when-${guide.code.toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className='grid gap-2'>
      <h3 id={headingId} className='font-travel text-xl uppercase leading-tight tracking-wide text-colour9'>
        When to go: {guide.name}
      </h3>
      <MonthStrip months={guide.months} label={`${guide.name}, month by month`} />
      {linkToGuide ? (
        <Link
          to={countryPagePath(guide.slug)}
          onClick={onLeave}
          className='justify-self-start text-sm font-semibold underline underline-offset-2 hover:no-underline'
        >
          Read our guide to {guide.name}
        </Link>
      ) : null}
    </section>
  );
}

export default TravelDeskWhenToGo;
