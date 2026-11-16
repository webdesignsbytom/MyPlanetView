import React from 'react';
// Utils
import { priceText } from '@/utils/plans/billing';

const CHOICES = [
  { value: 'MONTH', label: 'Monthly' },
  { value: 'YEAR', label: 'Yearly', hint: 'Two months free' },
];

// Paying monthly or yearly, as two ticket-style radio cards (like the map's group
// picker). `prices` ({ MONTH, YEAR } in pence) puts each price on its card.
function IntervalPicker({ value, onChange, name, legend = 'How do you want to pay?', prices = null, disabled = false }) {
  return (
    // min-w-0: a fieldset is never narrower than its content otherwise, which widened the
    // whole card on a phone
    <fieldset className='grid min-w-0 gap-2' disabled={disabled}>
      <legend className='text-sm font-medium'>{legend}</legend>
      <div className='grid grid-cols-2 gap-2'>
        {CHOICES.map((choice) => (
          <label
            key={choice.value}
            className={`grid cursor-pointer gap-0.5 border-2 px-3 py-2 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
              value === choice.value
                ? 'paper-aged border-poster-red text-poster-ink shadow-paper'
                : 'border-dashed border-poster-brown/60 hover:border-solid hover:border-poster-brown'
            }`}
          >
            <input
              type='radio'
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className='sr-only'
            />
            <span className='font-travel text-lg uppercase leading-tight tracking-wide'>{choice.label}</span>
            {prices ? <span className='text-sm'>{priceText(prices[choice.value], choice.value)}</span> : null}
            {choice.hint ? <span className='text-xs opacity-80'>{choice.hint}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default IntervalPicker;
