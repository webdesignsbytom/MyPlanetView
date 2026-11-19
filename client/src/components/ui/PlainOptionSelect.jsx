import React from 'react';
import useHydrated from '@/hooks/useHydrated';

// Dropdown of plain text options, styled by styles/select.css.
// options: strings, or { value, label, disabled }
function PlainOptionSelect({
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
  const items = options.map((option) => (typeof option === 'string' ? { value: option, label: option } : option));
  const chosen = items.find((item) => String(item.value) === String(value));

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
      title={chosen?.label || undefined}
      className={`app-select ${className}`}
    >
      {/* The closed box shows the choice on one line, cut short with … when it's long (its full
          name is the title), so dropdowns side by side are always the same height (17 Nov 2026).
          Customizable select only; other browsers ignore it. React 19 logs a "cannot be a
          child of" warning in development for it, as for RichOptionSelect. */}
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

      {items.map((item) => (
        <option key={item.value} value={item.value} disabled={item.disabled}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

export default PlainOptionSelect;
