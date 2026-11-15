import React, { useState } from 'react';
// Components
import CloseStamp from '@/components/common/CloseStamp';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

// The site's buttons at components/common/Button's `small` size
const SMALL = '[--btn-leading:1.25rem] [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:1rem] pointer-coarse:[--btn-pad-y:0.5rem]';

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
      // A slip of paper in the card (dashed brown edge, like a trip's traveller fieldset)
      className='grid grid-cols-[minmax(0,1fr)_auto] content-start gap-x-2 border-2 border-dashed border-poster-brown/60 bg-paper-cream px-4 py-4'
      aria-labelledby={`user-heading-${user.id}`}
      aria-busy={busy ? 'true' : 'false'}
    >
      <section className='grid gap-y-1 min-w-0'>
        <h3 id={`user-heading-${user.id}`} className='font-semibold text-lg break-words'>
          {user.name || '—'}
        </h3>
        <p className='break-all'>
          <strong className='text-colour9'>Email:</strong> {user.email}
        </p>
        <p>
          <strong className='text-colour9'>Joined:</strong> {joined}
        </p>

        <div className='grid grid-row-wrap gap-2 pt-1 text-xs'>
          <span className={`px-2 py-0.5 rounded ${badgeClass('info')}`}>{currentRole}</span>
          <span className={`px-2 py-0.5 rounded ${badgeClass(isActive ? 'good' : 'bad')}`}>
            {isActive ? 'Active' : 'Deactivated'}
          </span>
          <span className={`px-2 py-0.5 rounded ${badgeClass(user.emailVerified ? 'good' : 'warn')}`}>
            {user.emailVerified ? 'Email verified' : 'Email not verified'}
          </span>
        </div>

        {/* Role + status actions */}
        <div className='grid items-end gap-3 pt-3 sm:grid-cols-reg'>
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

          <div className='grid grid-row-wrap gap-2'>
            <button
              type='button'
              onClick={() => onSaveRole(user, draftRole)}
              disabled={isLocked || busy || !roleChanged}
              className={`btn-poster ${SMALL}`}
              aria-label={`Save role for ${name}`}
            >
              Save role
            </button>

            {isActive ? (
              <button
                type='button'
                onClick={() => onDeactivate(user)}
                disabled={isLocked || busy}
                className={`btn-paper [--btn-ink:var(--poster-red-deep)] ${SMALL}`}
                aria-label={`Deactivate ${name}`}
              >
                Deactivate
              </button>
            ) : (
              <button
                type='button'
                onClick={() => onReactivate(user)}
                disabled={isLocked || busy}
                className={`btn-paper ${SMALL}`}
                aria-label={`Reactivate ${name}`}
              >
                Reactivate
              </button>
            )}
          </div>
        </div>

        {isLocked && (
          <p id={noteId} className='pt-1 text-xs text-colour5'>
            {lockedReason}
          </p>
        )}
      </section>

      {/* Delete */}
      <section className='grid content-start'>
        <CloseStamp onClick={() => onDelete(user)} disabled={isLocked || busy} hint={`Delete ${name}`} label={`Delete user ${name}`} />
      </section>
    </article>
  );
}

export default UserAdminItem;
