// The mock's map designs (src/dev/mock/mapDesigns.js and handlers/mapDesigns.js), as the
// server's: one design per map style (22 Nov 2026), and the hovered country's colour
// (23 Nov 2026, the user's wish).
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { designStyleOf, designView, designsOf, designsView, newDesign, parseDesignChange } from '@/dev/mock/mapDesigns';
import { HOME_MAP, SAM_MAP, db, del, freshStore, get, patch, registerAllRoutes } from './mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const designs = async (mapId = HOME_MAP) => (await get(`/api/maps/${mapId}`)).data.map.designs;

describe('the design rules', () => {
  it('reads the hover colour as it reads the names’ and the grid’s', () => {
    expect(parseDesignChange({ hover: '#FF00AA' })).toEqual({ change: { hover: '#ff00aa' } });
    expect(parseDesignChange({ hover: null })).toEqual({ change: { hover: null } });
    expect(parseDesignChange({ hover: 'pink' })).toEqual({ error: 'invalidDesignColour' });
  });

  it('lets the strings, and only the strings, be see-through, as the server does', () => {
    expect(parseDesignChange({ string: '#1D4ED866' })).toEqual({ change: { string: '#1d4ed866' } });
    expect(parseDesignChange({ string: '#1d4ed8ff' })).toEqual({ change: { string: '#1d4ed8' } });
    expect(parseDesignChange({ string: '#1d4ed8666' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ names: '#00000080' })).toEqual({ error: 'invalidDesignColour' });
    expect(parseDesignChange({ countries: { FR: '#aa000080' } })).toEqual({ error: 'invalidDesignColour' });
  });

  it('takes a second colour twisted into the strings, opaque only, as the server does', () => {
    expect(parseDesignChange({ stringTwist: '#FFFFFF' })).toEqual({ change: { stringTwist: '#ffffff' } });
    expect(parseDesignChange({ stringTwist: null })).toEqual({ change: { stringTwist: null } });
    expect(parseDesignChange({ stringTwist: '#ffffff80' })).toEqual({ error: 'invalidDesignColour' });
  });

  it('knows the map styles, and nothing else', () => {
    expect(designStyleOf('starry')).toBe('starry');
    expect(designStyleOf('mono')).toBe('mono');
    expect(designStyleOf('jupiter')).toBeNull();
    expect(designStyleOf(undefined)).toBeNull();
  });

  it('starts a design with every colour usual', () => {
    expect(newDesign()).toEqual({ shown: true, countries: {}, names: null, grid: null, hover: null, string: null, stringTwist: null, plannedString: null, plannedStringTwist: null, pictureKey: null });
  });

  it('makes an older store’s one design the World map’s', () => {
    const map = { design: { ...newDesign(), names: '#ff0000' } };
    expect(designsOf(map)).toEqual({ animated: { ...newDesign(), names: '#ff0000' } });
    expect(map.design).toBeUndefined();
    expect(designView(map, 'animated')).toMatchObject({ style: 'animated', names: '#ff0000', hover: null });
    expect(designView(map, 'starry')).toBeNull();
    expect(Object.keys(designsView(map))).toEqual(['animated']);
  });
});

describe('PATCH /api/maps/:mapId/design', () => {
  it('saves a style’s design, the hover colour too, and leaves the other styles’ alone', async () => {
    const mono = await patch(`/api/maps/${HOME_MAP}/design`, { style: 'mono', names: '#e92525', hover: '#00AA00' });
    expect(mono.status).toBe(200);
    expect(mono.data.design).toMatchObject({ style: 'mono', shown: true, names: '#e92525', hover: '#00aa00' });

    expect(await designs()).toEqual({ mono: expect.objectContaining({ hover: '#00aa00' }) });
    await patch(`/api/maps/${HOME_MAP}/design`, { style: 'animated', grid: '#123456' });
    const both = await designs();
    expect(both.animated).toMatchObject({ grid: '#123456', hover: null, names: null });
    expect(both.mono).toMatchObject({ names: '#e92525', hover: '#00aa00' });

    // Back to the style's usual highlight
    expect((await patch(`/api/maps/${HOME_MAP}/design`, { style: 'mono', hover: null })).data.design.hover).toBeNull();
  });

  it('refuses a request that names no style, an unknown one, or a bad colour', async () => {
    expect((await patch(`/api/maps/${HOME_MAP}/design`, { names: '#000000' })).status).toBe(400);
    expect((await patch(`/api/maps/${HOME_MAP}/design`, { style: 'jupiter', names: '#000000' })).status).toBe(400);
    expect((await patch(`/api/maps/${HOME_MAP}/design`, { style: 'starry', hover: 'pink' })).status).toBe(400);
    expect(db().maps.find((map) => map.id === HOME_MAP).designs ?? {}).toEqual({});
  });

  it('is the owner’s and co-owners’ only', async () => {
    expect((await patch(`/api/maps/${SAM_MAP}/design`, { style: 'starry', hover: '#000000' })).status).toBe(403);
  });
});

describe('DELETE /api/maps/:mapId/design/picture', () => {
  it('needs the style whose picture goes', async () => {
    await patch(`/api/maps/${HOME_MAP}/design`, { style: 'old-map', names: '#000000' });
    expect((await del(`/api/maps/${HOME_MAP}/design/picture`)).status).toBe(400);
    const removed = await del(`/api/maps/${HOME_MAP}/design/picture?style=old-map`);
    expect(removed.status).toBe(200);
    expect(removed.data.design).toMatchObject({ style: 'old-map', names: '#000000', picture: null });
  });
});
