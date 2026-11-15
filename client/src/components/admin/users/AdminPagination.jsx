import React from 'react';

// Prev/next pager (also used by the audit log), with the site's parchment buttons at
// components/common/Button's `small` size
const BUTTON = 'btn-paper [--btn-leading:1.25rem] [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:1rem] pointer-coarse:[--btn-pad-y:0.5rem]';

function AdminPagination({ page, totalPages, total, onPageChange, label, disabled = false }) {
  if (!total) return null;

  return (
    <nav className='grid grid-cols-[auto_auto_auto] items-center justify-center gap-3' aria-label={label}>
      <button
        type='button'
        className={BUTTON}
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        Previous
      </button>
      <span className='text-center text-sm'>
        Page {page} of {totalPages} ({total} total)
      </span>
      <button
        type='button'
        className={BUTTON}
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}

export default AdminPagination;
