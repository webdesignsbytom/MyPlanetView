import React from 'react';

// Shared surface styles for all ui/ inputs
export const INPUT_SURFACE_CLASS =
  'w-full rounded-md border border-colour5/40 bg-field text-colour4 shadow-input py-2 px-2 transition focus:outline-none focus:border-colour6 focus:ring-2 focus:ring-colour6 disabled:opacity-50 disabled:cursor-not-allowed aria-invalid:ring-2 aria-invalid:ring-status-critical';

function TextInput({
  refProp,
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  autoComplete,
  inputMode,
  autoCapitalize,
  spellCheck,
  min,
  max,
  step,
  maxLength,
  pattern,
  title,
  ariaInvalid = false,
  ariaDescribedBy,
  className = '',
}) {
  return (
    <input
      ref={refProp}
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete={autoComplete}
      inputMode={inputMode}
      autoCapitalize={autoCapitalize}
      spellCheck={spellCheck}
      min={min}
      max={max}
      step={step}
      maxLength={maxLength}
      pattern={pattern}
      title={title}
      aria-invalid={ariaInvalid ? 'true' : 'false'}
      aria-describedby={ariaDescribedBy}
      className={`${INPUT_SURFACE_CLASS} ${className}`}
    />
  );
}

export default TextInput;
