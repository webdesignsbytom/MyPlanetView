// Monthly photo themes (docs/API.md, "Photo themes"): admins set one theme a month; while it
// runs, a map's editors enter its photos (not videos, at most 20 a map); the entries are the
// theme's album on that map, seen by whoever can see the map (a share link too), never
// hidden photos below editor; three, six and twelve themes entered are badges.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp, uploadPhoto, uploadVideo } from './helpers.js';
import { THEME_LIMITS, monthKey, monthStart } from '../../src/utils/themes.js';

const addMonths = (month, n) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + n, 1));
const THIS_MONTH = monthStart();
const months = [-3, -2, -1, 0, 1, 2].map((n) => addMonths(THIS_MONTH, n));

afterAll(async () => {
  await prisma.photoTheme.deleteMany({ where: { month: { in: months } } });
  await cleanUp();
});

describe('monthly photo themes', () => {
  let admin;
  let owner;
  let editor;
  let viewer;
  let stranger;
  let map;
  let current;
  let next;
  const photos = {};

  beforeAll(async () => {
    // Themes are site-wide: start these months empty
    await prisma.photoTheme.deleteMany({ where: { month: { in: months } } });
    admin = await signUp('ThemeAdmin');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
    owner = await signUp('ThemeOwner');
    editor = await signUp('ThemeEditor');
    viewer = await signUp('ThemeViewer');
    stranger = await signUp('ThemeStranger');
    map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: editor.email, role: 'EDITOR' });
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: viewer.email, role: 'VIEWER' });
    photos.a = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'PT', caption: 'Blue door' })).photo.id;
    photos.b = data(await uploadPhoto(owner.agent, map.id, { countryCode: 'PT', caption: 'Hidden door' })).photo.id;
    await owner.agent.patch(`/api/photos/${photos.b}`).send({ hidden: true });
  });

  it('lets admins set one theme a month, this month or later', async () => {
    const make = (body, agent = admin.agent) => agent.post('/api/users/admin/themes').send(body);
    const res = await make({ month: monthKey(THIS_MONTH), title: '  Doors ', blurb: 'Front doors and gates.' });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    current = data(res).theme;
    expect(current).toMatchObject({ month: monthKey(THIS_MONTH), title: 'Doors', running: true, entryCount: 0, ended: false });
    next = data(await make({ month: monthKey(months[4]), title: 'Street food' })).theme;
    expect(next.running).toBe(false);

    expect((await make({ month: monthKey(THIS_MONTH), title: 'Again' })).status).toBe(409);
    expect((await make({ month: monthKey(months[2]), title: 'Too late' })).status).toBe(400);
    expect((await make({ month: '2026-13', title: 'Nope' })).status).toBe(400);
    expect((await make({ month: monthKey(months[5]), title: 'x'.repeat(THEME_LIMITS.title + 1) })).status).toBe(400);
    expect((await make({ month: monthKey(months[5]), title: 'Mine' }, owner.agent)).status).toBe(403);
  });

  it('tells anyone the running theme, never a future one', async () => {
    const res = await anon().get('/api/themes');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/public/);
    expect(data(res).current).toMatchObject({ id: current.id, title: 'Doors', running: true });
    expect(data(res).recent.map((t) => t.id)).not.toContain(next.id);
  });

  it('lets an editor enter a photo once; viewers and strangers can’t', async () => {
    const enter = (agent, photoId = photos.a, themeId = current.id) => agent.put(`/api/photos/${photoId}/themes/${themeId}`);
    const first = await enter(editor.agent);
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    expect(data(first).themes).toEqual([expect.objectContaining({ id: current.id, title: 'Doors' })]);
    expect((await enter(editor.agent)).status).toBe(200);
    expect((await enter(viewer.agent)).status).toBe(403);
    expect((await enter(stranger.agent)).status).toBe(404);
    // A theme that isn't running takes nothing
    expect((await enter(owner.agent, photos.a, next.id)).status).toBe(409);
    // The hidden photo too (its album hides it from viewers)
    expect((await enter(owner.agent, photos.b)).status).toBe(201);
    // The photo says which themes it's in, to anyone who can see it
    const seen = data(await viewer.agent.get(`/api/photos/${photos.a}`)).photo;
    expect(seen.themes.map((t) => t.id)).toEqual([current.id]);
  });

  it('shows the album to whoever sees the map, hidden photos to editors only', async () => {
    const mine = data(await owner.agent.get(`/api/maps/${map.id}/themes`));
    expect(mine.current).toMatchObject({ id: current.id, count: 2, entriesLeft: THEME_LIMITS.entriesPerMap - 2 });
    expect(mine.albums).toEqual([expect.objectContaining({ id: current.id, count: 2 })]);

    const theirs = data(await viewer.agent.get(`/api/maps/${map.id}/themes`));
    expect(theirs.current).toMatchObject({ count: 1 });
    expect(theirs.current).not.toHaveProperty('entriesLeft');
    const album = data(await viewer.agent.get(`/api/maps/${map.id}/themes/${current.id}/photos`));
    expect(album.photos.map((p) => p.id)).toEqual([photos.a]);
    expect(album.theme.title).toBe('Doors');
    const editors = data(await owner.agent.get(`/api/maps/${map.id}/themes/${current.id}/photos?limit=1`));
    // Newest entry first, paged
    expect(editors.photos.map((p) => p.id)).toEqual([photos.b]);
    const rest = data(await owner.agent.get(`/api/maps/${map.id}/themes/${current.id}/photos?limit=1&cursor=${editors.nextCursor}`));
    expect(rest.photos.map((p) => p.id)).toEqual([photos.a]);
    expect(rest.nextCursor).toBeNull();
    expect((await stranger.agent.get(`/api/maps/${map.id}/themes`)).status).toBe(404);

    // Through a share link: the viewers' album, and never how many more may go in
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    const shared = data(await anon().get(`/api/shared/${shareCode}/themes`));
    expect(shared.current).toMatchObject({ count: 1 });
    expect(shared.current).not.toHaveProperty('entriesLeft');
    const sharedAlbum = data(await anon().get(`/api/shared/${shareCode}/themes/${current.id}/photos`));
    expect(sharedAlbum.photos.map((p) => p.id)).toEqual([photos.a]);
  });

  it('takes photos out at any time', async () => {
    const out = await editor.agent.delete(`/api/photos/${photos.b}/themes/${current.id}`);
    expect(out.status).toBe(200);
    expect(data(out).themes).toEqual([]);
    expect((await editor.agent.delete(`/api/photos/${photos.b}/themes/${current.id}`)).status).toBe(404);
  });

  it('refuses videos', async () => {
    const first = await signUp('ThemeFirstClass');
    await givePlan(first.user.id, { plan: 'PREMIUM' });
    const own = await defaultMapOf(first.agent);
    const video = data(await uploadVideo(first.agent, own.id, { ready: true })).photo.id;
    expect((await first.agent.put(`/api/photos/${video}/themes/${current.id}`)).status).toBe(400);
  });

  it('takes at most 20 photos a map in one theme', async () => {
    const full = await signUp('ThemeFull');
    const own = await defaultMapOf(full.agent);
    const ids = [];
    for (let i = 0; i <= THEME_LIMITS.entriesPerMap; i += 1) {
      ids.push(data(await uploadPhoto(full.agent, own.id, { countryCode: i % 2 ? 'FR' : 'ES' })).photo.id);
    }
    for (const id of ids.slice(0, -1)) expect((await full.agent.put(`/api/photos/${id}/themes/${current.id}`)).status).toBe(201);
    const over = await full.agent.put(`/api/photos/${ids.at(-1)}/themes/${current.id}`);
    expect(over.status).toBe(409);
    expect(over.body.message).toMatch(/already: take one out/);
    expect(data(await full.agent.get(`/api/maps/${own.id}/themes`)).current.entriesLeft).toBe(0);
  });

  it('earns the theme badges from three themes entered', async () => {
    // Two past months' themes with this map's photos in (set in the database: admins can't
    // make past themes)
    for (const [index, month] of [months[1], months[2]].entries()) {
      const theme = await prisma.photoTheme.create({ data: { month, title: `Past ${index}` } });
      await prisma.photoThemeEntry.create({ data: { themeId: theme.id, photoId: photos.a, mapId: map.id } });
    }
    const badges = data(await owner.agent.get(`/api/maps/${map.id}/badges`));
    expect(badges.badges.find((b) => b.key === 'themes-3')).toMatchObject({ have: 3, need: 3, earnedAt: expect.any(String) });
    expect(badges.newlyEarned).toContain('themes-3');
    expect(badges.badges.find((b) => b.key === 'themes-6')).toMatchObject({ have: 3, earnedAt: null });
    expect(data(await owner.agent.get(`/api/maps/${map.id}/themes`)).albums).toHaveLength(3);
  });

  it('keeps a theme with entries: its words change, its month and itself stay', async () => {
    const patch = (body) => admin.agent.patch(`/api/users/admin/themes/${current.id}`).send(body);
    // This map's photo, and the 20 from the full map above
    const entries = 1 + THEME_LIMITS.entriesPerMap;
    // With both counts, as the list has them, so the admin row swaps in as it is
    expect(data(await patch({ title: 'Doors and gates' })).theme).toMatchObject({ title: 'Doors and gates', entryCount: entries, mapCount: 2 });
    expect((await patch({ month: monthKey(months[5]) })).status).toBe(409);
    expect((await admin.agent.delete(`/api/users/admin/themes/${current.id}`)).status).toBe(409);
    // An empty one moves and goes
    const moved = await admin.agent.patch(`/api/users/admin/themes/${next.id}`).send({ month: monthKey(months[5]) });
    expect(data(moved).theme.month).toBe(monthKey(months[5]));
    expect((await admin.agent.delete(`/api/users/admin/themes/${next.id}`)).status).toBe(200);
    const listed = data(await admin.agent.get('/api/users/admin/themes'));
    expect(listed.themes.find((t) => t.id === current.id)).toMatchObject({ entryCount: entries, mapCount: 2 });
    expect(listed.themes.some((t) => t.id === next.id)).toBe(false);
  });

  it('drops a deleted photo from its albums', async () => {
    await owner.agent.delete(`/api/photos/${photos.a}`);
    const album = data(await owner.agent.get(`/api/maps/${map.id}/themes/${current.id}/photos`));
    expect(album.photos).toEqual([]);
  });
});
