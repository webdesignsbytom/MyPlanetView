import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { addMonths, monthOf } from '@/dev/mock/themes';
import { HOME_MAP, SAM_MAP, TOM_MAP, db, del, freshStore, get, patch, post, put, registerAllRoutes, signOut, testUser } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const THIS = () => `theme-${monthOf()}`;
const LAST = () => `theme-${addMonths(monthOf(), -1)}`;
const NEXT_MONTH = () => addMonths(monthOf(), 1);
const MALFORMED = "Some details weren't in the right format. Please check them and try again.";

describe('the themes', () => {
  it('give this month’s and the recent ones, to anyone', async () => {
    signOut();
    const { data } = await get('/api/themes');
    expect(data.current).toMatchObject({ id: THIS(), title: 'Worst weather', running: true });
    expect(data.recent.map((t) => t.id)).toEqual([LAST()]);
  });

  it('give a map’s current theme and albums, with the entries left for editors', async () => {
    const { data } = await get(`/api/maps/${HOME_MAP}/themes`);
    expect(data.current).toMatchObject({ id: THIS(), count: 2, entriesLeft: 18 });
    expect(data.albums.map((a) => [a.id, a.count])).toEqual([
      [THIS(), 2],
      [LAST(), 1],
    ]);
    expect(data.entriesPerMap).toBe(20);
    expect((await get(`/api/maps/${TOM_MAP}/themes`)).status).toBe(404);
    expect('entriesLeft' in (await get(`/api/maps/${SAM_MAP}/themes`)).data.current).toBe(false);
  });

  it('page an album newest entry first, hidden photos left out below editor', async () => {
    const album = await get(`/api/maps/${HOME_MAP}/themes/${THIS()}/photos`, { limit: 1 });
    expect(album.data.photos.map((p) => p.id)).toEqual(['photo-dam']);
    const rest = await get(`/api/maps/${HOME_MAP}/themes/${THIS()}/photos`, { cursor: album.data.nextCursor });
    expect(rest.data.photos.map((p) => p.id)).toEqual(['photo-eiffel']);
    expect((await get(`/api/maps/${HOME_MAP}/themes/${THIS()}/photos`, { cursor: 'nope' })).message).toBe(MALFORMED);
    expect((await get(`/api/maps/${HOME_MAP}/themes/nope/photos`)).status).toBe(404);
  });

  it('show through a share link, without the editors’ count', async () => {
    db().maps.find((m) => m.id === HOME_MAP).linkAccess = 'ANYONE_WITH_LINK';
    db().photos.find((p) => p.id === 'photo-dam').hidden = true;
    signOut();
    const { data } = await get('/api/shared/K7QXM2PA9RTW/themes');
    expect(data.current.count).toBe(1);
    expect('entriesLeft' in data.current).toBe(false);
    expect((await get(`/api/shared/K7QXM2PA9RTW/themes/${THIS()}/photos`)).data.photos.map((p) => p.id)).toEqual(['photo-eiffel']);
    expect((await get('/api/shared/SAMG4PYEAR22/themes')).status).toBe(200);
    expect((await get('/api/shared/TQMB7KX2PRG4/themes')).status).toBe(404);
  });
});

describe('entering a photo', () => {
  it('enters a photo in this month’s theme once, and takes it out', async () => {
    const entered = await put(`/api/photos/photo-louvre/themes/${THIS()}`);
    expect(entered.status).toBe(201);
    expect(entered.data.themes.map((t) => t.id)).toEqual([THIS()]);
    expect((await put(`/api/photos/photo-louvre/themes/${THIS()}`)).status).toBe(200);
    expect((await del(`/api/photos/photo-louvre/themes/${THIS()}`)).data.themes).toEqual([]);
    expect((await del(`/api/photos/photo-louvre/themes/${THIS()}`)).status).toBe(404);
  });

  it('only while the theme runs, photos only, 20 a map', async () => {
    expect((await put(`/api/photos/photo-louvre/themes/${LAST()}`)).status).toBe(409);
    db().photos.find((p) => p.id === 'photo-louvre').kind = 'VIDEO';
    expect((await put(`/api/photos/photo-louvre/themes/${THIS()}`)).message).toBe('Themes are for photos, not videos.');
    db().themeEntries.push(...Array.from({ length: 18 }, (_, i) => ({ themeId: THIS(), photoId: `x${i}`, mapId: HOME_MAP })));
    expect((await put(`/api/photos/photo-mont-saint-michel/themes/${THIS()}`)).status).toBe(409);
  });

  it('needs an editor, and a photo and theme the caller can see', async () => {
    expect((await put(`/api/photos/photo-bangkok/themes/${THIS()}`)).status).toBe(403);
    expect((await put(`/api/photos/photo-morgans-hidden/themes/${THIS()}`)).status).toBe(404);
    expect((await put('/api/photos/photo-louvre/themes/nope')).status).toBe(404);
  });
});

describe('the admin’s themes', () => {
  it('are for admins only', async () => {
    expect((await get('/api/users/admin/themes')).status).toBe(403);
    signOut();
    expect((await get('/api/users/admin/themes')).status).toBe(401);
  });

  it('list every theme with what it drew', async () => {
    testUser().role = 'ADMIN';
    const { data } = await get('/api/users/admin/themes');
    expect(data.themes.find((t) => t.id === THIS())).toMatchObject({ entryCount: 2, mapCount: 1, ended: false });
    expect(data.themes.find((t) => t.id === LAST()).ended).toBe(true);
  });

  it('make, change and delete a theme, never on a taken or past month, nor one with entries', async () => {
    testUser().role = 'ADMIN';
    db().themes = db().themes.filter((t) => t.month !== NEXT_MONTH());
    const made = await post('/api/users/admin/themes', { month: NEXT_MONTH(), title: 'Bridges' });
    expect(made.status).toBe(201);
    expect((await post('/api/users/admin/themes', { month: NEXT_MONTH(), title: 'Again' })).status).toBe(409);
    expect((await post('/api/users/admin/themes', { month: '2001-01', title: 'Old' })).status).toBe(400);
    const id = made.data.theme.id;
    expect((await patch(`/api/users/admin/themes/${id}`, { title: 'Bridges and tunnels' })).data.theme.title).toBe('Bridges and tunnels');
    expect((await patch(`/api/users/admin/themes/${id}`, { month: monthOf() })).status).toBe(409);
    expect((await patch(`/api/users/admin/themes/${THIS()}`, { month: addMonths(monthOf(), 13) })).status).toBe(409);
    expect((await del(`/api/users/admin/themes/${THIS()}`)).status).toBe(409);
    expect((await del(`/api/users/admin/themes/${id}`)).body.message).toBe('Theme deleted.');
    expect((await del('/api/users/admin/themes/nope')).status).toBe(404);
  });

  it('fill the coming year’s empty months with suggested themes, for admins only', async () => {
    const fill = () => post('/api/users/admin/themes/suggested', {});
    expect((await fill()).status).toBe(403);
    testUser().role = 'ADMIN';
    const months = Array.from({ length: 12 }, (_, i) => addMonths(monthOf(), i));
    db().themes = db().themes.filter((t) => !months.slice(1).includes(t.month));
    const res = await fill();
    expect(res.status).toBe(201);
    expect(res.data.added).toBe(11);
    for (const month of months) expect(res.data.themes.some((t) => t.month === month)).toBe(true);
    const again = await fill();
    expect(again.status).toBe(200);
    expect(again.data.added).toBe(0);
  });
});
