# The Wiener Riesenrad in the high-quality look (hq.py), laid out in metres in the Prater: the giant
# Ferris wheel's two steel rims, each a trussed ring, laced to the hub by their many spokes and tied to
# each other at every cabin; the fifteen red cabins like little railway carriages hanging between the
# rims; the hub on its axle, held by the four lattice legs of its trestles; the entrance pavilion at
# its foot; the Prater's chestnut trees, the paths, and people.
# Run: blender -b --factory-startup -P riesenrad.py -- riesenrad-1024.png 1024 riesenrad.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1897)
M['steelR'] = material('riesenradSteel', '#4a3f3a', 0.45, vary='#40362f', vary_scale=40, metallic=0.6)
M['cabinRed'] = material('cabinRed', '#b8302a', 0.55, vary='#a92a25', vary_scale=40)
M['cabinRoof'] = material('cabinRoof', '#7e231e', 0.6)
M['pavilion'] = material('pavilionWall', '#ece0c2', 0.75, vary='#e2d4b2', vary_scale=24, bump=0.06, bump_scale=200)
M['pavilionRoof'] = banded(material('pavilionRoof', '#a8503a', 0.7, vary='#984733', vary_scale=14), 'Z', 380.0, strength=0.25)
M['chestnut'] = material('chestnut', '#4c7a35', 0.85, vary='#5a8a3f', vary_scale=14, bump=0.3, bump_scale=90)
M['pathR'] = material('praterPath', '#d8c9a8', 0.9, vary='#cdbd9a', vary_scale=60, bump=0.2, bump_scale=400)

S = 0.026               # metres to the tile's units
Z0 = G + 0.004
HUB = 34.2              # the axle's height
RIM = 30.5              # the wheel's radius
HALF = 4.2              # each rim's distance from the wheel's middle plane


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


def wires(name, mat, lines, radius):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = 1
    for pts in lines:
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        for i, q in enumerate(pts):
            sp.points[i].co = (*q, 1)
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def on_wheel(r, a, y):
    """A point on the wheel at radius r, angle a (radians, from the hub), at y across it."""
    return P(r * math.cos(a), y, HUB + r * math.sin(a))


slab('paths', M['pathR'], [(x * S, y * S) for x, y in ((-70.0, -60.0), (70.0, -60.0), (70.0, -8.0), (-70.0, -8.0))], G - 0.002, Z0, margin=0.02)
slab('plaza', M['pathR'], [(x * S, y * S) for x, y in ((-24.0, -8.0), (24.0, -8.0), (24.0, 14.0), (-24.0, 14.0))], G - 0.002, Z0, margin=0.02)
BEFORE = set(bpy.data.objects)

# ------------------------------------------------------------------ the two trussed rims, their spokes, the ties between them, the hub and axle
N = 60
STRUCT, SPOKES = [], []
for y in (-HALF, HALF):
    outer = [on_wheel(RIM, 2 * math.pi * k / N, y) for k in range(N + 1)]
    inner = [on_wheel(RIM - 1.6, 2 * math.pi * k / N, y) for k in range(N + 1)]
    STRUCT += [outer, inner]
    STRUCT.append([outer[k // 2] if k % 2 == 0 else inner[k // 2 + 1] for k in range(2 * N + 1)])
    for k in range(N):
        a = 2 * math.pi * (k + 0.5) / N
        for hy in (-HALF - 1.2, HALF + 1.2):
            if (hy < 0) == (y < 0) or k % 2 == 0:
                SPOKES.append([on_wheel(1.4, a, hy * 0.9), on_wheel(RIM - 1.6, a, y)])
for k in range(15):
    a = 2 * math.pi * k / 15
    STRUCT.append([on_wheel(RIM, a, -HALF), on_wheel(RIM, a, HALF)])
    STRUCT.append([on_wheel(RIM - 1.6, a, -HALF), on_wheel(RIM, a + 2 * math.pi / 30, HALF)])
wires('rims', M['steelR'], STRUCT, 0.22 * S)
wires('spokes', M['steelR'], SPOKES, 0.07 * S)
cylinder('axle', M['steelR'], 1.1 * S, (2 * HALF + 6.0) * S, (0, 0, 0), segs=20, matrix=Matrix.Translation(P(0.0, 0.0, HUB)) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -(HALF + 3.0) * S)))
for y in (-HALF - 1.2, HALF + 1.2):
    cylinder(f'hub{y:+.0f}', M['steelR'], 2.0 * S, 0.8 * S, (0, 0, 0), segs=20, matrix=Matrix.Translation(P(0.0, y, HUB)) @ Matrix.Rotation(math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, -0.4 * S)))

