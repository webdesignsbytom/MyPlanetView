import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AnniversaryTag from '@/components/moments/AnniversaryTag';
import MomentCard from '@/components/moments/MomentCard';
import MomentList from '@/components/moments/MomentList';
import MomentStamp from '@/components/moments/MomentStamp';
import { deleteMoment, getMomentPage } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ deleteMoment: vi.fn(), getMomentPage: vi.fn() }));
vi.mock('@/components/moments/MomentForm', () => ({
  default: ({ moment, onSaved, onCancel }) => (
    <div data-moment-form={moment ? moment.id : 'new'}>
      <button type='button' onClick={() => onSaved({ ...(moment || { id: 'new-1' }), title: 'Saved' })}>
        Save the form
      </button>
      <button type='button' onClick={onCancel}>
        Cancel the form
      </button>
    </div>
  ),
}));

beforeEach(() => vi.clearAllMocks());

const MOMENT = {
  id: 'mo1',
  kind: 'ENGAGEMENT',
  title: 'Engaged',
  text: 'Under the tower.',
  happenedOn: '2019-06-14',
  datePrecision: 'DAY',
  countryCode: 'FR',
  landmark: { id: 'eiffel', name: 'Eiffel Tower' },
  placeName: 'Paris',
  travellerIds: ['t1', 't2', 't3'],
  photos: [
    { id: 'ph1', thumbUrl: '/1.jpg' },
    { id: 'ph2', thumbUrl: '/2.jpg' },
  ],
  tripId: 'trip1',
};
const TRAVELLERS = [
  { id: 't1', name: 'Charlie' },
  { id: 't2', name: 'Alex' },
  { id: 't3', name: 'Mia' },
];

const card = (props = {}) => render(<ul><MomentCard moment={MOMENT} travellers={TRAVELLERS} onEdit={vi.fn()} onDeleted={vi.fn()} {...props} /></ul>);

describe('MomentStamp', () => {
  it('is a decorative stamp, with a picture even for a kind it doesn’t know', () => {
    const { container } = render(<MomentStamp kind='NOT_A_KIND' className='h-8 w-8' />);
    const stamp = container.firstChild;
    expect(stamp.getAttribute('aria-hidden')).toBe('true');
    expect(stamp.className).toContain('h-8 w-8');
    expect(stamp.querySelector('svg')).toBeTruthy();
  });
});

