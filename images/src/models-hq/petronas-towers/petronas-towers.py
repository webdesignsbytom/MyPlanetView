# The Petronas Towers in the high-quality look (hq.py), laid out in metres: Kuala Lumpur's twin towers
# rising 452 m, their plan the eight-pointed star of two squares with rounded lobes in its corners,
# stepping in at the setbacks towards the crown; the stainless steel and ribbon glass of their floors;
# the skybridge between them on its inverted-V legs; the crowns of rings and the needle spires; the
# Suria KLCC podium behind; and in front, KLCC Park's Lake Symphony with its fountains, lawns and palms.
# Run: blender -b --factory-startup -P petronas-towers.py -- petronas-towers-1024.png 1024 petronas-towers.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1998)
M['towerSkin'] = striped('petronasSkin', ['#d4d8dc', '#d4d8dc', '#3f5468', '#3f5468', '#3f5468'], 'Z', 26.0, rough=0.3, metallic=0.6)
M['steelP'] = material('petronasSteel', '#c9cdd1', 0.25, metallic=0.85)
M['podium'] = material('suriaPodium', '#cfc6b6', 0.6, vary='#c4bba9', vary_scale=30)
M['podiumGlass'] = material('suriaGlass', '#5d7a8e', 0.12, vary='#6a8799', vary_scale=6, metallic=0.2)
M['lake'] = material('lakeSymphony', '#3f84a6', 0.08, vary='#4a92b4', vary_scale=6, bump=0.04, bump_scale=60, coat=0.8)
M['jet'] = material('fountainJet', '#eef6f9', 0.3)
M['lawnK'] = material('klccLawn', '#6aa443', 0.85, vary='#78b14e', vary_scale=12, bump=0.3, bump_scale=200)
M['pathK'] = material('klccPath', '#d8cfbd', 0.8, vary='#cec4b0', vary_scale=40)
M['treeK'] = material('klccTree', '#3d7f34', 0.85, vary='#4b8f3d', vary_scale=14, bump=0.3, bump_scale=90)
M['palmTrunkK'] = material('palmTrunkK', '#a49a86', 0.8, vary='#968c78', vary_scale=40)
M['frondK'] = material('palmFrondK', '#4f8f36', 0.8, vary='#5c9c40', vary_scale=20)

S = 2.9 / 452.0         # metres to the tile's units: the spires' tips about 2.9 units up
Z0 = G + 0.004
FY = 30.0               # the plan's middle on the tile's


def P(x, y, z):
    return Vector((x * S, (y - FY) * S, Z0 + z * S))


def plan(a, n=128):
    """The towers' plan: the eight-pointed star of two squares of half-side a, a rounded lobe in each of
    its inner corners (radius from the middle, by angle)."""
    pts = []
    for k in range(n):
        t = 2 * math.pi * k / n
        star = max(a / max(abs(math.cos(t)), abs(math.sin(t))), a / max(abs(math.cos(t - math.pi / 4)), abs(math.sin(t - math.pi / 4))))
        lobe = 0.0
        for j in range(8):
            tk = math.pi / 8 + j * math.pi / 4
            phi = (t - tk + math.pi) % (2 * math.pi) - math.pi
            d, rho = 0.78 * a, 0.47 * a
            disc = rho * rho - (d * math.sin(phi)) ** 2
            if disc > 0 and abs(phi) < math.pi / 2:
                lobe = max(lobe, d * math.cos(phi) + math.sqrt(disc))
        r = max(star, lobe)
        pts.append((r * math.cos(t), r * math.sin(t)))
    return pts


def section(name, cx, cy, a, z0, z1, mat):
    poly = plan(a)
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new(P(cx + x, cy + y, z1)) for x, y in poly], [bm.verts.new(P(cx + x, cy + y, z0)) for x, y in poly])
    return finish(name, bm, mat, smooth_sides=False)


