import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '@/components/forms/RegisterForm';
import PromoCodeField from '@/components/forms/PromoCodeField';
import FormAlert from '@/components/forms/FormAlert';
import { AuthContext } from '@/auth/AuthContext';
import usePromoCodeCheck from '@/hooks/usePromoCodeCheck';
import { forgetMapLists } from '@/utils/map/mapListCache';
import { PASSWORD_RULE } from '@/utils/regex/regex';
import { PROMO_CODE_INVALID, promoOfferText } from '@/utils/plans/promoCodes';
import { WELCOME_PAGE_URL, mapPath, tripPath } from '@/utils/constants/routes';

const navigateToPage = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useNavigateToPage', () => ({ default: () => navigateToPage }));
vi.mock('@/hooks/usePromoCodeCheck', () => ({ default: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));

const GOOD = 'Travel1!go';
const checkNow = vi.fn();

beforeEach(() => {
  navigateToPage.mockReset();
  checkNow.mockReset();
  usePromoCodeCheck.mockReturnValue({ result: { status: 'idle' }, checkNow });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const open = ({ register = vi.fn().mockResolvedValue({ ok: true }), entry = '/sign-up' } = {}) => {
  render(
    <AuthContext.Provider value={{ register }}>
      <MemoryRouter initialEntries={[entry]}>
        <RegisterForm />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { register, field: (id) => document.getElementById(id) };
};

const fill = (field, { password = GOOD, confirm = password, terms = true } = {}) => {
  fireEvent.change(field('username'), { target: { name: 'username', value: 'Sam' } });
  fireEvent.change(field('email'), { target: { name: 'email', value: 'sam@example.com' } });
  fireEvent.change(field('password'), { target: { name: 'password', value: password } });
  fireEvent.change(field('confirmPassword'), { target: { name: 'confirmPassword', value: confirm } });
  if (terms) fireEvent.click(field('termsChecked'));
};

const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByLabelText('Register your account'));
  });
};

const alertText = () => document.querySelector('form > [role="alert"]')?.textContent;

