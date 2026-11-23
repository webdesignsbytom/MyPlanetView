import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import AdminPromoCodesMainContainer from '@/components/admin/promoCodes/AdminPromoCodesMainContainer';
import PromoCodeCreateCard from '@/components/admin/promoCodes/PromoCodeCreateCard';
import PromoCodeEditDialog from '@/components/admin/promoCodes/PromoCodeEditDialog';
import PromoCodeItem from '@/components/admin/promoCodes/PromoCodeItem';
import { createPromoCode, getPromoCodes, updatePromoCode } from '@/api/promoApi';
import { promoSignUpLink } from '@/utils/plans/promoCodes';

vi.mock('@/api/promoApi', () => ({ getPromoCodes: vi.fn(), createPromoCode: vi.fn(), updatePromoCode: vi.fn() }));

const SAM = {
  id: 'p1',
  code: 'SAMTRAVELS',
  label: 'Sam’s Travels on YouTube',
  active: true,
  maxUses: 500,
  endsAt: '2099-03-31T23:59:59.999Z',
  freePlan: null,
  signUps: 1200,
  verified: 10,
  trials: 4,
  paying: 2,
};
const OWN = { id: 'p2', code: 'TOMFREE', label: 'Mine', active: false, maxUses: null, endsAt: null, freePlan: 'PREMIUM', signUps: 0 };

const byId = (id) => document.getElementById(id);
const press = async (el) => {
  await act(async () => {
    fireEvent.click(el);
  });
};

