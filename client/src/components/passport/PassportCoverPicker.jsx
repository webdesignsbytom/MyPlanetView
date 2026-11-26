import React from 'react';
// Icons
import { FaCheck } from 'react-icons/fa';
// Utils
import { COVER_COLOURS, planCoverColour } from '@/utils/passport/passportBook';

/**
 * The passport cover's colour (26 Nov 2026, the user's wish: "just the cover colour, and gold or
 * silver lettering stays tied to the plan"), for the map's owner and co-owners: a round swatch of
 * leather per colour, the one in use ticked. `value` is the colour chosen (null: the plan's own,
 * `plan`'s), `onChange` gets the new one (the plan's own colour goes back to null, so it follows
 * the plan). `busy` while it's saved; `error` says why it wasn't.
 */
function PassportCoverPicker({ value, plan, onChange, busy = false, error = '' }) {
  const planColour = planCoverColour(plan);
  const current = value || planColour;
  return (
    <fieldset className='grid gap-3' aria-busy={busy ? 'true' : undefined}>
      <legend className='font-travel text-lg uppercase tracking-wide text-colour9'>Cover colour</legend>
      <div className='grid grid-cols-3 gap-3 sm:grid-cols-6'>
        {COVER_COLOURS.map((colour) => {
          const on = colour.id === current;
          return (
            <label key={colour.id} className='relative grid cursor-pointer justify-items-center gap-1 text-center text-sm' data-cover-colour={colour.id}>
              <input
                type='radio'
                name='passport-cover-colour'
                value={colour.id}
                checked={on}
                disabled={busy}
                onChange={() => onChange(colour.id === planColour ? null : colour.id)}
                className='peer sr-only'
              />
              <span
                aria-hidden='true'
                className={`grid h-12 w-12 place-items-center rounded-full border-4 text-poster-cream shadow-paper peer-focus-visible:ring-4 peer-focus-visible:ring-colour6 ${
                  on ? 'border-poster-red' : 'border-poster-brown/40'
                }`}
                style={{ backgroundColor: `var(${colour.token})` }}
              >
                {on ? <FaCheck /> : null}
              </span>
              <span>
                {colour.label}
                {colour.id === planColour ? <span className='block text-2xs opacity-80'>Your plan’s</span> : null}
              </span>
            </label>
          );
        })}
      </div>
      <p className='text-xs'>The lettering stays your plan’s{plan?.id === 'REGULAR' ? ', silver' : ', gold'}. Everyone who opens the passport sees the colour chosen.</p>
      {error ? (
        <p role='alert' className='text-sm font-medium text-status-critical'>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export default PassportCoverPicker;
