# The Trevi Fountain in the high-quality look (hq.py): the Palazzo Poli's front made into a triumphal
# arch, its giant Corinthian columns, the great niche where Oceanus stands on his shell chariot, the
# side niches with Abundance and Health, the attic with its inscription, statues and the papal arms,
# the palace's wings with their windows and balustrades, the sea horses and tritons on the travertine
# rocks spilling into the basin (the modelled fountain in _sources/trevi-fountain-yalta/, Yalta, CC BY
# 4.0: its right wing mirrored for the left, which the model leaves out, and given the diorama's
# travertine); the wide basin of turquoise water, a rounded rectangle, inside its rim; the palace's
# body and tiled roof behind; the piazza's cobbles, and people.
# Run: blender -b --factory-startup -P trevi-fountain.py -- trevi-fountain-1024.png 1024 trevi-fountain.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1762)
M['trav'] = material('travertineT', '#ece3cf', 0.6, vary='#ded3bc', vary_scale=22, bump=0.15, bump_scale=150)
M['travRock'] = material('travertineRock', '#ddd0b6', 0.7, vary='#cbbd9f', vary_scale=9, bump=0.35, bump_scale=90)
M['travShade'] = material('travertineShadeT', '#bdb099', 0.65, vary='#ad9f87', vary_scale=22, bump=0.15, bump_scale=150)
M['trevi'] = material('treviWater', '#1593ad', 0.08, vary='#27abc2', vary_scale=3, coat=0.25)
M['sampietrini'] = masonry('sampietrini', '#8e8880', '#625d57', scale=120, rough=0.85, vary='#827c74')
M['paneGlass'] = material('paneGlass', '#4f6779', 0.45, vary='#5d7689', vary_scale=4)   # matte: a glossy pane mirrors the white sky at this camera's angle
M['stucco'] = material('stuccoPoli', '#e9ddc4', 0.7, vary='#dccfb3', vary_scale=20, bump=0.1, bump_scale=180)

# The model is in its own units (about 4.8 cm each): the front faces -y, the ground is z 0, and the
# central arch's axis is x = AXIS. Everything here is laid out in those units and placed by TO().
AXIS = 201.05           # the central arch's axis
EDGE = 393.65           # where the central arch ends and the right wing begins
K = 0.0028              # the model's units to the tile's
MID = 109.0             # the model's y that goes to the tile's middle
ZB = G + 0.006          # the piazza's top: the model's ground


def TO(x, y, z=0.0):
    """A point in the model's units, on the tile."""
    return ((x - AXIS) * K, (y - MID) * K, ZB + z * K)


def flat(pts):
    return [TO(x, y)[:2] for x, y in pts]


# ------------------------------------------------------------------ the fountain and the palace front
STONE, ROCK, LETTERS, PANE = 0, 1, 2, 3
GROUPS = {'material_7': ROCK, 'Mat.1': LETTERS, 'material_3': LETTERS, 'material_0': LETTERS, 'material_6': PANE}
src = import_model('trevi-fountain-yalta', 'fountain',
                   # the scale figure, and the model's own ground slab (the basin and piazza are ours)
                   skip=lambda names: any('sophia' in n or n == 'material_5' for n in names),
                   group=lambda names: next((GROUPS[n] for n in names if n in GROUPS), STONE))
if src is not None:
    me = src.data
    bm = bmesh.new()
    bm.from_mesh(me)
    # the left wing: the right wing (and its rocks) mirrored about the arch's axis
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(EDGE, 0, 0), plane_no=(1, 0, 0))
    right = [f for f in bm.faces if all(v.co.x >= EDGE - 1e-3 for v in f.verts)]
    dup = bmesh.ops.duplicate(bm, geom=right)['geom']
    for v in (e for e in dup if isinstance(e, bmesh.types.BMVert)):
        v.co.x = 2 * AXIS - v.co.x
    bmesh.ops.reverse_faces(bm, faces=[e for e in dup if isinstance(e, bmesh.types.BMFace)])
    bm.to_mesh(me)
    bm.free()
    me.transform(Matrix.Translation((0, 0, ZB - 0.002)) @ Matrix.Scale(K, 4) @ Matrix.Translation((-AXIS, -MID, 0)))
    # (no materials.clear(): it resets every face's material index to 0; the imported mesh has no slots)
    for m in (M['trav'], M['travRock'], M['travShade'], M['paneGlass']):
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = True
    xs = [v.co.x for v in me.vertices]
    print('FOUNTAIN x', round(min(xs), 3), round(max(xs), 3), 'faces', len(me.polygons), 'by material', [sum(1 for p in me.polygons if p.material_index == i) for i in range(4)])