# ------------------------------------------------------------------ the fifteen cabins hanging between the rims
CABWIN = []
for k in range(15):
    a = 2 * math.pi * k / 15 + math.pi / 30
    px, pz = RIM * math.cos(a), HUB + RIM * math.sin(a)
    cz = pz - 2.2
    box(f'cabin{k}', M['cabinRed'], P(px, 0.0, cz), (2.6 * S, 6.0 * S, 2.6 * S), bevel=0.0008)
    gable_roof(f'cabinRoof{k}', M['cabinRoof'], (px - 1.5) * S, (px + 1.5) * S, -3.2 * S, 3.2 * S, Z0 + (cz + 1.28) * S, 0.7 * S, over=0.0, along='y')
    for side in (-1, 1):
        for j in range(4):
            c = P(px + side * 1.32, -2.2 + 1.45 * j, 0)
            CABWIN.append((c.x, c.y, Z0 + (cz - 0.2) * S, 1.0 * S, 1.1 * S, (side, 0), 'rect'))
    for u in (-0.6, 0.6):
        c = P(px + u, -3.02, 0)
        CABWIN.append((c.x, c.y, Z0 + (cz - 0.2) * S, 0.9 * S, 1.1 * S, (0, -1), 'rect'))
    wires(f'hanger{k}', M['steelR'], [[P(px, y, cz + 1.3), P(px, y * 0.85, pz)] for y in (-2.6, 2.6)], 0.1 * S)
glazed('cabinWindows', CABWIN, M['white'], depth=0.15 * S, bars=False)

# ------------------------------------------------------------------ the trestles: four lattice legs from the ground to the axle's ends
LEGS = []
for y_end in (-HALF - 2.6, HALF + 2.6):
    for sx in (-1, 1):
        foot = Vector((sx * 17.0, y_end * 2.6, 0.0))
        top = Vector((sx * 0.8, y_end, HUB - 0.5))
        for j in range(4):
            ox, oy = (1, 1, -1, -1)[j], (1, -1, -1, 1)[j]
            LEGS.append([P(*(foot + Vector((ox * 1.2, oy * 1.2, 0.0)))), P(*(top + Vector((ox * 0.5, oy * 0.5, 0.0))))])
        steps = 16
        for i in range(steps):
            t0, t1 = i / steps, (i + 1) / steps
            for j in range(4):
                ox0, oy0 = (1, 1, -1, -1)[j], (1, -1, -1, 1)[j]
                ox1, oy1 = (1, 1, -1, -1)[(j + 1) % 4], (1, -1, -1, 1)[(j + 1) % 4]
                w0, w1 = 1.2 + (0.5 - 1.2) * t0, 1.2 + (0.5 - 1.2) * t1
                a = foot + (top - foot) * t0 + Vector((ox0 * w0, oy0 * w0, 0.0))
                b = foot + (top - foot) * t1 + Vector((ox1 * w1, oy1 * w1, 0.0))
                LEGS.append([P(*a), P(*b)])
    t = 9.0 / (HUB - 0.5)          # a brace between the legs' feet, 9 m up, where they've drawn in
    LEGS.append([P(-(17.0 - 16.2 * t), y_end * (2.6 - 1.6 * t), 9.0), P(17.0 - 16.2 * t, y_end * (2.6 - 1.6 * t), 9.0)])
wires('trestles', M['steelR'], LEGS, 0.16 * S)

# ------------------------------------------------------------------ the entrance pavilion, the chestnut trees, people
PX, PY = -30.0, -17.0            # beside the wheel's foot
box('pavilion', M['pavilion'], P(PX, PY, 3.0), (22.0 * S, 7.0 * S, 6.6 * S), bevel=0.0008)
hip_roof('pavilionRoof', M['pavilionRoof'], PX * S, PY * S, Z0 + 6.25 * S, 23.0 * S, 8.0 * S, 3.2 * S, over=0.0)
WIN = []
for k in range(7):
    c = P(PX - 9.0 + 3.0 * k, PY - 3.55, 0)
    WIN.append((c.x, c.y, Z0 + (0.0 if k == 3 else 1.4) * S, (2.0 if k == 3 else 1.4) * S, (3.2 if k == 3 else 2.4) * S, (0, -1), 'round'))
glazed('pavilionWindows', WIN, M['white'], depth=0.25 * S)
TREES = []
for k, (x, y) in enumerate(((-50.0, -30.0), (-36.0, -36.0), (-50.0, 0.0), (-44.0, 18.0), (-30.0, 30.0), (40.0, -30.0), (50.0, -12.0), (46.0, 10.0), (34.0, 30.0), (-10.0, 40.0), (12.0, 42.0), (-24.0, -44.0), (26.0, -44.0))):
    if math.hypot(x, y) * S > 1.3:
        continue
    cylinder(f'trunk{k}', M['trunk'], 0.4 * S, 4.0 * S, P(x, y, 0.0), segs=8)
    for j in range(5):
        a = 2 * math.pi * j / 5 + k
        TREES.append((P(x + 2.6 * math.cos(a), y + 2.6 * math.sin(a), 7.5 + rng.uniform(-0.6, 0.6)).to_tuple(), 3.2 * S, 0.9))
    TREES.append((P(x, y, 9.4).to_tuple(), 3.4 * S, 0.9))
blob_cloud('chestnuts', M['chestnut'], TREES)
for k, (x, y, shirt) in enumerate(((-6.0, -24.0, 'red'), (4.0, -28.0, 'blue'), (12.0, -22.0, 'yellow'), (-14.0, -30.0, 'green'), (20.0, -36.0, 'red'), (-22.0, -18.0, 'blue'), (8.0, -40.0, 'yellow'))):
    c = P(x, y, 0)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=Z0, scale=0.75)

R = Matrix.Rotation(math.radians(-32.0 + 28.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('riesenrad')
