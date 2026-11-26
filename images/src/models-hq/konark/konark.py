# The Konark Sun Temple in the high-quality look (hq.py), laid out in metres: the temple built as the Sun
# God's chariot; the great platform carved in bands and lined with its stone wheels, each with its rim,
# hub and spokes; on it the audience hall, its walls rising to the pyramid of stepped roof tiers and the
# ribbed crown on top; the ruined stump of the sanctum behind; the dance hall's platform and pillars in
# front; the lawns and trees round it, and people. (The seven horses are left out: no open scan of them
# was found.)
# Run: blender -b --factory-startup -P konark.py -- konark-1024.png 1024 konark.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1250)
M['khondalite'] = material('khondalite', '#8f6c52', 0.9, vary='#7f5f48', vary_scale=24, bump=0.4, bump_scale=200)
M['carved'] = material('konarkCarving', '#8a6750', 0.9, vary='#6e523f', vary_scale=160, bump=0.7, bump_scale=300)
M['laterite'] = material('laterite', '#a8664a', 0.9, vary='#985a40', vary_scale=24, bump=0.3, bump_scale=200)
M['lawnK'] = material('konarkLawn', '#6aa443', 0.85, vary='#78b14e', vary_scale=12)
M['pathK'] = material('konarkPath', '#cdb894', 0.9, vary='#c1ac88', vary_scale=40)
M['treeK'] = material('konarkTrees', '#3f7a36', 0.85, vary='#4c8a40', vary_scale=14, bump=0.3, bump_scale=90)
M['recessK'] = material('konarkRecess', '#3a2a20', 0.9)

S = 0.027               # metres to the tile's units
Z0 = G + 0.004
PH = 5.0                # the chariot platform's height


def P(x, y, z):
    return Vector((x * S, y * S, Z0 + z * S))


BEFORE = set(bpy.data.objects)
slab('lawn', M['lawnK'], [(-2.0, -2.0), (2.0, -2.0), (2.0, 2.0), (-2.0, 2.0)], Z0 - 0.003, Z0, margin=0.02)
slab('path', M['pathK'], [(-5.0 * S, -60.0 * S), (5.0 * S, -60.0 * S), (5.0 * S, -24.0 * S), (-5.0 * S, -24.0 * S)], Z0, Z0 + 0.12 * S, margin=0.03)

# ------------------------------------------------------------------ the chariot platform: its carved bands, the wheels along its sides
PX, PY0, PY1 = 17.0, -16.0, 30.0
box('platform', M['carved'], P(0.0, (PY0 + PY1) / 2, PH / 2), (2 * PX * S, (PY1 - PY0) * S, PH * S), bevel=0)
for z in (0.6, PH - 0.6):
    box(f'platformBand{z:.0f}', M['khondalite'], P(0.0, (PY0 + PY1) / 2, z), ((2 * PX + 0.6) * S, (PY1 - PY0 + 0.6) * S, 0.8 * S), bevel=0)
for j in range(6):
    box(f'stair{j}', M['khondalite'], P(0.0, PY0 - 1.0 - 1.0 * j, PH - 0.8 * (j + 0.5)), (10.0 * S, 1.0 * S, (PH - 0.8 * j) * S), bevel=0)
# one wheel's parts, made once and stood in every place along the sides
R_W = 2.4
M['wheelStone'] = material('wheelStone', '#a8876a', 0.85, vary='#97785e', vary_scale=24, bump=0.3, bump_scale=200)
rim = lathe('wheelRimSrc', M['wheelStone'], [(R_W * S, -0.25 * S), (R_W * S, 0.25 * S), ((R_W - 0.35) * S, 0.25 * S), ((R_W - 0.35) * S, -0.25 * S)], (0, 0, 0), segs=32,
            matrix=Matrix.Rotation(math.pi / 2, 4, 'Y'))
hub = cylinder('wheelHubSrc', M['wheelStone'], 0.45 * S, 0.7 * S, (0, 0, 0), segs=16, matrix=Matrix.Rotation(math.pi / 2, 4, 'Y') @ Matrix.Translation((0, 0, -0.35 * S)))
spokes = []
for k in range(8):
    a = 2 * math.pi * k / 8
    spokes.append(bar(f'wheelSpokeSrc{k}', M['wheelStone'], Vector((0.0, 0.4 * S * math.cos(a), 0.4 * S * math.sin(a))), Vector((0.0, (R_W - 0.3) * S * math.cos(a), (R_W - 0.3) * S * math.sin(a))), 0.18 * S))
PARTS = [o.data for o in [rim, hub] + spokes]
for o in [rim, hub] + spokes:
    bpy.data.objects.remove(o, do_unlink=True)
