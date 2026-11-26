import React from 'react';
// Components
import VsMedal from './VsMedal';
// Utils
import { categoryLabel, placeWords, valueWords } from '@/utils/vs/vsWords';

// Two people: each category as a head-to-head, a bar each for their share of the two numbers
function HeadToHead({ categories, pair }) {
  const [left, right] = pair;
  return (
    <div className='grid gap-3' data-vs-head-to-head=''>
      <p className='grid grid-cols-2 gap-4 text-sm font-semibold'>
        <span>{left.isYou ? `${left.name} (you)` : left.name}</span>
        <span className='text-right'>{right.isYou ? `${right.name} (you)` : right.name}</span>
      </p>
      {categories.map((category) => {
        const a = left.values[category] ?? 0;
        const b = right.values[category] ?? 0;
        const share = a + b ? Math.round((a / (a + b)) * 100) : 50;
        return (
          <section key={category} aria-labelledby={`vs-${category}`} className='grid gap-1' data-vs-category={category}>
            <h3 id={`vs-${category}`} className='text-center font-travel text-sm uppercase tracking-wide text-colour9'>
              {categoryLabel(category)}
            </h3>
            <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2'>
              <span className='grid grid-flow-col items-center gap-1 tabular-nums'>
                <VsMedal medal={left.medals[category]} className='h-5 w-5 text-2xs' />
                {valueWords(category, a)}
              </span>
              <span aria-hidden='true' className='grid h-3 overflow-hidden rounded-full border border-poster-brown bg-poster-paper' style={{ gridTemplateColumns: `${share}fr ${100 - share}fr` }}>
                <span className='bg-poster-red' />
                <span className='bg-colour7' />
              </span>
              <span className='grid grid-flow-col items-center gap-1 tabular-nums'>
                {valueWords(category, b)}
                <VsMedal medal={right.medals[category]} className='h-5 w-5 text-2xs' />
              </span>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Three or more: each category with everyone counted in their order, medals for the first three
function Ranked({ categories, members }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      {categories.map((category) => {
        const values = members.map((m) => m.values[category] ?? 0);
        const ranked = members
          .map((member, i) => ({ member, value: values[i], place: 1 + values.filter((v) => v > values[i]).length }))
          .sort((x, y) => x.place - y.place || x.member.name.localeCompare(y.member.name));
        return (
          <section key={category} aria-labelledby={`vs-${category}`} className='ticket-edge grid content-start gap-2 bg-paper-cream px-4 py-3' data-vs-category={category}>
            <h3 id={`vs-${category}`} className='font-travel text-base uppercase tracking-wide text-colour9'>
              {categoryLabel(category)}
            </h3>
            <ol className='grid gap-1 text-sm'>
              {ranked.map(({ member, value, place }) => (
                <li key={member.key ?? member.name} className={`grid grid-cols-[2.25rem_minmax(0,1fr)_auto_1.75rem] items-center gap-2 ${member.isYou ? 'font-semibold' : ''}`}>
                  <span className='text-xs opacity-80'>{placeWords(place)}</span>
                  <span className='truncate'>
                    {member.name}
                    {member.isYou ? ' (you)' : ''}
                  </span>
                  <span className='tabular-nums'>{valueWords(category, value)}</span>
                  <VsMedal medal={member.medals[category]} className='h-6 w-6 text-2xs' />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Everything compared (26 Nov 2026; docs/API.md "Vs mode"), counting only the people with a map
 * that counts: two of them side by side, head to head; more, each category ranked with its
 * medals. One person alone sees their own numbers and an invitation to bring friends.
 */
function VsCategories({ categories, members }) {
  const counted = members.filter((m) => m.counting && m.values);
  if (counted.length === 2) return <HeadToHead categories={categories} pair={counted} />;
  return <Ranked categories={categories} members={counted} />;
}

export default VsCategories;
