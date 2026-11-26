import React from 'react';
// Utils
import { VISIT_STATUS_LABELS } from '@/utils/map/visitStatus';

/**
 * A country map's states and pins as a list (19 Nov 2026, the audit): the way in from the
 * keyboard or a screen reader, as the country list is for the world map, since the shapes and
 * pins on the map answer only a press. The content of a panel in the middle of the screen,
 * opened from the map's list stamp (CountryMapView; 19 Nov 2026, the user's wish: it was a
 * disclosure in the map's header). Each state opens its card (`onOpenState(code, button)`,
 * the card beside the button), each landmark model drawn (`models`) its card
 * (`onOpenModel(id, button)`; 24 Nov 2026), each pin its panel (`onOpenPin(id)`). `word` is the
 * country's `[one, many]` ("state", "states").
 */
function CountryMapList({ areas, statuses, pins, word, models = [], onOpenState, onOpenModel, onOpenPin }) {
  const states = areas.filter((area) => area.code).sort((a, b) => a.name.localeCompare(b.name));
  const landmarks = [...models].sort((a, b) => a.name.localeCompare(b.name));
  const many = word?.[1] || 'states';

  return (
    <>
      <section className='grid gap-1'>
        <h3 className='font-travel text-sm uppercase tracking-wide text-colour9'>{`${many[0].toUpperCase()}${many.slice(1)}`}</h3>
        <ul className='grid gap-1'>
          {states.map((area) => {
            const status = statuses.get(area.code);
            return (
              <li key={area.code}>
                <button
                  type='button'
                  onClick={(e) => onOpenState(area.code, e.currentTarget)}
                  className='btn-paper w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left [--btn-pad-x:0.5rem] [--btn-pad-y:0.125rem] [--btn-size:0.8125rem]'
                >
                  <span className='break-words'>{area.name}</span>
                  <span className='text-xs opacity-80'>{status ? VISIT_STATUS_LABELS[status] : 'Not been yet'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      {landmarks.length && onOpenModel ? (
        <section className='grid gap-1'>
          <h3 className='font-travel text-sm uppercase tracking-wide text-colour9'>Landmarks</h3>
          <ul className='grid gap-1'>
            {landmarks.map((model) => (
              <li key={model.id}>
                <button
                  type='button'
                  data-list-model={model.id}
                  onClick={(e) => onOpenModel(model.id, e.currentTarget)}
                  className='btn-paper w-full text-left [--btn-pad-x:0.5rem] [--btn-pad-y:0.125rem] [--btn-size:0.8125rem]'
                >
                  <span className='break-words'>{model.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className='grid gap-1'>
        <h3 className='font-travel text-sm uppercase tracking-wide text-colour9'>Pins</h3>
        {pins.length ? (
          <ul className='grid gap-1'>
            {pins.map((pin) => (
              <li key={pin.id}>
                <button
                  type='button'
                  onClick={() => onOpenPin(pin.id)}
                  className='btn-paper w-full text-left [--btn-pad-x:0.5rem] [--btn-pad-y:0.125rem] [--btn-size:0.8125rem]'
                >
                  <span className='break-words'>{pin.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm'>No pins yet.</p>
        )}
      </section>
    </>
  );
}

export default CountryMapList;
