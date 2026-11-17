import React, { useState } from 'react';
// Components
import MapActionButton from './MapActionButton';
import FormField from '@/components/ui/FormField';
import TextAreaInput from '@/components/ui/TextAreaInput';
// Utils
import { NOTES_MAX, cleanNote } from '@/utils/map/visitNotes';

/**
 * The country's one note at the top of its ticket: a plan or a reminder ("I want to visit
 * here", "Cherry blossom is in early April"). Editors write it (`onSave(notes)`, which
 * saves the visit with its status, so it shows once the country has one); everyone else,
 * and an editor whose email address isn't verified yet, reads it. It's cleaned and cut as
 * the server does (utils/map/visitNotes.js), so what shows is what was kept.
 */
function CountryNotes({ code, notes, canEdit, onSave }) {
  const saved = notes || '';
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const headingId = `notes-${code}`;

  if (!canEdit) {
    return saved ? (
      <section aria-labelledby={headingId} className='paper-aged grid gap-1 border-2 border-poster-brown/60 px-3 py-2 text-poster-ink shadow-paper'>
        <h3 id={headingId} className='font-travel text-base uppercase tracking-wide text-poster-brown'>
          Notes
        </h3>
        <p className='whitespace-pre-line break-words text-sm'>{saved}</p>
      </section>
    ) : null;
  }

  const next = cleanNote(draft);
  const changed = (next || '') !== saved;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      await onSave(next);
      setDraft(next || '');
      setStatus(next ? 'Note saved.' : 'Note cleared.');
    } catch (err) {
      setError(err.friendlyMessage || 'The note could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className='grid gap-2' aria-busy={saving ? 'true' : undefined}>
      <FormField id={`notes-field-${code}`} label='Notes' error={error || undefined} hint='A plan or a reminder, up to 1,000 characters.'>
        <TextAreaInput
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setStatus(null);
          }}
          rows={2}
          maxLength={NOTES_MAX}
          placeholder='I want to visit here…'
        />
      </FormField>
      <div className='grid grid-cols-rev items-center gap-3 phone:grid-cols-1 phone:gap-1'>
        <p role='status' className='text-xs phone:order-last'>
          {status}
        </p>
        <MapActionButton type='submit' quiet busy={saving} disabled={!changed}>
          Save note
        </MapActionButton>
      </div>
    </form>
  );
}

export default CountryNotes;
