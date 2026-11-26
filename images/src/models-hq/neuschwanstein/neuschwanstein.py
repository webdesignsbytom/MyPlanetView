# Neuschwanstein Castle in the high-quality look (hq.py): a forested rock rising to a grey cliff,
# and on it the white limestone castle: the tall Palas with its rows of round-arched windows, its
# steep slate roof, a gable on its south face and two turrets on its west end; the slender stair
# tower behind it with its tall spire and little stair turret; the square tower with its
# battlements, the Bower and its round tower with a pointed roof, the Knights' House, the curtain
# wall; and the red-ochre gatehouse at the east end with its crenellated towers. Firs below.
# Run: blender -b --factory-startup -P neuschwanstein.py -- neuschwanstein-1024.png 1024 neuschwanstein.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1869)
M['castle'] = material('castle', '#f4f0e7', 0.5, vary='#e7e1d4', vary_scale=18, bump=0.06, bump_scale=140)
M['roof'] = banded(material('roof', '#5a6b84', 0.45, vary='#4e5d74', vary_scale=14, bump=0.1, bump_scale=240, metallic=0.1), 'Z', 24.0, strength=0.18)
M['gatehouse'] = material('gatehouse', '#c27b5c', 0.6, vary='#ad6a4e', vary_scale=18, bump=0.08, bump_scale=150)
M['pane'] = material('pane', '#46566f', 0.15, metallic=0.3, coat=0.5)
M['forest'] = material('forest', '#3d8a3a', 0.85, vary='#357b33', vary_scale=8, bump=0.3, bump_scale=200)

# ------------------------------------------------------------------ the rock
Z0 = G + 0.46
K = 1.25           # the castle's scale on its rock
N, SEG = 12, 72
rings = []
bm = bmesh.new()
for i in range(N + 1):
    t = i / N
    A = 1.18 + 0.27 * (1 - t) ** 1.8
    B = 0.47 + 0.6 * (1 - t) ** 1.8
    e = 2.0 + 2.2 * t
    z = G - 0.012 + (Z0 - G + 0.012) * t
    ring = []
    for k in range(SEG):
        a = 2 * math.pi * k / SEG
        c, s = math.cos(a), math.sin(a)
        x = A * math.copysign(abs(c) ** (2 / e), c)
        y = B * math.copysign(abs(s) ** (2 / e), s)
        j = 1 + (rng.uniform(-0.045, 0.045) if 0.25 < t < 0.99 else 0.0)
        ring.append(bm.verts.new((x * j, y * j, z + (rng.uniform(-0.008, 0.008) if 0 < t < 1 else 0))))
    rings.append(ring)
for i in range(N):
    for k in range(SEG):
        f = bm.faces.new((rings[i][k], rings[i][(k + 1) % SEG], rings[i + 1][(k + 1) % SEG], rings[i + 1][k]))
        f.material_index = 0 if i < N * 0.55 else 1
top = bm.faces.new(rings[-1])
top.material_index = 2
ring_co = [[v.co.copy() for v in r] for r in rings]
multi('rock', bm, [M['forest'], M['rock'], M['gravel']], smooth=False)
# firs on the slopes and round the foot
for i in (1, 2, 3, 4, 5):
    for k in range(0, SEG, 2):
        if rng.random() < 0.4:
            continue
        p = ring_co[i][(k + rng.randint(0, 2)) % SEG]
        fir(f'slopeFir{i}_{k}', p.x * 1.01, p.y * 1.01, h=0.15 + 0.06 * rng.random(), r=0.045, z=p.z - 0.01)
for k in range(26):
    a = rng.uniform(0, 2 * math.pi)
    rr = rng.uniform(1.25, 1.42)
    x, y = 1.0 * rr * math.cos(a), 0.98 * rr * math.sin(a) * 0.92
    if math.hypot(x, y) > 1.42:
        continue
    fir(f'footFir{k}', x, y, h=0.18 + 0.08 * rng.random(), r=0.05)


castle_from = set(bpy.data.objects)


