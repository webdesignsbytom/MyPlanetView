import React, { useEffect, useState } from 'react';
// Components
import PaperCard from '@/components/common/PaperCard';
// Utils
import { compareMaps } from '@/utils/compare/compareMaps';
import { drawCompareMap } from '@/utils/compare/drawCompareMap';
import { COMPARE_COLOURS } from '@/utils/constants/brandColours';
import { countryName } from '@/utils/map/countries';

const countWord = (n) => `${n.toLocaleString('en-GB')} ${n === 1 ? 'country' : 'countries'}`;

// One group: its swatch (decorative), heading with the count, and the names
function Group({ id, swatch, title, codes, empty }) {
  return (
    <section className='grid gap-1.5' aria-labelledby={id} data-compare-group={id}>
      <h3
        id={id}
        className={`grid items-center gap-2 font-travel text-lg uppercase leading-tight tracking-wide text-colour9 ${swatch ? 'grid-cols-[auto_minmax(0,1fr)]' : ''}`}
      >
        {swatch ? <span aria-hidden='true' className='size-4 border border-poster-brown' style={{ backgroundColor: swatch }} /> : null}
        <span>
          {title}: {countWord(codes.length)}
        </span>
      </h3>
      <p className='text-sm' data-compare-names>
        {codes.length ? codes.map(countryName).join(' · ') : empty}
      </p>
    </section>
  );
}

/**
 * Two maps side by side (ComparePage): the world with the countries on both, only on the
 * first and only on the second coloured in, then each group in words, and the countries both
 * want to go to. `a` and `b` are `{ label, visits }`.
 */
function CompareResults({ a, b }) {
  const groups = compareMaps(a.visits, b.visits);
  const [picture, setPicture] = useState('');
  const key = `${groups.both.join()}|${groups.onlyA.join()}|${groups.onlyB.join()}`;

  useEffect(() => {
    let cancelled = false;
    let url = '';
    drawCompareMap(groups)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPicture(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // Drawn again only when the groups change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <PaperCard title='How they compare' titleId='compare-results-heading'>
      <div className='grid gap-5'>
        <p className='font-medium' data-compare-summary>
          Both have been to {countWord(groups.both.length)}. {a.label} has {countWord(groups.onlyA.length)} the other doesn’t, and {b.label}{' '}
          {countWord(groups.onlyB.length)}.
        </p>
        {picture ? (
          <img
            src={picture}
            alt={`The world: ${countWord(groups.both.length)} on both maps, ${countWord(groups.onlyA.length)} only on ${a.label}, ${countWord(groups.onlyB.length)} only on ${b.label}.`}
            className='w-full border-2 border-poster-brown'
            data-compare-picture
          />
        ) : null}
        <Group id='compare-both' swatch={COMPARE_COLOURS.both} title='Both' codes={groups.both} empty='None yet: somewhere to go together?' />
        <Group id='compare-only-a' swatch={COMPARE_COLOURS.onlyA} title={`Only ${a.label}`} codes={groups.onlyA} empty='None.' />
        <Group id='compare-only-b' swatch={COMPARE_COLOURS.onlyB} title={`Only ${b.label}`} codes={groups.onlyB} empty='None.' />
        <Group id='compare-want' title='Both want to go' codes={groups.bothWant} empty='Nowhere both have marked “Want to go” yet.' />
      </div>
    </PaperCard>
  );
}

export default CompareResults;
