# The Hiroshima Peace Memorial in the high-quality look (hq.py), laid out in metres: the Atomic Bomb
# Dome, the ruin of the Prefectural Industrial Promotion Hall kept as it was left; its broken brick and
# plaster walls with their jagged tops and empty windows, three storeys in front and fallen away behind;
# the stair tower in the middle with the bare steel frame of its dome; the rubble inside; the lawn and
# its trees, the path, the stone embankment and the Motoyasu River before it, and people.
# Run: blender -b --factory-startup -P hiroshima-peace-memorial.py -- hiroshima-peace-memorial-1024.png 1024 hiroshima-peace-memorial.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1945)
M['ruinWall'] = material('domeRuin', '#a89c8a', 0.9, vary='#968a79', vary_scale=14, bump=0.4, bump_scale=200)
M['brickR'] = material('domeBrick', '#8f6a55', 0.9, vary='#7f5c49', vary_scale=24, bump=0.3, bump_scale=200)
M['domeSteel'] = material('domeSteel', '#4b3f37', 0.55, metallic=0.5)
M['opening'] = material('emptyWindow', '#2c2725', 0.95)
M['rubble'] = material('rubble', '#8c8172', 0.95, vary='#7b7062', vary_scale=40, bump=0.5, bump_scale=200)
M['river'] = material('motoyasu', '#477f8a', 0.06, vary='#518a95', vary_scale=6, coat=0.8)
M['embank'] = masonry('embankment', '#a7a196', '#857f74', scale=90, rough=0.9, vary='#9b9589')
M['pathH'] = material('peacePath', '#d2c8b5', 0.85, vary='#c7bda9', vary_scale=40)
M['treeHi'] = material('peaceTrees', '#4a8a3a', 0.85, vary='#579744', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.046               # metres to the tile's units
FY = 4.0                # the plan's middle on the tile's
Z0 = G + 0.004


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def ruined_wall(name, mat, xa, ya, xb, yb, thick, top, jag, wins=0, storeys=3, normal=(0, -1)):
    """A wall standing to a broken, jagged top: its elevation's outline, extruded through its thickness;
    rows of empty windows on its face."""
    L = math.hypot(xb - xa, yb - ya)
    n = max(4, int(L / 1.2))
    prof = [(0.0, 0.0), (L, 0.0)]
    for k in range(n, -1, -1):
        u = L * k / n
        h = top(u / L) + rng.uniform(-jag, jag)
        prof.append((u, max(0.8, h)))
    tx, ty = (xb - xa) / L, (yb - ya) / L
    nx, ny = -ty, tx
    bm = bmesh.new()
    a = [bm.verts.new(P(xa + tx * u, ya + ty * u, z)) for u, z in prof]
    b = [bm.verts.new(P(xa + tx * u + nx * thick, ya + ty * u + ny * thick, z)) for u, z in prof]
    add_prism(bm, a, b)
    finish(name, bm, mat, smooth_sides=False)
    for s in range(storeys):
        for k in range(wins):
            u = L * (k + 0.5) / wins
            z = 1.4 + s * 4.0
            if z + 2.6 < top(u / L) - jag - 0.4:
                out = max(0.0, thick * (nx * normal[0] + ny * normal[1])) + 0.05     # the face the normal looks out of
                c = P(xa + tx * u + normal[0] * out, ya + ty * u + normal[1] * out, 0)
                WIN.append((c.x, c.y, Z0 + z * S, 1.3 * S, 2.4 * S, normal, 'round' if s == 2 else 'rect'))


WIN = []
BEFORE = set(bpy.data.objects)
# ------------------------------------------------------------------ the river, its embankment, the lawn's path
slab('river', M['river'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (-20.0 - FY) * S), (-2.0, (-20.0 - FY) * S)], Z0 - 0.003, Z0 - 0.002, margin=0.02)
slab('embankment', M['embank'], [(-2.0, (-20.0 - FY) * S), (2.0, (-20.0 - FY) * S), (2.0, (-17.5 - FY) * S), (-2.0, (-17.5 - FY) * S)], Z0 - 0.003, Z0 + 1.2 * S, margin=0.02)
slab('path', M['pathH'], [(-2.0, (-17.5 - FY) * S), (2.0, (-17.5 - FY) * S), (2.0, (-14.0 - FY) * S), (-2.0, (-14.0 - FY) * S)], Z0 - 0.003, Z0 + 0.15 * S, margin=0.02)

