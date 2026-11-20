import React, { useState } from 'react';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { INPUT_SURFACE_CLASS } from './TextInput';

function PasswordInput({
  refProp,
  id,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  // None by default: dots looked like a password already typed in (19 Nov 2026, the audit)
  placeholder = '',
  required = false,
  disabled = false,
  readOnly = false,
  autoComplete = 'current-password',
  pattern,
  title,
  ariaInvalid = false,
  ariaDescribedBy,
  className = '',
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='relative'>
      <input
        ref={refProp}
        type={showPassword ? 'text' : 'password'}
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
        pattern={pattern}
        title={title}
        aria-invalid={ariaInvalid ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy}
        className={`${INPUT_SURFACE_CLASS} pr-10 ${className}`}
      />

      <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
        <button
          type='button'
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          className='flex items-center text-colour6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <IoEyeOffOutline className='text-2xl' />
          ) : (
            <IoEyeOutline className='text-2xl' />
          )}
        </button>
      </div>
    </div>
  );
}

export default PasswordInput;
