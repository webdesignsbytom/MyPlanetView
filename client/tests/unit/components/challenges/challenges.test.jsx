import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChallengeCreateCard from '@/components/challenges/ChallengeCreateCard';
import ChallengeDetail from '@/components/challenges/ChallengeDetail';
import ChallengeFields from '@/components/challenges/ChallengeFields';
import ChallengeInviteCard from '@/components/challenges/ChallengeInviteCard';
import ChallengeLeaderboard from '@/components/challenges/ChallengeLeaderboard';
import ChallengeListCard from '@/components/challenges/ChallengeListCard';
import ChallengeMyMapCard from '@/components/challenges/ChallengeMyMapCard';
import ChallengeSettingsCard from '@/components/challenges/ChallengeSettingsCard';
import {
  createChallenge,
  deleteChallenge,
  getChallenge,
  getMyChallenges,
  leaveChallenge,
  resetChallengeLink,
  setMyChallengeMap,
  updateChallenge,
} from '@/api/challengesApi';
import { getMyMaps } from '@/api/travelApi';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import { elsewhere, renderPage } from '../../pages/renderPage';

vi.mock('@/api/challengesApi', () => ({
  createChallenge: vi.fn(),
  deleteChallenge: vi.fn(),
  getChallenge: vi.fn(),
  getMyChallenges: vi.fn(),
  leaveChallenge: vi.fn(),
  resetChallengeLink: vi.fn(),
  setMyChallengeMap: vi.fn(),
  updateChallenge: vi.fn(),
}));
vi.mock('@/api/travelApi', () => ({ getMyMaps: vi.fn() }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));

const MAPS = [
  { id: 'm-own', name: 'My map', role: 'OWNER' },
  { id: 'm-edit', name: 'Our trips', role: 'EDITOR' },
  { id: 'm-view', name: 'Their map', role: 'VIEWER' },
];

const member = (over) => ({ name: 'Jo', rank: 1, count: 3, isYou: false, startedIt: false, counting: true, reachedTarget: false, ...over });

const challenge = (over = {}) => ({
  id: 'ch-1',
  title: 'Two years on the road',
  status: 'RUNNING',
  measure: 'NEW_COUNTRIES',
  startsOn: '2025-01-01',
  endsOn: '2026-12-31',
  target: 10,
  joinCode: 'CHA2-YR5R-DTRP',
  memberLimit: 50,
  youStartedIt: false,
  myMap: { id: 'm-own', name: 'My map' },
  members: [member({ name: 'Charlie', isYou: true, rank: 1, count: 2 }), member({ name: 'Sam', rank: 2, count: 0, startedIt: true })],
  ...over,
});

const failure = (message) => Object.assign(new Error('no'), { friendlyMessage: message });

const AT = '/challenges/ch-1';
const inPage = (element) => renderPage(element, { path: AT });

beforeEach(() => {
  vi.clearAllMocks();
  getMyMaps.mockResolvedValue({ maps: MAPS });
  useMustVerifyEmail.mockReturnValue(false);
});

