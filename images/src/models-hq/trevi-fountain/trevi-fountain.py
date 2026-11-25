# The Trevi Fountain in the high-quality look (hq.py): the Palazzo Poli's front made into a triumphal
# arch, its giant Corinthian columns and pilasters, the great niche where Oceanus stands, the side
# niches with Abundance and Health, the attic with its inscription, balustrade, statues and the papal
# arms, the palace's wings with their rows of windows; in front the fountain's sculpture: Oceanus on
# his shell chariot, the sea horses and tritons on the travertine rocks (the scanned sculpture in
# _sources/trevi-fountain/, RaizVR, CC BY 4.0, taken from its piazza and given the travertine); the
# great basin of blue water with its rim, the piazza's steps, the houses round it, and people.
# Run: blender -b --factory-startup -P trevi-fountain.py -- trevi-fountain-1024.png 1024 trevi-fountain.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1762)
M['trav'] = material('travertineT', '#e9dfc9', 0.6, vary='#dacfb5', vary_scale=22, bump=0.18, bump_scale=150)
M['travShade'] = material('travertineShadeT', '#d3c7ad', 0.65, vary='#c3b79d', vary_scale=22, bump=0.18, bump_scale=150)
M['travRock'] = material('travertineRock', '#e6dccb', 0.7, vary='#cfc3ad', vary_scale=9, bump=0.35, bump_scale=90)
M['trevi'] = material('treviWater', '#3fa8c8', 0.05, vary='#56b8d4', vary_scale=4, coat=0.9)
M['sampietrini'] = material('sampietrini', '#a49d92', 0.85, vary='#918a80', vary_scale=60, bump=0.35, bump_scale=300)
M['ochre'] = material('ochre', '#d9a25a', 0.8, vary='#c8924d', vary_scale=24, bump=0.12, bump_scale=200)
M['ochreRed'] = material('ochreRed', '#c76f45', 0.8, vary='#b5613b', vary_scale=24, bump=0.12, bump_scale=200)
OPEN = []
FY = 0.28            # the palace's front
PZ = G + 0.07        # the piazza's level; the basin's water is below it
WZ = G + 0.012

# ------------------------------------------------------------------ the piazza, the houses round it
# the piazza round the basin (never over it): in front, and either side
slab('piazzaFront', M['sampietrini'], [(-1.6, -1.6), (1.6, -1.6), (1.6, -0.3), (-1.6, -0.3)], G - 0.004, PZ, margin=0.05)
for s_ in (-1, 1):
    slab(f'piazzaSide{s_}', M['sampietrini'], [(s_ * 0.86, -0.3), (s_ * 1.6, -0.3), (s_ * 1.6, 0.6), (s_ * 0.86, 0.6)], G - 0.004, PZ, margin=0.05)
for k, (x, y, w, d, h, mat) in enumerate(((-1.05, -0.35, 0.3, 0.8, 0.5, 'ochre'), (1.05, -0.35, 0.3, 0.8, 0.48, 'ochreRed'))):
    box(f'house{k}', M[mat], (x, y, PZ + h / 2), (w, d, h), bevel=0.004)
    hip_roof(f'houseRoof{k}', M['terracotta'], x, y, PZ + h, w, d, 0.07, over=0.015)
    nx = 1 if x < 0 else -1
    for j in range(5):
        for zz in (0.06, 0.18, 0.3, 0.4):
            OPEN.append((x + nx * w / 2, y - d / 2 + (j + 0.5) * d / 5, PZ + zz, 0.035, 0.07, (nx, 0), 'rect'))

# ------------------------------------------------------------------ the basin
BW, BD = 0.78, 0.52
basin = [(BW * math.cos(a), FY - 0.02 + BD * 1.0 * math.sin(a) * (1.0 if math.sin(a) < 0 else 0.0)) for a in [math.pi + math.pi * k / 40 for k in range(41)]]
rim = [(x * 1.06, FY - 0.02 + (y - FY + 0.02) * 1.08) for x, y in basin]
slab('basinFloor', M['travShade'], basin, G - 0.004, WZ - 0.004, margin=0.05)
slab('water', M['trevi'], basin, WZ - 0.004, WZ, margin=0.05)
bm = bmesh.new()
ring_out = rim
ring_in = list(reversed(basin))
add_prism(bm, [bm.verts.new((x, y, G - 0.004)) for x, y in ring_out + ring_in], [bm.verts.new((x, y, PZ + 0.025)) for x, y in ring_out + ring_in])
finish('basinRim', bm, M['trav'], bevel=0.004, smooth_sides=False)
# the piazza cut down to the basin: the steps between
for k in range(3):
    pts = [(x * (1.1 + 0.05 * k), FY - 0.02 + (y - FY + 0.02) * (1.13 + 0.06 * k)) for x, y in basin]
    bm = bmesh.new()
    ring_out = pts
    ring_in = list(reversed([(x * (1.07 + 0.05 * k), FY - 0.02 + (y - FY + 0.02) * (1.1 + 0.06 * k)) for x, y in basin]))
    add_prism(bm, [bm.verts.new((x, y, PZ - 0.004)) for x, y in ring_out + ring_in], [bm.verts.new((x, y, PZ + 0.004)) for x, y in ring_out + ring_in])
    finish(f'step{k}', bm, M['travShade'], smooth_sides=False)

