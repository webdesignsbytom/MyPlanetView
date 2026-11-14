import React from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';

const STARS = [1, 2, 3, 4, 5];

function StarRatingInput({
  id,
  value = 5,
  onChange,
  ariaInvalid,
  ariaDescribedBy,
  disabled = false,
}) {
  const setValue = (n) => {
    if (disabled) return;
    onChange?.(n);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setValue(Math.min(5, value + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setValue(Math.max(1, value - 1));
    }
  };

  return (
    <div
      id={id}
      role='radiogroup'
      aria-label='Rating out of 5 stars'
      aria-invalid={ariaInvalid ? 'true' : 'false'}
      aria-describedby={ariaDescribedBy}
      className='flex items-center justify-center gap-1'
      onKeyDown={handleKeyDown}
    >
      {STARS.map((n) => (
        <button
          key={n}
          type='button'
          role='radio'
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          tabIndex={value === n ? 0 : -1}
          disabled={disabled}
          onClick={() => setValue(n)}
          className='p-1 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {n <= value ? (
            <FaStar aria-hidden='true' size={24} className='text-colour6' />
          ) : (
            <FaRegStar aria-hidden='true' size={24} className='text-colour3' />
          )}
        </button>
      ))}
    </div>
  );
}

export default StarRatingInput;
