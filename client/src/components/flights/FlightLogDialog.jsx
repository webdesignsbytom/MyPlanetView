import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
// Icons
import { FaChevronDown } from 'react-icons/fa';
// Api
import { addFlights, deleteFlight, getMapFlights } from '@/api/flightsApi';
import { createStop, createTrip } from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FlightAddForm from './FlightAddForm';
import AirportStamp from './AirportStamp';
// Utils
import { countryName } from '@/utils/map/countries';
import { airportFrom, loadAirports } from '@/utils/flights/airports';
import { distanceWords, firstFlownByAirport, flightCode } from '@/utils/flights/flightLog';
import { distanceLike } from '@/utils/map/distanceComparisons';
// Hooks
import useDistanceUnit from '@/hooks/useDistanceUnit';

const dayWords = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const word = (n, one, many) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

// The sections folded away (25 Nov 2026, the user's wish: the airports and the flights each fold
// under an arrow on the right), kept for the rest of the visit, as the badges' groups are
export const FLIGHT_LOG_CLOSED_KEY = 'mpv:flightLogClosed';
const closedForVisit = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(FLIGHT_LOG_CLOSED_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

/**
 * One of the log's sections that folds away: its heading is the button, the name on the left and
 * an arrow on the far right, pointing down while it's open and to the side once it's closed.
 */
function FoldSection({ id, title, open, onToggle, children }) {
  const headingId = useId();
  const bodyId = `${headingId}-body`;
  return (
    <section className='grid gap-2' aria-labelledby={headingId} data-flight-section={id}>
      <h3 id={headingId} className='grid border-b-2 border-dashed border-poster-brown/40 font-travel text-lg uppercase tracking-wide text-colour9'>
        <button
          type='button'
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className='grid min-h-9 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pb-1 text-left uppercase'
        >
          <span>{title}</span>
          <FaChevronDown aria-hidden='true' className={`text-sm transition-transform motion-reduce:transition-none ${open ? '' : 'rotate-90'}`} />
        </button>
      </h3>
      <div id={bodyId} hidden={!open} className='grid gap-2'>
        {children}
      </div>
    </section>
  );
}

// The log's numbers, as a strip of tiles; the distance flown in the map's unit and what it's
// like ("About twice round the world": distanceComparisons.js; 24 Nov 2026)
function FlightTotals({ totals, unit }) {
  const tiles = [
    { label: 'Flights', value: totals.flights.toLocaleString('en-GB') },
    { label: 'Flown', value: distanceWords(totals.distanceKm, unit), note: totals.distanceKm ? distanceLike(totals.distanceKm) : null },
    { label: 'Airports', value: totals.airports.length.toLocaleString('en-GB') },
    { label: 'Airlines', value: totals.airlines.toLocaleString('en-GB') },
  ];
  return (
    <dl className='grid grid-cols-2 gap-2 sm:grid-cols-4' data-flight-totals>
      {tiles.map((tile) => (
        <div key={tile.label} className='paper-aged grid content-start gap-0.5 border border-poster-brown/50 px-3 py-2'>
          <dt className='text-xs uppercase tracking-wide'>{tile.label}</dt>
          <dd className='font-semibold'>{tile.value}</dd>
          {tile.note ? <dd className='text-xs'>{tile.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

/**
 * The flight log (23 Nov 2026, the user's wish; docs/API.md "Flights"): from the statistics and
 * the trips panel. Its numbers (flights, distance, airports, airlines), the airports collected as
 * stamps (AirportStamp) and each flight taken, the two folding away (FoldSection); and, for an
 * editor (`canEdit`, verified: `canAdd`), adding flights from a boarding pass, its text or typed
 * (FlightAddForm), which fills in the trip and the countries.
 * `onSetVisit(code, status)` marks a place; `onChanged()` reloads the map's trips and visits.
 */
function FlightLogDialog({ mapId, trips = [], visitsByCode = {}, splitUk = false, canEdit = false, canAdd = false, onSetVisit, onChanged, onClose }) {
  const unit = useDistanceUnit();
  const [log, setLog] = useState(null);
  const [airports, setAirports] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [closed, setClosed] = useState(closedForVisit);
  const toggle = (section) => {
    const next = closed.includes(section) ? closed.filter((s) => s !== section) : [...closed, section];
    setClosed(next);
    try {
      if (next.length) sessionStorage.setItem(FLIGHT_LOG_CLOSED_KEY, JSON.stringify(next));
      else sessionStorage.removeItem(FLIGHT_LOG_CLOSED_KEY);
    } catch {
      // Storage blocked: it stays as chosen while the log is open
    }
  };

  const reload = useCallback(
    () =>
      getMapFlights(mapId)
        .then(setLog)
        .catch(() => setError('Your flight log couldn’t be loaded.')),
    [mapId],
  );
  useEffect(() => {
    reload();
    loadAirports()
      .then(setAirports)
      .catch(() => setError('The airports couldn’t be loaded.'));
  }, [reload]);

  const airportOf = (code) => airportFrom(airports, code);
  const stamps = useMemo(() => (log && airports ? log.totals.airports.map((code) => airportFrom(airports, code) ?? { code, city: '' }) : []), [log, airports]);
  const firstFlown = useMemo(() => firstFlownByAirport(log?.flights), [log]);

  const api = useMemo(() => ({ createTrip, createStop, addFlights, setVisit: onSetVisit }), [onSetVisit]);
  const saved = async (result) => {
    setAdding(false);
    setNote(
      [
        result.added ? `${word(result.added, 'flight', 'flights')} added` : 'Those flights were already in your log',
        result.skipped && result.added ? `${word(result.skipped, 'was', 'were')} already there` : '',
        result.marked.length ? `${result.marked.map(countryName).join(', ')} marked visited` : '',
      ]
        .filter(Boolean)
        .join('; ') + '.',
    );
    await reload();
    onChanged?.();
  };
  const remove = async (flight) => {
    setError('');
    try {
      await deleteFlight(flight.id);
      await reload();
    } catch (err) {
      setError(err?.friendlyMessage || 'That flight couldn’t be deleted.');
    }
  };

  return createPortal(
    <Modal title='Flight log' onClose={onClose} wide>
      <div className='grid gap-5'>
        {log ? <FlightTotals totals={log.totals} unit={unit} /> : <p role='status'>Loading your flights…</p>}
        {note ? (
          <p role='status' className='text-sm font-medium'>
            {note}
          </p>
        ) : null}
        <InlineAlert>{error}</InlineAlert>

        {canEdit ? (
          <section className='grid gap-3' aria-labelledby='flight-add-heading'>
            <h3 id='flight-add-heading' className='font-travel text-lg uppercase tracking-wide text-colour9'>
              Add flights
            </h3>
            {!canAdd ? (
              <p className='text-sm'>Verify your email address to add flights.</p>
            ) : adding && airports ? (
              <FlightAddForm
                mapId={mapId}
                airports={airports}
                trips={trips}
                visitsByCode={visitsByCode}
                splitUk={splitUk}
                api={api}
                onSaved={saved}
                onCancel={() => setAdding(false)}
              />
            ) : (
              <div className='grid justify-start'>
                <Button
                  onClick={() => {
                    setNote('');
                    setAdding(true);
                  }}
                  disabled={!airports}
                >
                  Scan a boarding pass
                </Button>
              </div>
            )}
          </section>
        ) : null}

        {stamps.length ? (
          <FoldSection id='airports' title='Airports collected' open={!closed.includes('airports')} onToggle={() => toggle('airports')}>
            <ul className='grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-x-3 gap-y-4 p-2' data-airport-stamps>
              {stamps.map((airport) => {
                const first = firstFlown.get(airport.code);
                return (
                  <li key={airport.code} title={airport.name}>
                    <AirportStamp airport={airport} firstFlownOn={first} />
                    <span className='sr-only'>
                      {airport.name || airport.code} ({airport.code}){first ? `, first flown ${dayWords(first)}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          </FoldSection>
        ) : null}

        <FoldSection id='flights' title='Flights taken' open={!closed.includes('flights')} onToggle={() => toggle('flights')}>
          {log && !log.flights.length ? <p className='text-sm'>No flights yet: scan a boarding pass to start your log.</p> : null}
          <ol className='grid gap-2'>
            {(log?.flights ?? []).map((flight) => {
              const from = airportOf(flight.from);
              const to = airportOf(flight.to);
              return (
                <li key={flight.id} className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-dashed border-poster-brown/40 pb-2 text-sm' data-flight={`${flight.from}-${flight.to}`}>
                  <span className='grid'>
                    <span className='font-semibold'>
                      {flight.from} → {flight.to}
                      {flightCode(flight) ? ` · ${flightCode(flight)}` : ''}
                    </span>
                    <span className='text-xs'>
                      {dayWords(flight.flownOn)} · {from?.city || flight.from} to {to?.city || flight.to} · {distanceWords(flight.distanceKm, unit)}
                    </span>
                  </span>
                  {canEdit && canAdd ? (
                    <Button quiet danger onClick={() => remove(flight)}>
                      Delete
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </FoldSection>
      </div>
    </Modal>,
    document.body,
  );
}

export default FlightLogDialog;
