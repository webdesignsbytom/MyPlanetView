import React, { useId } from 'react';
// Utils
import { POSTCARD_STYLE_CHOICES } from '@/utils/postcards/postcardRules';
import { paletteFor } from '@/utils/postcards/drawPostcard';

/**
 * The postcard's style (26 Nov 2026): Classic, Vintage, Airmail or Night, each a radio card with a
 * swatch of its paper and lettering (the canvas's own colours, brandColours.js POSTCARD_COLOURS,
 * as the card is drawn in them), its name and a few words.
 */
function PostcardStylePicker({ value, onChange, disabled = false }) {
  const uid = useId();
  return (
    <fieldset className='grid gap-2'>
      <legend className='text-sm font-medium'>Style</legend>
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
        {POSTCARD_STYLE_CHOICES.map((choice) => {
          const p = paletteFor(choice.value);
          const chosen = value === choice.value;
          return (
            <label
              key={choice.value}
              data-postcard-style={choice.value}
              className={`relative grid cursor-pointer content-start gap-1 border-2 p-2 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 ${
                chosen ? 'paper-aged border-poster-red shadow-paper' : 'border-dashed border-poster-brown/60 hover:border-solid hover:border-poster-brown'
              }`}
            >
              <input
                type='radio'
                name={`${uid}-style`}
                value={choice.value}
                checked={chosen}
                disabled={disabled}
                onChange={() => onChange(choice.value)}
                className='sr-only'
              />
              {/* The card in small: its paper, edge and lettering */}
              <span
                aria-hidden='true'
                data-keep-colour=''
                className='grid aspect-[3/2] place-items-center border-4 font-travel text-sm'
                style={{ background: p.paper, borderColor: choice.value === 'airmail' ? p.stripes[0] : p.edge, color: p.lettering }}
              >
                Aa
              </span>
              <span className='font-travel text-sm uppercase leading-tight tracking-wide'>{choice.label}</span>
              <span className='text-2xs opacity-80'>{choice.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default PostcardStylePicker;