describe('ChallengeLeaderboard', () => {
  it('keeps the order it is given, with ordinals, counts in words and who is who', () => {
    const { container } = render(
      <ChallengeLeaderboard
        measure='NEW_COUNTRIES'
        members={[
          member({ name: 'Jo', rank: 1, count: 10, reachedTarget: true }),
          member({ name: 'Charlie', rank: 2, count: 1, isYou: true }),
          member({ name: 'Sam', rank: 3, count: 0, startedIt: true, counting: false }),
          member({ name: 'Alex', rank: 11, count: 0, counting: false }),
        ]}
      />,
    );
    const list = container.querySelector('ol[aria-label="Leaderboard"]');
    const rows = [...list.querySelectorAll('li')];
    expect(rows.map((li) => li.querySelector('span').textContent)).toEqual(['1st', '2nd', '3rd', '11th']);
    expect(rows[0].textContent).toContain('Reached the target:10 new countries');
    expect(rows[0].querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    expect(rows[1].textContent).toContain('Charlie (you)');
    expect(rows[1].textContent).toContain('1 new country');
    expect(rows[1].className).toContain('border-poster-red');
    expect(rows[2].textContent).toContain('Started it · No map counting');
    expect(rows[3].textContent).toContain('No map counting');
    expect(rows[3].textContent).not.toContain('Started it');
  });
});

describe('ChallengeListCard', () => {
  it('shows a loading state, then each challenge with its link, status and counts', async () => {
    let answer;
    getMyChallenges.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { container } = inPage(<ChallengeListCard />);
    expect(container.querySelector('[role="status"]').textContent).toContain('Loading your challenges…');
    await act(async () =>
      answer({
        challenges: [
          { ...challenge(), counting: true, myCount: 2, memberCount: 3, reachedTarget: false },
          { ...challenge({ id: 'ch-2', title: 'Summer of landmarks', status: 'UPCOMING', measure: 'LANDMARKS', target: null }), counting: false, memberCount: 1 },
        ],
      }),
    );
    const items = [...container.querySelectorAll('li')];
    expect(items.length).toBe(2);
    expect(items[0].querySelector('a').getAttribute('href')).toBe('/challenges/ch-1');
    expect(items[0].textContent).toContain('On now');
    expect(items[0].textContent).toMatch(/New countries · 1 Jan\w* 2025 to 31 Dec\w* 2026 · first to 10/);
    expect(items[0].textContent).toContain('You: 2 new countries · 3 people');
    expect(items[1].textContent).toContain('Starts soon');
    expect(items[1].textContent).not.toContain('first to');
    expect(items[1].textContent).toContain('You: no map counting · just you so far');
  });

  it('says when there are none', async () => {
    getMyChallenges.mockResolvedValue({ challenges: [] });
    inPage(<ChallengeListCard />);
    expect(await screen.findByText(/None yet\. Start one below/)).toBeTruthy();
  });

  it('shows why the list failed', async () => {
    getMyChallenges.mockRejectedValue(failure('Challenges are resting.'));
    inPage(<ChallengeListCard />);
    expect((await screen.findByText('Challenges are resting.')).getAttribute('role')).toBe('alert');
  });
});

describe('ChallengeFields', () => {
  const form = { title: 'Race', measure: 'COUNTRIES', startsOn: '2027-01-01', endsOn: '2027-12-31', target: '', mapId: '' };

  it('names each field and reports each change by field', () => {
    const onChange = vi.fn();
    render(<ChallengeFields idPrefix='x' form={form} onChange={onChange} errors={{ title: 'Give it a title.' }} />);
    expect(document.getElementById('x-title').value).toBe('Race');
    expect(document.getElementById('x-measure').value).toBe('COUNTRIES');
    expect(screen.getByText('Countries with a photo taken between the dates, new or not.')).toBeTruthy();
    expect(screen.getByText('Give it a title.')).toBeTruthy();
    fireEvent.change(document.getElementById('x-target'), { target: { value: '5' } });
    expect(onChange).toHaveBeenCalledWith('target', '5');
    fireEvent.change(document.getElementById('x-ends'), { target: { value: '2027-06-30' } });
    expect(onChange).toHaveBeenCalledWith('endsOn', '2027-06-30');
    // No map list unless given one
    expect(document.getElementById('x-map')).toBeNull();
  });

  it('fixes the measure when asked, and offers the maps when given', () => {
    render(<ChallengeFields idPrefix='y' form={form} onChange={() => {}} measureFixed mapOptions={[{ value: 'm1', label: 'My map' }]} />);
    expect(document.getElementById('y-measure').disabled).toBe(true);
    expect(screen.getByText('This stays as it was made.')).toBeTruthy();
    expect(document.getElementById('y-map').textContent).toContain('My map');
  });
});

describe('ChallengeCreateCard', () => {
  it('asks an unverified person to verify first, with no form', () => {
    const { container } = inPage(<ChallengeCreateCard locked />);
    expect(container.querySelector('form')).toBeNull();
    expect(container.textContent).toContain('Verify your email address to start a challenge.');
  });

  it('offers only the maps you own or edit, the first chosen', async () => {
    inPage(<ChallengeCreateCard />);
    await waitFor(() => expect(document.getElementById('new-challenge-map').value).toBe('m-own'));
    const options = [...document.getElementById('new-challenge-map').querySelectorAll('option')].map((o) => o.textContent);
    expect(options).toContain('My map');
    expect(options).toContain('Our trips (you edit it)');
    expect(options).not.toContain('Their map');
  });

  it('checks the form before sending', async () => {
    inPage(<ChallengeCreateCard />);
    await waitFor(() => expect(screen.getByText('Start it').closest('button').disabled).toBe(false));
    fireEvent.click(screen.getByText('Start it'));
    expect(await screen.findByText('Give it a title.')).toBeTruthy();
    expect(createChallenge).not.toHaveBeenCalled();
  });

  it('starts the challenge and opens it', async () => {
    createChallenge.mockResolvedValue({ challenge: { id: 'ch-new' } });
    inPage(<ChallengeCreateCard />);
    await waitFor(() => expect(document.getElementById('new-challenge-map').value).toBe('m-own'));
    fireEvent.change(document.getElementById('new-challenge-title'), { target: { value: '  Most  new countries ' } });
    fireEvent.change(document.getElementById('new-challenge-target'), { target: { value: '5' } });
    fireEvent.click(screen.getByText('Start it'));
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/challenges/ch-new'));
    const body = createChallenge.mock.calls[0][0];
    expect(body).toMatchObject({ title: 'Most new countries', measure: 'NEW_COUNTRIES', target: 5, mapId: 'm-own' });
    expect(body.startsOn).toMatch(/^\d{4}-01-01$/);
    expect(body.endsOn).toMatch(/^\d{4}-12-31$/);
  });

  it('says why a start failed and stays', async () => {
    createChallenge.mockRejectedValue(failure('You are in 30 challenges.'));
    inPage(<ChallengeCreateCard />);
    await waitFor(() => expect(document.getElementById('new-challenge-map').value).toBe('m-own'));
    fireEvent.change(document.getElementById('new-challenge-title'), { target: { value: 'Race' } });
    fireEvent.click(screen.getByText('Start it'));
    expect(await screen.findByText('You are in 30 challenges.')).toBeTruthy();
    expect(elsewhere()).toBeNull();
  });
});

describe('ChallengeInviteCard', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue() }, configurable: true });
  });

  it('shows the join link on this site and copies it', async () => {
    render(<ChallengeInviteCard challenge={challenge()} onChanged={() => {}} />);
    const input = screen.getByLabelText('Join link');
    expect(input.value).toBe(`${window.location.origin}/challenges/join/CHA2-YR5R-DTRP`);
    expect(input.readOnly).toBe(true);
    fireEvent.click(screen.getByText('Copy link'));
    expect(await screen.findByText('Copied')).toBeTruthy();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(input.value);
    // Only the starter can make a new link
    expect(screen.queryByText('Make a new link')).toBeNull();
  });

  it('says when the challenge is full', () => {
    const { container } = render(<ChallengeInviteCard challenge={challenge({ memberLimit: 2 })} onChanged={() => {}} />);
    expect(container.textContent).toContain('This challenge has 2 people, the most it can have.');
  });

  it('the starter makes a new link after confirming, or keeps this one', async () => {
    const onChanged = vi.fn();
    resetChallengeLink.mockResolvedValue({ challenge: challenge({ joinCode: 'NEW2-CODE-HERE' }) });
    render(<ChallengeInviteCard challenge={challenge()} canReset onChanged={onChanged} />);
    fireEvent.click(screen.getByText('Make a new link'));
    expect(screen.getByText(/The old one stops working/)).toBeTruthy();
    fireEvent.click(screen.getByText('Keep this one'));
    expect(screen.queryByText(/The old one stops working/)).toBeNull();
    fireEvent.click(screen.getByText('Make a new link'));
    // The confirming box's own button now
    fireEvent.click(screen.getByText('Make a new link'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(resetChallengeLink).toHaveBeenCalledWith('ch-1');
    expect(onChanged.mock.calls[0][0].joinCode).toBe('NEW2-CODE-HERE');
  });

  it('says why a new link failed', async () => {
    resetChallengeLink.mockRejectedValue(failure('Try later.'));
    render(<ChallengeInviteCard challenge={challenge()} canReset onChanged={() => {}} />);
    fireEvent.click(screen.getByText('Make a new link'));
    fireEvent.click(screen.getByText('Make a new link'));
    expect(await screen.findByText('Try later.')).toBeTruthy();
  });
});

