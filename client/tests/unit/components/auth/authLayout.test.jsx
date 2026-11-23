import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthPageLayout from '@/components/auth/AuthPageLayout';
import TravelTicket from '@/components/auth/TravelTicket';
import TicketStub from '@/components/auth/TicketStub';
import { CompanyName } from '@/utils/constants/constants';

vi.mock('@/components/nav/Navbar', () => ({ default: ({ variant }) => <nav data-test-nav={variant}>Nav</nav> }));

describe('AuthPageLayout', () => {
  it('has the page’s one main, with its props, beside the nav column', () => {
    render(
      <AuthPageLayout mainProps={{ 'aria-labelledby': 'h' }}>
        <h1 id='h'>Log in</h1>
      </AuthPageLayout>,
    );
    const mains = document.querySelectorAll('main');
    expect(mains.length).toBe(1);
    expect(mains[0].id).toBe('main-content');
    expect(mains[0].getAttribute('tabindex')).toBe('-1');
    expect(mains[0].getAttribute('aria-labelledby')).toBe('h');
    expect(document.querySelector('[data-test-nav]').getAttribute('data-test-nav')).toBe('column');
    // in the red poster frame
    expect(mains[0].closest('.bg-poster-red')).toBeTruthy();
  });
});

describe('TravelTicket', () => {
  it('shows the kicker, the page’s h1, its subtitle and route, then the form and stub', () => {
    render(
      <TravelTicket
        kicker='Sign in'
        title='Welcome back'
        headingId='ticket-title'
        subtitle='Log in to your map.'
        subtitleId='ticket-sub'
        route={{ from: 'Home', to: 'Your map' }}
        stub={['Gate 7', 'Seat 1A']}
        stamp={['Boarding', 'now']}
      >
        <form data-test-form />
      </TravelTicket>,
    );
    expect(screen.getByText(`${CompanyName} · Sign in`)).toBeTruthy();
    const heading = document.getElementById('ticket-title');
    expect(heading.tagName).toBe('H1');
    expect(heading.textContent).toBe('Welcome back');
    expect(document.getElementById('ticket-sub').textContent).toBe('Log in to your map.');
    const terms = [...document.querySelectorAll('dt')].map((dt) => dt.textContent);
    expect(terms).toEqual(['From', 'To']);
    expect([...document.querySelectorAll('dd')].map((dd) => dd.textContent)).toEqual(['Home', 'Your map']);
    expect(document.querySelector('[data-test-form]')).toBeTruthy();
    const stub = document.querySelector('aside');
    expect(stub.getAttribute('aria-hidden')).toBe('true');
    expect(stub.textContent).toContain('Gate 7');
    expect(stub.textContent).toContain('Boarding');
    expect(document.querySelector('article').className).toContain('lg:max-w-2xl');
  });

  it('leaves out what it isn’t given, and fills when asked', () => {
    render(
      <TravelTicket kicker='Invite' title='Join' widthClassName=''>
        <p>Body</p>
      </TravelTicket>,
    );
    expect(document.querySelector('dl')).toBeNull();
    expect(document.querySelectorAll('header p').length).toBe(1);
    expect(document.querySelector('article').className).not.toContain('max-w-2xl');
    // the stub's default stamp
    expect(document.querySelector('aside').textContent).toContain('Admitone');
  });
});

describe('TicketStub', () => {
  it('is a decorative stub with its stamp and lines', () => {
    const { container } = render(<TicketStub lines={['Class Economy']} stamp={['Valid']} />);
    const stub = container.querySelector('aside');
    expect(stub.getAttribute('aria-hidden')).toBe('true');
    expect([...stub.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Class Economy']);
    expect(stub.textContent).toContain('Valid');
  });
});
