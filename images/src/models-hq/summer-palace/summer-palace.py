# The Summer Palace in the high-quality look (hq.py), laid out in metres (drawn closer together, to fit):
# Beijing's imperial garden; the Tower of Buddhist Incense on its massive stone base atop Longevity Hill,
# octagonal, its red columns under four tiers of yellow-glazed eaves; the halls stepping down the hill
# below it; the painted Long Corridor along the shore and the ceremonial archway at its middle; Kunming
# Lake before it with part of the white Seventeen-Arch Bridge; pines on the hill, and people.
# Run: blender -b --factory-startup -P summer-palace.py -- summer-palace-1024.png 1024 summer-palace.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1750)
M['yellowTile'] = material('imperialYellow', '#e2ae2e', 0.4, vary='#d9a128', vary_scale=60)
M['greenTileS'] = material('summerGreenTile', '#3f7f5a', 0.45)
M['redS'] = material('imperialRed', '#b23a2c', 0.6, vary='#a6352a', vary_scale=40)
M['stoneS'] = masonry('summerStone', '#bdb5a6', '#968e80', scale=80, rough=0.9, vary='#b2aa9b')
M['marbleS'] = material('summerMarble', '#eeeae2', 0.5)
M['paintS'] = material('corridorPaint', '#3f6f9a', 0.6, vary='#3f8a5a', vary_scale=60)
M['lakeS'] = material('kunmingLake', '#5a8a96', 0.06, vary='#6595a0', vary_scale=6, bump=0.04, bump_scale=60, coat=0.8)
M['hillS'] = material('longevityHill', '#6a8a42', 0.9, vary='#77964b', vary_scale=14)
M['pineS'] = material('summerPine', '#2f5a33', 0.85, vary='#3a683d', vary_scale=14, bump=0.3, bump_scale=90)
M['goldS'] = material('summerGold', '#d9ad48', 0.3, metallic=0.85)

S = 0.0185              # metres to the tile's units
Z0 = G
SHORE = -6.0


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    return 1.2 + 38.0 * smooth((y - 4.0) / 40.0) * smooth((70.0 - abs(x)) / 30.0) - 2.0 * smooth((SHORE - y) / 2.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.14)
    return max(0.0, ground(x / S, y / S)) * S * rim


land = terrain('hill', H, [M['hillS']], lambda z, nz, x, y: 0, rings=160, segs=400)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


slab('lake', M['lakeS'], [(-2.0, -2.0), (2.0, -2.0), (2.0, (SHORE - 0.5) * S), (-2.0, (SHORE - 0.5) * S)], Z0 - 0.003, Z0 + 0.8 * S, margin=0.02)


def roof(name, cx, cy, w, d, z, rise, lift, mat='yellowTile'):
    rings = []
    for fw, fd, fz in ((1.0, 1.0, 0.0), (0.8, 0.72, 0.45), (0.62, 0.3, 0.85), (0.6, 0.02, 1.0)):
        ring = []
        for sx, sy in ((-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0)):
            l = lift * (1.0 - fz) if abs(sx) + abs(sy) == 2 else 0.0
            ring.append(P(cx + sx * w / 2 * fw, cy + sy * d / 2 * fd, z + rise * fz + l).to_tuple())
        rings.append(ring)
    loft(name, M[mat], rings, smooth=True)


def hall(name, cx, cy, w, d, h, z):
    box(name, M['redS'], P(cx, cy, z + h / 2), (w * S, d * S, h * S), bevel=0)
    box(name + 'Beam', M['paintS'], P(cx, cy, z + h - 0.4), ((w + 0.3) * S, (d + 0.3) * S, 0.8 * S), bevel=0)
    roof(name + 'Roof', cx, cy, w + 4.0, d + 4.0, z + h, h * 0.6, 1.0)


# ------------------------------------------------------------------ the Long Corridor along the shore, the archway
for k in range(28):
    x = -64.0 + 4.6 * k
    if math.hypot(x, SHORE + 2.0) * S > 1.32:
        continue
    for s in (-1, 1):
        cylinder(f'corridorPost{k}{s}', M['redS'], 0.22 * S, 3.0 * S, P(x, SHORE + 2.0 + s * 1.4, ground(x, SHORE + 2.0)), segs=8)
    roof(f'corridorRoof{k}', x + 2.3, SHORE + 2.0, 5.2, 4.2, ground(x, SHORE + 2.0) + 3.0, 1.2, 0.2, 'greenTileS')
