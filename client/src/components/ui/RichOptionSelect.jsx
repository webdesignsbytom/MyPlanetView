import React from 'react';
import useHydrated from '@/hooks/useHydrated';

// Dropdown whose options have an icon, a title and a description line, styled by styles/select.css.
// options: { value, label, description, icon (a react-icons component), disabled }.
// The closed box shows the chosen icon and title. Browsers without customizable select show
// "Title – description" as plain text instead. React 19 logs "cannot be a child of" warnings in
// development for the button and option content; the browser renders them correctly.
function RichOptionSelect({
  refProp,
  id,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  options = [],
  placeholder,
  required = false,
  disabled = false,
  ariaInvalid = false,
  ariaDescribedBy,
  ariaLabel,
  className = '',
}) {
  // The custom box only once hydrated: a pre-rendered page must not carry it (useHydrated)
  const hydrated = useHydrated();
  return (
    <select
      ref={refProp}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      required={required}
      disabled={disabled}
      aria-invalid={ariaInvalid ? 'true' : 'false'}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      className={`app-select ${className}`}
    >
      {hydrated ? (
        <button type='button'>
          <selectedcontent></selectedcontent>
        </button>
      ) : null}

      {placeholder ? (
        <option value='' disabled hidden>
          {placeholder}
        </option>
      ) : null}

      {options.map((option) => {
        const Icon = option.icon;
        return (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {Icon ? <Icon aria-hidden='true' className='shrink-0 text-xl' /> : null}
            <span className='app-select-option-text'>
              <span>{option.label}</span>
              {option.description ? (
                <>
                  <span className='sr-only'> – </span>
                  <span className='app-select-option-description'>{option.description}</span>
                </>
              ) : null}
            </span>
          </option>
        );
      })}
    </select>
  );
}

export default RichOptionSelect;
