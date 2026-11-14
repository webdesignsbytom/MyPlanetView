import React from 'react';

function FormAlert({ innerRef, message, variant = 'error' }) {
  if (!message) return null;

  const isError = variant === 'error';

  return (
    <div
      ref={innerRef}
      role='alert'
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic='true'
      tabIndex={-1}
      className={
        isError
          ? 'text-status-critical max-w-[20rem] mx-auto text-sm text-center'
          : 'text-status-good max-w-[20rem] mx-auto text-sm text-center'
      }
    >
      {message}
    </div>
  );
}

export default FormAlert;