for s in (-1, 1):
    cylinder(f'archwayPost{s}', M['redS'], 0.5 * S, 8.0 * S, P(s * 5.0, SHORE - 1.0, 1.0), segs=12)
box('archwayBeam', M['paintS'], P(0.0, SHORE - 1.0, 8.4), (12.0 * S, 1.0 * S, 1.6 * S), bevel=0)
roof('archwayRoof', 0.0, SHORE - 1.0, 14.0, 3.0, 9.2, 1.6, 0.6)

# ------------------------------------------------------------------ the halls stepping up the hill, the stone base and the Tower of Buddhist Incense
hall('paiyunGate', 0.0, 6.0, 14.0, 7.0, 5.0, ground(0.0, 6.0))
hall('paiyunHall', 0.0, 16.0, 18.0, 10.0, 7.0, ground(0.0, 16.0))
BY = 30.0
bz = ground(0.0, BY) - 2.0
box('towerBase', M['stoneS'], P(0.0, BY, bz + 9.0), (28.0 * S, 24.0 * S, 18.0 * S), bevel=0)
TZ = bz + 18.0
for k, (r, h) in enumerate(((9.0, 6.0), (8.0, 5.0), (7.0, 5.0), (5.6, 4.0))):
    z = TZ + sum(hh + 2.6 for rr, hh in ((9.0, 6.0), (8.0, 5.0), (7.0, 5.0), (5.6, 4.0))[:k])
    lathe(f'storey{k}', M['redS'], [(r * S, 0.0), (r * S, h * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, BY, z)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
    lathe(f'eave{k}', M['yellowTile'], [((r + 3.4) * S, 0.0), ((r + 3.0) * S, 0.6 * S), ((r + 0.6) * S, 2.6 * S), (r * 0.7 * S, 2.8 * S)], (0, 0, 0), segs=8,
          matrix=Matrix.Translation(P(0.0, BY, z + h)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
top = TZ + sum(hh + 2.6 for rr, hh in ((9.0, 6.0), (8.0, 5.0), (7.0, 5.0), (5.6, 4.0)))
lathe('towerCrown', M['yellowTile'], [(4.4 * S, 0.0), (2.4 * S, 2.6 * S), (0.4 * S, 4.4 * S), (0.0, 4.6 * S)], (0, 0, 0), segs=8, matrix=Matrix.Translation(P(0.0, BY, top - 0.2)) @ Matrix.Rotation(math.pi / 8, 4, 'Z'))
lathe('towerFinial', M['goldS'], [(0.6 * S, 0.0), (0.8 * S, 0.8 * S), (0.3 * S, 1.6 * S), (0.0, 2.6 * S)], P(0.0, BY, top + 4.4), segs=12)

# ------------------------------------------------------------------ the Seventeen-Arch Bridge, pines, people
BX0, BX1, BYB = 22.0, 64.0, -30.0
arcade_path('bridge', M['marbleS'], [(BX0 + (BX1 - BX0) * k / 9, BYB) for k in range(10)], 6.0, 0.0, 6.0, 1.8,
            matrix=Matrix.Translation((0, 0, Z0)) @ Matrix.Diagonal((S, S, S, 1.0)))
box('bridgeDeck', M['marbleS'], P((BX0 + BX1) / 2, BYB + 3.0, 6.2), ((BX1 - BX0) * S, 6.6 * S, 0.5 * S), bevel=0)
for s in (0.0, 6.0):
    tube(f'bridgeRail{s:.0f}', M['marbleS'], [P(BX0, BYB + s, 7.2), P(BX1, BYB + s, 7.2)], 0.25 * S)
PINES = []
for p in scatter_on(land, 6000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.34, seed=4):
    x, y = p.x / S, p.y / S
    if y < SHORE + 6.0 or abs(x) < 16.0:
        continue
    PINES.append(((p.x, p.y, p.z + 3.0 * S), rng.uniform(2.4, 3.6) * S, 0.85))
    if len(PINES) >= 150:
        break
blob_cloud('pines', M['pineS'], PINES)
for k, (x, shirt) in enumerate(((-20.0, 'red'), (-8.0, 'blue'), (10.0, 'yellow'), (30.0, 'green'))):
    c = P(x, SHORE + 2.0, ground(x, SHORE + 2.0))
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.6)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('summer-palace')
