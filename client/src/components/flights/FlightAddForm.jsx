import React, { useId, useMemo, useState } from 'react';
// Components
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import CheckboxInput from '@/components/ui/CheckboxInput';
// Utils
import { countryName } from '@/utils/map/countries';
import { parseBoardingPass } from '@/utils/flights/boardingPass';
import { readBarcode } from '@/utils/flights/barcode';
import { airportFrom, airportLabel, placeOfAirport } from '@/utils/flights/airports';
import { distanceWords, flightCode, flightDays, flightKm, flightPlaces, tripForDay } from '@/utils/flights/flightLog';
import { saveFlights } from '@/utils/flights/saveFlights';
import { todayString } from '@/utils/offers/offerContext';

const NEW_TRIP = 'new';
const NO_TRIP = 'none';
const dayWords = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const NOT_A_PASS = 'That isn’t a boarding pass’s barcode. Try a sharper picture, paste its text, or type the flight in.';

// The ways a flight comes in: a picture of the barcode, its text, or typed
function FlightSources({ airports, onRead }) {
  const uid = useId();
  const [status, setStatus] = useState({ busy: false, error: '' });
  const [text, setText] = useState('');
  const [typed, setTyped] = useState({ from: '', to: '', flownOn: '', carrier: '', flightNumber: '' });
  const set = (key) => (e) => setTyped((prev) => ({ ...prev, [key]: e.target.value }));

  const fromText = (value, source) => {
    const pass = parseBoardingPass(value);
    if (!pass) return setStatus({ busy: false, error: NOT_A_PASS });
    setStatus({ busy: false, error: '' });
    return onRead(pass.flights, source);
  };
  const scan = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStatus({ busy: true, error: '' });
    try {
      const value = await readBarcode(file);
      if (!value) return setStatus({ busy: false, error: 'No barcode could be read in that picture. Try a sharper, closer one, or paste or type the flight.' });
      return fromText(value, 'BOARDING_PASS');
    } catch {
      return setStatus({ busy: false, error: 'That picture couldn’t be opened.' });
    }
  };
  const typedFlight = (e) => {
    e.preventDefault();
    const from = typed.from.trim().toUpperCase();
    const to = typed.to.trim().toUpperCase();
    if (!airportFrom(airports, from) || !airportFrom(airports, to) || from === to) {
      return setStatus({ busy: false, error: 'Give two different airports by their three-letter codes, such as LHR and JFK.' });
    }
    if (!typed.flownOn) return setStatus({ busy: false, error: 'Give the day of the flight.' });
    setStatus({ busy: false, error: '' });
    return onRead([{ from, to, flownOn: typed.flownOn, carrier: typed.carrier.trim().toUpperCase() || null, flightNumber: typed.flightNumber.trim().toUpperCase() || null }], 'MANUAL');
  };

  return (
    <div className='grid gap-4'>
      <section className='grid gap-2' aria-labelledby={`${uid}-scan`}>
        <h4 id={`${uid}-scan`} className='font-semibold'>
          Scan a boarding pass
        </h4>
        <p className='text-sm'>A photo of the paper pass, or a screenshot of the one on your phone or in its PDF: the barcode tells us the flights.</p>
        <label className='btn-paper relative grid cursor-pointer justify-self-start'>
          <span>{status.busy ? 'Reading the barcode…' : 'Choose a picture of the barcode'}</span>
          <input type='file' accept='image/*' className='sr-only' onChange={scan} disabled={status.busy} data-boarding-pass-file />
        </label>
      </section>
      <section className='grid gap-2' aria-labelledby={`${uid}-paste`}>
        <h4 id={`${uid}-paste`} className='font-semibold'>
          Or paste the barcode’s text
        </h4>
        <FormField id={`${uid}-text`} label='The barcode’s text (it starts with M1 or M2)' align='start'>
          <TextAreaInput value={text} onChange={(e) => setText(e.target.value)} rows={2} />
        </FormField>
        <div className='grid justify-start'>
          <Button quiet disabled={!text.trim()} onClick={() => fromText(text.trim(), 'BOARDING_PASS')}>
            Read it
          </Button>
        </div>
      </section>
      <form className='grid gap-2' aria-labelledby={`${uid}-type`} onSubmit={typedFlight} noValidate>
        <h4 id={`${uid}-type`} className='font-semibold'>
          Or type a flight in
        </h4>
        <div className='grid gap-2 sm:grid-cols-3'>
          <FormField id={`${uid}-from`} label='From (airport code)' align='start'>
            <TextInput value={typed.from} onChange={set('from')} maxLength={3} placeholder='LHR' />
          </FormField>
          <FormField id={`${uid}-to`} label='To (airport code)' align='start'>
            <TextInput value={typed.to} onChange={set('to')} maxLength={3} placeholder='JFK' />
          </FormField>
          <FormField id={`${uid}-day`} label='Day' align='start'>
            <TextInput type='date' value={typed.flownOn} onChange={set('flownOn')} />
          </FormField>
          <FormField id={`${uid}-carrier`} label='Airline code (if you know it)' align='start'>
            <TextInput value={typed.carrier} onChange={set('carrier')} maxLength={3} placeholder='BA' />
          </FormField>
          <FormField id={`${uid}-number`} label='Flight number' align='start'>
            <TextInput value={typed.flightNumber} onChange={set('flightNumber')} maxLength={5} placeholder='117' />
          </FormField>
        </div>
        <div className='grid justify-start'>
          <Button quiet type='submit'>
            Add this flight
          </Button>
        </div>
      </form>
      <InlineAlert>{status.error}</InlineAlert>
    </div>
  );
}

