import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import AccountPageMainContainer from '@/components/account/AccountPageMainContainer';

// Every section has its own tests: here each is a stand-in naming itself
const { stub } = vi.hoisted(() => ({ stub: (name) => ({ default: () => <p data-section={name} /> }) }));
vi.mock('@/components/account/AccountProfileSection', () => stub('profile'));
vi.mock('@/components/account/AccountPlanSection', () => stub('plan'));
vi.mock('@/components/account/AccountGiftsSection', () => stub('gifts'));
vi.mock('@/components/account/AccountPostcardsSection', () => stub('postcards'));
vi.mock('@/components/account/AccountReferralSection', () => stub('referral'));
vi.mock('@/components/account/AccountImportSection', () => stub('import'));
vi.mock('@/components/account/AccountEmailsSection', () => stub('emails'));
vi.mock('@/components/account/AccountEmailSection', () => stub('email'));
vi.mock('@/components/forms/ChangePasswordForm', () => stub('password'));
vi.mock('@/components/account/AccountSessionsSection', () => stub('sessions'));
vi.mock('@/components/account/AccountDataSection', () => stub('data'));
vi.mock('@/components/account/AccountDeleteSection', () => stub('delete'));

describe('AccountPageMainContainer', () => {
  it('lays out every section in its own named card, in order, the delete card in red', () => {
    const { container } = render(<AccountPageMainContainer />);
    const cards = [...container.querySelectorAll(':scope > section')];
    expect(cards.map((card) => [card.getAttribute('aria-labelledby'), card.querySelector('h2').textContent, card.querySelector('[data-section]').dataset.section])).toEqual([
      ['account-profile-heading', 'Profile', 'profile'],
      ['account-plan-heading', 'Your plan', 'plan'],
      ['account-gifts-heading', 'Gifts', 'gifts'],
      ['account-postcards-heading', 'Postcards you sent', 'postcards'],
      ['account-invite-heading', 'Invite a friend', 'referral'],
      ['account-import-heading', 'Bring your travels', 'import'],
      ['account-emails-heading', 'Emails we send', 'emails'],
      ['account-email-heading', 'Email', 'email'],
      ['account-password-heading', 'Password', 'password'],
      ['account-sessions-heading', 'Devices', 'sessions'],
      ['account-data-heading', 'Your data', 'data'],
      ['account-delete-heading', 'Delete account', 'delete'],
    ]);
    // the plan card is where "Upgrade to First Class" links (/account#account-plan-heading)
    expect(document.getElementById('account-plan-heading')).toBeTruthy();
    expect(cards.at(-1).className).toContain('paper-danger');
    expect(cards[0].className).not.toContain('paper-danger');
  });
});
