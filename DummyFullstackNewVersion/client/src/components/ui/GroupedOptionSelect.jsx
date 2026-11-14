import React from 'react';

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
