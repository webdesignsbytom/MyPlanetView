import React from 'react';

// A short message in a box: `danger` for errors (announced), `good` for done.
function InlineAlert({ children, tone = 'danger' }) {
  if (!children) return null;
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-lg border px-3 py-2 text-sm ${tone === 'good' ? 'tone-good' : tone === 'info' ? 'tone-info' : 'tone-danger'}`}
    >
      {children}
    </p>
  );
}

export default InlineAlert;
