import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
// Icons
import { FaRoute } from 'react-icons/fa';
// Constants
import { tripPath } from '@/utils/constants/routes';
// Hooks
import useMomentPage from '@/hooks/useMomentPage';
// Components
import MapPanel from './MapPanel';
import MomentStamp from '@/components/moments/MomentStamp';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
// Utils
import { MOMENT_KIND_LABELS } from '@/utils/moments/momentKinds';
import { formatMomentDate } from '@/utils/moments/momentDates';
import { countryName } from '@/utils/map/countries';
import { TRIP_STATUS_LABELS } from '@/utils/trips/tripStatus';
import { formatDayRange } from '@/utils/functions/dates';

const ROW = 'grid w-full grid-cols-reg items-start gap-3 border-2 border-dashed border-poster-brown/60 p-2 text-left';
const ROW_LINK = `${ROW} transition hover:border-solid hover:border-poster-brown hover:bg-poster-paper/30`;
const UNDATED = 'Undated';

// A trip's mark in the list: the toolbar's route stamp
function TripStamp() {
  return (
    <span aria-hidden='true' className='grid h-10 w-10 rotate-3 place-items-center rounded-full border-4 border-double border-colour7 bg-poster-paper text-lg text-colour7 shadow-paper'>
      <FaRoute />
    </span>
  );
}

// The year an item belongs under, or Undated
const yearOf = (date) => (date ? date.slice(0, 4) : UNDATED);

// Date order, oldest first, undated last; a trip before the moments of its first day
function byDate(a, b) {
  if (!a.date !== !b.date) return a.date ? -1 : 1;
  if (a.date && a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.type !== b.type) return a.type === 'trip' ? -1 : 1;
  return a.key < b.key ? -1 : 1;
}

/**
 * The map's story: its moments and trips together in date order, under each year, for
 * everyone or one traveller (`travellers`). Moments come a page at a time
 * (`momentSource`: the map, or a share link); until the last page is in, only the trips
 * up to the last moment loaded are shown, so nothing comes in out of order. A moment
 * opens its country (`onShowCountry`); a trip its page, when the viewer can open it (not
 * through a share link, nor a group trip they aren't on). Group trips from other maps
 * aren't anyone's here, so a traveller's story leaves them out.
 */
function TimelinePanel({ momentSource, trips = [], travellers = [], shareCode = null, onShowCountry, onClose }) {
  const [travellerId, setTravellerId] = useState('');
  const list = useMomentPage({ ...momentSource, limit: 30 });
  const { moments, nextCursor, loading, error } = list;

  const groups = useMemo(() => {
    const last = moments[moments.length - 1];
    // With more moments to come, trips wait until the moments around them are in
    const cutoff = nextCursor ? last?.happenedOn || UNDATED : null;
    const tripShows = (date) => !cutoff || (cutoff === UNDATED ? Boolean(date) : Boolean(date) && date <= cutoff);
    const items = [
      ...moments
        .filter((m) => !travellerId || m.travellerIds.includes(travellerId))
        .map((m) => ({ type: 'moment', key: `m-${m.id}`, date: m.happenedOn, moment: m })),
      ...trips
        .filter((t) => !travellerId || (!t.linked && t.travellerIds?.includes(travellerId)))
        .map((t) => ({ type: 'trip', key: `t-${t.id}`, date: t.startDate || t.endDate || null, trip: t }))
        .filter((item) => tripShows(item.date)),
    ].sort(byDate);
    const byYear = [];
    for (const item of items) {
      const year = yearOf(item.date);
      if (byYear[byYear.length - 1]?.year !== year) byYear.push({ year, items: [] });
      byYear[byYear.length - 1].items.push(item);
    }
    return byYear;
  }, [moments, nextCursor, trips, travellerId]);

  const renderMoment = (m) => (
    <button type='button' className={ROW_LINK} onClick={() => onShowCountry(m.countryCode)}>
      <MomentStamp kind={m.kind} />
      <span className='grid min-w-0 gap-0.5'>
        <span className='break-words font-travel text-base uppercase leading-tight tracking-wide'>{m.title}</span>
        <span className='text-xs opacity-80'>
          {[MOMENT_KIND_LABELS[m.kind], formatMomentDate(m), countryName(m.countryCode)].filter(Boolean).join(' · ')}
        </span>
        {m.hidden ? <span className='text-xs font-medium text-poster-red-deep'>Hidden from viewers</span> : null}
      </span>
    </button>
  );

  const renderTrip = (t) => {
    const body = (
      <>
        <TripStamp />
        <span className='grid min-w-0 gap-0.5'>
          <span className='break-words font-travel text-base uppercase leading-tight tracking-wide'>{t.title}</span>
          <span className='text-xs opacity-80'>
            {[t.linked ? `Group trip from ${t.organiserMapName}` : 'Trip', formatDayRange(t.startDate, t.endDate), TRIP_STATUS_LABELS[t.status]]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </>
    );
    return t.canOpen !== false && !shareCode ? (
      <Link to={tripPath(t.id)} className={ROW_LINK}>
        {body}
      </Link>
    ) : (
      <div className={ROW}>{body}</div>
    );
  };

  return (
    <MapPanel title='Timeline' onClose={onClose}>
      {travellers.length > 1 ? (
        <FormField id='timeline-traveller' label='Whose story'>
          <PlainOptionSelect
            value={travellerId}
            onChange={(e) => setTravellerId(e.target.value)}
            options={[{ value: '', label: 'Everyone' }, ...travellers.map((t) => ({ value: t.id, label: t.name }))]}
          />
        </FormField>
      ) : null}

      {error ? (
        <p role='alert' className='text-sm text-status-critical'>
          {error}
        </p>
      ) : null}

      {groups.length ? (
        <div className='grid gap-4'>
          {groups.map((group) => (
            <section key={group.year} className='grid gap-2' aria-labelledby={`timeline-${group.year}`}>
              <h3 id={`timeline-${group.year}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
                {group.year}
              </h3>
              <ol className='grid gap-2'>
                {group.items.map((item) => (
                  <li key={item.key}>{item.type === 'moment' ? renderMoment(item.moment) : renderTrip(item.trip)}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : !loading && !error ? (
        <p className='text-sm opacity-80'>
          {travellerId ? 'Nothing for them yet.' : 'Nothing on the timeline yet. Moments are added from a country; trips from Trips.'}
        </p>
      ) : null}

      {loading ? (
        <div className='grid place-items-center py-2' role='status'>
          <LoadingSpinner />
          <span className='sr-only'>Loading the timeline…</span>
        </div>
      ) : null}
      {nextCursor && !loading ? (
        <button type='button' onClick={list.loadMore} className='justify-self-start text-sm font-medium underline underline-offset-2'>
          Show more of the story
        </button>
      ) : null}
    </MapPanel>
  );
}

export default TimelinePanel;
