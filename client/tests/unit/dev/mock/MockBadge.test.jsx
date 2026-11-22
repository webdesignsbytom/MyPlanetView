import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MockBadge from '@/dev/mock/MockBadge';
import { getMockRole } from '@/dev/mock/store';
import { effectivePlan, extraMapsPaid } from '@/dev/mock/plans';
import { USER, db, freshStore, testUser } from './mockApi';

// jsdom can't reload the page, and says so through its own console: kept quiet here
let jsdomErrors = [];
beforeAll(() => {
  const virtualConsole = window._virtualConsole;
  jsdomErrors = virtualConsole?.listeners('jsdomError') ?? [];
  virtualConsole?.removeAllListeners('jsdomError');
});
afterAll(() => jsdomErrors.forEach((listener) => window._virtualConsole?.on('jsdomError', listener)));
beforeEach(() => {
  freshStore();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const open = () => {
  render(<MockBadge />);
  fireEvent.click(screen.getByText('Mock mode'));
};
const saved = () => JSON.parse(localStorage.getItem('mpvMockStore.v6'));

describe('MockBadge', () => {
  it('starts closed, and opens to say it’s demo data with the sign-in details', () => {
    render(<MockBadge />);
    const button = screen.getByText('Mock mode');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Demo data in this browser. No server.')).toBeNull();
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Demo data in this browser. No server.')).toBeTruthy();
    expect(screen.getByText('test@myplanetview.local')).toBeTruthy();
    expect(screen.getByText('12345678')).toBeTruthy();
  });

  it('shows the test user’s role, plan and extra maps', () => {
    open();
    expect(screen.getByLabelText('Signed in as').value).toBe('USER');
    expect(screen.getByLabelText('Plan').value).toBe('REGULAR');
    expect(screen.getByLabelText('Extra maps paid').value).toBe('1');
    expect(screen.getByLabelText('Email verified').checked).toBe(true);
  });

  it('switches the role, the plan and the extra maps, and saves them', () => {
    open();
    fireEvent.change(screen.getByLabelText('Signed in as'), { target: { value: 'ADMIN' } });
    expect(getMockRole()).toBe('ADMIN');
    fireEvent.change(screen.getByLabelText('Plan'), { target: { value: 'PREMIUM' } });
    expect(effectivePlan(USER).plan).toBe('PREMIUM');
    expect(saved().subscriptions.find((s) => s.userId === USER).plan).toBe('PREMIUM');
    fireEvent.change(screen.getByLabelText('Extra maps paid'), { target: { value: '3' } });
    expect(extraMapsPaid(USER)).toBe(3);
  });

  it('makes the test user unverified, and back', () => {
    open();
    fireEvent.click(screen.getByLabelText('Email verified'));
    expect(testUser().emailVerified).toBe(false);
    expect(saved().users[0].emailVerified).toBe(false);
  });

  it('resets the demo data, and chooses the real API', () => {
    open();
    db().maps = [];
    fireEvent.click(screen.getByText('Reset demo data'));
    expect(db().maps.length).toBeGreaterThan(4);
    fireEvent.click(screen.getByText('Use real API'));
    expect(localStorage.getItem('mpv:apiSource')).toBe('real');
  });
});
