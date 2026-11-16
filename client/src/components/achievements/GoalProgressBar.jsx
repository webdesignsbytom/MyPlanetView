import React from 'react';

// How far a goal has got, as a strip of red filling a dashed paper track. Decorative:
// the words beside it ("8 of 10 countries") say the same for everyone.
function GoalProgressBar({ fraction, className = '' }) {
  const percent = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return (
    <span aria-hidden='true' className={`grid h-2.5 overflow-hidden rounded-full border-2 border-poster-brown bg-poster-cream ${className}`}>
      <span className='h-full bg-poster-red' style={{ width: `${percent}%` }} />
    </span>
  );
}

export default GoalProgressBar;
