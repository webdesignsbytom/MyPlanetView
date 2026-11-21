import React, { useState } from 'react';
// Api
import { updateMap } from '@/api/travelApi';
// Components
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import SavedStamp from '@/components/common/SavedStamp';
// Utils
import { HOME_COUNTRY_OPTIONS, countryName } from '@/utils/map/countries';
import { withThe } from '@/utils/map/travelStatWords';

// The map's home (docs/API.md "Stats"; 21 Nov 2026), for the owner and co-owners: where its
// people live, so the statistics' distance travelled (home, the trip, home again) and the
// place furthest from home start there. Not set, the server takes the birth country of the
// owner's traveller, else of the first traveller with one, which the hint names. Saved as
// soon as it's chosen.
function MapHomeSection({ map, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const fallback = map.homeCountryCode ? null : (map.stats?.homeCountryCode ?? null);

  const choose = async (e) => {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      await updateMap(map.id, { homeCountryCode: e.target.value || null });
      await onChanged?.();
      setSaved(true);
    } catch (err) {
      setError(err.friendlyMessage || 'That didn’t save. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const hint = fallback
    ? `The statistics measure distances from home. Not set, home is ${withThe(countryName(fallback))}, where a traveller was born.`
    : 'The statistics measure distances from home. Not set, home is where a traveller was born.';

  return (
    <section className='grid gap-2 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='map-home-heading'>
      <h3 id='map-home-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Home
      </h3>
      <FormField id='map-home-country' label='Where you live' hint={hint} error={error || undefined}>
        <PlainOptionSelect
          value={map.homeCountryCode || ''}
          onChange={choose}
          disabled={busy}
          options={[{ value: '', label: 'Not set' }, ...HOME_COUNTRY_OPTIONS]}
        />
      </FormField>
      {saved ? <SavedStamp /> : null}
    </section>
  );
}

export default MapHomeSection;
