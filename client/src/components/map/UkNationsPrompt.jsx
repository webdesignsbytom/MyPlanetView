import React, { useId, useState } from 'react';
// Components
import MapActionButton from './MapActionButton';
import CheckboxInput from '@/components/ui/CheckboxInput';
// Utils
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { UK_NATION_CODES } from '@/utils/map/ukNations';
import { VISIT_STATUS_LABELS } from '@/utils/map/visitStatus';

/**
 * The UK's ticket on a map that splits it, while the UK itself is still marked from before
 * the split (docs/API.md "The UK's nations"): which of its nations does that mark mean?
 * Editors tick them; `onChoose(codes)` then marks each with the UK's status (never lowering
 * one marked higher already) and takes the UK's own mark off. `visitOf(code)` is the map's
 * visit for a place. Viewers are only told.
 */
function UkNationsPrompt({ ukStatus, visitOf, canEdit, onChoose }) {
  const idPrefix = useId();
  // Ticked to start with: the nations already marked
  const [chosen, setChosen] = useState(() => UK_NATION_CODES.filter((code) => Boolean(visitOf(code))));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const label = VISIT_STATUS_LABELS[ukStatus] ?? ukStatus;

  if (!canEdit) {
    return (
      <p className='text-sm'>
        The United Kingdom was marked “{label}” before this map showed it as England, Scotland, Wales and Northern Ireland.
      </p>
    );
  }

  const toggle = (code) => setChosen((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // Every nation ticked, those marked already too: the UK's note and first visit go to
      // the first of them (CountryPanel), and none is lowered there
      await onChoose(chosen);
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
      setSaving(false);
    }
  };

  return (
    <fieldset className='grid gap-3 rounded-lg border-2 border-dashed border-poster-brown px-4 py-3'>
      <legend className='px-1 font-travel text-sm uppercase tracking-wide text-colour9'>Which parts of the UK?</legend>
      <p className='text-sm'>
        This map shows the UK as England, Scotland, Wales and Northern Ireland. The United Kingdom was marked “{label}” before
        that: which of them does that mean? They’re marked “{label}” and the United Kingdom’s own mark comes off.
      </p>
      <div className='grid gap-1 sm:grid-cols-2'>
        {UK_NATION_CODES.map((code) => (
          <CheckboxInput
            key={code}
            id={`${idPrefix}-${code}`}
            name='nations'
            checked={chosen.includes(code)}
            onChange={() => toggle(code)}
            label={COUNTRY_BY_CODE[code].name}
          />
        ))}
      </div>
      {error ? (
        <p role='alert' className='rounded-lg border px-3 py-2 text-sm tone-danger'>
          {error}
        </p>
      ) : null}
      <div className='grid justify-start'>
        <MapActionButton onClick={save} busy={saving} disabled={!chosen.length}>
          Save
        </MapActionButton>
      </div>
    </fieldset>
  );
}

export default UkNationsPrompt;