describe('ChallengeMyMapCard', () => {
  it('says which map counts, and changes it', async () => {
    const onChanged = vi.fn();
    setMyChallengeMap.mockResolvedValue({ challenge: challenge({ myMap: { id: 'm-edit', name: 'Our trips' } }) });
    const { container } = inPage(<ChallengeMyMapCard challenge={challenge()} onChanged={onChanged} />);
    expect(container.textContent).toContain('Counting “My map”. Only the count is shown to the others.');
    const button = screen.getByText('Count this map').closest('button');
    // The map already counting can't be chosen again
    await waitFor(() => expect(document.getElementById('challenge-my-map').querySelectorAll('option').length).toBeGreaterThan(1));
    expect(button.disabled).toBe(true);
    fireEvent.change(document.getElementById('challenge-my-map'), { target: { value: 'm-edit' } });
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(setMyChallengeMap).toHaveBeenCalledWith('ch-1', 'm-edit');
  });

  it('says when no map counts', () => {
    const lost = challenge({ members: [member({ isYou: true, counting: false })] });
    const { container } = inPage(<ChallengeMyMapCard challenge={lost} onChanged={() => {}} />);
    expect(container.textContent).toContain('No map is counting for you');
  });

  it('locked until verified, with no map list', () => {
    const { container } = inPage(<ChallengeMyMapCard challenge={challenge()} locked onChanged={() => {}} />);
    expect(container.textContent).toContain('Verify your email address to change the map that counts.');
    expect(document.getElementById('challenge-my-map')).toBeNull();
  });

  it('leaving goes back to your challenges; the starter has no way to leave', async () => {
    leaveChallenge.mockResolvedValue({});
    const first = inPage(<ChallengeMyMapCard challenge={challenge()} onChanged={() => {}} />);
    fireEvent.click(screen.getByText('Leave the challenge'));
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/challenges'));
    expect(leaveChallenge).toHaveBeenCalledWith('ch-1');
    first.unmount();
    inPage(<ChallengeMyMapCard challenge={challenge({ youStartedIt: true })} onChanged={() => {}} />);
    expect(screen.queryByText('Leave the challenge')).toBeNull();
  });

  it('says why leaving failed', async () => {
    leaveChallenge.mockRejectedValue(failure('Not now.'));
    inPage(<ChallengeMyMapCard challenge={challenge()} onChanged={() => {}} />);
    fireEvent.click(screen.getByText('Leave the challenge'));
    expect(await screen.findByText('Not now.')).toBeTruthy();
  });
});

