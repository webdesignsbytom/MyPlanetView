import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MakeOwnerDialog from '@/components/sharing/MakeOwnerDialog';
import RemoveAccessDialog from '@/components/sharing/RemoveAccessDialog';
import ShareAddPersonForm from '@/components/sharing/ShareAddPersonForm';
import ShareGeneralAccess from '@/components/sharing/ShareGeneralAccess';
import ShareInviteRow from '@/components/sharing/ShareInviteRow';
import ShareLinkBox from '@/components/sharing/ShareLinkBox';
import ShareMemberRow from '@/components/sharing/ShareMemberRow';
import { MAP_SHARE_ROLE_OPTIONS } from '@/utils/sharing/shareRoles';

const optionsOf = (select) => [...select.querySelectorAll('option')].map((o) => o.textContent);

describe('ShareAddPersonForm', () => {
  it('adds someone by email as a viewer, lower-cased, and clears the field', async () => {
    const onAdd = vi.fn().mockResolvedValue({});
    render(<ShareAddPersonForm onAdd={onAdd} />);
    const share = screen.getByText('Share').closest('button');
    expect(share.disabled).toBe(true);
    expect(optionsOf(screen.getByLabelText('Role'))).toEqual(['Viewer', 'Editor']);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: ' Jo@Example.com ' } });
    fireEvent.click(share);
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ email: 'jo@example.com', role: 'VIEWER' }));
    await waitFor(() => expect(screen.getByLabelText('Email address').value).toBe(''));
  });

  it('keeps the address when the add is refused', async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error('409'));
    render(<ShareAddPersonForm onAdd={onAdd} />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'jo@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'EDITOR' } });
    fireEvent.click(screen.getByText('Share'));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ email: 'jo@example.com', role: 'EDITOR' }));
    expect(screen.getByLabelText('Email address').value).toBe('jo@example.com');
  });

  it('asks which traveller a co-owner is, the first free one to start with', async () => {
    const onAdd = vi.fn().mockResolvedValue({});
    const coOwner = { options: [{ value: 'tr1', label: 'Gigie' }, { value: 'tr2', label: 'Mia' }], room: 2 };
    render(<ShareAddPersonForm onAdd={onAdd} roleOptions={MAP_SHARE_ROLE_OPTIONS} coOwner={coOwner} />);
    expect(screen.queryByLabelText('Which traveller is this?')).toBeNull();
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'CO_OWNER' } });
    const traveller = screen.getByLabelText('Which traveller is this?');
    expect(traveller.value).toBe('tr1');
    expect(screen.getByText(/A co-owner can change everything on this map/)).toBeTruthy();
    fireEvent.change(traveller, { target: { value: 'tr2' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'mia@example.com' } });
    fireEvent.click(screen.getByText('Share'));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith({ email: 'mia@example.com', role: 'CO_OWNER', travellerId: 'tr2' }));
  });

  it('says why there is no room for a co-owner, and won’t share', () => {
    const onAdd = vi.fn();
    render(<ShareAddPersonForm onAdd={onAdd} roleOptions={MAP_SHARE_ROLE_OPTIONS} coOwner={{ options: [{ value: 'tr1', label: 'Gigie' }], room: 0 }} />);
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'CO_OWNER' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'mia@example.com' } });
    expect(screen.getByText(/every traveller here has one, or the map has no room for another/).getAttribute('role')).toBe('status');
    expect(screen.getByText('Share').closest('button').disabled).toBe(true);
  });
});