n = 0
for s in (-1, 1):
    for k in range(12):
        y = PY0 + 2.5 + (PY1 - PY0 - 5.0) * k / 11
        for d in PARTS:
            ob = bpy.data.objects.new(f'wheel{n}', d)
            bpy.context.scene.collection.objects.link(ob)
            ob.matrix_world = Matrix.Translation(P(s * (PX + 0.3), y, R_W + 0.05))
            n += 1

# ------------------------------------------------------------------ the audience hall: walls, the stepped pyramid roof, its crown
HX = 13.0
HY = 4.0
box('hall', M['khondalite'], P(0.0, HY, PH + 7.0), (2 * HX * S, 2 * HX * S, 14.0 * S), bevel=0)
box('hallFrieze', M['carved'], P(0.0, HY, PH + 11.5), ((2 * HX + 0.4) * S, (2 * HX + 0.4) * S, 3.0 * S), bevel=0)
WIN = []
for nx, ny in ((0, -1), (1, 0), (-1, 0)):
    c = P(nx * (HX + 0.05), HY + ny * (HX + 0.05), 0)
    WIN.append((c.x, c.y, Z0 + PH * S, 3.6 * S, 7.0 * S, (nx, ny), 'rect'))
z = PH + 14.0
for tier in range(3):
    for k in range(5):
        w = 2 * HX + 2.0 - tier * 6.4 - k * 1.2
        box(f'pidha{tier}{k}', M['khondalite'], P(0.0, HY, z + 0.6), (w * S, w * S, 1.2 * S), bevel=0)
        box(f'pidhaCore{tier}{k}', M['carved'], P(0.0, HY, z + 1.5), ((w - 1.6) * S, (w - 1.6) * S, 0.6 * S), bevel=0)
        z += 1.8
    z += 1.0
lathe('amalaka', M['khondalite'], [(3.2 * S, 0.0), (3.8 * S, 0.8 * S), (3.8 * S, 1.6 * S), (3.0 * S, 2.4 * S), (1.2 * S, 2.8 * S)], P(0.0, HY, z), segs=24)
lathe('kalasa', M['khondalite'], [(1.2 * S, 0.0), (1.6 * S, 1.0 * S), (0.8 * S, 2.2 * S), (0.5 * S, 3.0 * S), (0.0, 3.6 * S)], P(0.0, HY, z + 2.8), segs=16, smooth=True)
glazed('doors', WIN, M['khondalite'], glass=M['recessK'], depth=0.4 * S, bars=False)

# ------------------------------------------------------------------ the ruined sanctum behind, the dance hall in front, trees, people
box('sanctum', M['khondalite'], P(0.0, 24.0, PH + 5.0), (16.0 * S, 12.0 * S, 10.0 * S), bevel=0)
RUBBLE = [(P(rng.uniform(-8.0, 8.0), rng.uniform(20.0, 30.0), PH + 10.0 + rng.uniform(0.0, 1.5)).to_tuple(), rng.uniform(0.8, 1.8) * S, 0.6) for _ in range(20)]
blob_cloud('rubble', M['khondalite'], RUBBLE)
box('danceHallBase', M['laterite'], P(0.0, -36.0, 2.0), (18.0 * S, 18.0 * S, 4.0 * S), bevel=0)
for i in range(4):
    for j in range(4):
        x, y = -6.0 + 4.0 * i, -42.0 + 4.0 * j
        box(f'danceCol{i}{j}', M['carved'], P(x, y, 4.0 + 3.0), (1.0 * S, 1.0 * S, 6.0 * S), bevel=0)
TREES = []
for k, (x, y) in enumerate(((-34.0, -20.0), (-36.0, 8.0), (-30.0, 30.0), (34.0, -22.0), (36.0, 6.0), (30.0, 32.0), (-20.0, -48.0), (22.0, -46.0))):
    if math.hypot(x, y) * S > 1.3:
        continue
    tube(f'trunk{k}', M['trunk'], [P(x, y, 0.0), P(x, y, 3.0)], 0.4 * S)
    TREES += [(P(x + rng.uniform(-1.5, 1.5), y + rng.uniform(-1.5, 1.5), 5.2 + rng.uniform(-0.5, 0.8)).to_tuple(), rng.uniform(2.0, 3.0) * S, 0.85) for _ in range(5)]
blob_cloud('trees', M['treeK'], TREES)
for k, (x, y, z, shirt) in enumerate(((-2.0, -52.0, 0.1, 'red'), (3.0, -54.0, 0.1, 'blue'), (-8.0, -20.0, 0.0, 'yellow'), (8.0, -14.0, PH, 'green'))):
    c = P(x, y, z)
    person(f'p{k}', c.x, c.y, rng.random() * 6, shirt, z=c.z, scale=0.9)

R = Matrix.Rotation(math.radians(-32.0 + 44.0), 4, 'Z')
for ob in set(bpy.data.objects) - BEFORE:
    ob.matrix_world = R @ ob.matrix_world
render('konark')
