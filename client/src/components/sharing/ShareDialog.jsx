import React, { useCallback, useEffect, useState } from 'react';
// Api
import {
  addMember,
  cancelInvite,
  getSharing,
  removeMember,
  resetShareLink,
  transferMap,
  updateMember,
  updateSharing,
} from '@/api/travelApi';
// Auth
import { useAuth } from '@/auth/AuthContext';
// Constants
import { ACCOUNT_PAGE_URL } from '@/utils/constants/routes';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import AppLink from '@/components/common/AppLink';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import ShareAddPersonForm from './ShareAddPersonForm';
import ShareMemberRow, { ACCESS_ROW_CLASS } from './ShareMemberRow';
import ShareInviteRow from './ShareInviteRow';
import ShareGeneralAccess from './ShareGeneralAccess';
import ShareLinkBox from './ShareLinkBox';
import MakeOwnerDialog from './MakeOwnerDialog';
// Utils
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';
import { forgetMapLists } from '@/utils/map/mapListCache';

// Sharing a map or a trip, Google Docs style. The owner adds people by email as viewer or
// editor, changes or removes them, cancels invites, and sets general access. Anyone else
// sees their own role and can leave. `resource` is 'maps' or 'trips'. Every change here
// (adding, changing or removing people, link access, a new link, leaving) needs a verified
// email address: the server refuses otherwise (403, shown as the error), so until then
// those controls are locked and the dialog says why; the link can still be copied.
// The plan's caps on people (10 editors a map, 20 people a trip) come back as 409s,
// shown as the error. A map's owner can make a member the owner (`onTransferred` gets
// `{ stayed, map }` once it's done; the map lists are forgotten first).
function ShareDialog({ resource, id, name, role, currentUserId, onLeft, onTransferred, onClose }) {
  const { user } = useAuth();
  const isOwner = role === 'OWNER';
  const mustVerifyEmail = user?.emailVerified === false;
  const [sharing, setSharing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  // The member being made the owner (the confirmation is open)
  const [newOwner, setNewOwner] = useState(null);
  const kind = resource === 'trips' ? 'trip' : 'map';
  const canTransfer = resource === 'maps' && !mustVerifyEmail && Boolean(onTransferred);

  const transfer = async (stayAsEditor) => {
    const { map } = await transferMap(id, { userId: newOwner.userId, stayAsEditor });
    forgetMapLists();
    setNewOwner(null);
    onTransferred({ stayed: stayAsEditor, map });
  };

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
          {currentUserId && onLeft && mustVerifyEmail ? (
            <InlineAlert tone='info'>Leaving it needs a verified email address. The link is in the email we sent you.</InlineAlert>
          ) : currentUserId && onLeft ? (
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
          {mustVerifyEmail ? (
            <InlineAlert tone='info'>
              Adding people, changing who has access and making a new link need a verified email address. Lost the
              link? Send a new one from{' '}
              <AppLink to={ACCOUNT_PAGE_URL} label='your account page' description='your account page' className='font-semibold underline' />.
              Until then, you can copy the link below.
            </InlineAlert>
          ) : (
            <ShareAddPersonForm
              onAdd={(body) =>
                run(async () => {
                  const result = await addMember(resource, id, body);
                  return result;
                }, `Shared with ${body.email}. They’ve been emailed.`)
              }
            />
          )}

          <section className='grid gap-2' aria-labelledby='people-with-access'>
            <h3 id='people-with-access' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
              People with access
            </h3>
            <ul className='grid divide-y divide-dashed divide-poster-brown/40'>
              {/* "Owner" sits in the role column, where the members' dropdowns are */}
              <li className={ACCESS_ROW_CLASS}>
                <span className='font-medium'>You</span>
                <span className='px-3.5 opacity-80'>Owner</span>
              </li>
              {sharing.members.map((member) => (
                <ShareMemberRow
                  key={member.userId}
                  member={member}
                  busy={busy || mustVerifyEmail}
                  onChangeRole={(next) => run(() => updateMember(resource, id, member.userId, next)).catch(() => {})}
                  onRemove={() => run(() => removeMember(resource, id, member.userId)).catch(() => {})}
                  onMakeOwner={canTransfer ? () => setNewOwner(member) : undefined}
                />
              ))}
              {sharing.invites.map((invite) => (
                <ShareInviteRow
                  key={invite.id}
                  invite={invite}
                  busy={busy || mustVerifyEmail}
                  onCancel={() => run(() => cancelInvite(resource, id, invite.id)).catch(() => {})}
                />
              ))}
            </ul>
          </section>

          <section className='grid gap-3' aria-labelledby='general-access-heading'>
            <h3 id='general-access-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
              General access
            </h3>
            <ShareGeneralAccess
              value={sharing.linkAccess}
              busy={busy || mustVerifyEmail}
              onChange={(linkAccess) => run(() => updateSharing(resource, id, linkAccess)).catch(() => {})}
            />
            <ShareLinkBox
              shareUrl={sharing.shareUrl}
              shareCode={sharing.shareCode}
              busy={busy}
              canReset={!mustVerifyEmail}
              onReset={() => run(() => resetShareLink(resource, id), 'A new link is ready. The old one no longer works.').catch(() => {})}
            />
          </section>
        </div>
      )}

      <div className='grid justify-end'>
        <Button onClick={onClose}>Done</Button>
      </div>

      {newOwner ? (
        <MakeOwnerDialog member={newOwner} mapName={name} onConfirm={transfer} onClose={() => setNewOwner(null)} />
      ) : null}
    </Modal>
  );
}

export default ShareDialog;