beforeEach(() => {
  for (const fn of [getPromoCodes, createPromoCode, updatePromoCode]) fn.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('PromoCodeItem', () => {
  it('shows the code, its offer, limits, link and counts', () => {
    render(<PromoCodeItem promo={SAM} busy={false} onEdit={() => {}} onToggle={() => {}} />);
    const card = document.querySelector('article');
    expect(byId('promo-p1-heading').textContent).toBe('SAMTRAVELS');
    expect(card.getAttribute('aria-labelledby')).toBe('promo-p1-heading');
    expect(card.textContent).toContain('Up to 500 sign-ups');
    expect(card.textContent).toContain('31 Mar 2099');
    expect(card.textContent).toContain(promoSignUpLink('SAMTRAVELS'));
    expect(card.textContent).toContain('First month free');
    expect(card.textContent).toContain('1,200');
    // over its limit: used up
    expect(screen.getByText('Used up')).toBeTruthy();
  });

  it('says a code for life’s offer, no limits, and Off', () => {
    render(<PromoCodeItem promo={OWN} busy={false} onEdit={() => {}} onToggle={() => {}} />);
    const card = document.querySelector('article');
    expect(card.textContent).toContain('First Class, free for life');
    expect(card.textContent).toContain('No limit');
    expect(card.textContent).toContain('No end date');
    expect(screen.getByText('Off')).toBeTruthy();
  });

  it('changes and turns on or off, locked while busy', () => {
    const onEdit = vi.fn();
    const onToggle = vi.fn();
    const { rerender } = render(<PromoCodeItem promo={SAM} busy={false} onEdit={onEdit} onToggle={onToggle} />);
    fireEvent.click(screen.getByLabelText('Change SAMTRAVELS'));
    expect(onEdit).toHaveBeenCalledWith(SAM);
    const off = screen.getByLabelText('Turn off SAMTRAVELS');
    expect(off.className).toContain('btn-danger');
    fireEvent.click(off);
    expect(onToggle).toHaveBeenCalledWith(SAM);
    rerender(<PromoCodeItem promo={OWN} busy onEdit={onEdit} onToggle={onToggle} />);
    expect(screen.getByLabelText('Turn on TOMFREE').disabled).toBe(true);
    expect(screen.getByLabelText('Change TOMFREE').disabled).toBe(true);
    expect(document.querySelector('article').getAttribute('aria-busy')).toBe('true');
  });
});

describe('PromoCodeCreateCard', () => {
  it('checks the code and label by the form’s rules', async () => {
    render(<PromoCodeCreateCard onCreated={() => {}} />);
    await press(screen.getByText('Make code'));
    expect(byId('new-promo-code-error').textContent).toBe('A code is 3 to 24 letters and numbers.');
    expect(byId('new-promo-label-error').textContent).toBe('Give it a label: who it’s for, and when.');
    fireEvent.change(byId('new-promo-max-uses'), { target: { value: '0' } });
    await press(screen.getByText('Make code'));
    expect(byId('new-promo-max-uses-error').textContent).toBe('A whole number of sign-ups, or leave it empty for no limit.');
    expect(createPromoCode).not.toHaveBeenCalled();
  });

  it('makes a code with the usual free month, then starts afresh', async () => {
    createPromoCode.mockResolvedValue({ promoCode: { ...SAM } });
    const onCreated = vi.fn();
    render(<PromoCodeCreateCard onCreated={onCreated} />);
    fireEvent.change(byId('new-promo-code'), { target: { value: 'samtravels' } });
    fireEvent.change(byId('new-promo-label'), { target: { value: 'Sam’s Travels' } });
    fireEvent.change(byId('new-promo-max-uses'), { target: { value: '500' } });
    fireEvent.change(byId('new-promo-last-day'), { target: { value: '2027-03-31' } });
    await press(screen.getByText('Make code'));
    expect(createPromoCode).toHaveBeenCalledWith({ code: 'SAMTRAVELS', label: 'Sam’s Travels', maxUses: 500, endsAt: '2027-03-31T23:59:59.999Z' });
    expect(onCreated).toHaveBeenCalledWith(SAM);
    expect(screen.getByText('SAMTRAVELS is ready: their followers get their first month free.')).toBeTruthy();
    expect(byId('new-promo-code').value).toBe('');
  });

  it('makes a code for life with the plan chosen', async () => {
    createPromoCode.mockResolvedValue({ promoCode: { ...OWN, freePlan: 'REGULAR' } });
    render(<PromoCodeCreateCard onCreated={() => {}} />);
    fireEvent.change(byId('new-promo-code'), { target: { value: 'TOMFREE' } });
    fireEvent.change(byId('new-promo-offer'), { target: { value: 'REGULAR' } });
    fireEvent.change(byId('new-promo-label'), { target: { value: 'Mine' } });
    await press(screen.getByText('Make code'));
    expect(createPromoCode.mock.calls[0][0]).toMatchObject({ code: 'TOMFREE', freePlan: 'REGULAR', maxUses: null, endsAt: null });
    expect(screen.getByText('TOMFREE is ready: whoever signs up with it gets Business free, for life.')).toBeTruthy();
  });

  it('shows the server’s refusal', async () => {
    createPromoCode.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'That code is taken.' }));
    render(<PromoCodeCreateCard onCreated={() => {}} />);
    fireEvent.change(byId('new-promo-code'), { target: { value: 'TAKEN' } });
    fireEvent.change(byId('new-promo-label'), { target: { value: 'x' } });
    await press(screen.getByText('Make code'));
    expect(screen.getByText('That code is taken.').getAttribute('role')).toBe('alert');
  });
});

