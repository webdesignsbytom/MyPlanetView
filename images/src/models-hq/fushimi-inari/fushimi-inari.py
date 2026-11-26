# Fushimi Inari Taisha in the high-quality look (hq.py), laid out in metres: the twin paths of the
# Senbon Torii winding up the forested slope of Mount Inari, each a tunnel of vermilion gates set close
# one behind another, black at their feet and on their lintels; the stone steps under them; the shrine's
# vermilion two-storey tower gate at the foot of the hill with its white walls; the cedars and the
# woods all round, and people walking up through the gates.
# Run: blender -b --factory-startup -P fushimi-inari.py -- fushimi-inari-1024.png 1024 fushimi-inari.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(711)
M['vermilionF'] = material('inariVermilion', '#e04a26', 0.5, vary='#d64322', vary_scale=40)
M['blackF'] = material('inariBlack', '#24211f', 0.5)
M['whiteF'] = material('inariWhite', '#f2eee4', 0.6)
M['roofF'] = material('inariRoof', '#5d5550', 0.7, vary='#544d48', vary_scale=60)
M['stepF'] = material('inariStep', '#a59e92', 0.9, vary='#968f83', vary_scale=40)
M['slopeF'] = material('inariSlope', '#58763a', 0.9, vary='#638143', vary_scale=14, bump=0.3, bump_scale=200)
M['cedar'] = material('inariCedar', '#2f5a33', 0.85, vary='#3a683d', vary_scale=14, bump=0.3, bump_scale=90)
M['woodsF'] = material('inariWoods', '#4f8a3a', 0.85, vary='#5c9744', vary_scale=14, bump=0.3, bump_scale=90)
M['plazaF'] = material('inariGravel', '#d8cfbe', 0.9, vary='#cec4b2', vary_scale=60)

S = 0.045               # metres to the tile's units
Z0 = G