describe('RegisterForm', { timeout: 20000 }, () => {
  it('starts empty, the terms unticked, the password rule as the hint', () => {
    const { field } = open();
    expect(field('username').value).toBe('');
    expect(field('email').readOnly).toBe(false);
    expect(field('termsChecked').checked).toBe(false);
    expect(document.getElementById('password-hint').textContent).toBe(PASSWORD_RULE);
    expect(field('password').getAttribute('autocomplete')).toBe('new-password');
    expect(field('country').value).toBe('United Kingdom');
  });

  it('refuses a weak password with the one wording of the rule, sending nothing', async () => {
    const { field, register } = open();
    fill(field, { password: 'short' });
    await submit();
    expect(alertText()).toBe(PASSWORD_RULE);
    expect(register).not.toHaveBeenCalled();
    expect(field('password').getAttribute('aria-invalid')).toBe('true');
  });

  it('refuses passwords that don’t match', async () => {
    const { field, register } = open();
    fill(field, { confirm: 'Travel1!gone' });
    await submit();
    expect(alertText()).toBe('Passwords do not match or fail requirements. Please re-enter them.');
    expect(register).not.toHaveBeenCalled();
  });

  it('asks for the age and terms box to be ticked', async () => {
    const { field, register } = open();
    fill(field, { terms: false });
    await submit();
    expect(alertText()).toContain('13 or over');
    expect(register).not.toHaveBeenCalled();
  });

  it('signs up and goes on to set up the map', async () => {
    const { field, register } = open();
    fill(field);
    await submit();
    expect(register).toHaveBeenCalledWith({
      email: 'sam@example.com',
      password: GOOD,
      confirmPassword: GOOD,
      username: 'Sam',
      country: 'United Kingdom',
      agreedToTerms: true,
      promoCode: '',
      inviteToken: '',
    });
    expect(navigateToPage).toHaveBeenCalledWith(WELCOME_PAGE_URL);
  });

  it('goes back where a guarded page sent them from', async () => {
    const register = vi.fn().mockResolvedValue({ ok: true });
    render(
      <AuthContext.Provider value={{ register }}>
        <MemoryRouter initialEntries={[{ pathname: '/sign-up', state: { from: '/gifts' } }]}>
          <RegisterForm />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    fill((id) => document.getElementById(id));
    await submit();
    expect(navigateToPage).toHaveBeenCalledWith('/gifts');
  });

  it('shows the server’s refusal and stays', async () => {
    const register = vi.fn().mockResolvedValue({ ok: false, error: 'That address already has an account.' });
    const { field } = open({ register });
    fill(field);
    await submit();
    expect(alertText()).toBe('That address already has an account.');
    expect(navigateToPage).not.toHaveBeenCalled();
  });

  describe('the promo code', () => {
    it('is filled from the link’s ?code= and sent normalised', async () => {
      const { field, register } = open({ entry: '/sign-up?code=samtravels' });
      await waitFor(() => expect(field('promoCode').value).toBe('samtravels'));
      fill(field);
      await submit();
      expect(register.mock.calls[0][0].promoCode).toBe('SAMTRAVELS');
    });

    it('is filled from one remembered this visit', async () => {
      sessionStorage.setItem('mpv:promoCode', JSON.stringify('TRAVELTALK'));
      const { field } = open();
      await waitFor(() => expect(field('promoCode').value).not.toBe(''));
      expect(field('promoCode').value).toContain('TRAVELTALK');
    });

    it('is checked when the field is left, and says what it gives', () => {
      usePromoCodeCheck.mockReturnValue({ result: { status: 'valid', code: 'SAMTRAVELS' }, checkNow });
      const { field } = open();
      fireEvent.change(field('promoCode'), { target: { name: 'promoCode', value: 'SAMTRAVELS' } });
      expect(usePromoCodeCheck).toHaveBeenLastCalledWith('SAMTRAVELS');
      fireEvent.blur(field('promoCode'));
      expect(checkNow).toHaveBeenCalled();
      expect(document.getElementById('promoCode-status').textContent).toBe(promoOfferText({ code: 'SAMTRAVELS' }));
    });

    it('isn’t sent once found unusable: the form says so and focuses it', async () => {
      usePromoCodeCheck.mockReturnValue({ result: { status: 'invalid', message: 'No such code.' }, checkNow });
      const { field, register } = open();
      fill(field);
      fireEvent.change(field('promoCode'), { target: { name: 'promoCode', value: 'NOPE' } });
      await submit();
      expect(register).not.toHaveBeenCalled();
      expect(alertText()).toBe(PROMO_CODE_INVALID);
      expect(document.activeElement).toBe(field('promoCode'));
    });

    it('marks the field when the server refuses it at sign-up, until it changes', async () => {
      usePromoCodeCheck.mockReturnValue({ result: { status: 'valid', code: 'GONE' }, checkNow });
      const register = vi.fn().mockResolvedValue({ ok: false, error: PROMO_CODE_INVALID });
      const { field } = open({ register });
      fill(field);
      fireEvent.change(field('promoCode'), { target: { name: 'promoCode', value: 'GONE' } });
      await submit();
      expect(field('promoCode').getAttribute('aria-invalid')).toBe('true');
      // the earlier "valid" goes: the form's own error says it
      expect(document.getElementById('promoCode-status').textContent).toBe('');
      fireEvent.change(field('promoCode'), { target: { name: 'promoCode', value: '' } });
      expect(field('promoCode').getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('from an invite', () => {
    const invite = { token: 'tok-1', email: 'jo@example.com', name: 'Jo', kind: 'map', id: 'map 1' };
    const openInvite = (inv = invite) => {
      const register = vi.fn().mockResolvedValue({ ok: true });
      render(
        <AuthContext.Provider value={{ register }}>
          <MemoryRouter initialEntries={[{ pathname: '/sign-up', state: { invite: inv } }]}>
            <RegisterForm />
          </MemoryRouter>
        </AuthContext.Provider>,
      );
      return register;
    };

    it('keeps the invite’s address, sends its token and goes straight to the map', async () => {
      const register = openInvite();
      const email = document.getElementById('email');
      expect(email.value).toBe('jo@example.com');
      expect(email.readOnly).toBe(true);
      expect(document.getElementById('email-hint').textContent).toBe('The address your invite was sent to.');
      expect(document.getElementById('username').value).toBe('Jo');
      fireEvent.change(document.getElementById('password'), { target: { name: 'password', value: GOOD } });
      fireEvent.change(document.getElementById('confirmPassword'), { target: { name: 'confirmPassword', value: GOOD } });
      fireEvent.click(document.getElementById('termsChecked'));
      await submit();
      expect(register.mock.calls[0][0]).toMatchObject({ email: 'jo@example.com', inviteToken: 'tok-1' });
      expect(forgetMapLists).toHaveBeenCalled();
      expect(navigateToPage).toHaveBeenCalledWith(mapPath('map 1'), { joinedByInvite: true });
    });

    it('goes to the trip for a trip’s invite', async () => {
      openInvite({ ...invite, kind: 'trip', id: 't1' });
      fireEvent.change(document.getElementById('password'), { target: { name: 'password', value: GOOD } });
      fireEvent.change(document.getElementById('confirmPassword'), { target: { name: 'confirmPassword', value: GOOD } });
      fireEvent.click(document.getElementById('termsChecked'));
      await submit();
      expect(navigateToPage).toHaveBeenCalledWith(tripPath('t1'), { joinedByInvite: true });
    });
  });
});

describe('PromoCodeField', () => {
  const field = (result, props = {}) => {
    render(<PromoCodeField value='CODE' onChange={() => {}} result={result} {...props} />);
    return { input: document.getElementById('promoCode'), status: document.getElementById('promoCode-status') };
  };

  it('is optional, says nothing until checked, and is a polite status', () => {
    const { input, status } = field({ status: 'idle' });
    expect(screen.getByText('Promo code (optional)')).toBeTruthy();
    expect(input.maxLength).toBe(64);
    expect(input.getAttribute('autocapitalize')).toBe('characters');
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent).toBe('');
  });

  it('says it’s checking, what a good code gives, and why a bad one can’t be used', () => {
    const { status, input } = field({ status: 'checking' });
    expect(status.textContent).toBe('Checking the code…');
    cleanupAndRender({ status: 'invalid', message: 'Used up.' });
    expect(document.getElementById('promoCode-status').textContent).toBe('Used up.');
    expect(document.getElementById('promoCode-status').className).toContain('text-status-critical');
    expect(document.getElementById('promoCode').getAttribute('aria-invalid')).toBe('true');
    cleanupAndRender({ status: 'unknown', message: 'Couldn’t check it.' });
    expect(document.getElementById('promoCode-status').className).toContain('text-status-warning');
    cleanupAndRender({ status: 'valid', code: 'SAM', freePlan: 'PREMIUM' });
    expect(document.getElementById('promoCode-status').textContent).toBe(promoOfferText({ code: 'SAM', freePlan: 'PREMIUM' }));
    expect(document.getElementById('promoCode-status').className).toContain('text-status-good');
    expect(input).toBeTruthy();
  });

  function cleanupAndRender(result) {
    document.body.innerHTML = '';
    render(<PromoCodeField value='CODE' onChange={() => {}} result={result} />);
  }
});

describe('FormAlert', () => {
  it('shows nothing without a message', () => {
    const { container } = render(<FormAlert message='' />);
    expect(container.innerHTML).toBe('');
  });

  it('is an assertive alert for an error and a polite one for good news, focusable from code', () => {
    const ref = React.createRef();
    const { rerender } = render(<FormAlert innerRef={ref} message='Wrong password.' />);
    const alert = screen.getByRole('alert');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
    expect(alert.getAttribute('tabindex')).toBe('-1');
    expect(alert.className).toContain('text-status-critical');
    expect(ref.current).toBe(alert);
    rerender(<FormAlert innerRef={ref} message='Saved.' variant='success' />);
    expect(screen.getByRole('alert').getAttribute('aria-live')).toBe('polite');
    expect(screen.getByRole('alert').className).toContain('text-status-good');
  });
});
