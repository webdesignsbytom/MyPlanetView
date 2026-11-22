import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminTransferMapCard from '@/components/admin/users/AdminTransferMapCard';
import { adminTransferMap } from '@/api/plansApi';

vi.mock('@/api/plansApi', () => ({ adminTransferMap: vi.fn() }));

const fill = ({ mapId = 'map-1', email = 'New.Owner@Example.com', keep = false } = {}) => {
  fireEvent.change(screen.getByLabelText(/^Map id/), { target: { value: mapId } });
  fireEvent.change(screen.getByLabelText(/^New owner’s email/), { target: { value: email } });
  if (keep) fireEvent.click(screen.getByLabelText('Keep the old owner on the map as an editor'));
  fireEvent.click(screen.getByText('Transfer map'));
};

const confirmDialog = () => document.querySelector('[role="dialog"]');

describe('AdminTransferMapCard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('is a card named for what it does', () => {
    const { container } = render(<AdminTransferMapCard />);
    const card = container.querySelector('section');
    expect(card.getAttribute('aria-labelledby')).toBe('admin-transfer-map-heading');
    expect(container.querySelector('#admin-transfer-map-heading').textContent).toBe('Transfer a map');
  });

  it('asks for both fields before anything happens', () => {
    render(<AdminTransferMapCard />);
    fireEvent.click(screen.getByText('Transfer map'));
    expect(screen.getByText('Enter the map’s id (from its address: /maps/<id>).').getAttribute('role')).toBe('alert');
    expect(screen.getByText('Enter the new owner’s email address.')).toBeTruthy();
    expect(screen.getByLabelText(/^Map id/).getAttribute('aria-invalid')).toBe('true');
    expect(confirmDialog()).toBeNull();
  });

  it('refuses an address that isn’t one', () => {
    render(<AdminTransferMapCard />);
    fill({ email: 'not an address' });
    expect(screen.queryByText('Enter the map’s id (from its address: /maps/<id>).')).toBeNull();
    expect(screen.getByText('Enter the new owner’s email address.')).toBeTruthy();
    expect(confirmDialog()).toBeNull();
  });

  it('asks first, saying the old owner loses access unless kept', () => {
    render(<AdminTransferMapCard />);
    fill();
    expect(confirmDialog().textContent).toContain('Transfer this map?');
    expect(confirmDialog().textContent).toContain(
      'The map map-1 will belong to New.Owner@Example.com, with its owner’s plan. The old owner loses access.',
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(confirmDialog()).toBeNull();
    expect(adminTransferMap).not.toHaveBeenCalled();
  });

  it('says the old owner stays when ticked', () => {
    render(<AdminTransferMapCard />);
    fill({ keep: true });
    expect(confirmDialog().textContent).toContain('The old owner stays as an editor.');
  });

  it('moves the map with the address in lower case, then clears the form', async () => {
    adminTransferMap.mockResolvedValue({ map: { name: 'Family travels', graceUntil: null } });
    render(<AdminTransferMapCard />);
    fill({ mapId: '  map-1 ', keep: true });
    fireEvent.click(screen.getByText('Confirm'));
    expect(await screen.findByText('“Family travels” now belongs to New.Owner@Example.com.')).toBeTruthy();
    expect(adminTransferMap).toHaveBeenCalledWith({ mapId: 'map-1', toEmail: 'new.owner@example.com', keepOldOwnerAsEditor: true });
    expect(screen.getByLabelText(/^Map id/).value).toBe('');
    expect(screen.getByLabelText(/^New owner’s email/).value).toBe('');
    expect(screen.getByLabelText('Keep the old owner on the map as an editor').checked).toBe(false);
  });

  it('says when the new owner’s grace runs out', async () => {
    adminTransferMap.mockResolvedValue({ map: { name: 'Family travels', graceUntil: '2027-01-21T00:00:00Z' } });
    render(<AdminTransferMapCard />);
    fill();
    fireEvent.click(screen.getByText('Confirm'));
    expect(
      await screen.findByText(
        '“Family travels” now belongs to New.Owner@Example.com. They have no free map slot, so it’s fully usable until 21 Jan 2027, then needs paying for.',
      ),
    ).toBeTruthy();
  });

  it('says why the move failed, keeping what was typed', async () => {
    adminTransferMap.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'No such map.' }));
    render(<AdminTransferMapCard />);
    fill();
    fireEvent.click(screen.getByText('Confirm'));
    expect((await screen.findByText('No such map.')).getAttribute('role')).toBe('alert');
    expect(screen.getByLabelText(/^Map id/).value).toBe('map-1');
  });

  it('has its own words when the server gives none', async () => {
    adminTransferMap.mockRejectedValue(new Error('no'));
    render(<AdminTransferMapCard />);
    fill();
    fireEvent.click(screen.getByText('Confirm'));
    expect(await screen.findByText('The map couldn’t be moved.')).toBeTruthy();
  });
});
