import React from 'react';

// Eyebrow + h2 for the How it works sections, in my_planet's travel face
function HowItWorksHeading({ id, eyebrow, title, className = 'text-center' }) {
  return (
    <div className={`grid gap-y-2 ${className}`}>
      {eyebrow && <span className='font-travel text-sm uppercase tracking-xl text-colour9'>{eyebrow}</span>}
      <h2 id={id} className='font-travel text-3xl uppercase leading-tight tracking-wide text-colour6 sm:text-4xl'>
        {title}
      </h2>
    </div>
  );
}

export default HowItWorksHeading;
