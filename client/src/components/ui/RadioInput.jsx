import React from 'react';

// Radio input (same shape as CheckboxInput)
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
    <div
      className={`${wrapperClassName} form-check flex ${disabled ? 'opacity-50' : ''}`}
    >
      <input
        className={`${className} h-4 w-4 rounded-full transition duration-200 mt-1 align-top float-left mr-2 cursor-pointer accent-colour6 disabled:cursor-not-allowed aria-invalid:outline-2 aria-invalid:outline-status-critical`}
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
      <label
        className={`${labelClassName} inline-block ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
}

export default RadioInput;
