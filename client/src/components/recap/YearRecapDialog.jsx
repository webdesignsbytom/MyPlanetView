import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import RecapSlide from './RecapSlide';
// Utils
import { loadYearRecap, recapCardOptions, recapSlides } from '@/utils/recap/recap';
import { cardMapView } from '@/utils/shareCard/cardMapView';

// "Your year in travel" (docs/API.md "Year in travel"; 21 Nov 2026, the user's wish): one year
// of the map as a few slides (RecapSlide), Back and Next (or the arrow keys), ending on its
// share card, in `design`'s colours (the design the map is shown in, or null). Any year the
// map has something in can be chosen. Portalled over the page. The card's map is the whole
// world, or the year's places close up, by the owner's choice on its slide (24 Nov 2026, the
// user's wish: "offer both on the year card").
function YearRecapDialog({ map, design = null, year: firstYear, onClose }) {
  const uid = useId();
  const [year, setYear] = useState(firstYear);
  // Each year's answer as it arrives (`{ recap }` or `{ error }`), so a year comes back at once
  const [loaded, setLoaded] = useState({});
  const [index, setIndex] = useState(0);
  const [closeUp, setCloseUp] = useState(false);
  const headingRef = useRef(null);
  const movedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    loadYearRecap(map.id, year)
      .then((recap) => alive && setLoaded((was) => ({ ...was, [year]: { recap } })))
      .catch((err) => alive && setLoaded((was) => ({ ...was, [year]: { error: err?.friendlyMessage || 'Your year couldn’t be loaded.' } })));
    return () => {
      alive = false;
    };
  }, [map.id, year]);

  const answer = loaded[year];
  const recap = answer?.recap ?? null;
  const slides = useMemo(() => recapSlides(recap), [recap]);
  const card = useMemo(() => (recap ? recapCardOptions(recap, map, design, { closeUp }) : null), [recap, map, design, closeUp]);
  // A close-up only when it shows something the whole world doesn't (places near each other)
  const canCloseUp = useMemo(() => Boolean(recap) && cardMapView(recap.places).kind !== 'world', [recap]);
  const at = Math.min(index, Math.max(0, slides.length - 1));
  const years = recap?.years?.length ? [...new Set([year, ...recap.years])].sort((a, b) => b - a) : [year];

  // A slide moved to puts focus on its heading, so it's read out
  useEffect(() => {
    if (movedRef.current) headingRef.current?.focus();
  }, [at, year]);

  const go = (step) => {
    movedRef.current = true;
    setIndex(Math.min(Math.max(0, at + step), slides.length - 1));
  };
  const onKeyDown = (e) => {
    // Never from a field: the share slide's words move their caret with the arrows
    if (e.target.closest?.('select, input, textarea, button')) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
  };

  return createPortal(
    <Modal title='Your year in travel' onClose={onClose} wide fill>
      <div className='grid gap-4' onKeyDown={onKeyDown} data-year-recap={year}>
        <div className='grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3'>
          <FormField id={`${uid}-year`} label='Year' align='start'>
            <PlainOptionSelect
              value={String(year)}
              onChange={(e) => {
                movedRef.current = false;
                setIndex(0);
                setYear(Number(e.target.value));
              }}
              options={years.map((y) => ({ value: String(y), label: String(y) }))}
            />
          </FormField>
          {slides.length ? (
            <p className='pb-2 text-sm' aria-live='polite'>
              {at + 1} of {slides.length}
            </p>
          ) : null}
        </div>

        {!answer ? (
          <p aria-live='polite'>Gathering your {year}…</p>
        ) : answer.error ? (
          <p role='alert' className='font-medium text-status-critical'>
            {answer.error}
          </p>
        ) : !slides.length ? (
          <p>
            Nothing on “{map.name}” for {year} yet. Photos taken that year, trips, moments and first visits fill it in.
            {years.length > 1 ? ' Choose another year above.' : ''}
          </p>
        ) : (
          <section aria-roledescription='slide' aria-label={`${at + 1} of ${slides.length}`} className='paper-aged grid min-h-72 content-start border-2 border-poster-brown p-4 sm:p-6'>
            <RecapSlide
              key={`${year}-${slides[at]}`}
              kind={slides[at]}
              recap={recap}
              map={map}
              card={card}
              closeUp={canCloseUp ? closeUp : null}
              onCloseUp={setCloseUp}
              headingRef={headingRef}
            />
          </section>
        )}

        {slides.length ? (
          <div className='grid grid-cols-2 gap-2'>
            <Button quiet disabled={at === 0} onClick={() => go(-1)}>
              Back
            </Button>
            {at < slides.length - 1 ? <Button onClick={() => go(1)}>Next</Button> : <Button onClick={onClose}>Done</Button>}
          </div>
        ) : null}
      </div>
    </Modal>,
    document.body,
  );
}

export default YearRecapDialog;