describe('PromoCodeEditDialog', () => {
  it('starts from the code, never offers to change the code, and sends only what changed', async () => {
    updatePromoCode.mockResolvedValue({ promoCode: { ...SAM, maxUses: 600 } });
    const onSaved = vi.fn();
    render(<PromoCodeEditDialog promo={SAM} onSaved={onSaved} onClose={() => {}} />);
    expect(screen.getByText('Change SAMTRAVELS')).toBeTruthy();
    expect(byId('edit-promo-code')).toBeNull();
    expect(byId('edit-promo-label').value).toBe(SAM.label);
    expect(byId('edit-promo-max-uses').value).toBe('500');
    expect(byId('edit-promo-last-day').value).toBe('2099-03-31');
    fireEvent.change(byId('edit-promo-max-uses'), { target: { value: '600' } });
    await press(screen.getByText('Save changes'));
    // the last day didn't change, so it isn't sent
    expect(updatePromoCode).toHaveBeenCalledWith('p1', { label: SAM.label, maxUses: 600 });
    expect(onSaved).toHaveBeenCalledWith({ ...SAM, maxUses: 600 });
  });

  it('says what a field needs and shows a refusal', async () => {
    updatePromoCode.mockRejectedValue(new Error('x'));
    const onClose = vi.fn();
    render(<PromoCodeEditDialog promo={SAM} onSaved={() => {}} onClose={onClose} />);
    fireEvent.change(byId('edit-promo-label'), { target: { value: ' ' } });
    await press(screen.getByText('Save changes'));
    expect(byId('edit-promo-label-error').textContent).toBe('Give it a label: who it’s for, and when.');
    fireEvent.change(byId('edit-promo-label'), { target: { value: 'New label' } });
    await press(screen.getByText('Save changes'));
    expect(screen.getByText('The code couldn’t be changed.')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AdminPromoCodesMainContainer', () => {
  it('lists the codes, or says there are none', async () => {
    getPromoCodes.mockResolvedValue({ promoCodes: [SAM, OWN] });
    const { unmount } = render(<AdminPromoCodesMainContainer />);
    const list = await screen.findByLabelText('List of promo codes');
    await within(list).findByText('SAMTRAVELS');
    expect(within(list).getByText('TOMFREE')).toBeTruthy();
    expect(list.getAttribute('aria-busy')).toBe('false');
    unmount();
    getPromoCodes.mockResolvedValue({ promoCodes: [] });
    render(<AdminPromoCodesMainContainer />);
    expect(await screen.findByText('No codes yet. Make one above.')).toBeTruthy();
  });

  it('says why when the codes can’t be loaded, and reloads', async () => {
    getPromoCodes.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'Not allowed.' })).mockResolvedValueOnce({ promoCodes: [SAM] });
    render(<AdminPromoCodesMainContainer />);
    expect((await screen.findByText('Not allowed.')).getAttribute('role')).toBe('alert');
    await press(screen.getByLabelText('Reload the codes and their counts'));
    expect(screen.getByText('SAMTRAVELS')).toBeTruthy();
  });

  it('turns a code off and on, saying what that means', async () => {
    getPromoCodes.mockResolvedValue({ promoCodes: [SAM] });
    updatePromoCode.mockResolvedValueOnce({ promoCode: { ...SAM, active: false } }).mockResolvedValueOnce({ promoCode: { ...SAM, active: true } });
    render(<AdminPromoCodesMainContainer />);
    await press(await screen.findByLabelText('Turn off SAMTRAVELS'));
    expect(updatePromoCode).toHaveBeenCalledWith('p1', { active: false });
    expect(screen.getByText('SAMTRAVELS is off: nobody new can use it.')).toBeTruthy();
    await press(screen.getByLabelText('Turn on SAMTRAVELS'));
    expect(screen.getByText('SAMTRAVELS is on: new sign-ups can use it.')).toBeTruthy();
  });

  it('says when turning one off fails', async () => {
    getPromoCodes.mockResolvedValue({ promoCodes: [SAM] });
    updatePromoCode.mockRejectedValue(new Error('x'));
    render(<AdminPromoCodesMainContainer />);
    await press(await screen.findByLabelText('Turn off SAMTRAVELS'));
    const status = screen.getByText('That didn’t work. Please try again.');
    expect(status.className).toContain('text-status-critical');
  });

  it('puts a new code first, and shows a changed one', async () => {
    getPromoCodes.mockResolvedValue({ promoCodes: [OWN] });
    createPromoCode.mockResolvedValue({ promoCode: SAM });
    updatePromoCode.mockResolvedValue({ promoCode: { ...OWN, label: 'Renamed' } });
    render(<AdminPromoCodesMainContainer />);
    await screen.findByText('TOMFREE');
    fireEvent.change(byId('new-promo-code'), { target: { value: 'SAMTRAVELS' } });
    fireEvent.change(byId('new-promo-label'), { target: { value: 'Sam' } });
    await press(screen.getByText('Make code'));
    const headings = [...screen.getByLabelText('List of promo codes').querySelectorAll('h3')].map((h) => h.textContent);
    expect(headings).toEqual(['SAMTRAVELS', 'TOMFREE']);
    fireEvent.click(screen.getByLabelText('Change TOMFREE'));
    fireEvent.change(byId('edit-promo-label'), { target: { value: 'Renamed' } });
    await press(within(document.querySelector('[role="dialog"]')).getByText('Save changes'));
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.getByText('TOMFREE is changed.')).toBeTruthy();
    expect(screen.getByText('Renamed')).toBeTruthy();
  });
});