BEFORE = set(bpy.data.objects)
slab('park', M['lawnK'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)

# ------------------------------------------------------------------ the twin towers: their setbacks, the crowns' rings, the spires
TX = 52.0               # each tower's middle from the axis
TIERS = [(16.4, 0.0, 268.0), (14.3, 268.0, 312.0), (12.4, 312.0, 344.0), (10.6, 344.0, 360.0), (9.0, 360.0, 372.0)]
for s in (-1, 1):
    cx = s * TX
    for k, (a, z0, z1) in enumerate(TIERS):
        section(f'tower{s}_{k}', cx, 0.0, a, z0, z1, M['towerSkin'])
        if k + 1 < len(TIERS):
            section(f'ledge{s}_{k}', cx, 0.0, a * 0.98, z1, z1 + 1.2, M['steelP'])
    # the crown: rings of steel narrowing, then the needle with its balls
    for j, (r, z) in enumerate(((12.0, 372.0), (10.0, 376.0), (8.2, 380.0), (6.4, 384.0), (4.8, 388.0), (3.4, 392.0))):
        cylinder(f'crownRing{s}{j}', M['steelP'], r * S, 1.4 * S, P(cx, 0.0, z), segs=48)
        cylinder(f'crownCore{s}{j}', M['towerSkin'], (r - 1.4) * S, 4.0 * S, P(cx, 0.0, z), segs=48)
    lathe(f'spire{s}', M['steelP'], [(2.6 * S, 0.0), (1.6 * S, 20.0 * S), (0.8 * S, 48.0 * S), (0.2 * S, 58.0 * S), (0.0, 60.0 * S)], P(cx, 0.0, 392.0), segs=16, smooth=True)
    for j, z in enumerate((404.0, 416.0, 426.0, 434.0)):
        lathe(f'spireBall{s}{j}', M['steelP'], [(0.0, 0.0), (2.2 * S, 1.2 * S), (2.2 * S, 1.8 * S), (0.0, 3.0 * S)], P(cx, 0.0, z), segs=16, smooth=True)
    # the little bustle tower beside each
    section(f'bustle{s}', cx + s * 30.0, 18.0, 7.0, 0.0, 168.0, M['towerSkin'])
    cylinder(f'bustleCap{s}', M['steelP'], 8.6 * S, 4.0 * S, P(cx + s * 30.0, 18.0, 168.0), segs=40)

# ------------------------------------------------------------------ the skybridge and its legs
BZ = 170.0
inner = TX - 21.0
block_size = ((2 * inner) * S, 5.0 * S, 9.0 * S)
box('skybridge', M['podiumGlass'], P(0.0, 0.0, BZ + 4.5), block_size, bevel=0)
box('skybridgeRoof', M['steelP'], P(0.0, 0.0, BZ + 9.4), ((2 * inner) * S, 6.0 * S, 0.8 * S), bevel=0)
box('skybridgeFloor', M['steelP'], P(0.0, 0.0, BZ - 0.4), ((2 * inner) * S, 6.0 * S, 0.8 * S), bevel=0)
for s in (-1, 1):
    for side in (-1, 1):
        tube(f'bridgeLeg{s}{side}', M['steelP'], [P(0.0, side * 1.8, BZ - 0.8), P(s * inner * 0.55, side * 1.8, BZ - 24.0), P(s * inner, side * 1.8, BZ - 42.0)], 0.9 * S)

# ------------------------------------------------------------------ the podium behind, the park and Lake Symphony in front
bm = bmesh.new()
arc = [(110.0 * math.cos(t), 30.0 + 50.0 * math.sin(t)) for t in [math.radians(a) for a in range(195, 346, 6)]]
outline = arc + [(108.0, 62.0), (-108.0, 62.0)]
add_prism(bm, [bm.verts.new(P(x, y, 30.0)) for x, y in outline], [bm.verts.new(P(x, y, 0.0)) for x, y in outline])
finish('podium', bm, M['podium'], smooth_sides=False)
bm = bmesh.new()
glass = [(110.6 * math.cos(t), 30.0 + 50.6 * math.sin(t)) for t in [math.radians(a) for a in range(195, 346, 6)]]
for (xa, ya), (xb, yb) in zip(glass, glass[1:]):
    q = [bm.verts.new(P(xa, ya, 6.0)), bm.verts.new(P(xb, yb, 6.0)), bm.verts.new(P(xb, yb, 26.0)), bm.verts.new(P(xa, ya, 26.0))]
    bm.faces.new(q)
finish('podiumGlass', bm, M['podiumGlass'], smooth_sides=False)
LAKE = [(70.0 * math.cos(t) + 10.0 * math.sin(3 * t), -95.0 + 34.0 * math.sin(t)) for t in [2 * math.pi * k / 48 for k in range(48)]]
slab('lake', M['lake'], [(x * S, (y - FY) * S) for x, y in LAKE], Z0, Z0 + 0.2 * S, margin=0.02)
slab('lakeRim', M['pathK'], [(x * 1.06 * S, (-95.0 + (y + 95.0) * 1.12 - FY) * S) for x, y in LAKE], Z0, Z0 + 0.12 * S, margin=0.02)
for j in range(9):
    x = -48.0 + 12.0 * j
    lathe(f'jet{j}', M['jet'], [(1.4 * S, 0.0), (0.9 * S, 6.0 * S), (0.3 * S, 14.0 * S), (0.0, 16.0 * S)], P(x, -95.0, 0.2), segs=12, smooth=True)
for x in (-12.0, 12.0):
    slab(f'walk{x:+.0f}', M['pathK'], [((x - 4.0) * S, (-60.0 - FY) * S), ((x + 4.0) * S, (-60.0 - FY) * S), ((x + 4.0) * S, (-22.0 - FY) * S), ((x - 4.0) * S, (-22.0 - FY) * S)], Z0, Z0 + 0.12 * S, margin=0.02)
TREES = []
for j in range(40):
    x, y = rng.uniform(-160.0, 160.0), rng.uniform(-190.0, -40.0)
    if math.hypot(x, y - FY) * S > 1.36 or (abs(x) < 90.0 and -135.0 < y < -55.0):
        continue
    TREES.append((P(x, y, 8.0).to_tuple(), rng.uniform(5.0, 8.0) * S, 0.85))
blob_cloud('parkTrees', M['treeK'], TREES)
for j, (x, y) in enumerate(((-84.0, -60.0), (84.0, -60.0), (-90.0, -120.0), (90.0, -120.0))):
    h = 16.0
    lathe(f'palm{j}', M['palmTrunkK'], [(0.8 * S, 0.0), (0.6 * S, h * 0.5 * S), (0.55 * S, h * S)], P(x, y, 0.0), segs=10, smooth=True)
    for f in range(8):
        b = 2 * math.pi * f / 8 + j
        tube(f'frond{j}{f}', M['frondK'], [P(x, y, h), P(x + 3.0 * math.cos(b), y + 3.0 * math.sin(b), h + 1.0), P(x + 5.6 * math.cos(b), y + 5.6 * math.sin(b), h - 1.8)], 0.5 * S)

R = Matrix.Rotation(math.radians(-32.0 + 10.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('petronas-towers')