# ------------------------------------------------------------------ the basin: a rounded rectangle, its rim and water
BW, BF, BB, BR = 350.0, -230.0, 150.0, 150.0     # half its width, its front, its back (under the rocks), its corners' radius
RIM, RIMZ, WATERZ = 18.0, 18.0, 10.0              # the rim's width and top, the water's level


def basin_path(grow):
    """The basin's sides and front, from back left round to back right, `grow` outwards."""
    w, f, r = BW + grow, BF - grow, BR + grow
    pts = [(-w, BB)]
    for j in range(13):
        a = math.pi + math.pi / 2 * j / 12
        pts.append((-w + r + r * math.cos(a), f + r + r * math.sin(a)))
    for j in range(13):
        a = 1.5 * math.pi + math.pi / 2 * j / 12
        pts.append((w - r + r * math.cos(a), f + r + r * math.sin(a)))
    pts.append((w, BB))
    return [(AXIS + x, y) for x, y in pts]


inner, outer = basin_path(0.0), basin_path(RIM)
slab('water', M['trevi'], flat(inner), G - 0.004, ZB + WATERZ * K, margin=0.03)
bm = bmesh.new()
band = flat(inner + list(reversed(outer)))
add_prism(bm, [bm.verts.new((x, y, G - 0.003)) for x, y in band], [bm.verts.new((x, y, ZB + RIMZ * K)) for x, y in band])
finish('rim', bm, M['trav'], bevel=0.006, smooth_sides=False)

# ------------------------------------------------------------------ the piazza round the basin, and behind
front = [(-2.0, -2.0), (2.0, -2.0), (2.0, TO(0, BB)[1])] + list(reversed(flat(outer))) + [(-2.0, TO(0, BB)[1])]
slab('piazza', M['sampietrini'], front, G - 0.004, ZB, margin=0.03)
slab('piazzaBack', M['sampietrini'], [(-2.0, TO(0, BB)[1]), (2.0, TO(0, BB)[1]), (2.0, 2.0), (-2.0, 2.0)], G - 0.004, ZB - 0.0006, margin=0.03)

# ------------------------------------------------------------------ the palace's body and roof behind its front
WING = 2 * AXIS - 630.0          # the mirrored wing's outer edge
TOP = 370.0                      # the wings' top (their balustrade stands on it)
body = clip_to_plinth([TO(WING + 2, 221)[:2], TO(628, 221)[:2], TO(628, 430)[:2], TO(WING + 2, 430)[:2]], 0.05)
bm = bmesh.new()
add_prism(bm, [bm.verts.new((x, y, ZB - 0.002)) for x, y in body], [bm.verts.new((x, y, ZB + TOP * K)) for x, y in body])
finish('palace', bm, M['stucco'], smooth_sides=False)
for z0, z1 in ((0, 12), (TOP - 14, TOP - 2)):
    band_ = clip_to_plinth([TO(WING - 1, 223)[:2], TO(631, 223)[:2], TO(631, 433)[:2], TO(WING - 1, 433)[:2]], 0.045)
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new((x, y, ZB + z0 * K)) for x, y in band_], [bm.verts.new((x, y, ZB + z1 * K)) for x, y in band_])
    finish(f'palaceBand{z0}', bm, M['trav'], smooth_sides=False)
# the roof: tiles sloping up from every side to the ridge
M['roofTiles'] = banded(material('roofTiles', '#b4562f', 0.65, vary='#9f4a28', vary_scale=10, bump=0.1, bump_scale=200), 'Z', 40.0, strength=0.5)
lo = clip_to_plinth([TO(WING - 4, 214)[:2], TO(634, 214)[:2], TO(634, 436)[:2], TO(WING - 4, 436)[:2]], 0.04)
cx, cy = sum(p[0] for p in lo) / len(lo), sum(p[1] for p in lo) / len(lo)
hi = [(cx + (x - cx) * 0.86, cy + (y - cy) * 0.25) for x, y in lo]
bm = bmesh.new()
add_prism(bm, [bm.verts.new((x, y, ZB + TOP * K)) for x, y in lo], [bm.verts.new((x, y, ZB + (TOP + 62) * K)) for x, y in hi])
finish('palaceRoof', bm, M['roofTiles'], smooth_sides=False)

# ------------------------------------------------------------------ people at the rim
for k, (x, y, shirt) in enumerate(((-0.75, -1.08, 'red'), (-0.45, -1.15, 'blue'), (-0.1, -1.12, 'yellow'), (0.2, -1.16, 'green'), (0.55, -1.1, 'red'),
                                     (0.85, -1.0, 'blue'), (-1.05, -0.75, 'green'), (1.12, -0.7, 'yellow'), (0.0, -1.3, 'blue'), (-0.3, -1.33, 'red'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=ZB)

render('trevi-fountain')