# ------------------------------------------------------------------ helpers
def wall_windows(name, x0, x1, y, zrows, normal, n, w, h, shape='round', mat='pane'):
    """Rows of windows along a wall from x0 to x1 at y (or along y when the normal is ±x)."""
    specs = []
    for z in zrows:
        for i in range(n):
            u = x0 + (i + 0.5) * (x1 - x0) / n
            if normal[0] == 0:
                specs.append((u, y, z, w, h, normal, shape))
            else:
                specs.append((y, u, z, w, h, normal, shape))
    frames = [(sx + normal[0] * 0.002, sy + normal[1] * 0.002, z - 0.004, sw + 0.012, sh + 0.008, nrm, shp) for sx, sy, z, sw, sh, nrm, shp in specs]
    windows(name + 'Frames', M['whiteStone'], frames, depth=0.006)
    windows(name, M[mat], [(sx + normal[0] * 0.004, sy + normal[1] * 0.004, z, sw, sh, nrm, shp) for sx, sy, z, sw, sh, nrm, shp in specs], depth=0.006)


def gable_wall(name, mat, x, y0, y1, z0, rise, thick=0.02, along='x'):
    """A triangular gable end: at x (spanning y0..y1) when `along` is 'x' (the ridge's direction)."""
    bm = bmesh.new()
    ym = (y0 + y1) / 2
    if along == 'x':
        tri = [(y0, z0), (y1, z0), (ym, z0 + rise)]
        add_prism(bm, [bm.verts.new((x - thick / 2, u, z)) for u, z in tri], [bm.verts.new((x + thick / 2, u, z)) for u, z in tri])
    else:
        tri = [(y0, z0), (y1, z0), (ym, z0 + rise)]
        add_prism(bm, [bm.verts.new((u, x - thick / 2, z)) for u, z in tri], [bm.verts.new((u, x + thick / 2, z)) for u, z in tri])
    finish(name, bm, mat, smooth_sides=False)


def battlements(name, mat, x0, x1, y0, y1, z, mh=0.03, mw=0.03):
    """Merlons round the top of a rectangle."""
    bm = bmesh.new()
    for (ax, ay, bx, by) in ((x0, y0, x1, y0), (x1, y0, x1, y1), (x1, y1, x0, y1), (x0, y1, x0, y0)):
        L = math.hypot(bx - ax, by - ay)
        n = max(2, int(L / (mw * 2)))
        for i in range(n):
            f = (i + 0.25) / n
            cx, cy = ax + (bx - ax) * (f + 0.25 / n), ay + (by - ay) * (f + 0.25 / n)
            bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((cx, cy, z + mh / 2)) @ Matrix.Diagonal((mw if bx != ax else 0.026, mw if by != ay else 0.026, mh, 1)))
    finish(name, bm, mat, bevel=0.002, smooth_sides=False)


def round_tower(name, x, y, r, z0, h, roof_h, mat='castle', slits=3):
    cylinder(name, M[mat], r, h, (x, y, z0), segs=32)
    lathe(name + 'Corbel', M[mat], [(r, 0), (r * 1.12, 0.03), (r * 1.12, 0.05)], (x, y, z0 + h - 0.05), segs=32)
    lathe(name + 'Band', M['whiteStone'], [(r * 1.01, 0), (r * 1.01, 0.012)], (x, y, z0 + h * 0.4), segs=32)
    specs = []
    for j in range(slits):
        a = math.radians(225 + (j - (slits - 1) / 2) * 50)
        specs.append((x + r * math.cos(a), y + r * math.sin(a), z0 + h * 0.55, r * 0.35, h * 0.2, (math.cos(a), math.sin(a)), 'round'))
    windows(name + 'Windows', M['pane'], specs, depth=0.008)
    spire(name + 'Spire', M['roof'], x, y, z0 + h, r * 1.12, roof_h)


# ------------------------------------------------------------------ the Palas
PX0, PX1, PY0, PY1, HP = -0.84, -0.18, -0.22, 0.16, 0.6
box('palas', M['castle'], ((PX0 + PX1) / 2, (PY0 + PY1) / 2, Z0 + HP / 2), (PX1 - PX0, PY1 - PY0, HP), bevel=0.003)
box('palasPlinth', M['rockLight'], ((PX0 + PX1) / 2, (PY0 + PY1) / 2, Z0 + 0.02), (PX1 - PX0 + 0.02, PY1 - PY0 + 0.02, 0.04), bevel=0.002)
for zz in (Z0 + 0.15, Z0 + 0.3, Z0 + 0.45, Z0 + HP - 0.012):
    box(f'palasCourse{zz:.3f}', M['whiteStone'], ((PX0 + PX1) / 2, (PY0 + PY1) / 2, zz), (PX1 - PX0 + 0.008, PY1 - PY0 + 0.008, 0.012), bevel=0.001)
