import React from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { monthLabel, photoCount } from '@/utils/themes/themeWords';

const stateOf = (theme) => (theme.running ? 'Running now' : theme.ended ? 'Ended' : 'Coming');
const STATE_TONE = { 'Running now': 'tone-good', Ended: 'tone-muted', Coming: 'tone-info' };

// One theme on the admin page: its month and state, title and line, and what it drew
// (photos entered, on how many maps). It's changed in a dialog; one with no photos
// entered can be deleted.
function ThemeItem({ theme, onEdit, onDelete }) {
  const state = stateOf(theme);
  return (
    <article className='ticket-edge grid gap-2 bg-paper-cream px-4 py-3 text-colour4' aria-label={`${monthLabel(theme.month)}: ${theme.title}`}>
      <p className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs font-semibold uppercase tracking-wide text-colour9'>
        <span>{monthLabel(theme.month)}</span>
        <span className={`rounded-full border px-2 py-0.5 normal-case ${STATE_TONE[state]}`}>{state}</span>
      </p>
      <h3 className='font-travel text-xl uppercase leading-tight tracking-wide text-poster-red-deep'>{theme.title}</h3>
      {theme.blurb ? <p className='text-sm'>{theme.blurb}</p> : null}
      <p className='text-sm'>
        {photoCount(theme.entryCount)} entered
        {theme.entryCount ? ` on ${theme.mapCount === 1 ? '1 map' : `${theme.mapCount} maps`}` : ''}
      </p>
      <div className='grid grid-row-wrap gap-2'>
        <Button small quiet onClick={() => onEdit(theme)} ariaLabel={`Change ${theme.title}`}>
          Change
        </Button>
        {theme.entryCount ? null : (
          <Button small danger onClick={() => onDelete(theme)} ariaLabel={`Delete ${theme.title}`}>
            Delete
          </Button>
        )}
      </div>
    </article>
  );
}

export default ThemeItem;
