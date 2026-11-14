import React from 'react';
// Components
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
// Utils
import { SHARE_ROLE_OPTIONS } from '@/utils/sharing/shareRoles';

// Someone with access: change their role, or remove them.
function ShareMemberRow({ member, busy, onChangeRole, onRemove }) {
  return (
    <li className='grid grid-cols-[1fr_auto_auto] items-center gap-2 py-2'>
      <span className='grid min-w-0'>
        <span className='truncate font-medium'>{member.name || member.email}</span>
        {member.name ? <span className='truncate text-xs opacity-80'>{member.email}</span> : null}
      </span>
      <PlainOptionSelect
        id={`member-role-${member.userId}`}
        value={member.role}
        options={SHARE_ROLE_OPTIONS}
        disabled={busy}
        ariaLabel={`Role for ${member.name || member.email}`}
        onChange={(e) => onChangeRole(e.target.value)}
      />
      <button
        type='button'
        onClick={onRemove}
        disabled={busy}
        className='text-sm text-status-critical underline underline-offset-2 disabled:opacity-50'
        aria-label={`Remove ${member.name || member.email}`}
      >
        Remove
      </button>
    </li>
  );
}

export default ShareMemberRow;
