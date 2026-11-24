import React, { useId, useMemo, useState } from 'react';
// Utils
import { unCountsFrom } from '@/utils/map/unMembers';

const HEADING = 'font-travel text-lg uppercase leading-tight tracking-wide text-colour9';
const LINK = 'justify-self-start text-left text-sm font-semibold text-colour6 underline underline-offset-2';

/**
 * Collector's counts in the statistics panel (24 Nov 2026, the user's wish): the map counted
 * against lists serious travellers use, beside its own count. Only a counter: the map itself and
 * what's marked on it never change. First the UN's 193 member states (utils/map/unMembers.js):
 * how many of them the map's visited and lived-in places count for (`count`, the server's
 * `stats.unCountries`, else worked out here), and the ones still to go, A–Z, folded away until
 * asked for; each opens its country's ticket (`onOpenCountry`) where there is one.
 */
function CollectorCounts({ count = null, visits = [], onOpenCountry = null }) {
  const headingId = useId();
  const listId = useId();
  const [showToGo, setShowToGo] = useState(false);
  const { visited, toGo, total } = useMemo(() => unCountsFrom(visits), [visits]);
  const been = count ?? visited.length;
  const share = Math.round((been / total) * 100);

  return (
    <section className='grid gap-2' aria-labelledby={headingId} data-collector-counts>
      <h3 id={headingId} className={HEADING}>
        Collector’s counts
      </h3>
      <div className='grid gap-1' data-un-count={been}>
        <p className='grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm'>
          <span>UN member states</span>
          <span className='font-semibold'>
            {been} of {total}
          </span>
        </p>
        <span aria-hidden='true' className='grid h-1.5 overflow-hidden rounded-full bg-poster-brown/15'>
          <span className='block h-full rounded-full bg-poster-red/80' style={{ width: `${share}%` }} />
        </span>
        <p className='text-xs'>
          The UN’s 193 countries, the usual way to count. The UK’s nations count as the UK and the Canaries as Spain; territories such as
          Greenland, and places outside the UN such as Taiwan, count for none.
        </p>
      </div>
      {toGo.length ? (
        <>
          <button type='button' aria-expanded={showToGo} aria-controls={listId} onClick={() => setShowToGo((now) => !now)} className={LINK}>
            {showToGo ? 'Hide the ones to go' : `Show the ${toGo.length} to go`}
          </button>
          <ul id={listId} hidden={!showToGo} aria-label='UN member states to go' className='grid grid-cols-2 gap-x-3 gap-y-1 text-sm'>
            {toGo.map((country) => (
              <li key={country.code} data-un-to-go={country.code}>
                {onOpenCountry ? (
                  <button type='button' onClick={() => onOpenCountry(country.code)} className='text-left underline-offset-2 hover:underline'>
                    {country.name}
                  </button>
                ) : (
                  country.name
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className='text-sm font-semibold'>Every one of them!</p>
      )}
    </section>
  );
}

export default CollectorCounts;
