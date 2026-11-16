import React from 'react';

// A checkbox and its label, in the site's paperwork colours rather than the browser's blue
// (the forms plugin draws the box: it fills a ticked one with the text colour, so that's the
// deep poster red, with its cream tick): a brown-edged square on the field colour, red when
// ticked, a red ring for the keyboard. The box sits by the label's first line.
function CheckboxInput({
  id,
  name,
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
        className={`${className} relative top-0.75 size-control cursor-pointer border-2 border-poster-brown bg-field text-poster-red-deep transition checked:border-poster-red-deep checked:bg-poster-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-colour6 disabled:cursor-not-allowed aria-invalid:outline-2 aria-invalid:outline-status-critical`}
        type='checkbox'
        id={id}
        name={name}
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

export default CheckboxInput;
