# Pamukkale in the high-quality look (hq.py), laid out in metres: the white travertine terraces
# stepping down the hillside, row on row of scalloped basins, each with its raised white lip holding
# a pool of turquoise water, the calcite dripping in white streaks down each step; above them on the
# plateau the ruins of Hierapolis, a colonnade with its architrave and fallen column drums among pines
# and grass; the grass at the foot, and people wading in the pools.
# Run: blender -b --factory-startup -P pamukkale.py -- pamukkale-1024.png 1024 pamukkale.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1988)
M['calcite'] = layered('calcite', ['#f6f5f0', '#e6e5de', '#f9f8f4', '#ecebe4'], scale=40.0, distortion=4.0, rough=0.55, bump=0.25, bump_scale=160, axis='X')
M['calciteTop'] = material('calciteTop', '#f4f3ee', 0.5, vary='#e8e7e0', vary_scale=20, bump=0.15, bump_scale=200)
M['pool'] = material('pamukkalePool', '#22a8bd', 0.08, vary='#3ab6c8', vary_scale=4, coat=0.4)
M['meadowP'] = material('pamukkaleMeadow', '#7fae4a', 0.85, vary='#8bba53', vary_scale=10, bump=0.3, bump_scale=200)
M['ruin'] = material('hierapolisMarble', '#e2d9c6', 0.6, vary='#d3c8b2', vary_scale=14, bump=0.1, bump_scale=160)
M['pineP'] = material('pamukkalePine', '#3d6b37', 0.85, vary='#4a7a41', vary_scale=14, bump=0.3, bump_scale=90)

S = 0.0185              # metres to the tile's units
Z0 = G + 0.004
STEP = 3.6              # each terrace's rise
ROWS = 9
Y_FRONT, Y_TOP = -52.0, 26.0     # the first terrace's front, the plateau's edge


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


