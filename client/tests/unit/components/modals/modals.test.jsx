import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConfirmModal from '@/components/modals/ConfirmModal';
import CookieConsentBanner from '@/components/modals/CookieConsentBanner';
import CookieConsentModal from '@/components/modals/CookieConsentModal';
import { saveConsent } from '@/utils/analytics/consent';
import { LEGAL_AGREEMENTS_PAGE_URL, PRIVACY_POLICIES_PAGE_URL } from '@/utils/constants/routes';

vi.mock('@/utils/analytics/consent', () => ({ saveConsent: vi.fn(), openCookieSettings: vi.fn() }));

afterEach(() => {
  document.body.style.overflow = '';
  saveConsent.mockClear();
});

describe('ConfirmModal', () => {
  const open = () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const view = render(<ConfirmModal onClose={onClose} onConfirm={onConfirm} header='Delete this map?' message='It can’t be undone.' />);
    return { onClose, onConfirm, dialog: document.querySelector('[role="dialog"]'), ...view };
  };

  it('is a modal dialog named and described by its words, with Cancel focused', () => {
    const { dialog } = open();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toBe('Delete this map?');
    expect(document.getElementById(dialog.getAttribute('aria-describedby')).textContent).toBe('It can’t be undone.');
    expect(document.activeElement.textContent).toBe('Cancel');
  });

  it('confirms and closes, or just closes on Cancel and Escape', () => {
    const { onClose, onConfirm } = open();
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab between its two buttons', () => {
    open();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement.textContent).toBe('Confirm');
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement.textContent).toBe('Cancel');
  });

  it('takes the page’s one counted scroll lock and gives it back', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = open();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});

describe('CookieConsentBanner', () => {
  const show = (props = {}) => {
    const onChoice = vi.fn();
    render(
      <MemoryRouter>
        <CookieConsentBanner onChoice={onChoice} {...props} />
      </MemoryRouter>,
    );
    return { onChoice };
  };

  it('asks about analytics with two equal buttons and links the privacy policy', () => {
    show();
    expect(screen.getByLabelText('Cookie choices').getAttribute('role')).toBe('dialog');
    expect(screen.getByText('No thanks').className).toContain('w-full');
    expect(screen.getByText('Accept analytics').className).toContain('w-full');
    expect(screen.getByText('Privacy Policy').getAttribute('href')).toBe(PRIVACY_POLICIES_PAGE_URL);
    // first visit: no close stamp and no word on an earlier choice
    expect(screen.queryByLabelText('Close, keeping your choice')).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  it('saves and passes on the choice', () => {
    const { onChoice } = show();
    fireEvent.click(screen.getByText('Accept analytics'));
    expect(saveConsent).toHaveBeenCalledWith('granted', {});
    expect(onChoice).toHaveBeenCalledWith('granted');
    fireEvent.click(screen.getByText('No thanks'));
    expect(saveConsent).toHaveBeenLastCalledWith('denied', {});
    expect(onChoice).toHaveBeenLastCalledWith('denied');
  });

  it('opened from Cookie settings: says what was chosen, focuses “No thanks”, and shuts unchanged', () => {
    const onClose = vi.fn();
    const { onChoice } = show({ fromSettings: true, current: 'granted', onClose });
    expect(screen.getByText(/You've allowed Google Analytics/)).toBeTruthy();
    expect(document.activeElement.textContent).toBe('No thanks');
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByLabelText('Close, keeping your choice'));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onChoice).not.toHaveBeenCalled();
    expect(saveConsent).not.toHaveBeenCalled();
  });

  it('says a refusal back to them', () => {
    show({ fromSettings: true, current: 'denied', onClose: () => {} });
    expect(screen.getByText(/You've said no to Google Analytics/)).toBeTruthy();
  });
});

describe('CookieConsentModal', () => {
  const show = (path = '/') => {
    const onChoice = vi.fn();
    render(
      <MemoryRouter initialEntries={[path]}>
        <CookieConsentModal onChoice={onChoice} />
      </MemoryRouter>,
    );
    return { onChoice };
  };

  it('is a modal wall whose Agree waits for both boxes', () => {
    const { onChoice } = show();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById('cookie-consent-title').textContent).toBe('Cookie & Policy Consent');
    const agree = screen.getByLabelText('Agree to cookie usage');
    expect(agree.disabled).toBe(true);
    const [cookies, terms] = dialog.querySelectorAll('input[type="checkbox"]');
    expect(document.activeElement).toBe(cookies);
    fireEvent.click(cookies);
    expect(agree.disabled).toBe(true);
    fireEvent.click(terms);
    expect(agree.disabled).toBe(false);
    fireEvent.click(agree);
    expect(saveConsent).toHaveBeenCalledWith('granted', { agreed: true, assertions: { acceptCookies: true, agreeTerms: true } });
    expect(onChoice).toHaveBeenCalledWith('granted');
  });

  it('won’t close on Escape: it says how to go on', () => {
    show();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.getElementById('cookie-consent-live').textContent).toBe('Use the Disagree or I Agree buttons to proceed.');
  });

  it('is a bar on the legal pages, so they can be read', () => {
    const { onChoice } = show(LEGAL_AGREEMENTS_PAGE_URL);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    const bar = screen.getByLabelText('Cookie consent notice');
    const [cookies, terms] = bar.querySelectorAll('input[type="checkbox"]');
    const agree = screen.getByText('I Agree');
    expect(agree.disabled).toBe(true);
    fireEvent.click(cookies);
    fireEvent.click(terms);
    fireEvent.click(agree);
    expect(onChoice).toHaveBeenCalledWith('granted');
  });
});