def smooth(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def ground(x, y):
    """The hill rising behind the gate's forecourt."""
    return 14.0 * smooth((y + 8.0) / 34.0) + 2.0 * math.sin(x / 7.0) * smooth((y + 4.0) / 20.0)


def H(x, y):
    rim = smooth((1.48 - math.hypot(x, y)) / 0.12)
    return ground(x / S, y / S) * S * rim


land = terrain('hill', H, [M['slopeF']], lambda z, nz, x, y: 0, rings=140, segs=360)
BEFORE = set(bpy.data.objects)


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def spline(pts, step):
    """Points every `step` metres along a smooth path through pts (Catmull-Rom), with their headings."""
    dense = []
    for i in range(len(pts) - 1):
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        for k in range(40):
            t = k / 40
            t2, t3 = t * t, t * t * t
            x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            dense.append((x, y))
    dense.append(pts[-1])
    out, acc = [], 0.0
    for (xa, ya), (xb, yb) in zip(dense, dense[1:]):
        seg = math.hypot(xb - xa, yb - ya)
        while acc <= seg and seg > 0:
            t = acc / seg
            out.append((xa + (xb - xa) * t, ya + (yb - ya) * t, math.atan2(yb - ya, xb - xa)))
            acc += step
        acc -= seg
    return out


# ------------------------------------------------------------------ one torii's parts, to be stood along the paths
GW, GH = 2.2, 3.2       # the gate's width between its posts, its height
parts = []
for s in (-1, 1):
    parts.append(cylinder(f'srcPost{s}', M['vermilionF'], 0.13 * S, GH * S, (s * GW / 2 * S, 0.0, 0.4 * S), segs=8))
    parts.append(cylinder(f'srcFoot{s}', M['blackF'], 0.17 * S, 0.45 * S, (s * GW / 2 * S, 0.0, 0.0), segs=8))
parts.append(box('srcNuki', M['vermilionF'], (0.0, 0.0, (GH - 0.4) * S), ((GW + 0.7) * S, 0.18 * S, 0.22 * S), bevel=0))
parts.append(box('srcKasagi', M['vermilionF'], (0.0, 0.0, (GH + 0.45) * S), ((GW + 1.2) * S, 0.3 * S, 0.3 * S), bevel=0))
parts.append(box('srcKasagiTop', M['blackF'], (0.0, 0.0, (GH + 0.68) * S), ((GW + 1.4) * S, 0.36 * S, 0.16 * S), bevel=0))
SRC = [(o.data, o.name) for o in parts]
for o in parts:
    bpy.data.objects.remove(o, do_unlink=True)


def stand_torii(tag, x, y, heading):
    z = ground(x, y)
    m = Matrix.Translation(P(x, y, z)) @ Matrix.Rotation(heading + math.pi / 2, 4, 'Z')
    for data, name in SRC:
        ob = bpy.data.objects.new(f'{tag}{name}', data)
        bpy.context.scene.collection.objects.link(ob)
        ob.matrix_world = m


PATHS = [[(-3.0, -8.0), (-5.0, 2.0), (-1.0, 10.0), (-6.0, 19.0), (-2.0, 27.0)], [(1.0, -8.0), (1.0, 2.0), (5.0, 10.0), (0.0, 19.0), (4.0, 27.0)]]
n = 0
for j, path in enumerate(PATHS):
    pts = spline(path, 0.75)
    for k, (x, y, h) in enumerate(pts):
        if math.hypot(x, y) * S > 1.3:
            continue
        stand_torii(f't{j}_{k}', x, y, h)
        n += 1
        if k % 2 == 0:
            z = ground(x, y)
            box(f'step{j}_{k}', M['stepF'], P(x, y, z + 0.08), (1.8 * S, 1.6 * S, 0.3 * S), rot_z=h + math.pi / 2, bevel=0)
print('TORII', n)

# ------------------------------------------------------------------ the tower gate at the foot, its forecourt
slab('forecourt', M['plazaF'], [(-12.0 * S, -32.0 * S), (12.0 * S, -32.0 * S), (12.0 * S, -10.0 * S), (-12.0 * S, -10.0 * S)], Z0, Z0 + 0.15 * S, margin=0.02)
RY = -22.0
box('gateBase', M['whiteF'], P(0.0, RY, 0.5), (12.0 * S, 6.0 * S, 1.0 * S), bevel=0)
for x in (-5.0, -1.6, 1.6, 5.0):
    for y in (RY - 2.4, RY + 2.4):
        cylinder(f'gatePost{x:+.0f}{y:+.0f}', M['vermilionF'], 0.32 * S, 5.4 * S, P(x, y, 1.0), segs=12)
for s in (-1, 1):
    box(f'gateWall{s}', M['whiteF'], P(s * 3.3, RY, 3.4), (2.8 * S, 4.6 * S, 4.6 * S), bevel=0)
box('gateBeam', M['vermilionF'], P(0.0, RY, 6.6), (11.4 * S, 5.6 * S, 0.8 * S), bevel=0)
hip_roof('gateRoof1', M['roofF'], 0.0, RY * S, Z0 + 7.0 * S, 15.0 * S, 8.6 * S, 1.8 * S, over=0.0)
box('upperStorey', M['vermilionF'], P(0.0, RY, 9.6), (9.0 * S, 4.6 * S, 2.8 * S), bevel=0)
box('upperWhite', M['whiteF'], P(0.0, RY - 2.32, 9.6), (7.0 * S, 0.1 * S, 1.6 * S), bevel=0)
hip_roof('gateRoof2', M['roofF'], 0.0, RY * S, Z0 + 11.0 * S, 13.6 * S, 8.0 * S, 3.4 * S, over=0.0)
for s in (-1, 1):
    lathe(f'lantern{s}', M['stepF'], [(0.5 * S, 0.0), (0.3 * S, 0.3 * S), (0.3 * S, 1.2 * S), (0.6 * S, 1.4 * S), (0.4 * S, 2.0 * S), (0.7 * S, 2.2 * S), (0.0, 2.8 * S)], P(s * 6.0, RY - 6.0, 0.15), segs=6)

# ------------------------------------------------------------------ the woods: cedars along the paths, the hill's trees, people
CEDARS, WOODS = [], []
NEAR = [(a, b) for path in PATHS for a, b, h in spline(path, 3.0)]
for p in scatter_on(land, 9000, (-1.5, 1.5, -1.5, 1.5), lambda p, m: math.hypot(p.x, p.y) < 1.34, seed=12):
    x, y = p.x / S, p.y / S
    if y < -9.0:
        continue
    if any(math.hypot(x - qx, y - qy) < 2.8 for qx, qy in NEAR):
        continue
    if rng.random() < 0.5 and len(CEDARS) < 120:
        CEDARS.append(((p.x, p.y, p.z + 5.0 * S), rng.uniform(1.2, 1.7) * S, 2.2))
    elif len(WOODS) < 150:
        WOODS.append(((p.x, p.y, p.z + 3.6 * S), rng.uniform(1.8, 2.8) * S, 0.85))
blob_cloud('cedars', M['cedar'], CEDARS)
blob_cloud('woods', M['woodsF'], WOODS)
for k, (x, y, shirt) in enumerate(((-4.4, 3.0, 'blue'), (1.2, 0.0, 'red'), (-1.4, 9.0, 'yellow'), (-2.0, -14.0, 'green'), (3.0, -28.0, 'red'))):
    c = P(x, y, ground(x, y) if y > -10.0 else 0.15)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=1.0)

R = Matrix.Rotation(math.radians(-32.0 + 26.0), 4, 'Z')
for ob in [land] + list(set(bpy.data.objects) - BEFORE):
    ob.matrix_world = R @ ob.matrix_world
render('fushimi-inari')
