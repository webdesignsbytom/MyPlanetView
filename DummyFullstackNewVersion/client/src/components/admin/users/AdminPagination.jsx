import React from 'react';

// Prev/next pager (also used by the audit log)
function AdminPagination({ page, totalPages, total, onPageChange, label, disabled = false }) {
  if (!total) return null;

  const buttonClass =
    'py-1.5 px-4 rounded bg-colour6 text-colour1 font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <nav className='flex flex-wrap items-center justify-center gap-3' aria-label={label}>
      <button
        type='button'
        className={buttonClass}
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        Previous
      </button>
      <span className='text-sm'>
        Page {page} of {totalPages} ({total} total)
      </span>
      <button
        type='button'
        className={buttonClass}
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}

export default AdminPagination;
