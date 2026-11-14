import React from 'react';
import RadioInput from './RadioInput';

// Radio options in one <fieldset>
function RadioGroup({
  legend,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  ariaInvalid = false,
  ariaDescribedBy,
  className = 'grid gap-y-2',
  optionsClassName = 'grid gap-y-1',
}) {
  return (
    <fieldset className={className} aria-describedby={ariaDescribedBy}>
      {legend ? (
        <legend className='block text-center text-sm font-medium w-full'>
          {legend}
          {required ? (
            <span className='text-status-critical' aria-hidden='true'>
              {' '}
              *
            </span>
          ) : null}
        </legend>
      ) : null}

      <div className={optionsClassName}>
        {options.map((opt) => (
          <RadioInput
            key={opt.value}
            id={`${name}-${opt.value}`}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={onChange}
            label={opt.label}
            required={required}
            disabled={disabled || opt.disabled}
            ariaInvalid={ariaInvalid}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default RadioGroup;
