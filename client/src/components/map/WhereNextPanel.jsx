import React, { useMemo, useState } from 'react';
// Icons
import { FaCalendarCheck, FaMapMarkedAlt, FaPlaneDeparture, FaSuitcaseRolling } from 'react-icons/fa';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import PanelEmptyState from './PanelEmptyState';
import PassportLink from './PassportLink';
import MonthLinks from '@/components/months/MonthLinks';
import AppLink from '@/components/common/AppLink';
// Hooks
import useCountryGuides from '@/hooks/useCountryGuides';
// Constants
import { countryPagePath } from '@/utils/constants/routes';
// Utils
import { COUNTRY_PAGES } from '@/utils/countries/countryPages';
import { MONTH_NAMES, bestMonthsText } from '@/utils/countries/countryContent';
import { whereNext } from '@/utils/countries/whereNext';
import { countryName } from '@/utils/map/countries';
import { countryOf } from '@/utils/map/ukNations';

const RATING_WORDS = { best: 'Best time', good: 'Good time' };

// One place: its name (opens its ticket on the map), how good the month is, its best months
// and its guide
function Place({ place, onShowCountry, showRating = true }) {
  const best = place.guide ? bestMonthsText(place.guide.months, { short: true }) : '';
  return (
    <li className='grid gap-0.5 py-2' data-where-next={place.code}>
      <span className='grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2'>
        <button type='button' onClick={() => onShowCountry(place.code)} className='justify-self-start text-left font-semibold text-poster-red-deep underline underline-offset-2'>
          {countryName(place.code)}
        </button>
        {showRating && place.rating ? <span className='text-xs font-semibold uppercase tracking-wide text-colour9'>{RATING_WORDS[place.rating]}</span> : null}
      </span>
      {place.guide ? (
        <span className='text-xs'>
          {best ? `Best: ${best}. ` : ''}
          <AppLink to={countryPagePath(place.guide.slug)} label='Read the guide' className='underline underline-offset-2' />
        </span>
      ) : null}
    </li>
  );
}

const List = ({ children }) => <ul className='grid divide-y divide-dashed divide-poster-brown/40'>{children}</ul>;
const Heading = ({ id, children }) => (
  <h3 id={id} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
    {children}
  </h3>
);

/**
 * Where to go next (22 Nov 2026, the user's wish; utils/countries/whereNext.js): the map's
 * "want to go" places matched to the best time for each, from the country guides: those good
 * this month, then the rest at their next best month, then the ones with no guide yet. A
 * place opens its ticket on the map. For everyone who can see the map (share links too).
 * `passportHref` puts "Open passport" at the top (24 Nov 2026, the user's wish).
 * With nothing marked "want to go", a passport page waiting for its first stamp fills the panel
 * (PanelEmptyState, as the trips' and the timeline's; 27 Nov 2026, the user's wish: a line of
 * text at the top looked bare): a plane, what the panel does, and for an editor (`canEdit`) how
 * to start, with "Open the country list" (`onOpenCountries`).
 */
function WhereNextPanel({ visits = [], onShowCountry, passportHref = null, canEdit = false, onOpenCountries = null, onClose }) {
  // This month, read once as the panel opens (the map page is never pre-rendered)
  const [month] = useState(() => new Date().getMonth());
  const codes = useMemo(() => visits.filter((v) => v.status === 'WANT_TO_GO').map((v) => v.countryCode), [visits]);
  const guides = useCountryGuides(codes);
  // Some have a guide in this build, and they haven't arrived yet
  const waiting = !guides.length && codes.some((code) => COUNTRY_PAGES.some((page) => page.code === countryOf(code)));
  const plan = useMemo(() => whereNext({ codes, guides, month }), [codes, guides, month]);
  const empty = !codes.length;

  return (
    <MapPanel title='Where to go next' onClose={onClose} fill={empty}>
      {/* Empty, one cell that fills the panel: the passport link on top, the empty page below it */}
      <div className={`grid gap-4 ${empty ? (passportHref ? 'grid-rows-[auto_minmax(0,1fr)]' : 'grid-rows-[minmax(0,1fr)]') : 'content-start'}`}>
      {passportHref ? <PassportLink href={passportHref} /> : null}
      {empty ? (
        <PanelEmptyState
          icon={<FaPlaneDeparture />}
          title='Where will you go?'
          text={
            canEdit
              ? 'Nothing is marked “Want to go” yet. Mark the countries you’d like to visit, and this shows the best time to go to each.'
              : 'Nothing on this map is marked “Want to go” yet. When it is, this shows the best time to go to each.'
          }
          steps={
            canEdit
              ? [
                  { icon: <FaMapMarkedAlt />, text: 'Mark a country “Want to go”, on the map or in the country list.' },
                  { icon: <FaCalendarCheck />, text: 'See the best month for each, from our country guides.' },
                  { icon: <FaSuitcaseRolling />, text: 'Plan the trip, and count down the days.' },
                ]
              : []
          }
        >
          {canEdit && onOpenCountries ? <MapActionButton onClick={onOpenCountries}>Open the country list</MapActionButton> : null}
        </PanelEmptyState>
      ) : waiting ? (
        <p className='text-sm' role='status'>
          Reading the country guides…
        </p>
      ) : (
        <div className='grid gap-5'>
          <p className='text-sm'>Your “want to go” countries, and the best time for each, from our country guides.</p>

          <section className='grid gap-1' aria-labelledby='where-next-now'>
            <Heading id='where-next-now'>Good in {MONTH_NAMES[month]}</Heading>
            {plan.now.length ? (
              <List>
                {plan.now.map((place) => (
                  <Place key={place.code} place={place} onShowCountry={onShowCountry} />
                ))}
              </List>
            ) : (
              <p className='text-sm'>None of them is at its best this month.</p>
            )}
          </section>

          {plan.upcoming.length ? (
            <section className='grid gap-2' aria-labelledby='where-next-later'>
              <Heading id='where-next-later'>Coming up</Heading>
              {plan.upcoming.map((group) => (
                <section key={group.month} className='grid gap-0.5' aria-label={MONTH_NAMES[group.month]}>
                  <h4 className='font-semibold'>{MONTH_NAMES[group.month]}</h4>
                  <List>
                    {group.places.map((place) => (
                      <Place key={place.code} place={place} onShowCountry={onShowCountry} />
                    ))}
                  </List>
                </section>
              ))}
            </section>
          ) : null}

          {plan.never.length ? (
            <section className='grid gap-1' aria-labelledby='where-next-never'>
              <Heading id='where-next-never'>Any time you can</Heading>
              <List>
                {plan.never.map((place) => (
                  <Place key={place.code} place={place} onShowCountry={onShowCountry} showRating={false} />
                ))}
              </List>
            </section>
          ) : null}

          {plan.noGuide.length ? (
            <section className='grid gap-1' aria-labelledby='where-next-no-guide'>
              <Heading id='where-next-no-guide'>No guide yet</Heading>
              <p className='text-sm'>Our guides to these are still being written.</p>
              <List>
                {plan.noGuide.map((code) => (
                  <Place key={code} place={{ code, rating: null, guide: null }} onShowCountry={onShowCountry} showRating={false} />
                ))}
              </List>
            </section>
          ) : null}

          <MonthLinks months={[month + 1]} lead='More ideas for this month:' />
        </div>
      )}
      </div>
    </MapPanel>
  );
}

export default WhereNextPanel;