# ------------------------------------------------------------------ the hall's ruined walls: the front wing, the side wings, the fallen back
XF = 22.0
ruined_wall('frontWall', M['ruinWall'], -XF, -8.0, XF, -8.0, 0.6, lambda t: 12.0 - 4.0 * max(0.0, t - 0.7) / 0.3 - 2.0 * max(0.0, 0.25 - t) / 0.25, 0.8, wins=11, normal=(0, -1))
ruined_wall('frontWallBack', M['brickR'], -XF + 1.0, 2.0, XF - 1.0, 2.0, 0.5, lambda t: 9.0 - 5.0 * abs(t - 0.5), 1.4, wins=0)
for s in (-1, 1):
    ruined_wall(f'sideWall{s}', M['ruinWall'], s * XF, -8.0, s * XF, 14.0, 0.6 if s < 0 else -0.6, lambda t: 12.0 - 7.0 * t, 1.2, wins=5, normal=(s, 0))
ruined_wall('backWall', M['brickR'], -XF, 14.0, -6.0, 14.0, 0.5, lambda t: 5.0 + 2.0 * math.sin(t * 7.0), 1.2, wins=0)
for y in (-4.0, 0.0):
    for s in (-1, 1):
        ruined_wall(f'crossWall{s}{y:+.0f}', M['brickR'], s * 9.0, y, s * 18.0, y, 0.4, lambda t: 8.0 - 3.0 * t, 1.0, wins=0)
RUB = [(P(rng.uniform(-XF + 2.0, XF - 2.0), rng.uniform(-6.0, 12.0), 0.3).to_tuple(), rng.uniform(0.8, 2.0) * S, 0.45) for _ in range(70)]
blob_cloud('rubble', M['rubble'], RUB)

# ------------------------------------------------------------------ the stair tower and the bare steel frame of its dome
TX, TY = 0.0, -6.0
for k in range(24):
    a = 2 * math.pi * k / 24
    if 13 <= k <= 16:
        continue                                     # a breach in the tower's back
    a1 = 2 * math.pi * (k + 1) / 24
    rx, ry = 6.0, 5.4
    xa, ya = TX + rx * math.cos(a), TY + ry * math.sin(a)
    xb, yb = TX + rx * math.cos(a1), TY + ry * math.sin(a1)
    top = 17.0 + (0.6 if k % 3 else 0.0) - (2.0 if 10 <= k <= 18 else 0.0)
    nrm = (math.cos((a + a1) / 2), math.sin((a + a1) / 2))
    ruined_wall(f'tower{k}', M['ruinWall'], xa, ya, xb, yb, -0.6, lambda t, tp=top: tp, 0.15, wins=1 if k % 2 == 0 else 0, storeys=4, normal=nrm)
cylinder('towerBand', M['ruinWall'], 6.3 * S, 0.5 * S, P(TX, TY, 12.4), segs=48)
annulus('towerTopRing', M['domeSteel'], 6.1 * S, 5.6 * S, Z0 + 17.0 * S, Z0 + 17.4 * S, segs=48, center=(TX * S, (TY - FY) * S))
DH = 7.4
for j in range(16):
    a = 2 * math.pi * j / 16
    pts = [P(TX + 5.8 * math.cos(t) * math.cos(a), TY + 5.2 * math.cos(t) * math.sin(a), 17.4 + DH * math.sin(t)) for t in [math.pi / 2 * i / 10 for i in range(11)]]
    tube(f'domeRib{j}', M['domeSteel'], pts, 0.13 * S)
for f in (0.35, 0.65, 0.88):
    t = math.pi / 2 * f
    pts = [P(TX + 5.8 * math.cos(t) * math.cos(a), TY + 5.2 * math.cos(t) * math.sin(a), 17.4 + DH * math.sin(t)) for a in [2 * math.pi * i / 48 for i in range(49)]]
    tube(f'domeRing{f}', M['domeSteel'], pts, 0.1 * S)
glazed('openings', WIN, M['ruinWall'], glass=M['opening'], depth=0.3 * S, bars=False)

# ------------------------------------------------------------------ trees on the lawn, people
TREES = []
for x, y in ((-30.0, -6.0), (-30.0, 8.0), (30.0, -4.0), (28.0, 10.0), (-24.0, 20.0), (20.0, 22.0), (-8.0, 24.0), (6.0, 26.0)):
    if math.hypot(x, y - FY) * S > 1.34:
        continue
    tube(f'trunk{x:+.0f}{y:+.0f}', M['trunk'], [P(x, y, 0.0), P(x, y, 3.4)], 0.35 * S)
    TREES += [(P(x + rng.uniform(-1.5, 1.5), y + rng.uniform(-1.5, 1.5), 5.4 + rng.uniform(-0.6, 0.8)).to_tuple(), rng.uniform(1.8, 2.6) * S, 0.85) for _ in range(5)]
blob_cloud('trees', M['treeHi'], TREES)
for k, (x, y, shirt) in enumerate(((-6.0, -15.6, 'blue'), (-2.0, -16.0, 'red'), (5.0, -15.4, 'yellow'), (12.0, -16.2, 'green'))):
    c = P(x, y, 0.15)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.1)

R = Matrix.Rotation(math.radians(-32.0 + 18.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('hiroshima-peace-memorial')