/**
 * Adding flights to the flight log (23 Nov 2026, the user's wish: scan a boarding pass, and the
 * trip and its countries fill in): read them (FlightSources), then check them: the flights, the
 * places to mark visited (a change of planes left unticked), and the trip they were on (one of
 * the map's covering the day, or a new one with the flights' days and a stop per place). Saved
 * with utils/flights/saveFlights.js through `api` ({ createTrip, createStop, addFlights,
 * setVisit }); `onSaved(result)` afterwards. `airports` is the loaded airport data.
 */
function FlightAddForm({ mapId, airports, trips = [], visitsByCode = {}, splitUk = false, api, onSaved, onCancel }) {
  const uid = useId();
  const [read, setRead] = useState(null); // { flights, source }
  const [ticked, setTicked] = useState(new Set());
  const [tripChoice, setTripChoice] = useState(NEW_TRIP);
  const [newTrip, setNewTrip] = useState({ title: '', startDate: '', endDate: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const airportOf = useMemo(() => (code) => airportFrom(airports, code), [airports]);
  const ownTrips = useMemo(() => trips.filter((trip) => !trip.linked), [trips]);
  const places = useMemo(() => (read ? flightPlaces(read.flights, airportOf, splitUk) : []), [read, airportOf, splitUk]);

  const onRead = (flights, source) => {
    const found = flightPlaces(flights, airportOf, splitUk);
    const days = flightDays(flights);
    const firstArrival = flights.map((f) => airportOf(f.to)).find(Boolean);
    const covering = tripForDay(ownTrips, days.startDate);
    setRead({ flights, source });
    setTicked(new Set(found.filter((place) => !place.connection).map((place) => place.code)));
    setTripChoice(covering ? covering.id : NEW_TRIP);
    setNewTrip({ title: firstArrival ? `Trip to ${firstArrival.city || countryName(placeOfAirport(firstArrival, splitUk))}` : 'A trip', ...days });
    setError('');
  };
  const removeFlight = (index) =>
    setRead((prev) => {
      const flights = prev.flights.filter((_, i) => i !== index);
      return flights.length ? { ...prev, flights } : null;
    });

  const unknown = read ? [...new Set(read.flights.flatMap((f) => [f.from, f.to]).filter((code) => !airportOf(code)))] : [];

  const save = async () => {
    if (tripChoice === NEW_TRIP && (!newTrip.title.trim() || !newTrip.startDate || !newTrip.endDate || newTrip.endDate < newTrip.startDate)) {
      return setError('Give the new trip a title, and the day it starts and the day it ends.');
    }
    setBusy(true);
    setError('');
    try {
      // A new trip's stops: the places flown to, in order, never the first one left from
      const home = read.flights[0] && airportOf(read.flights[0].from) ? placeOfAirport(airportOf(read.flights[0].from), splitUk) : null;
      const stops = [];
      for (const flight of read.flights) {
        const airport = airportOf(flight.to);
        const code = airport && placeOfAirport(airport, splitUk);
        if (code && code !== home && ticked.has(code) && !stops.some((stop) => stop.code === code)) stops.push({ code, city: airport.city || null });
      }
      const trip =
        tripChoice === NEW_TRIP ? { kind: 'new', title: newTrip.title.trim(), startDate: newTrip.startDate, endDate: newTrip.endDate } : tripChoice === NO_TRIP ? { kind: 'none' } : { kind: 'existing', tripId: tripChoice };
      const result = await saveFlights(
        { mapId, flights: read.flights, source: read.source, trip, stops, ticked: [...ticked], visitsByCode, today: todayString() },
        api,
      );
      onSaved(result);
    } catch (err) {
      setError(err?.friendlyMessage || 'The flights couldn’t be saved.');
      setBusy(false);
    }
    return undefined;
  };

  if (!read) {
    return (
      <div className='grid gap-3'>
        <FlightSources airports={airports} onRead={onRead} />
        {onCancel ? (
          <div className='grid justify-start'>
            <Button quiet onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  const tripOptions = [
    { value: NEW_TRIP, label: 'A new trip' },
    ...ownTrips.map((trip) => ({ value: trip.id, label: trip.startDate ? `${trip.title} (${dayWords(trip.startDate)})` : trip.title })),
    { value: NO_TRIP, label: 'Not part of a trip' },
  ];
  return (
    <div className='grid gap-4' data-flight-confirm>
      <section className='grid gap-2' aria-labelledby={`${uid}-flights`}>
        <h4 id={`${uid}-flights`} className='font-semibold'>
          {read.flights.length === 1 ? 'The flight' : `The ${read.flights.length} flights`}
        </h4>
        <ol className='grid gap-2'>
          {read.flights.map((flight, index) => {
            const from = airportOf(flight.from);
            const to = airportOf(flight.to);
            return (
              <li key={`${flight.from}-${flight.to}-${flight.flownOn}-${index}`} className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm' data-flight-leg>
                <span>
                  <span className='font-semibold'>{dayWords(flight.flownOn)}</span> · {from ? airportLabel(from) : flight.from} → {to ? airportLabel(to) : flight.to}
                  {flightCode(flight) ? ` · ${flightCode(flight)}` : ''}
                  {from && to ? ` · ${distanceWords(flightKm(from, to))}` : ''}
                </span>
                <Button quiet onClick={() => removeFlight(index)}>
                  Remove
                </Button>
              </li>
            );
          })}
        </ol>
      </section>

      {unknown.length ? (
        <InlineAlert>{`We don’t know the airport${unknown.length > 1 ? 's' : ''} ${unknown.join(', ')}: remove ${unknown.length > 1 ? 'those flights' : 'that flight'}, or type it in.`}</InlineAlert>
      ) : null}

      <fieldset className='grid gap-2'>
        <legend className='font-semibold'>Mark on the map as visited</legend>
        {places.map((place) => {
          const already = Boolean(visitsByCode[place.code]);
          return (
            <CheckboxInput
              key={place.code}
              id={`${uid}-place-${place.code}`}
              checked={already || ticked.has(place.code)}
              disabled={already}
              onChange={(e) =>
                setTicked((prev) => {
                  const next = new Set(prev);
                  if (e.target.checked) next.add(place.code);
                  else next.delete(place.code);
                  return next;
                })
              }
              label={
                <span>
                  {countryName(place.code)}
                  {already ? <span className='text-xs'> (already on your map)</span> : place.connection ? <span className='text-xs'> (changing planes)</span> : null}
                </span>
              }
            />
          );
        })}
      </fieldset>

      <div className='grid gap-2'>
        <FormField id={`${uid}-trip`} label='The trip it was part of' align='start'>
          <PlainOptionSelect value={tripChoice} onChange={(e) => setTripChoice(e.target.value)} options={tripOptions} />
        </FormField>
        {tripChoice === NEW_TRIP ? (
          <div className='grid gap-2 sm:grid-cols-3'>
            <FormField id={`${uid}-title`} label='Its title' align='start'>
              <TextInput value={newTrip.title} onChange={(e) => setNewTrip((prev) => ({ ...prev, title: e.target.value }))} maxLength={120} />
            </FormField>
            <FormField id={`${uid}-start`} label='From' align='start'>
              <TextInput type='date' value={newTrip.startDate} onChange={(e) => setNewTrip((prev) => ({ ...prev, startDate: e.target.value }))} />
            </FormField>
            <FormField id={`${uid}-end`} label='To' align='start'>
              <TextInput type='date' value={newTrip.endDate} min={newTrip.startDate || undefined} onChange={(e) => setNewTrip((prev) => ({ ...prev, endDate: e.target.value }))} />
            </FormField>
          </div>
        ) : null}
      </div>

      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-flow-col justify-start gap-2'>
        <Button busy={busy} disabled={unknown.length > 0} onClick={save}>
          Save to my flight log
        </Button>
        <Button quiet onClick={() => setRead(null)}>
          Start again
        </Button>
      </div>
    </div>
  );
}

export default FlightAddForm;