describe('ChallengeSettingsCard', () => {
  it('starts from the challenge and saves only what changed', async () => {
    const onChanged = vi.fn();
    updateChallenge.mockResolvedValue({ challenge: challenge({ title: 'New title' }) });
    inPage(<ChallengeSettingsCard challenge={challenge()} onChanged={onChanged} />);
    expect(document.getElementById('edit-challenge-title').value).toBe('Two years on the road');
    expect(document.getElementById('edit-challenge-target').value).toBe('10');
    expect(document.getElementById('edit-challenge-measure').disabled).toBe(true);
    fireEvent.change(document.getElementById('edit-challenge-title'), { target: { value: 'New title' } });
    fireEvent.click(screen.getByText('Save changes'));
    expect(await screen.findByText('Saved.')).toBeTruthy();
    expect(updateChallenge).toHaveBeenCalledWith('ch-1', { title: 'New title' });
    expect(onChanged).toHaveBeenCalled();
  });

  it('shows a problem by its field, and the server’s refusal', async () => {
    updateChallenge.mockRejectedValue(failure('Too long a challenge.'));
    inPage(<ChallengeSettingsCard challenge={challenge()} onChanged={() => {}} />);
    fireEvent.change(document.getElementById('edit-challenge-ends'), { target: { value: '2024-01-01' } });
    fireEvent.click(screen.getByText('Save changes'));
    expect(await screen.findByText('The last day comes after the first.')).toBeTruthy();
    expect(updateChallenge).not.toHaveBeenCalled();
    fireEvent.change(document.getElementById('edit-challenge-ends'), { target: { value: '2026-06-30' } });
    fireEvent.click(screen.getByText('Save changes'));
    expect(await screen.findByText('Too long a challenge.')).toBeTruthy();
  });

  it('deletes it after confirming, then goes to your challenges', async () => {
    deleteChallenge.mockResolvedValue({});
    inPage(<ChallengeSettingsCard challenge={challenge()} onChanged={() => {}} />);
    fireEvent.click(screen.getByText('Delete the challenge'));
    expect(screen.getByText('Delete “Two years on the road” for everyone in it? It can’t be undone.')).toBeTruthy();
    fireEvent.click(screen.getByText('Keep it'));
    expect(deleteChallenge).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Delete the challenge'));
    fireEvent.click(screen.getByText('Delete it'));
    await waitFor(() => expect(elsewhere()?.getAttribute('data-elsewhere')).toBe('/challenges'));
    expect(deleteChallenge).toHaveBeenCalledWith('ch-1');
  });
});

