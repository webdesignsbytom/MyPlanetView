// Every country ticket's first pages in one reply (controllers/countryLists.js; docs/API.md
// "Country lists"): the same pages, and the same rules, as the photo and moment lists
import { afterAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, signUp, uploadPhoto } from './helpers.js';

afterAll(cleanUp);

describe('country lists', () => {
  it('answers each country’s first page as its own list would, hidden ones for editors only', async () => {
    const owner = await signUp('ListsOwner');
    const map = await defaultMapOf(owner.agent);
    const france = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'FR', caption: 'Paris' })).photo;
    const hidden = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'FR', caption: 'Hidden' })).photo;
    expect((await owner.agent.patch(`/api/photos/${hidden.id}`).send({ hidden: true })).status).toBe(200);
    await uploadPhoto(owner.agent, map.id, { countryCode: 'IT', caption: 'Rome' });
    const moment = await owner.agent
      .post(`/api/maps/${map.id}/moments`)
      .send({ kind: 'SAW_OR_DID', title: 'Up the Eiffel Tower', countryCode: 'FR' });
    expect(moment.status).toBe(201);

    const lists = (agent, base, query = '?photos=FR,IT,ES&moments=FR&limit=12&display=1') => agent.get(`${base}/country-lists${query}`);
    const mine = data(await lists(owner.agent, `/api/maps/${map.id}`));
    expect(Object.keys(mine.photos).sort()).toEqual(['ES', 'FR', 'IT']);
    expect(mine.photos.FR.photos.map((p) => p.id).sort()).toEqual([france.id, hidden.id].sort());
    expect(mine.photos.ES).toEqual({ photos: [], nextCursor: null });
    expect(mine.moments.FR.moments.map((m) => m.title)).toEqual(['Up the Eiffel Tower']);
    // The same as the photo list's own first page
    const single = data(await owner.agent.get(`/api/maps/${map.id}/photos?country=FR&limit=12&display=1`));
    expect(mine.photos.FR.photos.map((p) => p.id)).toEqual(single.photos.map((p) => p.id));

    // A share link: map links only, never a hidden photo
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const code = data(await owner.agent.get(`/api/maps/${map.id}/sharing`)).shareCode;
    const linked = data(await lists(anon(), `/api/shared/${code}`));
    expect(linked.photos.FR.photos.map((p) => p.id)).toEqual([france.id]);
    expect(linked.photos.FR.photos[0]).not.toHaveProperty('latitude');

    // No role: 404; a bad list: 400
    const stranger = await signUp('ListsStranger');
    expect((await lists(stranger.agent, `/api/maps/${map.id}`)).status).toBe(404);
    expect((await lists(owner.agent, `/api/maps/${map.id}`, '?photos=FR,xx')).status).toBe(400);
    expect((await lists(owner.agent, `/api/maps/${map.id}`, '?photos=ZZ')).status).toBe(400);
  });
});
