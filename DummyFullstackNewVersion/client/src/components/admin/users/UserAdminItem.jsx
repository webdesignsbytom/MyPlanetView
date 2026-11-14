import React, { useState } from 'react';
import { IoIosCloseCircleOutline } from 'react-icons/io';
// Components
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

const badgeClass = (tone) =>
  ({
    good: 'bg-status-good/20 text-status-good',
    warn: 'tone-warn',
    bad: 'tone-danger',
    info: 'bg-colour6/15 text-colour6',
  })[tone];

// lockedReason: why this row can't be changed (null = editable)
function UserAdminItem({ user, roleOptions, lockedReason, busy, onSaveRole, onDeactivate, onReactivate, onDelete }) {
  const currentRole = String(user.role || '').toUpperCase();
  const [draftRole, setDraftRole] = useState(currentRole);

  const name = user.name || user.email;
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
  const isActive = user.isActive !== false;
  const isLocked = Boolean(lockedReason);
  const roleChanged = draftRole !== currentRole;
  const noteId = `user-note-${user.id}`;

  return (
    <article
      className='grid grid-cols-rev bg-colour1 text-colour4 border-2 border-colour6 px-4 py-4 h-fit rounded-md shadow gap-x-2'
      aria-labelledby={`user-heading-${user.id}`}
      aria-busy={busy ? 'true' : 'false'}
    >
      <section className='grid gap-y-1 min-w-0'>
        <h3 id={`user-heading-${user.id}`} className='font-semibold text-lg break-words'>
          {user.name || '—'}
        </h3>
        <p className='break-all'>
          <strong className='text-colour6'>Email:</strong> {user.email}
        </p>
        <p>
          <strong className='text-colour6'>Joined:</strong> {joined}
        </p>

        <div className='mt-1 flex flex-wrap gap-2 text-xs'>
          <span className={`px-2 py-0.5 rounded ${badgeClass('info')}`}>{currentRole}</span>
          <span className={`px-2 py-0.5 rounded ${badgeClass(isActive ? 'good' : 'bad')}`}>
            {isActive ? 'Active' : 'Deactivated'}
          </span>
          <span className={`px-2 py-0.5 rounded ${badgeClass(user.emailVerified ? 'good' : 'warn')}`}>
            {user.emailVerified ? 'Email verified' : 'Email not verified'}
          </span>
        </div>

        {/* Role + status actions */}
        <div className='mt-3 grid gap-3 sm:grid-cols-reg items-end'>
          <FormField id={`user-role-${user.id}`} label='Role' className='grid gap-y-1'>
            <PlainOptionSelect
              name='role'
              value={draftRole}
              onChange={(e) => setDraftRole(e.target.value)}
              options={roleOptions}
              disabled={isLocked || busy}
              ariaDescribedBy={isLocked ? noteId : undefined}
            />
          </FormField>

          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => onSaveRole(user, draftRole)}
              disabled={isLocked || busy || !roleChanged}
              className='bg-colour6 text-colour1 font-bold py-1.5 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed'
              aria-label={`Save role for ${name}`}
            >
              Save role
            </button>

            {isActive ? (
              <button
                type='button'
                onClick={() => onDeactivate(user)}
                disabled={isLocked || busy}
                className='solid-warn font-semibold py-1.5 px-4 rounded hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed'
                aria-label={`Deactivate ${name}`}
              >
                Deactivate
              </button>
            ) : (
              <button
                type='button'
                onClick={() => onReactivate(user)}
                disabled={isLocked || busy}
                className='bg-status-good text-colour1 font-semibold py-1.5 px-4 rounded hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed'
                aria-label={`Reactivate ${name}`}
              >
                Reactivate
              </button>
            )}
          </div>
        </div>

        {isLocked && (
          <p id={noteId} className='text-xs text-colour5 mt-1'>
            {lockedReason}
          </p>
        )}
      </section>

      {/* Delete */}
      <section className='flex justify-end items-start'>
        <button
          type='button'
          onClick={() => onDelete(user)}
          disabled={isLocked || busy}
          className='text-status-critical hover:opacity-75 disabled:opacity-40 disabled:cursor-not-allowed'
          title={`Delete ${name}`}
          aria-label={`Delete user ${name}`}
        >
          <IoIosCloseCircleOutline size={32} />
        </button>
      </section>
    </article>
  );
}

export default UserAdminItem;
