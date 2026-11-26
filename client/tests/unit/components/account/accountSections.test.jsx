import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccountDeleteSection from '@/components/account/AccountDeleteSection';
import AccountImportSection from '@/components/account/AccountImportSection';
import AccountPageHeader from '@/components/account/AccountPageHeader';
import AccountProfileSection from '@/components/account/AccountProfileSection';
import AccountReferralSection from '@/components/account/AccountReferralSection';
import { AuthContext } from '@/auth/AuthContext';
import { getLeavingOptions, putLeavingPlan } from '@/api/plansApi';
import { createReferral, getReferral } from '@/api/referralsApi';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import { IMPORT_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';

vi.mock('@/api/plansApi', () => ({ getLeavingOptions: vi.fn(), putLeavingPlan: vi.fn() }));
vi.mock('@/api/referralsApi', () => ({ getReferral: vi.fn(), createReferral: vi.fn() }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (fn) => setTimeout(fn, 0));
  for (const fn of [getLeavingOptions, putLeavingPlan, getReferral, createReferral]) fn.mockReset();
  useMustVerifyEmail.mockReturnValue(false);
});

const withAuth = (value, children) => <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

describe('AccountDeleteSection', () => {
  const OPTIONS = {
    maps: [
      {
        id: 'm1',
        name: 'Family',
        members: [
          { userId: 'u3', name: 'Jo', role: 'VIEWER' },
          { userId: 'u2', name: 'Alex', role: 'EDITOR' },
        ],
      },
      { id: 'm2', name: 'Solo', members: [] },
    ],
    photosOnOtherMaps: 2,
  };

  const open = (deleteAccount = vi.fn().mockResolvedValue({ ok: true })) => {
    render(withAuth({ deleteAccount }, <AccountDeleteSection />));
    return { deleteAccount };
  };

  it('loads the maps first, the delete waiting for them', async () => {
    let resolve;
    getLeavingOptions.mockReturnValue(new Promise((r) => (resolve = r)));
    open();
    expect(screen.getByText('Loading your maps…')).toBeTruthy();
    expect(screen.getByText('Delete my account').disabled).toBe(true);
    await act(async () => resolve(OPTIONS));
    expect(screen.getByText('Delete my account').disabled).toBe(false);
    expect(screen.getByText('Delete my account').className).toContain('btn-danger');
  });

  it('says so when the maps can’t be loaded', async () => {
    getLeavingOptions.mockRejectedValue(new Error('x'));
    open();
    expect((await screen.findByText('Your maps could not be loaded. Reload the page to try again.')).getAttribute('role')).toBe('alert');
  });

  it('asks for the password before anything else', async () => {
    getLeavingOptions.mockResolvedValue(OPTIONS);
    open();
    await screen.findByText('Delete my account');
    await waitFor(() => expect(screen.getByText('Delete my account').disabled).toBe(false));
    fireEvent.click(screen.getByText('Delete my account'));
    expect(document.getElementById('deletePassword-error').textContent).toBe('Enter your password to confirm.');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('confirms with a summary of what goes where, saves the plan, then deletes', async () => {
    getLeavingOptions.mockResolvedValue(OPTIONS);
    putLeavingPlan.mockResolvedValue({});
    const { deleteAccount } = open();
    await waitFor(() => expect(screen.getByText('Delete my account').disabled).toBe(false));
    fireEvent.change(document.getElementById('deletePassword'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Delete my account'));
    const dialog = document.querySelector('[role="dialog"]');
    expect(within(dialog).getByText('Delete your account?')).toBeTruthy();
    // the default heir is the editor, never the viewer
    const message = document.getElementById(dialog.getAttribute('aria-describedby')).textContent;
    expect(message).toContain('“Family” goes to Alex.');
    expect(message).toContain('“Solo” is deleted, with every trip and photo on it.');
    expect(message).toContain('Your photos on other people’s maps stay there.');
    await act(async () => fireEvent.click(within(dialog).getByText('Confirm')));
    expect(putLeavingPlan).toHaveBeenCalledWith({
      maps: [
        { mapId: 'm1', action: 'TRANSFER', toUserId: 'u2' },
        { mapId: 'm2', action: 'DELETE' },
      ],
      leavePhotos: true,
    });
    expect(deleteAccount).toHaveBeenCalledWith('secret');
  });

  it('deletes nothing when the plan can’t be saved, and says why', async () => {
    getLeavingOptions.mockResolvedValue(OPTIONS);
    putLeavingPlan.mockRejectedValue(new Error('x'));
    const { deleteAccount } = open();
    await waitFor(() => expect(screen.getByText('Delete my account').disabled).toBe(false));
    fireEvent.change(document.getElementById('deletePassword'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Delete my account'));
    await act(async () => fireEvent.click(within(document.querySelector('[role="dialog"]')).getByText('Confirm')));
    expect(deleteAccount).not.toHaveBeenCalled();
    expect(screen.getByText('Your choices could not be saved, so nothing was deleted.')).toBeTruthy();
  });

  it('shows the delete’s refusal (a wrong password)', async () => {
    getLeavingOptions.mockResolvedValue(OPTIONS);
    putLeavingPlan.mockResolvedValue({});
    open(vi.fn().mockResolvedValue({ ok: false, error: 'Wrong password.' }));
    await waitFor(() => expect(screen.getByText('Delete my account').disabled).toBe(false));
    fireEvent.change(document.getElementById('deletePassword'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByText('Delete my account'));
    await act(async () => fireEvent.click(within(document.querySelector('[role="dialog"]')).getByText('Confirm')));
    expect(screen.getByText('Wrong password.')).toBeTruthy();
  });

  it('cancelling the confirmation deletes nothing', async () => {
    getLeavingOptions.mockResolvedValue(OPTIONS);
    const { deleteAccount } = open();
    await waitFor(() => expect(screen.getByText('Delete my account').disabled).toBe(false));
    fireEvent.change(document.getElementById('deletePassword'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Delete my account'));
    fireEvent.click(within(document.querySelector('[role="dialog"]')).getByText('Cancel'));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(putLeavingPlan).not.toHaveBeenCalled();
    expect(deleteAccount).not.toHaveBeenCalled();
  });
});

describe('AccountProfileSection', () => {
  const open = (user, actions = {}) => {
    const value = {
      user,
      updateName: vi.fn().mockResolvedValue({ ok: true }),
      updateAvatar: vi.fn().mockResolvedValue({ ok: true }),
      removeAvatar: vi.fn().mockResolvedValue({ ok: true }),
      ...actions,
    };
    render(withAuth(value, <AccountProfileSection />));
    return value;
  };

  it('shows the initial without an avatar, and the avatar with one', () => {
    open({ name: 'sam', email: 's@example.com', emailVerified: true });
    expect(screen.getByText('S').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('Upload avatar')).toBeTruthy();
    expect(screen.queryByText('Remove')).toBeNull();
    document.body.innerHTML = '';
    open({ name: 'Sam', email: 's@example.com', emailVerified: true, image: 'myplanetview/avatars/a.png' });
    expect(screen.getByAltText('Sam avatar')).toBeTruthy();
    expect(screen.getByText('Change avatar')).toBeTruthy();
    expect(screen.getByText('Remove')).toBeTruthy();
  });

  it('locks the upload while the address is unverified, but removing stays allowed', async () => {
    const auth = open({ name: 'Sam', email: 's@example.com', emailVerified: false, image: 'a.png' });
    const upload = screen.getByText('Change avatar');
    expect(upload.getAttribute('aria-disabled')).toBe('true');
    expect(upload.getAttribute('aria-describedby')).toBe('avatar-verify-note');
    expect(document.getElementById('avatar-verify-note').textContent).toBe('Verify your email to add a photo.');
    const file = document.getElementById('avatar-file');
    expect(file.disabled).toBe(true);
    const click = vi.spyOn(file, 'click');
    fireEvent.click(upload);
    expect(click).not.toHaveBeenCalled();
    await act(async () => fireEvent.click(screen.getByText('Remove')));
    expect(auth.removeAvatar).toHaveBeenCalled();
    expect(screen.getByText('Your avatar has been removed.')).toBeTruthy();
  });

  it('names the hidden file input and leaves it out of the Tab order (the button opens it)', () => {
    open({ name: 'Sam', email: 's@example.com', emailVerified: true });
    const file = document.getElementById('avatar-file');
    expect(file.getAttribute('aria-label')).toBe('Choose an avatar picture');
    expect(file.getAttribute('tabindex')).toBe('-1');
  });

  it('uploads an image of an allowed type and size, refusing others', async () => {
    const auth = open({ name: 'Sam', email: 's@example.com', emailVerified: true });
    const file = document.getElementById('avatar-file');
    const click = vi.spyOn(file, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByText('Upload avatar'));
    expect(click).toHaveBeenCalled();
    await act(async () => fireEvent.change(file, { target: { files: [new File(['x'], 'a.svg', { type: 'image/svg+xml' })] } }));
    expect(screen.getByText('Choose a PNG, JPEG, WebP or GIF image.')).toBeTruthy();
    const big = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
    await act(async () => fireEvent.change(file, { target: { files: [big] } }));
    expect(screen.getByText('Images must be 5 MB or smaller.')).toBeTruthy();
    expect(auth.updateAvatar).not.toHaveBeenCalled();
    const good = new File(['x'], 'me.webp', { type: 'image/webp' });
    await act(async () => fireEvent.change(file, { target: { files: [good] } }));
    expect(auth.updateAvatar).toHaveBeenCalledWith(good);
    expect(screen.getByText('Your avatar has been updated.')).toBeTruthy();
  });

  it('saves the display name, trimmed, and wants one', async () => {
    const auth = open({ name: 'Sam', email: 's@example.com', emailVerified: true }, { updateName: vi.fn().mockResolvedValue({ ok: false, error: 'Too long.' }) });
    const input = document.getElementById('displayName');
    expect(input.value).toBe('Sam');
    fireEvent.change(input, { target: { value: '   ' } });
    await act(async () => fireEvent.click(screen.getByText('Save name')));
    expect(document.getElementById('displayName-error').textContent).toBe('Enter a display name.');
    expect(auth.updateName).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '  Sam Carter ' } });
    await act(async () => fireEvent.click(screen.getByText('Save name')));
    expect(auth.updateName).toHaveBeenCalledWith('Sam Carter');
    expect(screen.getByText('Too long.')).toBeTruthy();
  });
});

describe('AccountReferralSection', () => {
  const REFERRAL = { code: 'SAMFRIEND', perYear: 12, friendsJoined: 3, friendsPaid: 1, monthsEarned: 1, monthsLeftThisYear: 11 };

  it('offers to make the link, and shows it once made', async () => {
    getReferral.mockResolvedValue({ referral: { code: null, perYear: 12 } });
    createReferral.mockResolvedValue({ referral: REFERRAL });
    render(<AccountReferralSection />);
    await screen.findByText('Get my invite link');
    await act(async () => fireEvent.click(screen.getByText('Get my invite link')));
    expect(createReferral).toHaveBeenCalled();
    const link = screen.getByLabelText('Your invite link');
    expect(link.value).toBe(`${window.location.origin}${SIGN_UP_PAGE_URL}?code=SAMFRIEND`);
    expect(document.querySelector('[data-referral-counts]').textContent).toBe(
      '3 friends joined, 1 went on to pay. You’ve earned 1 free month, with 11 more months to earn this year.',
    );
  });

  it('asks an unverified member to verify before making a link', async () => {
    useMustVerifyEmail.mockReturnValue(true);
    getReferral.mockResolvedValue({ referral: { code: null } });
    render(<AccountReferralSection />);
    expect(await screen.findByText(/to get your invite link/)).toBeTruthy();
    expect(screen.queryByText('Get my invite link')).toBeNull();
  });

  it('copies the link and says so for a moment', async () => {
    vi.useFakeTimers();
    try {
      const writeText = vi.fn().mockResolvedValue();
      vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
      getReferral.mockResolvedValue({ referral: REFERRAL });
      render(<AccountReferralSection />);
      await act(async () => {});
      await act(async () => fireEvent.click(screen.getByText('Copy link')));
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('?code=SAMFRIEND'));
      expect(screen.getByText('Copied')).toBeTruthy();
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(screen.getByText('Copy link')).toBeTruthy();
      // no Share button where the browser can't share
      expect(screen.queryByText('Share')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shares the link where the browser can', async () => {
    const share = vi.fn().mockResolvedValue();
    vi.stubGlobal('navigator', { ...navigator, share });
    getReferral.mockResolvedValue({ referral: REFERRAL });
    render(<AccountReferralSection />);
    fireEvent.click(await screen.findByText('Share'));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: 'A free month of My Planet View', url: expect.stringContaining('SAMFRIEND') }));
  });

  it('says so when it can’t be loaded', async () => {
    getReferral.mockRejectedValue(new Error('x'));
    render(<AccountReferralSection />);
    expect((await screen.findByText('Your invite couldn’t be loaded.')).getAttribute('role')).toBe('alert');
  });

  it('says so when the link can’t be made', async () => {
    getReferral.mockResolvedValue({ referral: { code: null } });
    createReferral.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Verify your email first.' }));
    render(<AccountReferralSection />);
    const button = await screen.findByText('Get my invite link');
    await act(async () => fireEvent.click(button));
    expect(screen.getByText('Verify your email first.')).toBeTruthy();
  });
});

describe('AccountImportSection, AccountPageHeader and the page’s cards', () => {
  it('links to the Polarsteps import', () => {
    render(
      <MemoryRouter>
        <AccountImportSection />
      </MemoryRouter>,
    );
    expect(screen.getByText('Bring your travels from Polarsteps').getAttribute('href')).toBe(IMPORT_PAGE_URL);
  });

  it('heads the page with the signed-in address', () => {
    render(withAuth({ user: { email: 'sam@example.com' } }, <AccountPageHeader />));
    const heading = document.getElementById('account-title');
    expect(heading.tagName).toBe('H1');
    expect(heading.textContent).toBe('Your account');
    expect(document.getElementById('account-subtitle').textContent).toBe('Signed in as sam@example.com');
  });
});
