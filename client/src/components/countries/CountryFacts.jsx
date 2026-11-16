import React from 'react';
// Utils
import { FACT_FIELDS, formatDay } from '@/utils/countries/countryContent';
// Components
import PaperCard from '@/components/common/PaperCard';
import AppAnchor from '@/components/common/AppAnchor';

/**
 * Practical facts (currency, languages, plugs, driving side, time, emergency number,
 * calling code) as a list of terms, with their source: Wikidata (CC0), the country's
 * item and the day it was queried.
 */
function CountryFacts({ name, facts }) {
  const byKey = Object.fromEntries(facts.items.map((item) => [item.key, item]));

  return (
    <PaperCard title='Practical facts' titleId='country-facts-heading' bodyClassName='gap-5'>
      <dl className='grid gap-x-8 gap-y-3 leading-relaxed sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]'>
        {FACT_FIELDS.map(({ key, label }) => (
          <React.Fragment key={key}>
            <dt className='font-travel uppercase tracking-wide text-colour9'>{label}</dt>
            <dd className='border-b border-poster-brown/25 pb-3 sm:pb-2'>{byKey[key].text}</dd>
          </React.Fragment>
        ))}
      </dl>
      <p className='text-sm leading-relaxed text-colour5'>
        From{' '}
        <AppAnchor
          href={`https://www.wikidata.org/wiki/${facts.wikidata}`}
          target='_blank'
          className='text-colour6 underline hover:brightness-75'
        >
          {name} on Wikidata
        </AppAnchor>{' '}
        (free to reuse, CC0), queried on {formatDay(facts.queried)}. Rules and numbers change: check before you travel.
      </p>
    </PaperCard>
  );
}

export default CountryFacts;
