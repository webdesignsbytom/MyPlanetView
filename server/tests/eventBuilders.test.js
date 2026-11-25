// The audit events the event log's own routes and the travel features write
// (event/eventUtils.js, event/travelUtils.js): ids, counts and statuses only, the actor by
// id, the level from the status code. The write itself is faked.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const written = vi.hoisted(() => []);
vi.mock('../src/event/events.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createAppEvent: vi.fn(async (event) => written.push(event)) };
});

const eventUtils = await import('../src/event/eventUtils.js');
const travelUtils = await import('../src/event/travelUtils.js');

beforeEach(() => {
  written.length = 0;
});

describe('the event log’s own events', () => {
  const developer = { id: 'dev-1', role: 'DEVELOPER', email: 'dev@example.test' };

  it('name the event, its new status and who changed it', async () => {
    await eventUtils.createEventsUpdateStatusSuccessEvent({ user: developer, eventId: 'ev-1', status: 'RESOLVED' });
    expect(written[0]).toEqual({
      level: 'INFO',
      domain: 'events',
      action: 'Update Status Success',
      message: 'Update Status Success | eventId=ev-1 | status=RESOLVED',
      statusCode: 200,
      actorId: 'dev-1',
    });
  });

  it('name a deleted event, or how many went (zero too)', async () => {
    await eventUtils.createEventsDeleteByIdSuccessEvent({ user: developer, eventId: 'ev-2' });
    await eventUtils.createEventsDeleteAllSuccessEvent({ user: developer, count: 0 });
    await eventUtils.createEventsDeleteAllSuccessEvent({ user: null });
    expect(written.map((e) => e.message)).toEqual(['Delete By Id Success | eventId=ev-2', 'Delete All Success | count=0', 'Delete All Success']);
    expect(written[2].actorId).toBeNull();
    // Never an address
    expect(JSON.stringify(written)).not.toMatch(/@/);
  });
});

describe('the travel features’ events', () => {
  const builders = Object.entries(travelUtils).filter(([name]) => /^create\w+Event$/.test(name));

  it('write each feature under its own domain', async () => {
    const domains = {
      createMapEvent: 'maps',
      createTripEvent: 'trips',
      createPhotoEvent: 'photos',
      createSharingEvent: 'sharing',
      createMomentEvent: 'moments',
      createCountryMapEvent: 'countryMaps',
      createBillingEvent: 'billing',
      createOfferEvent: 'offers',
      createThemeEvent: 'themes',
      createChallengeEvent: 'challenges',
      createGuessGameEvent: 'guessGames',
      createFlightEvent: 'flights',
      createFeedbackEvent: 'feedback',
    };
    expect(builders.map(([name]) => name).sort()).toEqual(Object.keys(domains).sort());
    for (const [name, build] of builders) {
      written.length = 0;
      await build({ user: { id: 'u-1' }, action: 'Create Success' });
      expect(written[0], name).toMatchObject({ domain: domains[name], action: 'Create Success', actorId: 'u-1', targetId: null });
    }
  });

  it('join the action, the id and a detail, and take the level from the status', async () => {
    await travelUtils.createMapEvent({ user: { id: 'u-1' }, action: 'Create Success', id: 'map-1', detail: 'kind=COUPLE', statusCode: 201, targetId: 'u-2' });
    expect(written[0]).toMatchObject({ message: 'Create Success | id=map-1 | kind=COUPLE', statusCode: 201, level: 'INFO', targetId: 'u-2' });
    await travelUtils.createPhotoEvent({ user: null, action: 'Upload Failed', statusCode: 500 });
    expect(written[1]).toMatchObject({ message: 'Upload Failed', actorId: null, level: 'ERROR' });
    await travelUtils.createTripEvent({ user: 'not-an-object', action: 'Delete Refused', statusCode: 403 });
    expect(written[2].actorId).toBeNull();
    expect(written[2].level).toBe('WARNING');
  });
});
