import React, { useCallback, useEffect, useState } from 'react';
// Api
import {
  addMember,
  cancelInvite,
  getSharing,
  removeMember,
  resetShareLink,
  updateMember,
  updateSharing,
} from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import ShareAddPersonForm from './ShareAddPersonForm';
import ShareMemberRow from './ShareMemberRow';
import ShareInviteRow from './ShareInviteRow';
import ShareGeneralAccess from './ShareGeneralAccess';
import ShareLinkBox from './ShareLinkBox';
// Utils
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';

// Sharing a map or a trip, Google Docs style. The owner adds people by email as viewer or
// editor, changes or removes them, cancels invites, and sets general access. Anyone else
// sees their own role and can leave. `resource` is 'maps' or 'trips'.
function ShareDialog({ resource, id, name, role, currentUserId, onLeft, onClose }) {
  const isOwner = role === 'OWNER';
  const [sharing, setSharing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const kind = resource === 'trips' ? 'trip' : 'map';

  const load = useCallback(async () => {
    try {
      setSharing(await getSharing(resource, id));
    } catch (err) {
      setError(err.friendlyMessage || 'Sharing settings could not be loaded.');
    }
  }, [resource, id]);

  useEffect(() => {
    if (isOwner) load();
  }, [isOwner, load]);

  const run = async (action, doneMessage) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await load();
      if (doneMessage) setNotice(doneMessage);
    } catch (err) {
      setError(err.friendlyMessage || 'That change could not be saved.');
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    setError(null);
    try {
      await removeMember(resource, id, currentUserId);
      onLeft?.();
    } catch (err) {
      setError(err.friendlyMessage || 'That didn’t work.');
      setBusy(false);
    }
  };

  return (
    <Modal title={`Share “${name}”`} onClose={onClose}>
      <InlineAlert>{error}</InlineAlert>
      {notice ? <InlineAlert tone='good'>{notice}</InlineAlert> : null}

      {!isOwner ? (
        <div className='grid gap-3 text-sm'>
          <p>
            You’re {ROLE_LABELS[role] === 'Editor' ? 'an editor' : 'a viewer'} on this {kind}. Only its owner can
            change who has access.
          </p>
          {currentUserId && onLeft ? (
            <Button quiet busy={busy} onClick={leave}>
              Remove me from this {kind}
            </Button>
          ) : null}
        </div>
      ) : !sharing ? (
        error ? null : (
          <div className='grid place-items-center py-6' role='status'>
            <LoadingSpinner md />
            <span className='sr-only'>Loading sharing settings…</span>
          </div>
        )
      ) : (
        <div className='grid gap-5'>
          <ShareAddPersonForm
            onAdd={(body) =>
              run(async () => {
                const result = await addMember(resource, id, body);
                return result;
              }, `Shared with ${body.email}. They’ve been emailed.`)
            }
          />

          <section className='grid gap-2' aria-labelledby='people-with-access'>
            <h3 id='people-with-access' className='font-semibold'>
              People with access
            </h3>
            <ul className='grid gap-3'>
              <li className='grid grid-cols-rev items-center gap-2 text-sm'>
                <span className='font-medium'>You</span>
                <span className='opacity-80'>Owner</span>
              </li>
              {sharing.members.map((member) => (
                <ShareMemberRow
                  key={member.userId}
                  member={member}
                  busy={busy}
                  onChangeRole={(next) => run(() => updateMember(resource, id, member.userId, next)).catch(() => {})}
                  onRemove={() => run(() => removeMember(resource, id, member.userId)).catch(() => {})}
                />
              ))}
              {sharing.invites.map((invite) => (
                <ShareInviteRow
                  key={invite.id}
                  invite={invite}
                  busy={busy}
                  onCancel={() => run(() => cancelInvite(resource, id, invite.id)).catch(() => {})}
                />
              ))}
            </ul>
          </section>

          <section className='grid gap-3' aria-labelledby='general-access-heading'>
            <h3 id='general-access-heading' className='font-semibold'>
              General access
            </h3>
            <ShareGeneralAccess
              value={sharing.linkAccess}
              busy={busy}
              onChange={(linkAccess) => run(() => updateSharing(resource, id, linkAccess)).catch(() => {})}
            />
            <ShareLinkBox
              shareUrl={sharing.shareUrl}
              shareCode={sharing.shareCode}
              busy={busy}
              onReset={() => run(() => resetShareLink(resource, id), 'A new link is ready. The old one no longer works.').catch(() => {})}
            />
          </section>
        </div>
      )}

      <div className='grid justify-end'>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}

export default ShareDialog;
