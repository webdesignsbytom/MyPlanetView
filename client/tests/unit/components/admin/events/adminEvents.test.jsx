import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminEventsMainContainer from '@/components/admin/events/AdminEventsMainContainer';
import EventAdminItem from '@/components/admin/events/EventAdminItem';
import EventFilters from '@/components/admin/events/EventFilters';
import client from '@/api/client';
import { DELETE_ALL_EVENTS_API, DELETE_EVENT_API, GET_PAGINATED_EVENTS_API, UPDATE_EVENT_STATUS_API } from '@/utils/constants/apiRoutes';

vi.mock('@/api/client', () => ({ default: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const EVENT = {
  id: 'e1',
  level: 'ERROR',
  status: 'OPEN',
  domain: 'users',
  statusCode: 500,
  action: 'updateUser',
  message: 'Could not update the user.',
  createdAt: '2026-11-20T10:00:00Z',
  method: 'PATCH',
  path: '/api/users/:id',
  requestId: 'req-1',
  actor: { name: 'Alex', email: 'alex@example.com' },
  targetId: 'u9',
  metadata: { field: 'name' },
  stack: 'Error: boom\n  at x',
};
const STATUS_OPTIONS = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED'].map((value) => ({ value, label: value }));

const page = (events, total = events.length) => ({ data: { data: { events, total } } });
const lastQuery = () => new URLSearchParams(client.get.mock.calls.at(-1)[0].split('?')[1]);
const press = async (el) => {
  await act(async () => {
    fireEvent.click(el);
  });
};

beforeEach(() => {
  for (const fn of [client.get, client.patch, client.delete]) fn.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('EventAdminItem', () => {
  const draw = (props = {}) => {
    const onStatusChange = vi.fn();
    const onDelete = vi.fn();
    render(<EventAdminItem event={EVENT} statusOptions={STATUS_OPTIONS} busy={false} onStatusChange={onStatusChange} onDelete={onDelete} {...props} />);
    return { onStatusChange, onDelete, card: document.querySelector('article') };
  };

  it('sums the event up: level, status, domain, code, action and message', () => {
    const { card } = draw();
    expect(card.getAttribute('aria-labelledby')).toBe('event-heading-e1');
    expect(document.getElementById('event-heading-e1').textContent).toBe('updateUser');
    expect(card.textContent).toContain('ERROR');
    expect(card.textContent).toContain('500');
    expect(card.querySelector('time').getAttribute('datetime')).toBe(EVENT.createdAt);
    expect(screen.getByText('Could not update the user.').className).toContain('line-clamp-2');
  });

  it('shows its details on demand: request, people, metadata and stack', () => {
    draw();
    const toggle = screen.getByText('Show details');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByText('Hide details').getAttribute('aria-expanded')).toBe('true');
    const details = document.getElementById('event-details-e1');
    expect(details.textContent).toContain('PATCH /api/users/:id');
    expect(details.textContent).toContain('Alex <alex@example.com>');
    // a deleted target keeps its id
    expect(details.textContent).toContain('u9 (deleted)');
    expect(details.textContent).toContain('"field": "name"');
    expect(details.textContent).toContain('Error: boom');
  });

  it('changes its status and deletes it, locked while busy', () => {
    const { onStatusChange, onDelete } = draw();
    fireEvent.change(document.getElementById('event-status-e1'), { target: { value: 'RESOLVED' } });
    expect(onStatusChange).toHaveBeenCalledWith(EVENT, 'RESOLVED');
    fireEvent.click(screen.getByLabelText('Delete event updateUser'));
    expect(onDelete).toHaveBeenCalledWith(EVENT);
    document.body.innerHTML = '';
    draw({ busy: true });
    expect(document.getElementById('event-status-e1').disabled).toBe(true);
    expect(screen.getByLabelText('Delete event updateUser').disabled).toBe(true);
  });
});

describe('EventFilters', () => {
  it('passes on the search and each filter', () => {
    const onFilterChange = vi.fn();
    const onSearchChange = vi.fn();
    const options = { level: [{ value: '', label: 'All levels' }, 'ERROR'], domain: [{ value: '', label: 'All domains' }], status: [{ value: '', label: 'All statuses' }, 'OPEN'] };
    render(<EventFilters filters={{ level: '', domain: '', status: '' }} search='' options={options} onFilterChange={onFilterChange} onSearchChange={onSearchChange} />);
    expect(screen.getByLabelText('Filter audit log').getAttribute('role')).toBe('search');
    fireEvent.change(document.getElementById('event-search'), { target: { value: 'boom' } });
    expect(onSearchChange).toHaveBeenCalledWith('boom');
    fireEvent.change(document.getElementById('event-level-filter'), { target: { value: 'ERROR' } });
    expect(onFilterChange).toHaveBeenCalledWith('level', 'ERROR');
    fireEvent.change(document.getElementById('event-status-filter'), { target: { value: 'OPEN' } });
    expect(onFilterChange).toHaveBeenCalledWith('status', 'OPEN');
  });
});

describe('AdminEventsMainContainer', () => {
  it('loads the first page of 25', async () => {
    client.get.mockResolvedValue(page([EVENT], 60));
    render(<AdminEventsMainContainer />);
    await screen.findByText('updateUser');
    expect(client.get.mock.calls[0][0].startsWith(`${GET_PAGINATED_EVENTS_API}?`)).toBe(true);
    expect(lastQuery().get('page')).toBe('1');
    expect(lastQuery().get('pageSize')).toBe('25');
    expect(screen.getByText('Page 1 of 3 (60 total)')).toBeTruthy();
    expect(screen.getByText('Delete All')).toBeTruthy();
  });

  it('says when nothing matches, or the log can’t be loaded', async () => {
    client.get.mockResolvedValue(page([], 0));
    const { unmount } = render(<AdminEventsMainContainer />);
    expect(await screen.findByText('No events match these filters.')).toBeTruthy();
    expect(screen.queryByText('Delete All')).toBeNull();
    unmount();
    client.get.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Developers only.' }));
    render(<AdminEventsMainContainer />);
    expect(await screen.findByText('Developers only.')).toBeTruthy();
  });

  it('filters and pages, going back to page 1 on a new filter', async () => {
    client.get.mockResolvedValue(page([EVENT], 60));
    render(<AdminEventsMainContainer />);
    await screen.findByText('updateUser');
    await press(screen.getByText('Next'));
    await waitFor(() => expect(lastQuery().get('page')).toBe('2'));
    fireEvent.change(document.getElementById('event-level-filter'), { target: { value: 'ERROR' } });
    await waitFor(() => expect(lastQuery().get('level')).toBe('ERROR'));
    expect(lastQuery().get('page')).toBe('1');
  });

  it('searches once the typing pauses', async () => {
    client.get.mockResolvedValue(page([EVENT], 1));
    render(<AdminEventsMainContainer />);
    await screen.findByText('updateUser');
    const calls = client.get.mock.calls.length;
    fireEvent.change(document.getElementById('event-search'), { target: { value: '  boom ' } });
    expect(client.get.mock.calls.length).toBe(calls);
    await waitFor(() => expect(lastQuery().get('search')).toBe('boom'));
  });

  it('marks an event’s status and says so', async () => {
    client.get.mockResolvedValue(page([EVENT], 1));
    client.patch.mockResolvedValue({ data: { data: { event: { ...EVENT, status: 'RESOLVED' } } } });
    render(<AdminEventsMainContainer />);
    await screen.findByText('updateUser');
    await act(async () => fireEvent.change(document.getElementById('event-status-e1'), { target: { value: 'RESOLVED' } }));
    expect(client.patch).toHaveBeenCalledWith(`${UPDATE_EVENT_STATUS_API}/e1`, { status: 'RESOLVED' }, true);
    expect(screen.getByText('Event marked Resolved.')).toBeTruthy();
    expect(document.getElementById('event-status-e1').value).toBe('RESOLVED');
  });

  it('deletes one event after confirming, and reloads', async () => {
    client.get.mockResolvedValue(page([EVENT], 1));
    client.delete.mockResolvedValue({});
    render(<AdminEventsMainContainer />);
    await screen.findByText('updateUser');
    fireEvent.click(screen.getByLabelText('Delete event updateUser'));
    const dialog = document.querySelector('[role="dialog"]');
    expect(within(dialog).getByText('Delete Event')).toBeTruthy();
    const loads = client.get.mock.calls.length;
    await press(within(dialog).getByText('Confirm'));
    expect(client.delete).toHaveBeenCalledWith(`${DELETE_EVENT_API}/e1`, true);
    expect(screen.getByText('Event deleted.')).toBeTruthy();
    await waitFor(() => expect(client.get.mock.calls.length).toBe(loads + 1));
  });

  it('deletes every event after confirming', async () => {
    client.get.mockResolvedValue(page([EVENT], 1));
    client.delete.mockRejectedValue(new Error('x'));
    render(<AdminEventsMainContainer />);
    await screen.findByText('updateUser');
    fireEvent.click(screen.getByText('Delete All'));
    const dialog = document.querySelector('[role="dialog"]');
    expect(within(dialog).getByText(/every event in the audit log/)).toBeTruthy();
    await press(within(dialog).getByText('Confirm'));
    expect(client.delete).toHaveBeenCalledWith(DELETE_ALL_EVENTS_API, true);
    expect(screen.getByText('Failed to delete events.').className).toContain('text-status-critical');
  });
});
