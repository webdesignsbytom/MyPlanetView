import React from 'react';
// Utils
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';
import { formatDay } from '@/utils/functions/dates';

// An invite emailed to someone without an account yet, until they accept it.
function ShareInviteRow({ invite, busy, onCancel }) {
  return (
    <li className='grid grid-cols-rev items-center gap-2'>
      <span className='grid min-w-0'>
        <span className='truncate font-medium'>{invite.email}</span>
        <span className='text-xs opacity-80'>
          Invited as {ROLE_LABELS[invite.role]?.toLowerCase()}, until {formatDay(invite.expiresAt)}
        </span>
      </span>
      <button
        type='button'
        onClick={onCancel}
        disabled={busy}
        className='text-sm underline underline-offset-2 disabled:opacity-50'
        aria-label={`Cancel the invite to ${invite.email}`}
      >
        Cancel invite
      </button>
    </li>
  );
}

export default ShareInviteRow;
