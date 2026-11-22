import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccountCard from '@/components/account/AccountCard';
import AccountImportSection from '@/components/account/AccountImportSection';
import AccountPageHeader from '@/components/account/AccountPageHeader';
import { AuthContext } from '@/auth/AuthContext';

describe('AccountCard', () => {
  it('is a section named by its title, with the body inside', () => {
    const { container } = render(
      <AccountCard id='account-plan' title='Your plan'>
        <p>Body text</p>
      </AccountCard>,
    );
    const section = container.querySelector('section');
    expect(section.getAttribute('aria-labelledby')).toBe('account-plan-heading');
    const heading = container.querySelector('#account-plan-heading');
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent).toBe('Your plan');
    expect(section.textContent).toContain('Body text');
    expect(section.className).not.toContain('paper-danger');
  });

  it('is edged in deep red when it is the danger card', () => {
    const { container } = render(
      <AccountCard id='account-delete' title='Delete account' danger>
        <p>Gone</p>
      </AccountCard>,
    );
    expect(container.querySelector('section').className).toContain('paper-danger');
  });
});

describe('AccountImportSection', () => {
  it('links to the import page', () => {
    render(
      <MemoryRouter>
        <AccountImportSection />
      </MemoryRouter>,
    );
    const link = screen.getByText('Bring your travels from Polarsteps');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/import');
    expect(screen.getByText(/Your download is read on your own device/)).toBeTruthy();
  });
});

describe('AccountPageHeader', () => {
  it('is the page’s one h1, with the signed-in address under it', () => {
    const { container } = render(
      <AuthContext.Provider value={{ user: { email: 'sam@example.com' } }}>
        <AccountPageHeader />
      </AuthContext.Provider>,
    );
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].id).toBe('account-title');
    expect(h1s[0].textContent).toBe('Your account');
    expect(container.querySelector('#account-subtitle').textContent).toBe('Signed in as sam@example.com');
    expect(screen.getByText('My Planet View · Passport office')).toBeTruthy();
    // The rubber stamp is decorative
    const stamp = screen.getByText('Approved').parentElement;
    expect(stamp.getAttribute('aria-hidden')).toBe('true');
  });
});
