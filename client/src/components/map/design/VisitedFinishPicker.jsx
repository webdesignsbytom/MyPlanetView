import React from 'react';
// Utils
import { VISITED_FINISHES } from '@/utils/map/mapDesign';

/**
 * A metallic finish for the places been to, beside their colour (25 Nov 2026, the user's wish:
 * "a few options next to the colour selector for visited country, like gold silver bronze"):
 * a button per metal, each with a piece of the metal's own picture, pressed while it's the one shown. `value` is the
 * design's `visitedFinish`; `onChange(id)` chooses one, and pressing the chosen one again goes
 * back to the plain colour (`onChange(null)`), as choosing a colour does.
 */
function VisitedFinishPicker({ id, value = null, onChange }) {
  return (
    <div className='grid gap-2' data-visited-finish-picker>
      <span id={`${id}-label`} className='text-sm'>
        Or a metallic finish
      </span>
      <div role='group' aria-labelledby={`${id}-label`} className='grid grid-cols-3 gap-2'>
        {VISITED_FINISHES.map((finish) => {
          const on = value === finish.id;
          return (
            <button
              key={finish.id}
              type='button'
              aria-pressed={on}
              onClick={() => onChange(on ? null : finish.id)}
              data-finish={finish.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-2 px-2 py-1 text-left text-sm font-semibold ${
                on ? 'border-poster-red bg-poster-paper text-poster-red-deep' : 'border-dashed border-poster-brown/60 hover:bg-paper-cream'
              }`}
            >
              <span
                aria-hidden='true'
                className='h-4 w-6 rounded-sm border border-poster-brown bg-cover bg-center'
                style={{ backgroundImage: `url("${finish.texture}")` }}
                data-finish-swatch
              />
              {finish.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default VisitedFinishPicker;