describe('ShareMemberRow', () => {
  const row = (member, props = {}) => {
    const handlers = { onChangeRole: vi.fn(), onRemove: vi.fn() };
    render(<ul><ShareMemberRow member={member} busy={false} {...handlers} {...props} /></ul>);
    return handlers;
  };
  const JO = { userId: 'u2', name: 'Jo', email: 'jo@example.com', role: 'EDITOR' };

  it('shows the name and address, changes the role and removes them', () => {
    const h = row(JO);
    expect(screen.getByText('jo@example.com')).toBeTruthy();
    const role = screen.getByLabelText('Role for Jo');
    expect(role.value).toBe('EDITOR');
    // Becoming a co-owner needs a traveller: the add form's, never this dropdown's
    expect(optionsOf(role)).toEqual(['Viewer', 'Editor']);
    fireEvent.change(role, { target: { value: 'VIEWER' } });
    expect(h.onChangeRole).toHaveBeenCalledWith('VIEWER');
    fireEvent.click(screen.getByLabelText('Remove Jo'));
    expect(h.onRemove).toHaveBeenCalled();
    expect(screen.queryByText('Make owner')).toBeNull();
  });

  it('shows a co-owner’s traveller, locked for anyone but the owner', () => {
    row({ ...JO, role: 'CO_OWNER', travellerName: 'Gigie' }, { locked: true });
    expect(screen.getByText('Traveller: Gigie')).toBeTruthy();
    expect(screen.getByLabelText('Role for Jo').disabled).toBe(true);
    expect(optionsOf(screen.getByLabelText('Role for Jo'))).toContain('Co-owner');
    expect(screen.queryByLabelText('Remove Jo')).toBeNull();
  });

  it('calls your own row “You”, whose bin means leaving', () => {
    const h = row(JO, { isYou: true });
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByLabelText('Role for Jo').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Leave this map'));
    expect(h.onRemove).toHaveBeenCalled();
  });

  it('offers “Make owner” to a map’s owner', () => {
    const onMakeOwner = vi.fn();
    row(JO, { onMakeOwner });
    fireEvent.click(screen.getByLabelText('Make Jo the owner'));
    expect(onMakeOwner).toHaveBeenCalled();
  });

  it('switches everything off while busy', () => {
    row(JO, { busy: true, onMakeOwner: () => {} });
    expect(screen.getByLabelText('Role for Jo').disabled).toBe(true);
    expect(screen.getByLabelText('Remove Jo').disabled).toBe(true);
    expect(screen.getByLabelText('Make Jo the owner').disabled).toBe(true);
  });
});

