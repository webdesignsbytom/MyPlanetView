import React from 'react';

// A radio button and its label, the same shape and colours as CheckboxInput: a brown-edged
// circle on the field colour, deep poster red with a cream dot when chosen (the forms
// plugin fills it with the text colour), a red ring for the keyboard.
function RadioInput({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  ariaLabel,
  required = false,
  disabled = false,
  ariaInvalid = false,
  ariaDescribedBy,
  className = '',
  labelClassName = '',
  wrapperClassName = '',
}) {
  return (
    <div className={`${wrapperClassName} grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 ${disabled ? 'opacity-50' : ''}`}>
      <input
        className={`${className} relative top-0.75 size-control cursor-pointer rounded-full border-2 border-poster-brown bg-field text-poster-red-deep transition checked:border-poster-red-deep checked:bg-poster-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-colour6 disabled:cursor-not-allowed aria-invalid:outline-2 aria-invalid:outline-status-critical`}
        type='radio'
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={ariaInvalid ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
      />
      <label className={`${labelClassName} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} htmlFor={id}>
        {label}
      </label>
    </div>
  );
}

export default RadioInput;
