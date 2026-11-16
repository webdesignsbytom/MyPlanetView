import React from 'react';
// Utils
import { RATINGS, RATING_LABELS, RATING_MEANINGS, monthNumbersText } from '@/utils/countries/countryContent';
// Components
import PaperCard from '@/components/common/PaperCard';
import MonthStrip from './MonthStrip';
import MonthStripSummary from './MonthStripSummary';
import MonthLinks from '@/components/months/MonthLinks';
import GuidePhoto from './GuidePhoto';
// Utils
import { festivalGuidePhoto } from '@/utils/countries/guidePhotos';

const subheading = 'font-travel text-xl uppercase leading-tight tracking-wide text-colour9';
const section = 'grid gap-3 border-t-2 border-dashed border-poster-brown/50 pt-5';

/**
 * When to go: the month strip and what its ratings mean, a line per season, the weather in
 * words, the festivals with their usual months, and how the regions differ (each with a
 * strip of its own where the content gives one).
 */
function CountryWhenToGo({ name, whenToGo }) {
  const { stripLabel, months, seasons, weather, festivals, regions = [] } = whenToGo;

  return (
    <PaperCard title='When to go' titleId='country-when-heading' bodyClassName='gap-6'>
      <div className='grid gap-3'>
        {stripLabel ? <p className='text-sm leading-relaxed text-colour5'>{stripLabel}</p> : null}
        <MonthStrip months={months} label={`${name}, month by month`} />
        <dl className='grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_minmax(0,1fr)]'>
          {RATINGS.map((rating) => (
            <React.Fragment key={rating}>
              <dt className='font-semibold'>{RATING_LABELS[rating]}</dt>
              <dd className='text-colour5'>{RATING_MEANINGS[rating]}</dd>
            </React.Fragment>
          ))}
        </dl>
        {/* Where else is at its best in this country's best months (published month pages only) */}
        <MonthLinks
          months={months.map((rating, i) => (rating === 'best' ? i + 1 : null)).filter(Boolean)}
          lead={`Where else is at its best in ${name}’s best months:`}
        />
      </div>

      <section aria-labelledby='country-seasons-heading' className={section}>
        <h3 id='country-seasons-heading' className={subheading}>
          Season by season
        </h3>
        <ul className='grid gap-3 md:grid-cols-2'>
          {seasons.map((season) => (
            <li key={season.name} className='grid content-start gap-1 leading-relaxed'>
              <p>
                <span className='font-semibold'>{season.name}</span>{' '}
                <span className='text-colour5'>({monthNumbersText(season.months)})</span>
              </p>
              <p>{season.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby='country-weather-heading' className={section}>
        <h3 id='country-weather-heading' className={subheading}>
          The weather
        </h3>
        <p className='max-w-prose leading-relaxed'>{weather}</p>
      </section>

      <section aria-labelledby='country-festivals-heading' className={section}>
        <h3 id='country-festivals-heading' className={subheading}>
          Festivals and holidays
        </h3>
        <ul className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {festivals.map((festival) => (
            <li key={festival.name} className='grid content-start gap-1 rounded-md border border-poster-brown/40 px-4 py-3 leading-relaxed'>
              {/* Its photo (images/src/tools/festival-photos.mjs), when one was found */}
              {festival.photo ? (
                <div className='mb-2'>
                  <GuidePhoto photo={festivalGuidePhoto(festival)} frameClass='aspect-[16/9]' />
                </div>
              ) : null}
              <p className='font-semibold'>{festival.name}</p>
              <p className='text-sm text-colour9'>
                {festival.when}
                {festival.place ? ` · ${festival.place}` : ''}
              </p>
              <p className='text-sm'>{festival.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {regions.length ? (
        <section aria-labelledby='country-regions-heading' className={section}>
          <h3 id='country-regions-heading' className={subheading}>
            How regions differ
          </h3>
          <ul className='grid gap-5 md:grid-cols-2'>
            {regions.map((region) => (
              <li key={region.name} className='grid content-start gap-2 leading-relaxed'>
                <p className='font-semibold'>{region.name}</p>
                {region.months ? (
                  <div className='grid gap-1'>
                    <MonthStrip months={region.months} compact />
                    <MonthStripSummary months={region.months} />
                  </div>
                ) : null}
                <p>{region.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PaperCard>
  );
}

export default CountryWhenToGo;
