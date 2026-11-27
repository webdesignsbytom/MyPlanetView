import React, { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { quickFillVisits } from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import CheckboxInput from '@/components/ui/CheckboxInput';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
// Utils
import { CONTINENT_LABELS, COUNTRY_BY_CODE, countriesOnMap } from '@/utils/map/countries';
import { countsAsVisited } from '@/utils/map/visitStatus';
import { trackCountriesMarked } from '@/utils/analytics/siteActions';

const CONTINENT_ORDER = ['EUROPE', 'ASIA', 'AFRICA', 'NORTH_AMERICA', 'SOUTH_AMERICA', 'OCEANIA', 'ANTARCTICA'];
const plain = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Every country on this map (a split UK's nations in its place) and Antarctica, by continent
function placesByContinent(splitUk) {
  const places = [...countriesOnMap(splitUk), COUNTRY_BY_CODE.AQ].filter(Boolean);
  return CONTINENT_ORDER.map((continent) => ({
    continent,
    label: CONTINENT_LABELS[continent],
    places: places.filter((place) => place.continent === continent).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.places.length);
}

/**
 * "Where have you been?" (22 Nov 2026, the user's wish: the map starts full instead of empty):
 * every country by continent with a tick box, to colour in many at once. The map offers it
 * once, the first time it loads with few countries on it (MapExperience), and the country
 * list any time after; it's always optional. Countries already visited or lived in are ticked
 * and fixed (nothing is taken off here); a "want to go" one ticked becomes visited. The owner
 * or a co-owner; it needs no verified email (POST /maps/:mapId/visits/quick-fill). Portalled.
 * `onSaved(added)` after the countries are saved; `first` words it for the first time.
 */
function QuickFillDialog({ mapId, splitUk = false, visitsByCode, first = false, onSaved, onClose }) {
  const uid = useId();
  const groups = useMemo(() => placesByContinent(splitUk), [splitUk]);
  const [chosen, setChosen] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onMap = (code) => countsAsVisited(visitsByCode?.[code]);
  const wanted = plain(query.trim());

  const toggle = (code, on) =>
    setChosen((was) => {
      const next = new Set(was);
      if (on) next.add(code);
      else next.delete(code);
      return next;
    });

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const { added } = await quickFillVisits(mapId, [...chosen]);
      trackCountriesMarked({ status: 'VISITED', count: chosen.size, method: 'quick_fill' });
      await onSaved?.(added);
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'Your countries couldn’t be saved. Please try again.');
      setBusy(false);
    }
  };

  const count = chosen.size;
  return createPortal(
    <Modal title='Where have you been?' onClose={onClose} wide fill>
      <p className='text-sm'>
        {first ? 'Your map is ready. ' : ''}Tick the countries you’ve already been to and they’re coloured in on your map.{' '}
        {first ? 'Skip it if you like: you can tick more any time from the country list.' : ''}
      </p>
      {/* The search and the buttons stay put while the list scrolls under them */}
      <div className='sticky -top-5 z-10 -mx-5 grid gap-3 border-b-2 border-dashed border-poster-brown/50 bg-paper-cream px-5 pb-3 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
        <FormField id={`${uid}-find`} label='Find a country' align='start'>
          <TextInput type='search' value={query} onChange={(e) => setQuery(e.target.value)} autoComplete='off' />
        </FormField>
        <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-3'>
          <Button busy={busy} disabled={!count} onClick={save}>
            {count ? `Colour in ${count} ${count === 1 ? 'country' : 'countries'}` : 'Colour them in'}
          </Button>
          <Button quiet onClick={onClose}>
            {first ? 'Skip' : 'Cancel'}
          </Button>
        </div>
        {error ? (
          <p role='alert' className='text-sm font-medium text-status-critical'>
            {error}
          </p>
        ) : null}
      </div>

      {groups.map((group) => {
        const shown = wanted ? group.places.filter((place) => plain(place.name).includes(wanted)) : group.places;
        if (!shown.length) return null;
        return (
          <fieldset key={group.continent} className='grid gap-2' data-quick-fill-continent={group.continent}>
            <legend className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>{group.label}</legend>
            <div className='grid gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3'>
              {shown.map((place) => {
                const already = onMap(place.code);
                return (
                  <CheckboxInput
                    key={place.code}
                    id={`${uid}-${place.code}`}
                    checked={already || chosen.has(place.code)}
                    disabled={already || busy}
                    onChange={(e) => toggle(place.code, e.target.checked)}
                    label={already ? `${place.name} (on your map)` : place.name}
                  />
                );
              })}
            </div>
          </fieldset>
        );
      })}
      {wanted && !groups.some((group) => group.places.some((place) => plain(place.name).includes(wanted))) ? (
        <p className='text-sm'>No country is called that.</p>
      ) : null}
    </Modal>,
    document.body,
  );
}

export default QuickFillDialog;