wall_windows('palasSouth', PX0 + 0.04, PX1 - 0.04, PY0, (Z0 + 0.05, Z0 + 0.19, Z0 + 0.335), (0, -1), 8, 0.032, 0.075)
wall_windows('palasSouthHall', PX0 + 0.04, PX1 - 0.04, PY0, (Z0 + 0.475,), (0, -1), 12, 0.026, 0.1)
wall_windows('palasWest', PY0 + 0.05, PY1 - 0.05, PX0, (Z0 + 0.05, Z0 + 0.19, Z0 + 0.335, Z0 + 0.475), (-1, 0), 4, 0.03, 0.075)
gable_roof('palasRoof', M['roof'], PX0, PX1, PY0, PY1, Z0 + HP, 0.3, over=0.025)
for x in (PX0, PX1):
    gable_wall(f'palasGable{x}', M['castle'], x, PY0, PY1, Z0 + HP, 0.3)
windows('palasGableWindow', M['pane'], [(PX0 - 0.012, (PY0 + PY1) / 2, Z0 + HP + 0.05, 0.04, 0.12, (-1, 0), 'round')], depth=0.006)
for k in range(3):
    x = PX0 + 0.15 + k * 0.18
    box(f'dormer{k}', M['castle'], (x, PY1 - 0.02, Z0 + HP + 0.08), (0.06, 0.06, 0.08), bevel=0.002)
    gable_roof(f'dormerRoof{k}', M['roof'], x - 0.03, x + 0.03, PY1 - 0.05, PY1 + 0.01, Z0 + HP + 0.12, 0.05, over=0.008, along='y')
# the gable on the south face, over the Singers' Hall
SX0, SX1 = -0.6, -0.4
box('southWing', M['castle'], ((SX0 + SX1) / 2, PY0 - 0.03, Z0 + HP / 2), (SX1 - SX0, 0.06, HP), bevel=0.002)
gable_roof('southGableRoof', M['roof'], SX0, SX1, PY0 - 0.06, PY0 + 0.12, Z0 + HP, 0.2, over=0.015, along='y')
gable_wall('southGableWall', M['castle'], PY0 - 0.06, SX0, SX1, Z0 + HP, 0.2, along='y')
windows('southGableWindow', M['pane'], [((SX0 + SX1) / 2, PY0 - 0.072, Z0 + HP + 0.03, 0.05, 0.1, (0, -1), 'round')], depth=0.006)
box('balcony', M['whiteStone'], ((SX0 + SX1) / 2, PY0 - 0.08, Z0 + 0.3), (0.16, 0.05, 0.015), bevel=0.002)
# the two turrets at the west end
round_tower('turretSW', PX0 - 0.01, PY0 - 0.01, 0.055, Z0 + 0.25, HP + 0.05, 0.28)
round_tower('turretNW', PX0 - 0.01, PY1 + 0.01, 0.065, Z0 + 0.1, HP + 0.22, 0.34)

# ------------------------------------------------------------------ the stair tower behind
round_tower('stairTower', -0.22, PY1 + 0.05, 0.08, Z0, 0.98, 0.42, slits=4)
lathe('stairGallery', M['whiteStone'], [(0.1, 0), (0.1, 0.02)], (-0.22, PY1 + 0.05, Z0 + 0.8), segs=32)
round_tower('stairTurret', -0.12, PY1 + 0.08, 0.04, Z0 + 0.4, 0.5, 0.18, slits=2)

