import React from 'react';
import { INPUT_SURFACE_CLASS } from './TextInput';

function TextAreaInput({
  refProp,
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
  rows = 4,
  maxLength,
  resize = 'resize-y',
  ariaInvalid = false,
  ariaDescribedBy,
  className = '',
}) {
  return (
    <textarea
      ref={refProp}
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
      rows={rows}
      maxLength={maxLength}
      aria-invalid={ariaInvalid ? 'true' : 'false'}
      aria-describedby={ariaDescribedBy}
      className={`${INPUT_SURFACE_CLASS} ${resize} ${className}`}
    />
  );
}

export default TextAreaInput;
