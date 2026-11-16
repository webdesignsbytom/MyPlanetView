import React from 'react';
// Icons
import { FiTrash2 } from 'react-icons/fi';
// Components
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { SHARE_ROLE_OPTIONS } from '@/utils/sharing/shareRoles';

// The columns every "People with access" row shares (you, members, invites): name, a
// fixed-width role column, a bin. Fixed widths keep the dropdowns, "Owner" and the bins
// lined up down the list whatever the names or roles say. From sm up they're the
// add-person form's columns too (ShareAddPersonForm), so its dropdown sits above these
// and each bin under its Share button; phones keep a narrow bin column for the names.
export const ACCESS_ROW_CLASS =
  'grid grid-cols-[minmax(0,1fr)_9rem_2.5rem] items-center gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_9rem_6rem]';

// The bin button that takes someone off the list (a member, or an invite)
export const BIN_BUTTON_CLASS =
  'grid h-10 w-10 justify-self-center place-items-center rounded-full text-xl text-status-critical transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-colour6 disabled:opacity-50 disabled:hover:scale-100';

// Someone with access: change their role, or remove them. `onMakeOwner` (a map's owner)
// adds "Make owner" under their name, which asks first (MakeOwnerDialog).
function ShareMemberRow({ member, busy, onChangeRole, onRemove, onMakeOwner }) {
  const who = member.name || member.email;
  return (
    <li className={ACCESS_ROW_CLASS}>
      <span className='grid min-w-0 justify-items-start'>
        <span className='w-full truncate font-medium'>{who}</span>
        {member.name ? <span className='w-full truncate text-xs opacity-80'>{member.email}</span> : null}
        {onMakeOwner ? (
          <button
            type='button'
            onClick={onMakeOwner}
            disabled={busy}
            aria-label={`Make ${who} the owner`}
            className='text-xs font-semibold text-poster-red-deep underline underline-offset-2 disabled:opacity-50'
          >
            Make owner
          </button>
        ) : null}
      </span>
      <PlainOptionSelect
        id={`member-role-${member.userId}`}
        value={member.role}
        options={SHARE_ROLE_OPTIONS}
        disabled={busy}
        ariaLabel={`Role for ${who}`}
        onChange={(e) => onChangeRole(e.target.value)}
      />
      <button type='button' onClick={onRemove} disabled={busy} className={BIN_BUTTON_CLASS} aria-label={`Remove ${who}`} title={`Remove ${who}`}>
        <FiTrash2 aria-hidden='true' />
      </button>
    </li>
  );
}

export default ShareMemberRow;
