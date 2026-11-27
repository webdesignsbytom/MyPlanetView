import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, TOM_MAP, get, freshStore, registerAllRoutes, signOut } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

// What earned a badge (the server's GET …/badges/:badgeKey): anyone on the map, its link too
describe('a badge’s story', () => {
  it('tells the map’s people what earned a badge', async () => {
    const { status, data } = await get(`/api/maps/${HOME_MAP}/badges/countries-5`);
    expect(status).toBe(200);
    expect(data.story).toMatchObject({ key: 'countries-5', kind: 'places', need: 5, earnedWith: 4 });
    expect(data.story.items).toHaveLength(5);
  });

  it('answers 404 for an unknown badge, a traveller off the map, and a map with no role', async () => {
    const unknown = await get(`/api/maps/${HOME_MAP}/badges/countries-7`);
    expect(unknown.status).toBe(404);
    expect(unknown.message).toBe("That badge doesn't exist.");
    const nobody = await get(`/api/maps/${HOME_MAP}/badges/countries-1?traveller=nobody`);
    expect(nobody.status).toBe(404);
    expect(nobody.message).toBe("That traveller isn't on this map.");
    expect((await get(`/api/maps/${TOM_MAP}/badges/countries-1`)).status).toBe(404);
  });

  it('tells one traveller’s from their trips', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/badges/continent-europe?traveller=trav-alex`);
    expect(data.story.items[0]).toMatchObject({ code: expect.any(String), trip: { title: expect.any(String) } });
  });

  it('tells it through the map’s share link, signed out too, never a restricted one', async () => {
    signOut();
    expect((await get('/api/shared/SAMG4PYEAR22/badges/countries-1')).status).toBe(200);
    expect((await get('/api/shared/K7QXM2PA9RTW/badges/countries-1')).status).toBe(404);
  });
});