# ------------------------------------------------------------------ the square tower, the Knights' House and the Bower
box('squareTower', M['castle'], (0.06, 0.12, Z0 + 0.32), (0.15, 0.15, 0.64), bevel=0.003)
box('squareTowerTop', M['castle'], (0.06, 0.12, Z0 + 0.655), (0.17, 0.17, 0.03), bevel=0.002)
battlements('squareTowerMerlons', M['castle'], -0.025, 0.145, 0.035, 0.205, Z0 + 0.67)
wall_windows('squareTowerWindows', 0.0, 0.12, 0.12 - 0.075, (Z0 + 0.3, Z0 + 0.48), (0, -1), 2, 0.025, 0.06)
box('knights', M['castle'], (-0.07, 0.24, Z0 + 0.16), (0.22, 0.14, 0.32), bevel=0.002)
gable_roof('knightsRoof', M['roof'], -0.18, 0.04, 0.17, 0.31, Z0 + 0.32, 0.12, over=0.015)
box('bower', M['castle'], (0.28, 0.08, Z0 + 0.21), (0.26, 0.22, 0.42), bevel=0.003)
gable_roof('bowerRoof', M['roof'], 0.15, 0.41, -0.03, 0.19, Z0 + 0.42, 0.18, over=0.018)
for x in (0.15, 0.41):
    gable_wall(f'bowerGable{x}', M['castle'], x, -0.03, 0.19, Z0 + 0.42, 0.18)
wall_windows('bowerSouth', 0.17, 0.39, -0.03, (Z0 + 0.12, Z0 + 0.27), (0, -1), 4, 0.03, 0.07)
round_tower('bowerTower', 0.16, -0.06, 0.065, Z0, 0.56, 0.3)
# the curtain wall along the south of the courtyard, the courtyard steps
box('curtain', M['castle'], (0.2, -0.3, Z0 + 0.07), (0.72, 0.04, 0.14), bevel=0.002)
battlements('curtainMerlons', M['castle'], -0.16, 0.56, -0.31, -0.29, Z0 + 0.14, mh=0.025, mw=0.025)

# ------------------------------------------------------------------ the gatehouse
GX0, GX1, GY0, GY1 = 0.55, 0.88, -0.27, 0.2
box('gatehouse', M['gatehouse'], ((GX0 + GX1) / 2, (GY0 + GY1) / 2, Z0 + 0.19), (GX1 - GX0, GY1 - GY0, 0.38), bevel=0.003)
box('gatehouseBand', M['whiteStone'], ((GX0 + GX1) / 2, (GY0 + GY1) / 2, Z0 + 0.24), (GX1 - GX0 + 0.008, GY1 - GY0 + 0.008, 0.012), bevel=0.001)
gable_roof('gatehouseRoof', M['roof'], GX0, GX1, GY0 + 0.06, GY1 - 0.06, Z0 + 0.38, 0.14, over=0.015, along='y')
gable_wall('gatehouseGable', M['gatehouse'], GY0 + 0.06, GX0, GX1, Z0 + 0.38, 0.14, along='y')
wall_windows('gatehouseSouth', GX0 + 0.03, GX1 - 0.03, GY0, (Z0 + 0.1, Z0 + 0.27), (0, -1), 4, 0.03, 0.065, mat='pane')
for k, y in enumerate((GY0, GY1)):
    box(f'gateTower{k}', M['gatehouse'], (GX1 - 0.04, y, Z0 + 0.25), (0.1, 0.1, 0.5), bevel=0.003)
    battlements(f'gateTowerMerlons{k}', M['gatehouse'], GX1 - 0.09, GX1 + 0.01, y - 0.05, y + 0.05, Z0 + 0.5)
    box(f'gateTowerTop{k}', M['gatehouse'], (GX1 - 0.04, y, Z0 + 0.49), (0.11, 0.11, 0.02), bevel=0.002)
windows('gateArch', M['shadow'], [(GX1 + 0.002, (GY0 + GY1) / 2, Z0, 0.1, 0.17, (1, 0), 'round')], depth=0.008)
# the castle drawn bigger on its rock (the rock's top made to fit it)
S = Matrix.Translation((0, 0, Z0)) @ Matrix.Scale(K, 4) @ Matrix.Translation((0, 0, -Z0))
for ob in bpy.data.objects:
    if ob not in castle_from:
        ob.matrix_world = S @ ob.matrix_world

render('neuschwanstein')
