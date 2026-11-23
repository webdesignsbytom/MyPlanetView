import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { addFlights, deleteFlight, getMapFlights } from '@/api/flightsApi';
import { createStop, createTrip } from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FlightAddForm from './FlightAddForm';
// Utils
import { countryName } from '@/utils/map/countries';
import { airportFrom, loadAirports } from '@/utils/flights/airports';
import { aroundTheWorld, distanceWords, flightCode } from '@/utils/flights/flightLog';

const dayWords = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const word = (n, one, many) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

// The log's numbers, as a strip of tiles
function FlightTotals({ totals }) {
  const tiles = [
    { label: 'Flights', value: totals.flights.toLocaleString('en-GB') },
    { label: 'Flown', value: distanceWords(totals.distanceKm), note: totals.distanceKm ? `${aroundTheWorld(totals.distanceKm)} times round the world` : null },
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
 * stamps, each flight; and, for an editor (`canEdit`, verified: `canAdd`), adding flights from a
 * boarding pass, its text or typed (FlightAddForm), which fills in the trip and the countries.
 * `onSetVisit(code, status)` marks a place; `onChanged()` reloads the map's trips and visits.
 */
function FlightLogDialog({ mapId, trips = [], visitsByCode = {}, splitUk = false, canEdit = false, canAdd = false, onSetVisit, onChanged, onClose }) {
  const [log, setLog] = useState(null);
  const [airports, setAirports] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

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
        {log ? <FlightTotals totals={log.totals} /> : <p role='status'>Loading your flights…</p>}
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
          <section className='grid gap-2' aria-labelledby='flight-airports-heading'>
            <h3 id='flight-airports-heading' className='font-travel text-lg uppercase tracking-wide text-colour9'>
              Airports collected
            </h3>
            <ul className='grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2' data-airport-stamps>
              {stamps.map((airport, index) => (
                <li
                  key={airport.code}
                  title={airport.name}
                  className={`grid aspect-square place-content-center rounded-full border-4 border-double border-poster-red-deep text-center text-poster-red-deep ${
                    index % 2 ? 'rotate-6' : '-rotate-6'
                  }`}
                >
                  <span className='font-travel text-xl leading-none'>{airport.code}</span>
                  <span className='px-1 text-[0.6rem] uppercase leading-tight'>{airport.city}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className='grid gap-2' aria-labelledby='flight-list-heading'>
          <h3 id='flight-list-heading' className='font-travel text-lg uppercase tracking-wide text-colour9'>
            Flights
          </h3>
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
                      {dayWords(flight.flownOn)} · {from?.city || flight.from} to {to?.city || flight.to} · {distanceWords(flight.distanceKm)}
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
        </section>
      </div>
    </Modal>,
    document.body,
  );
}

export default FlightLogDialog;
