import React from 'react';
import useHydrated from '@/hooks/useHydrated';

// Dropdown for long lists, with options under group headings, styled by styles/select.css.
// groups: [{ label, options }], each option a string or { value, label, disabled }
function GroupedOptionSelect({
  refProp,
  id,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  groups = [],
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
  const chosen = groups
    .flatMap((group) => group.options)
    .map((option) => (typeof option === 'string' ? { value: option, label: option } : option))
    .find((item) => String(item.value) === String(value));

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

      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => {
            const item = typeof option === 'string' ? { value: option, label: option } : option;
            return (
              <option key={item.value} value={item.value} disabled={item.disabled}>
                {item.label}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
}

export default GroupedOptionSelect;
