# The Cliffs of Moher in the high-quality look (hq.py), laid out in metres from the Atlantic: the sheer
# cliffs in bands of dark shale and sandstone, their edge waving in and out of headlands and bays,
# rising southwards; the green clifftop with the flagstone wall along its path and O'Brien's Tower on
# a headland; the sea stack Branaunmore standing off the cliffs with its grassy cap; the surf at the
# cliffs' foot, and visitors along the top.
# Run: blender -b --factory-startup -P cliffs-of-moher.py -- cliffs-of-moher-1024.png 1024 cliffs-of-moher.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1835)
M['strata'] = layered('moherStrata', ['#35312e', '#8c7c66', '#3d3733', '#a08d72', '#2f2b29', '#7a6b58'], scale=5.0, distortion=0.4, rough=0.85, bump=0.5, bump_scale=60, axis='Z', detail=2.0)
M['clifftopGrass'] = material('clareGrass', '#5d9a42', 0.85, vary='#6ca64d', vary_scale=12, bump=0.3, bump_scale=120)
M['atlantic'] = material('atlantic', '#2a5c72', 0.08, vary='#336a80', vary_scale=8, bump=0.06, bump_scale=30)
M['foam'] = material('moherSurf', '#eef3f2', 0.6)
M['flagstone'] = material('moherFlagstone', '#6d6a64', 0.85, vary='#625f5a', vary_scale=40, bump=0.2, bump_scale=200)
M['towerStone'] = masonry('obriensTower', '#8a857b', '#625e57', scale=200, rough=0.9, vary='#7d786f')

S = 0.0075              # metres to the tile's units
SEA = G + 0.03          # the sea's level
RMAX = 1.46 / S         # the base's edge, in metres


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def edge(x):
    """The cliff's edge (y, metres) along the coast: headlands and bays."""
    return 22.0 * math.sin(x / 34.0) + 10.0 * math.sin(x / 13.0 + 1.3) - 10.0


def top(x, y=None):
    """The clifftop's height (metres), higher to the south (right), rising a little inland."""
    base = 75.0 + 30.0 * smooth((x + 120.0) / 240.0)
    return base + (0.0 if y is None else 0.06 * max(0.0, y - edge(x)))


def P(x, y, z):
    return Vector((x * S, y * S, SEA + z * S))


slab('sea', M['atlantic'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], G - 0.003, SEA, margin=0.015)
BEFORE = set(bpy.data.objects)

# ------------------------------------------------------------------ the clifftop: a grid of grass from the edge back to the base's rim
XS = [x for x in [-RMAX + 2.0 * k for k in range(int(2 * RMAX / 2.0) + 1)] if edge(x) < math.sqrt(max(0.0, RMAX ** 2 - x * x)) - 3.0]
NY = 40
bm = bmesh.new()
cols, col_pts = [], []
for x in XS:
    y0, y1 = edge(x), math.sqrt(max(0.0, RMAX ** 2 - x * x))
    pts = [P(x, y0 + (y1 - y0) * k / NY, top(x, y0 + (y1 - y0) * k / NY)) for k in range(NY + 1)]
    col_pts.append(pts)
    cols.append([bm.verts.new(p) for p in pts])
for a, b in zip(cols, cols[1:]):
    for k in range(NY):
        bm.faces.new((a[k], b[k], b[k + 1], a[k + 1]))
finish('clifftop', bm, M['clifftopGrass'], smooth_all=True)
# the sheer face: from below the water up to the edge, along the whole coast
bm = bmesh.new()
face_cols = []
for x in XS:
    y = edge(x)
    col = []
    for k in range(13):
        rough = 0 < k < 12                      # the face's middle a little rugged, its foot and lip true to the edge
        col.append(bm.verts.new(P(x + (rng.uniform(-0.3, 0.3) if rough else 0.0), y - (0.6 * math.sin(k * 1.7 + x) if rough else 0.0), top(x) * k / 12 - 3.0 * (1 - k / 12))))
    face_cols.append(col)
for a, b in zip(face_cols, face_cols[1:]):
    for k in range(12):
        bm.faces.new((a[k], a[k + 1], b[k + 1], b[k]))
finish('cliffFace', bm, M['strata'], smooth_sides=False)
# the cut down the base's rim behind, and at both ends, so the clifftop is closed
bm = bmesh.new()
back = [tuple(pts[-1]) for pts in col_pts]
for (a, b) in zip(back, back[1:]):
    q = [bm.verts.new(a), bm.verts.new(b), bm.verts.new((b[0], b[1], SEA - 3.0 * S)), bm.verts.new((a[0], a[1], SEA - 3.0 * S))]
    bm.faces.new(q)
finish('cliffBack', bm, M['strata'], smooth_sides=False)
for side, pts in ((0, col_pts[0]), (1, col_pts[-1])):
    bm = bmesh.new()
    ring = [bm.verts.new(p) for p in pts] + [bm.verts.new((p[0], p[1], SEA - 3.0 * S)) for p in reversed(pts)]
    bm.faces.new(ring)
    finish(f'cliffEnd{side}', bm, M['strata'], smooth_sides=False)