describe('MomentCard', () => {
  it('shows the title at its heading level, then kind, date and place, the story and who it’s about', () => {
    card({ headingLevel: 3 });
    const heading = screen.getByText('Engaged');
    expect(heading.tagName).toBe('H3');
    expect(screen.getByText('Engagement · 14 Jun 2019 · Eiffel Tower, Paris')).toBeTruthy();
    expect(screen.getByText('Under the tower.')).toBeTruthy();
    expect(screen.getByText('With Charlie, Alex and Mia')).toBeTruthy();
  });

  it('says “No date” for an undated moment, and adds the country in a trip’s list', () => {
    card({ moment: { ...MOMENT, happenedOn: null, datePrecision: null, landmark: null, placeName: null, travellerIds: ['t1', 't2'] }, showCountry: true });
    expect(screen.getByText('Engagement · No date · France')).toBeTruthy();
    expect(screen.getByText('With Charlie and Alex')).toBeTruthy();
  });

  it('names its trip when the trips are given', () => {
    card({ trips: [{ id: 'trip1', title: 'Paris in June' }] });
    expect(screen.getByText('On Paris in June')).toBeTruthy();
  });

  it('links a pinned spot to Google Maps, with who sees it for editors', () => {
    card({ moment: { ...MOMENT, spot: { latitude: 48.8584, longitude: 2.2945, shared: false } }, canEdit: true });
    const link = screen.getByText('See the spot on Google Maps').closest('a');
    expect(link.getAttribute('href')).toBe('https://www.google.com/maps/search/?api=1&query=48.858400%2C2.294500');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(link.parentElement.textContent).toContain('Only you and the map’s editors see this spot');
  });

  it('says a hidden moment is hidden', () => {
    card({ moment: { ...MOMENT, hidden: true } });
    expect(screen.getByText('Hidden from viewers')).toBeTruthy();
  });

  it('opens a photo with the moment’s photos as its list', () => {
    const onOpenPhoto = vi.fn();
    card({ onOpenPhoto });
    fireEvent.click(screen.getByLabelText('Open photo 2 of Engaged'));
    expect(onOpenPhoto).toHaveBeenCalledWith(MOMENT.photos[1], { photos: MOMENT.photos });
  });

  it('shows the photos as plain tiles when they can’t be opened', () => {
    card();
    expect(screen.getByLabelText('Photos of Engaged').querySelectorAll('img').length).toBe(2);
    expect(screen.queryByLabelText('Open photo 1 of Engaged')).toBeNull();
  });

  it('gives editors Edit and Delete, which asks first', async () => {
    deleteMoment.mockResolvedValue({});
    const onEdit = vi.fn();
    const onDeleted = vi.fn();
    card({ canEdit: true, onEdit, onDeleted });
    fireEvent.click(screen.getByLabelText('Edit Engaged'));
    expect(onEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Delete Engaged'));
    expect(screen.getByText('Delete “Engaged”? It can’t be brought back.')).toBeTruthy();
    fireEvent.click(screen.getByText('Keep it'));
    expect(deleteMoment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Delete Engaged'));
    fireEvent.click(screen.getByText('Yes, delete it'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('mo1'));
  });

  it('says why a delete failed', async () => {
    deleteMoment.mockRejectedValue(new Error('x'));
    card({ canEdit: true });
    fireEvent.click(screen.getByLabelText('Delete Engaged'));
    fireEvent.click(screen.getByText('Yes, delete it'));
    expect(await screen.findByText('The moment could not be deleted.')).toBeTruthy();
  });

  it('gives viewers neither', () => {
    card();
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('takes focus on its title when just saved', () => {
    card({ focusTitle: true });
    expect(document.activeElement.textContent).toBe('Engaged');
  });
});

describe('MomentList', () => {
  const listOf = (moments, extra = {}) => ({
    moments,
    loading: false,
    error: null,
    nextCursor: null,
    loadMore: vi.fn(),
    saved: vi.fn(),
    removed: vi.fn(),
    ...extra,
  });

  it('says when there are none, and shows a failure', () => {
    const { rerender } = render(<MomentList list={listOf([])} emptyText='Nothing yet.' />);
    expect(screen.getByText('Nothing yet.')).toBeTruthy();
    rerender(<MomentList list={listOf([], { error: 'No connection.' })} emptyText='Nothing yet.' />);
    expect(screen.getByText('No connection.').getAttribute('role')).toBe('alert');
    expect(screen.queryByText('Nothing yet.')).toBeNull();
  });

  it('lists the moments, with “Show more moments” while there are more', () => {
    const list = listOf([MOMENT], { nextCursor: 'c2' });
    render(<MomentList list={list} />);
    expect(screen.getByText('Engaged')).toBeTruthy();
    fireEvent.click(screen.getByText('Show more moments'));
    expect(list.loadMore).toHaveBeenCalled();
  });

  it('shows a spinner while loading', () => {
    render(<MomentList list={listOf([], { loading: true })} />);
    expect(screen.getByText('Loading moments…')).toBeTruthy();
  });

  it('gives editors “Add a moment”, which opens the form in place and saves into the list', () => {
    const list = listOf([]);
    const onChanged = vi.fn();
    render(<MomentList list={list} canEdit onChanged={onChanged} />);
    fireEvent.click(screen.getByText('Add a moment'));
    expect(screen.getByLabelText('Add a moment').getAttribute('aria-label')).toBe('Add a moment');
    expect(document.querySelector('[data-moment-form="new"]')).toBeTruthy();
    fireEvent.click(screen.getByText('Save the form'));
    expect(list.saved).toHaveBeenCalledWith({ id: 'new-1', title: 'Saved' });
    expect(onChanged).toHaveBeenCalled();
    expect(document.querySelector('[data-moment-form]')).toBeNull();
  });

  it('edits a moment in place, and takes a deleted one out', async () => {
    deleteMoment.mockResolvedValue({});
    const list = listOf([MOMENT]);
    const onChanged = vi.fn();
    render(<MomentList list={list} canEdit onChanged={onChanged} />);
    fireEvent.click(screen.getByLabelText('Edit Engaged'));
    expect(screen.getByLabelText('Edit Engaged').tagName).toBe('SECTION');
    fireEvent.click(screen.getByText('Cancel the form'));
    expect(document.querySelector('[data-moment-form]')).toBeNull();
    fireEvent.click(screen.getByLabelText('Delete Engaged'));
    fireEvent.click(screen.getByText('Yes, delete it'));
    await waitFor(() => expect(list.removed).toHaveBeenCalledWith('mo1'));
    expect(onChanged).toHaveBeenCalled();
  });

  it('draws a header first, with the empty line under it', () => {
    render(<MomentList list={listOf([])} header={<h3>Moments</h3>} canEdit emptyText='None here.' />);
    const header = screen.getByText('Moments');
    expect(header.parentElement.textContent).toContain('None here.');
    expect(screen.getByText('Add a moment')).toBeTruthy();
  });

  it('folds to its header alone, keeping a half-written form', () => {
    const { rerender } = render(<MomentList list={listOf([MOMENT])} header={<h3>Moments</h3>} canEdit collapsed bodyId='body-1' />);
    const body = document.getElementById('body-1');
    expect(body.hidden).toBe(true);
    expect(body.textContent).toContain('Engaged');
    expect(body.textContent).toContain('Add a moment');
    expect(screen.getByText('Moments').closest('[hidden]')).toBeNull();
    rerender(<MomentList list={listOf([MOMENT])} header={<h3>Moments</h3>} canEdit bodyId='body-1' />);
    expect(body.hidden).toBe(false);
    fireEvent.click(screen.getByText('Add a moment'));
    expect(document.querySelector('[data-moment-form]')).not.toBeNull();
    rerender(<MomentList list={listOf([MOMENT])} header={<h3>Moments</h3>} canEdit collapsed bodyId='body-1' />);
    expect(body.hidden).toBe(true);
    expect(document.querySelector('[data-moment-form]')).not.toBeNull();
  });

  it('hides the empty line under the header while folded', () => {
    render(<MomentList list={listOf([])} header={<h3>Moments</h3>} emptyText='None here.' collapsed />);
    expect(screen.getByText('None here.').hidden).toBe(true);
  });

  it('gives viewers no “Add a moment”', () => {
    render(<MomentList list={listOf([MOMENT])} />);
    expect(screen.queryByText('Add a moment')).toBeNull();
  });
});

describe('AnniversaryTag', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 5, 14, 9, 0));
  });
  afterEach(() => vi.useRealTimers());

  const ANNIVERSARIES = [
    { id: 'a', kind: 'WEDDING', title: 'Our wedding', happenedOn: '2016-06-14', countryCode: 'IT' },
    { id: 'b', kind: 'NOTE', title: 'Another', happenedOn: '2020-06-14', countryCode: 'FR' },
  ];

  it('asks for today’s anniversaries and says the newest, opening its country', async () => {
    getMomentPage.mockResolvedValue({ moments: ANNIVERSARIES });
    const onOpenCountry = vi.fn();
    render(<AnniversaryTag mapId='m1' onOpenCountry={onOpenCountry} />);
    const tag = await waitFor(() => {
      const found = document.querySelector('[data-anniversary-tag]');
      if (!found) throw new Error('not yet');
      return found;
    });
    expect(getMomentPage).toHaveBeenCalledWith({ mapId: 'm1', anniversary: '2026-06-14' });
    expect(tag.getAttribute('aria-label')).toBe('On this day');
    expect(tag.textContent).toContain('10 years ago today: Our wedding');
    expect(tag.textContent).toContain('(and 1 more)');
    fireEvent.click(screen.getByText('Open Italy'));
    expect(onOpenCountry).toHaveBeenCalledWith('IT');
  });

  it('shows nothing when no moment’s day has come round', async () => {
    getMomentPage.mockResolvedValue({ moments: [] });
    const { container } = render(<AnniversaryTag mapId='m1' onOpenCountry={() => {}} />);
    await waitFor(() => expect(getMomentPage).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
  });

  it('stays closed for the rest of the day once closed', async () => {
    getMomentPage.mockResolvedValue({ moments: ANNIVERSARIES.slice(0, 1) });
    const { unmount } = render(<AnniversaryTag mapId='m1' onOpenCountry={() => {}} />);
    fireEvent.click(await screen.findByLabelText('Close: on this day'));
    expect(document.querySelector('[data-anniversary-tag]')).toBeNull();
    expect(sessionStorage.getItem('mpv:anniversaryTagClosed')).toBe('m1:2026-06-14');
    unmount();
    getMomentPage.mockClear();
    render(<AnniversaryTag mapId='m1' onOpenCountry={() => {}} />);
    expect(getMomentPage).not.toHaveBeenCalled();
  });
});
