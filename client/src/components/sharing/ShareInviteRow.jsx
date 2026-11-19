import React from 'react';
// Icons
import { FiTrash2 } from 'react-icons/fi';
// Components
import { ACCESS_ROW_CLASS, BIN_BUTTON_CLASS } from './ShareMemberRow';
// Utils
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';
import { formatDay } from '@/utils/functions/dates';

// An invite emailed to someone without an account yet, until they accept it. The
// details take the name and role columns; the bin lines up with the members' bins.
function ShareInviteRow({ invite, busy, onCancel }) {
  return (
    <li className={ACCESS_ROW_CLASS}>
      <span className='col-span-2 grid min-w-0'>
        <span className='truncate font-medium'>{invite.email}</span>
        <span className='text-xs opacity-80'>
          Invited as {ROLE_LABELS[invite.role]?.toLowerCase()}
          {invite.travellerName ? ` (${invite.travellerName})` : ''}, until {formatDay(invite.expiresAt)}
        </span>
      </span>
      <button
        type='button'
        onClick={onCancel}
        disabled={busy}
        className={BIN_BUTTON_CLASS}
        aria-label={`Cancel the invite to ${invite.email}`}
        title='Cancel the invite'
      >
        <FiTrash2 aria-hidden='true' />
      </button>
    </li>
  );
}

export default ShareInviteRow;