# ------------------------------------------------------------------ the Palazzo Poli's front
PH = 0.86
box('palace', M['trav'], (0.0, FY + 0.25, PZ + PH / 2), (1.62, 0.5, PH), bevel=0.004)
box('arch', M['trav'], (0.0, FY - 0.015, PZ + 0.45), (0.56, 0.05, 0.9), bevel=0.004)
COLS = bmesh.new()
for u in (-0.24, -0.08, 0.08, 0.24):
    x = u
    bmesh.ops.create_cone(COLS, cap_ends=True, segments=16, radius1=0.022, radius2=0.019, depth=0.6, matrix=Matrix.Translation((x, FY - 0.05, PZ + 0.2 + 0.3)))
    bmesh.ops.create_cube(COLS, size=1.0, matrix=Matrix.Translation((x, FY - 0.05, PZ + 0.19)) @ Matrix.Diagonal((0.06, 0.06, 0.02, 1)))
    bmesh.ops.create_cone(COLS, cap_ends=True, segments=16, radius1=0.02, radius2=0.03, depth=0.04, matrix=Matrix.Translation((x, FY - 0.05, PZ + 0.82)))
for u in (-0.72, -0.56, -0.4, 0.4, 0.56, 0.72):
    bmesh.ops.create_cube(COLS, size=1.0, matrix=Matrix.Translation((u, FY - 0.004, PZ + 0.5)) @ Matrix.Diagonal((0.03, 0.012, 0.62, 1)))
finish('orders', COLS, M['trav'], smooth_sides=False)
box('ground', M['travShade'], (0.0, FY - 0.006, PZ + 0.09), (1.64, 0.03, 0.18), bevel=0.002)
box('entablature', M['trav'], (0.0, FY - 0.03, PZ + 0.86), (1.66, 0.08, 0.05), bevel=0.003)
box('attic', M['trav'], (0.0, FY - 0.02, PZ + 0.95), (0.6, 0.07, 0.14), bevel=0.003)
box('inscription', M['travShade'], (0.0, FY - 0.056, PZ + 0.94), (0.4, 0.004, 0.05))
box('balustrade', M['trav'], (0.0, FY + 0.1, PZ + PH + 0.02), (1.62, 0.04, 0.04), bevel=0.002)
lathe('arms', M['trav'], [(0.0, 0), (0.07, 0.03), (0.075, 0.08), (0.04, 0.12), (0.0, 0.13)], (0.0, FY - 0.02, PZ + 1.0), segs=20, smooth=True, sy=0.35)
STAT = bmesh.new()
for u in (-0.22, -0.08, 0.08, 0.22):
    bmesh.ops.create_cone(STAT, cap_ends=True, segments=8, radius1=0.017, radius2=0.013, depth=0.07, matrix=Matrix.Translation((u, FY - 0.03, PZ + 1.055)))
    bmesh.ops.create_icosphere(STAT, subdivisions=1, radius=0.012, matrix=Matrix.Translation((u, FY - 0.03, PZ + 1.1)))
for u in (-0.16, 0.16):
    bmesh.ops.create_cone(STAT, cap_ends=True, segments=8, radius1=0.022, radius2=0.016, depth=0.11, matrix=Matrix.Translation((u, FY - 0.05, PZ + 0.31)))
    bmesh.ops.create_icosphere(STAT, subdivisions=1, radius=0.015, matrix=Matrix.Translation((u, FY - 0.05, PZ + 0.38)))
finish('statues', STAT, M['trav'], smooth_all=True)
OPEN.append((0.0, FY - 0.041, PZ + 0.18, 0.2, 0.46, (0, -1), 'round'))
for u in (-0.16, 0.16):
    OPEN.append((u, FY - 0.041, PZ + 0.24, 0.07, 0.18, (0, -1), 'round'))
    OPEN.append((u, FY - 0.041, PZ + 0.5, 0.07, 0.08, (0, -1), 'rect'))
for u in (-0.64, -0.48, -0.32, 0.32, 0.48, 0.64):
    for zz, hh in ((0.24, 0.12), (0.46, 0.12), (0.68, 0.08)):
        OPEN.append((u, FY - 0.001, PZ + zz, 0.06, hh, (0, -1), 'rect'))

# ------------------------------------------------------------------ the sculpture: Oceanus, the sea horses, the tritons and the rocks
CROP = (60.0, 74.0, -184.0, -154.0, 10.7, 29.0)     # the scan's box round them (its metres)
K = 0.0327                                          # the scan's metres to the tile's units
src = import_model('trevi-fountain', 'sculpture')
if src is not None:
    me = src.data
    bm = bmesh.new()
    bm.from_mesh(me)
    x0, x1, y0, y1, z0, z1 = CROP
    for co, no in (((x0, 0, 0), (-1, 0, 0)), ((x1, 0, 0), (1, 0, 0)), ((0, y0, 0), (0, -1, 0)), ((0, y1, 0), (0, 1, 0)), ((0, 0, z0), (0, 0, -1)), ((0, 0, z1), (0, 0, 1))):
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=no, clear_outer=True)
    bm.to_mesh(me)
    bm.free()
    # the scan's front faces -x: turned to face -y, the palace's side against our palace's front
    me.transform(Matrix.Translation((0.0, FY - 0.04, WZ - 0.004)) @ Matrix.Rotation(math.radians(90), 4, 'Z') @ Matrix.Scale(K, 4) @ Matrix.Translation((-x1, -(y0 + y1) / 2, -z0)))
    me.materials.clear()
    me.materials.append(M['travRock'])
    for p in me.polygons:
        p.use_smooth = True

for k, (x, y, shirt) in enumerate(((-0.5, -0.32, 'red'), (-0.35, -0.42, 'blue'), (0.3, -0.42, 'yellow'), (0.55, -0.3, 'green'), (0.0, -0.65, 'red'), (-0.2, -0.7, 'blue'), (0.2, -0.72, 'yellow'), (-0.7, -0.15, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=PZ)

windows('openings', M['shadow'], OPEN, depth=0.01)
render('trevi-fountain')
