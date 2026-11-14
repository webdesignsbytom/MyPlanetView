import React from 'react';

// Checkbox styled as a switch (role="switch")
function SwitchInput({
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
    <div
      className={`${wrapperClassName} flex items-center gap-3 ${disabled ? 'opacity-50' : ''}`}
    >
      <label
        htmlFor={id}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full bg-colour3 transition-colors has-checked:bg-colour6 has-aria-invalid:outline-2 has-aria-invalid:outline-status-critical ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <input
          type='checkbox'
          role='switch'
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-required={required || undefined}
          aria-invalid={ariaInvalid ? 'true' : 'false'}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel || label}
          className='peer sr-only'
        />
        <span
          aria-hidden='true'
          className='inline-block h-4 w-4 translate-x-1 transform rounded-full bg-colour1 shadow transition-transform peer-checked:translate-x-6'
        />
      </label>

      {label ? (
        <label
          htmlFor={id}
          className={`${labelClassName} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {label}
        </label>
      ) : null}
    </div>
  );
}

export default SwitchInput;
