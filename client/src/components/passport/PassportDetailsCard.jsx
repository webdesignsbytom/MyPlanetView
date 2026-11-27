import React, { useId, useState } from 'react';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import SavedStamp from '@/components/common/SavedStamp';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import TravellerFieldset from '@/components/onboarding/TravellerFieldset';
// Utils
import { saveTravellerDetails } from '@/utils/map/saveMapSetup';

// The form's copy of a traveller: every field a string, as the inputs keep them
const formOf = (t) => ({
  id: t.id,
  name: t.name || '',
  lastName: t.lastName || '',
  nationalityCode: t.nationalityCode || '',
  birthCountryCode: t.birthCountryCode || '',
  favouriteCountryCode: t.favouriteCountryCode || '',
  birthDate: t.birthDate || '',
});

/**
 * "Travellers’ details" under the passport (27 Nov 2026, the user's wish: "below the passport we
 * should have a edit data container for the peoples info"): for the map's editors, never through
 * a share link, each traveller's first and last name, nationality, birthplace, favourite country
 * and date of birth, as the travellers page shows them, with the same fields as Settings
 * (TravellerFieldset). "Save details" sends only what changed (saveTravellerDetails); travellers
 * are added and taken off in Settings. `travellers` are the passport's (every traveller on the
 * map); `onSaved(saved, { birthplaceChanged })` hands the saved ones back, so the book shows them
 * (a new birthplace can bring a page, so the page reads the passport again). `locked`: an
 * unverified address, told why it can't save yet.
 */
function PassportDetailsCard({ mapId, travellers, locked = false, onSaved }) {
  const headingId = useId();
  const [form, setForm] = useState(() => travellers.map(formOf));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const change = (index) => (next) => {
    setSaved(false);
    setForm((list) => list.map((t, i) => (i === index ? next : t)));
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const done = await saveTravellerDetails(mapId, travellers, form);
      const birthplaceChanged = done.some((t) => (travellers.find((b) => b.id === t.id)?.birthCountryCode || null) !== (t.birthCountryCode || null));
      onSaved?.(done, { birthplaceChanged });
      setSaved(true);
    } catch (err) {
      setError(err?.friendlyMessage || 'The details couldn’t be saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PaperCard>
      <form onSubmit={save} noValidate className='grid gap-4 px-6 py-5 sm:px-8' aria-labelledby={headingId} data-passport-details=''>
        <h2 id={headingId} className='font-travel text-2xl uppercase leading-tight tracking-wide text-colour6'>
          Travellers’ details
        </h2>
        <p className='text-sm'>What each traveller’s passport page shows. Add or take off travellers in the map’s settings.</p>
        {locked ? <VerifyFirstNote action='change these details' /> : null}
        <div className='grid gap-4'>
          {form.map((traveller, i) => (
            <TravellerFieldset
              key={traveller.id}
              index={i}
              traveller={traveller}
              legend={travellers[i]?.name || `Traveller ${i + 1}`}
              onChange={change(i)}
              onRemove={() => {}}
              canRemove={false}
              askBirthDate
            />
          ))}
        </div>
        <InlineAlert>{error}</InlineAlert>
        {saved ? <SavedStamp /> : null}
        <Button type='submit' busy={busy} disabled={locked}>
          Save details
        </Button>
      </form>
    </PaperCard>
  );
}

export default PassportDetailsCard;