# ------------------------------------------------------------------ the flagstone wall along the path, O'Brien's Tower, the sea stack
FLAGS = bmesh.new()
for x in [XS[0] + 3.0 * k for k in range(int((XS[-1] - XS[0]) / 3.0))]:
    y = edge(x) + 9.0
    if math.hypot(x, y) > RMAX - 4.0:
        continue
    bmesh.ops.create_cube(FLAGS, size=1.0, matrix=Matrix.Translation(P(x, y, top(x, y) + 0.6)) @ Matrix.Rotation(math.atan2(edge(x + 1.0) - edge(x - 1.0), 2.0), 4, 'Z') @ Matrix.Diagonal((2.6 * S, 0.25 * S, 1.3 * S, 1)))
finish('flagstoneWall', FLAGS, M['flagstone'], smooth_sides=False)
# the dry-stone walls dividing the fields inland
STONES = []
LINES = [[(x, edge(x) + 48.0 + 6.0 * math.sin(x / 20.0)) for x in range(-150, 151, 2)], [(x, edge(x) + 95.0) for x in range(-150, 151, 2)]]
LINES += [[(x0 + 0.08 * (y - 40.0), y) for y in range(20, 200, 2)] for x0 in (-90.0, -25.0, 45.0, 105.0)]
for line in LINES:
    for x, y in line:
        if y < edge(x) + 30.0 or math.hypot(x, y) > RMAX - 4.0:
            continue
        STONES.append((P(x, y, top(x, y) + 0.5).to_tuple(), 1.0 * S, 0.8))
blob_cloud('fieldWalls', M['flagstone'], STONES, subdivisions=1)
best = max(XS[10:-10], key=lambda x: -edge(x) if -60.0 < x < 40.0 else -1e9)
TX, TY = best + 4.0, edge(best) + 16.0
TZ = top(TX, TY)
cylinder('obriensTower', M['towerStone'], 5.4 * S, 16.0 * S, P(TX, TY, TZ - 0.5), segs=24)     # drawn larger than life, to be seen
for k in range(12):
    a = 2 * math.pi * k / 12
    box(f'towerMerlon{k}', M['towerStone'], P(TX + 5.0 * math.cos(a), TY + 5.0 * math.sin(a), TZ + 16.2), (1.6 * S, 1.0 * S, 2.0 * S), rot_z=a + math.pi / 2, bevel=0)
c = P(TX, TY - 5.45, 0)
glazed('towerDoor', [(c.x, c.y, SEA + TZ * S, 1.8 * S, 3.2 * S, (0, -1), 'round')], M['towerStone'], glass=M['door'], depth=0.25 * S)
sx = 70.0
sy = edge(sx) - 26.0
rings = []
for k in range(9):
    z = -3.0 + (top(sx) - 8.0 + 3.0) * k / 8
    r = 13.0 - 1.6 * math.sin(k * 0.9) - 1.4 * k / 8
    rings.append([P(sx + r * (1.0 + 0.15 * math.sin(3 * a + k)) * math.cos(a), sy + r * 0.8 * math.sin(a), z) for a in [2 * math.pi * j / 14 for j in range(14)]])
loft('seaStack', M['strata'], rings, cap=True, smooth=False)
ztop = top(sx) - 8.0
lathe('seaStackCap', M['clifftopGrass'], [(12.0 * S, 0.0), (10.8 * S, 1.8 * S), (5.0 * S, 3.0 * S), (0.0, 3.3 * S)], P(sx, sy, ztop - 0.2), segs=20, smooth=True, sy=0.8)

# ------------------------------------------------------------------ the surf at the cliffs' foot, visitors along the top
FOAM = []
for x in XS[1:-1]:
    for k in range(2):
        FOAM.append((P(x + rng.uniform(-1.0, 1.0), edge(x) - rng.uniform(1.0, 4.0), 0.1).to_tuple(), rng.uniform(1.4, 2.4) * S, 0.25))
for k in range(12):
    a = 2 * math.pi * k / 12
    FOAM.append((P(sx + 14.0 * math.cos(a), sy + 11.5 * math.sin(a), 0.1).to_tuple(), 2.4 * S, 0.25))
blob_cloud('surf', M['foam'], FOAM, subdivisions=1)
for k, (dx, dy) in enumerate(((-12.0, 4.0), (-4.0, 5.0), (10.0, 5.0), (16.0, 3.0), (-20.0, 6.0))):
    x = TX + dx
    y = edge(x) + dy + 9.0
    c = P(x, y, top(x, y))
    person(f'p{k}', c.x, c.y, rng.random() * 6, ('red', 'blue', 'yellow', 'green')[k % 4], z=c.z, scale=0.9)

Rz = Matrix.Rotation(math.radians(-32.0 + 50.0), 4, 'Z')     # the coast running away from us, headland behind headland
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = Rz @ ob.matrix_world
render('cliffs-of-moher')
