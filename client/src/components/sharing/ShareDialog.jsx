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
import RemoveAccessDialog from './RemoveAccessDialog';
// Utils
import { MAP_SHARE_ROLE_OPTIONS, ROLE_WITH_ARTICLE, SHARE_ROLE_OPTIONS, canManageRole, coOwnerChoices } from '@/utils/sharing/shareRoles';
import { forgetMapLists } from '@/utils/map/mapListCache';
import { inFlight, recall, remember } from '@/utils/data/panelCache';
import { sharingKey } from '@/utils/sharing/sharingCache';

// Sharing a map or a trip, Google Docs style. The owner, or a map's co-owner (19 Nov 2026),
// adds people by email as viewer or editor (or, on a map, co-owner: one of `travellers`, the
// map's), changes or removes them, cancels invites, and sets general access; only the owner
// changes or removes a co-owner, or makes someone the owner. Anyone else sees their own role
// and can leave. `resource` is 'maps' or 'trips'. Every change here
// (adding, changing or removing people, link access, a new link, leaving) needs a verified
// email address: the server refuses otherwise (403, shown as the error), so until then
// those controls are locked and the dialog says why; the link can still be copied.
// The plan's caps on people (5 editors a map, co-owners by travellers, 20 people a trip) come back as 409s,
// shown as the error. A map's owner can make a member the owner (`onTransferred` gets
// `{ stayed, map }` once it's done; the map lists are forgotten first). A bin (removing a
// member, cancelling an invite) asks first (RemoveAccessDialog).
function ShareDialog({ resource, id, name, role, travellers = null, currentUserId, onLeft, onTransferred, onClose }) {
  const { user } = useAuth();
  const isOwner = role === 'OWNER';
  const canManage = canManageRole(role);
  const mustVerifyEmail = user?.emailVerified === false;
  // The settings the map page fetched once the map drew, or this dialog last saw, show at
  // once (17 Nov 2026); a fresh copy replaces them as soon as it arrives
  const cacheKey = sharingKey(resource, id);
  const [sharing, setSharing] = useState(() => (canManage ? recall(cacheKey) : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  // The member being made the owner (the confirmation is open)
  const [newOwner, setNewOwner] = useState(null);
  // A bin pressed: { member } or { invite }, asked about first (RemoveAccessDialog)
  const [removing, setRemoving] = useState(null);
  const kind = resource === 'trips' ? 'trip' : 'map';
  const canTransfer = isOwner && resource === 'maps' && !mustVerifyEmail && Boolean(onTransferred);
  const isMap = resource === 'maps';

  const transfer = async (stayAsEditor) => {
    const { map } = await transferMap(id, { userId: newOwner.userId, stayAsEditor });
    forgetMapLists();
    setNewOwner(null);
    onTransferred({ stayed: stayAsEditor, map });
  };

  // `quiet`: a refresh behind settings already on screen, whose failure changes nothing
  const load = useCallback(
    async (quiet = false) => {
      try {
        const fresh = await (inFlight(cacheKey) || getSharing(resource, id));
        remember(cacheKey, fresh);
        setSharing(fresh);
      } catch (err) {
        if (!quiet) setError(err.friendlyMessage || 'Sharing settings could not be loaded.');
      }
    },
    [resource, id, cacheKey],
  );

  useEffect(() => {
    if (canManage) load(Boolean(recall(cacheKey)));
  }, [canManage, load, cacheKey]);

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

      {!canManage ? (
        <div className='grid gap-3 text-sm'>
          <p>
            You’re {ROLE_WITH_ARTICLE[role] || 'a viewer'} on this {kind}. Only its owner{isMap ? ' and co-owners' : ''} can
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
              roleOptions={isMap ? MAP_SHARE_ROLE_OPTIONS : SHARE_ROLE_OPTIONS}
              coOwner={isMap ? coOwnerChoices(travellers || [], sharing) : null}
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
                <span className='grid min-w-0'>
                  <span className='truncate font-medium'>{isOwner ? 'You' : sharing.owner?.name || sharing.owner?.email || 'The owner'}</span>
                  {!isOwner && sharing.owner?.name ? <span className='truncate text-xs opacity-80'>{sharing.owner.email}</span> : null}
                </span>
                <span className='px-3.5 opacity-80'>Owner</span>
              </li>
              {sharing.members.map((member) => (
                <ShareMemberRow
                  key={member.userId}
                  member={member}
                  busy={busy || mustVerifyEmail}
                  isYou={member.userId === currentUserId}
                  locked={!isOwner && member.role === 'CO_OWNER' && member.userId !== currentUserId}
                  onChangeRole={(next) => run(() => updateMember(resource, id, member.userId, next)).catch(() => {})}
                  onRemove={() => setRemoving({ member })}
                  onMakeOwner={canTransfer ? () => setNewOwner(member) : undefined}
                />
              ))}
              {sharing.invites.map((invite) => (
                <ShareInviteRow
                  key={invite.id}
                  invite={invite}
                  busy={busy || mustVerifyEmail}
                  onCancel={() => setRemoving({ invite })}
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
      {removing ? (
        <RemoveAccessDialog
          member={removing.member}
          invite={removing.invite}
          kind={kind}
          name={name}
          leaving={removing.member?.userId === currentUserId}
          onConfirm={async () => {
            if (removing.member?.userId === currentUserId) {
              await removeMember(resource, id, currentUserId);
              onLeft?.();
              return;
            }
            await run(() =>
              removing.member ? removeMember(resource, id, removing.member.userId) : cancelInvite(resource, id, removing.invite.id),
            );
            setRemoving(null);
          }}
          onClose={() => setRemoving(null)}
        />
      ) : null}
    </Modal>
  );
}

export default ShareDialog;