describe('ShareInviteRow', () => {
  it('says who was invited as what, until when, and cancels it', () => {
    const onCancel = vi.fn();
    render(
      <ul>
        <ShareInviteRow invite={{ id: 'i1', email: 'new@example.com', role: 'CO_OWNER', travellerName: 'Gigie', expiresAt: '2026-12-01' }} onCancel={onCancel} />
      </ul>,
    );
    expect(screen.getByText('Invited as co-owner (Gigie), until 1 Dec 2026')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Cancel the invite to new@example.com'));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('ShareGeneralAccess', () => {
  it('shows the link access with its hint, and changes it', () => {
    const onChange = vi.fn();
    const { rerender } = render(<ShareGeneralAccess value='RESTRICTED' onChange={onChange} />);
    expect(screen.getByText('Only people added here can open it')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('General access'), { target: { value: 'ANYONE_WITH_LINK' } });
    expect(onChange).toHaveBeenCalledWith('ANYONE_WITH_LINK');
    rerender(<ShareGeneralAccess value='ANYONE_WITH_LINK' busy onChange={onChange} />);
    expect(screen.getByText('Anyone with the link can view it in their browser: no app or account needed')).toBeTruthy();
    expect(screen.getByLabelText('General access').disabled).toBe(true);
  });
});

describe('ShareLinkBox', () => {
  afterEach(() => vi.useRealTimers());

  it('links to the share page on this site, and copies it', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<ShareLinkBox shareUrl='https://elsewhere/x' shareCode='ABCD-EFGH-JKMN' onReset={() => {}} />);
    const link = `${window.location.origin}/shared/ABCD-EFGH-JKMN`;
    expect(screen.getByLabelText('Share link').value).toBe(link);
    expect(screen.getByText('ABCD-EFGH-JKMN')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Copy link')));
    expect(writeText).toHaveBeenCalledWith(link);
    expect(screen.getByText('Copied')).toBeTruthy();
  });

  it('asks before making a new link', async () => {
    const onReset = vi.fn().mockResolvedValue();
    render(<ShareLinkBox shareCode='ABCD' onReset={onReset} />);
    fireEvent.click(screen.getByText('Reset link'));
    expect(screen.getByText(/Anyone using the old one loses access/)).toBeTruthy();
    fireEvent.click(screen.getByText('Keep this one'));
    expect(onReset).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Reset link'));
    // The confirmation's own button
    fireEvent.click(screen.getByText('Reset link'));
    await waitFor(() => expect(onReset).toHaveBeenCalled());
  });

  it('offers no reset without a verified email', () => {
    render(<ShareLinkBox shareCode='ABCD' canReset={false} onReset={() => {}} />);
    expect(screen.queryByText('Reset link')).toBeNull();
    expect(screen.getByText('Copy link')).toBeTruthy();
  });
});

describe('MakeOwnerDialog', () => {
  it('asks, staying on as an editor unless unticked', async () => {
    const onConfirm = vi.fn().mockResolvedValue();
    render(<MakeOwnerDialog member={{ name: 'Jo', email: 'jo@example.com' }} mapName='Our map' onConfirm={onConfirm} onClose={() => {}} />);
    expect(screen.getByText('Make Jo the owner?')).toBeTruthy();
    expect(screen.getByText(/Jo will own “Our map”/)).toBeTruthy();
    const stay = screen.getByLabelText('Stay on the map as an editor');
    expect(stay.checked).toBe(true);
    fireEvent.click(stay);
    expect(screen.getByText('You’ll lose access to the map unless they add you again.')).toBeTruthy();
    fireEvent.click(screen.getByText('Make owner'));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(false));
  });

  it('says why the handover was refused', async () => {
    const onConfirm = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Jo must verify first.' }));
    render(<MakeOwnerDialog member={{ email: 'jo@example.com' }} mapName='Our map' onConfirm={onConfirm} onClose={() => {}} />);
    expect(screen.getByText('Make jo@example.com the owner?')).toBeTruthy();
    fireEvent.click(screen.getByText('Make owner'));
    expect(await screen.findByText('Jo must verify first.')).toBeTruthy();
  });

  it('cancels', () => {
    const onClose = vi.fn();
    render(<MakeOwnerDialog member={{ name: 'Jo' }} mapName='Our map' onConfirm={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('RemoveAccessDialog', () => {
  it('asks before removing a member', async () => {
    const onConfirm = vi.fn().mockResolvedValue();
    render(<RemoveAccessDialog member={{ name: 'Jo' }} kind='map' name='Our map' onConfirm={onConfirm} onClose={() => {}} />);
    expect(screen.getByText('Remove Jo?')).toBeTruthy();
    expect(screen.getByText('Jo will no longer be able to open “Our map”. You can add them again at any time.')).toBeTruthy();
    expect(screen.getByText('Keep them')).toBeTruthy();
    fireEvent.click(screen.getByText('Remove'));
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
  });

  it('asks before cancelling an invite', () => {
    render(<RemoveAccessDialog invite={{ email: 'new@example.com' }} kind='trip' name='Rome' onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Cancel the invite?')).toBeTruthy();
    expect(screen.getByText(/The invite to new@example.com will stop working, so the link in their email won’t open this trip/)).toBeTruthy();
    expect(screen.getByText('Keep the invite')).toBeTruthy();
  });

  it('asks about leaving on your own row', () => {
    const onClose = vi.fn();
    render(<RemoveAccessDialog member={{ name: 'Me' }} leaving kind='map' name='Our map' onConfirm={() => {}} onClose={onClose} />);
    expect(screen.getByText('Leave this map?')).toBeTruthy();
    fireEvent.click(screen.getByText('Stay'));
    expect(onClose).toHaveBeenCalled();
  });

  it('says why it failed', async () => {
    render(<RemoveAccessDialog member={{ name: 'Jo' }} kind='map' name='Our map' onConfirm={() => Promise.reject(new Error('x'))} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Remove'));
    expect(await screen.findByText('That change could not be saved.')).toBeTruthy();
  });
});