describe('ChallengeDetail', () => {
  it('shows a loading state, then the challenge with its one h1 and leaderboard', async () => {
    getChallenge.mockResolvedValue({ challenge: challenge() });
    const { container } = inPage(<ChallengeDetail challengeId='ch-1' />);
    expect(container.querySelector('[role="status"]').textContent).toContain('Loading the challenge…');
    await waitFor(() => expect(container.querySelector('h1')?.textContent).toContain('Two years on the road'));
    expect(getChallenge).toHaveBeenCalledWith('ch-1');
    expect(container.querySelectorAll('h1').length).toBe(1);
    expect(container.textContent).toMatch(/New countries, 1 Jan\w* 2025 to 31 Dec\w* 2026\. First to 10\./);
    expect(container.querySelector('ol[aria-label="Leaderboard"]').querySelectorAll('li').length).toBe(2);
    expect(container.querySelector('#challenge-invite-heading')).toBeTruthy();
    expect(container.querySelector('#challenge-my-map-heading')).toBeTruthy();
    // Not the starter: no settings
    expect(container.querySelector('#challenge-settings-heading')).toBeNull();
  });

  it('gives the starter the settings, but not while unverified', async () => {
    getChallenge.mockResolvedValue({ challenge: challenge({ youStartedIt: true }) });
    const first = inPage(<ChallengeDetail challengeId='ch-1' />);
    await waitFor(() => expect(first.container.querySelector('#challenge-settings-heading')).toBeTruthy());
    expect(screen.getByText('Make a new link')).toBeTruthy();
    first.unmount();
    useMustVerifyEmail.mockReturnValue(true);
    const second = inPage(<ChallengeDetail challengeId='ch-1' />);
    await waitFor(() => expect(second.container.querySelector('h1')).toBeTruthy());
    expect(second.container.querySelector('#challenge-settings-heading')).toBeNull();
    expect(screen.queryByText('Make a new link')).toBeNull();
  });

  it('a finished challenge has no invite card', async () => {
    getChallenge.mockResolvedValue({ challenge: challenge({ status: 'ENDED', target: null }) });
    const { container } = inPage(<ChallengeDetail challengeId='ch-1' />);
    await waitFor(() => expect(container.querySelector('h1')).toBeTruthy());
    expect(container.textContent).toContain('Finished');
    expect(container.textContent).toMatch(/31 Dec\w* 2026\./);
    expect(container.querySelector('#challenge-invite-heading')).toBeNull();
  });

  it('an error keeps an h1 and links back to your challenges', async () => {
    getChallenge.mockRejectedValue(failure('Challenge not found.'));
    const { container } = inPage(<ChallengeDetail challengeId='ch-1' />);
    expect(await screen.findByText('Challenge not found.')).toBeTruthy();
    expect(container.querySelector('h1').textContent).toContain('Challenge');
    expect(screen.getByText('Your challenges').getAttribute('href')).toBe('/challenges');
  });
});
