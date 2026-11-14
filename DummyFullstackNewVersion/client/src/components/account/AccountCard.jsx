import React from 'react';

function AccountCard({ id, title, danger = false, children }) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={`grid gap-4 p-6 lg:p-8 rounded-2xl shadow-lift bg-colour1 ${
        danger ? 'border-2 border-solid border-status-critical' : ''
      }`}
    >
      <h2 id={`${id}-heading`} className='text-xl font-semibold text-center'>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default AccountCard;
