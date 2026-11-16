import React from 'react';
// Components
import PaperCard from '@/components/common/PaperCard';

const subheading = 'font-travel text-xl uppercase leading-tight tracking-wide text-colour9';
const section = 'grid content-start gap-2';
const ruled = 'grid gap-3 border-t-2 border-dashed border-poster-brown/50 pt-5';

/**
 * Culture and customs: greetings, tipping and dress side by side, then etiquette, what to
 * eat, and a few phrases (a table: the phrase, how to say it, what it means; the middle
 * column only when the content gives pronunciations).
 */
function CountryCulture({ culture }) {
  const { greetings, etiquette, tipping, dress, food, phrases } = culture;
  const hasSay = phrases.items.some((item) => item.say);

  return (
    <PaperCard title='Culture and customs' titleId='country-culture-heading' bodyClassName='gap-6'>
      <div className='grid gap-6 lg:grid-cols-3'>
        <section aria-labelledby='country-greetings-heading' className={section}>
          <h3 id='country-greetings-heading' className={subheading}>
            Greetings
          </h3>
          <p className='leading-relaxed'>{greetings}</p>
        </section>
        <section aria-labelledby='country-tipping-heading' className={section}>
          <h3 id='country-tipping-heading' className={subheading}>
            Tipping
          </h3>
          <p className='leading-relaxed'>{tipping}</p>
        </section>
        <section aria-labelledby='country-dress-heading' className={section}>
          <h3 id='country-dress-heading' className={subheading}>
            What to wear
          </h3>
          <p className='leading-relaxed'>{dress}</p>
        </section>
      </div>

      <section aria-labelledby='country-etiquette-heading' className={ruled}>
        <h3 id='country-etiquette-heading' className={subheading}>
          Etiquette
        </h3>
        <ul className='grid list-disc gap-2 pl-5 leading-relaxed lg:grid-cols-2 lg:gap-x-10'>
          {etiquette.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby='country-food-heading' className={ruled}>
        <h3 id='country-food-heading' className={subheading}>
          What to eat
        </h3>
        <dl className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {food.map((dish) => (
            <div key={dish.name} className='grid content-start gap-1 leading-relaxed'>
              <dt className='font-semibold'>{dish.name}</dt>
              <dd className='text-sm'>{dish.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby='country-phrases-heading' className={ruled}>
        <h3 id='country-phrases-heading' className={subheading}>
          A few words of {phrases.language}
        </h3>
        {phrases.intro ? <p className='max-w-prose text-sm leading-relaxed'>{phrases.intro}</p> : null}
        <table className='w-full text-left text-sm'>
          <thead className='font-travel uppercase tracking-wide text-poster-brown'>
            <tr className='border-b-2 border-poster-brown/50'>
              <th scope='col' className='py-2 pr-3 font-normal'>
                {hasSay ? 'Phrase' : 'Word'}
              </th>
              {hasSay ? (
                <th scope='col' className='py-2 pr-3 font-normal'>
                  Say it
                </th>
              ) : null}
              <th scope='col' className='py-2 font-normal'>
                Meaning
              </th>
            </tr>
          </thead>
          <tbody>
            {phrases.items.map((item) => (
              <tr key={item.phrase} className='border-b border-poster-brown/25 align-top'>
                <th scope='row' className='py-2 pr-3 font-semibold'>
                  {item.phrase}
                </th>
                {hasSay ? <td className='py-2 pr-3 italic text-colour5'>{item.say}</td> : null}
                <td className='py-2'>{item.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PaperCard>
  );
}

export default CountryCulture;