BEFORE = set(bpy.data.objects)
slab('foot', M['meadowP'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)


def scalloped_front(y0, k, width=90.0):
    """The front edge of a terrace row: a run of rounded lobes bulging towards the viewer."""
    pts = []
    lobe = 11.0 + 3.0 * ((k * 7) % 3)
    x = -width
    phase = (k * 4.3) % lobe
    x -= phase
    while x < width:
        w = lobe * (0.8 + 0.4 * rng.random())
        depth = 3.0 + 2.0 * rng.random()
        for j in range(9):
            t = j / 8
            xx = x + w * t
            pts.append((xx, y0 + 5.0 * math.sin(xx / 21.0 + k * 1.3) - depth * math.sin(math.pi * t)))
        x += w
    return pts, lobe


# ------------------------------------------------------------------ the terraces: each row a white prism with a scalloped front, its pools and lips
LIPS = []
POOLS = []
depth_row = (Y_TOP - Y_FRONT) / ROWS
for k in range(ROWS):
    y0 = Y_FRONT + depth_row * k
    z = STEP * (k + 1)
    front, lobe = scalloped_front(y0, k)
    poly = [(x * S, y * S) for x, y in front] + [(100.0 * S, 90.0 * S), (-100.0 * S, 90.0 * S)]
    row = slab(f'terrace{k}', M['calcite'], poly, Z0 - 0.003, Z0 + z * S, margin=0.02)
    if row is not None:
        row.data.materials.append(M['calciteTop'])
        for poly_ in row.data.polygons:
            if poly_.normal.z > 0.9:
                poly_.material_index = 1
    # the pool behind each lobe's lip: the row's tread, a little inside its front, under the next row
    if k < ROWS - 1:
        # the pools, lobe by lobe, a few of them dry
        for j in range(0, len(front) - 8, 9):
            if rng.random() < 0.22:
                continue
            lobe_pts = front[j:j + 9]
            poly_ = [(x * S, (y + 1.2) * S) for x, y in lobe_pts] + [(lobe_pts[-1][0] * S, (y0 + depth_row + 5.0 * math.sin(lobe_pts[-1][0] / 21.0 + (k + 1) * 1.3) - 1.0) * S), (lobe_pts[0][0] * S, (y0 + depth_row + 5.0 * math.sin(lobe_pts[0][0] / 21.0 + (k + 1) * 1.3) - 1.0) * S)]
            POOLS.append(slab(f'pool{k}_{j}', M['pool'], poly_, Z0 + (z - 0.05) * S, Z0 + (z + 0.35) * S, margin=0.05))
    # the raised white lip along the front, where it stays on the base
    seg = []
    for x, y in front:
        if math.hypot(x * S, y * S) < 1.42:
            seg.append(P(x, y + 0.6, z + 0.25))
        elif len(seg) > 1:
            LIPS.append(seg)
            seg = []
        else:
            seg = []
    if len(seg) > 1:
        LIPS.append(seg)
for k, seg in enumerate(LIPS):
    tube(f'lip{k}', M['calciteTop'], seg, 0.45 * S)

# ------------------------------------------------------------------ the plateau above: Hierapolis's colonnade, fallen drums, pines
ZT = STEP * ROWS
slab('plateau', M['meadowP'], [(-2.0, (Y_TOP + 6.0) * S), (2.0, (Y_TOP + 6.0) * S), (2.0, 2.0), (-2.0, 2.0)], Z0 + ZT * S, Z0 + (ZT + 0.2) * S, margin=0.02)
for j in range(7):
    x = -18.0 + 6.0 * j
    y = Y_TOP + 18.0
    h = 12.0 if j not in (2, 5) else rng.uniform(4.0, 6.0)
    cylinder(f'column{j}', M['ruin'], 0.8 * S, h * S, P(x, y, ZT), segs=16, r2=0.7 * S)
    box(f'columnBase{j}', M['ruin'], P(x, y, ZT + 0.4), (2.2 * S, 2.2 * S, 0.8 * S), bevel=0.001)
    if h > 8.0:
        box(f'capital{j}', M['ruin'], P(x, y, ZT + h + 0.4), (2.1 * S, 2.1 * S, 0.8 * S), bevel=0.001)
box('architrave', M['ruin'], P(-12.0, Y_TOP + 18.0, ZT + 13.4), (13.6 * S, 1.8 * S, 1.6 * S), bevel=0.001)
box('architrave2', M['ruin'], P(15.0, Y_TOP + 18.0, ZT + 13.4), (7.6 * S, 1.8 * S, 1.6 * S), bevel=0.001)
for k in range(6):
    x, y = rng.uniform(-30.0, 30.0), Y_TOP + rng.uniform(10.0, 26.0)
    a = rng.uniform(0, math.pi)
    cylinder(f'drum{k}', M['ruin'], 0.55 * S, rng.uniform(1.2, 2.4) * S, (0, 0, 0), segs=14, matrix=Matrix.Translation(P(x, y, ZT + 0.75)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
PINES = []
for k in range(90):
    x, y = rng.uniform(-75.0, 75.0), Y_TOP + rng.uniform(8.0, 60.0)
    if abs(y - (Y_TOP + 18.0)) < 6.0 and abs(x) < 24.0:
        continue
    if math.hypot(x * S, y * S) > 1.36:
        continue
    cylinder(f'pine{k}Trunk', M['trunk'], 0.3 * S, 4.0 * S, P(x, y, ZT), segs=6)
    PINES.append((P(x, y, ZT + 6.0).to_tuple(), rng.uniform(2.6, 3.6) * S, 0.8))
blob_cloud('pines', M['pineP'], PINES)

# ------------------------------------------------------------------ people wading in the pools
for k, (x, y, row, shirt) in enumerate(((-8.0, None, 3, 'red'), (6.0, None, 3, 'blue'), (-20.0, None, 5, 'yellow'), (14.0, None, 6, 'green'), (0.0, None, 1, 'red'), (24.0, None, 4, 'blue'))):
    yy = Y_FRONT + depth_row * row + depth_row * 0.55
    c = P(x, yy, STEP * (row + 1) + 0.1)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.1)

R = Matrix.Rotation(math.radians(-32.0 + 12.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('pamukkale')
