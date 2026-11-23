# A cartoon Everest for the country maps, built in the set's shared look (../toon.py): the dark
# summit pyramid with its snow and the plume of cloud streaming from its top, Lhotse beside it, the
# sharp spire of Ama Dablam in front, and Tengboche monastery on its ridge below with its golden
# finial, prayer flags and rhododendrons. Turned a little towards the camera.
# Run: blender -b --factory-startup -P everest.py -- everest-1024.png 1024 everest.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#8a9a6a', shadow_mul=(0.76, 0.8, 0.74), lift=0.2),
    'rock': toon('rock', '#4e4a50', shadow_mul=(0.84, 0.84, 0.9)),
    'rockLight': toon('rockLight', '#6e6a70', shadow_mul=(0.84, 0.84, 0.9)),
    'snow': toon('snow', '#fbfbfd', shadow_mul=(0.8, 0.86, 0.96), lift=0.15),
    'plume': toon('plume', '#f2f4f8', shadow_mul=(0.86, 0.9, 0.97), lift=0.1),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'roof': toon('roof', '#8a3a2c'),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'window': flat('window', '#3a3640'),
    'rhodo': toon('rhodo', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'bloom': toon('bloom', '#e8402c'),
    'f0': toon('f0', '#2f6fc0'), 'f1': toon('f1', '#f8f6f0'), 'f2': toon('f2', '#d83a2c'), 'f3': toon('f3', '#3f9a4a'), 'f4': toon('f4', '#f0c030'),
    'string': flat('string', '#6a5a4a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1901)


def peak(name, x, y, r, h, snow_from, segs=6):
    lathe(name, M['rock'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.25, h * 0.85), (0.004, h)), G - 0.01, x, y, segs=segs, outline=0.016, smooth=False)
    s0 = h * snow_from
    rs = r * (0.6 + (0.25 - 0.6) * (snow_from - 0.55) / 0.3) if snow_from > 0.55 else r * (1 - 0.4 * snow_from / 0.55)
    lathe(f'{name}snow', M['snow'], ((rs * 1.04, 0), (r * 0.27, h * 0.85 - s0 + 0.004), (0.004, h - s0 + 0.012)), G - 0.01 + s0, x, y, segs=segs, outline=0.01, smooth=False)


peak('everest', -0.15, 0.75, 0.55, 1.0, 0.6)
peak('lhotse', 0.55, 0.7, 0.42, 0.78, 0.6)
peak('nuptse', -0.75, 0.6, 0.38, 0.6, 0.65)
peak('amadablam', 0.65, 0.05, 0.22, 0.62, 0.55, segs=5)
for k, (dx, dz, r) in enumerate(((0.08, 0.0, 0.07), (0.18, 0.03, 0.06), (0.28, 0.05, 0.05))):
    b = ball(f'plume{k}', M['plume'], 0, 0, 0, r, outline=0.01)
    b.scale = (1.8, 1.0, 0.6)
    b.location = (-0.15 + dx, 0.75, G + 0.97 + dz)

# ---------- Tengboche monastery ----------
TX, TY = -0.3, -0.25
box('monastery', M['white'], TX, TY, G - 0.005, 0.32, 0.22, 0.16, outline=0.012, bevel=0)
box('monasterytrim', M['roof'], TX, TY, G + 0.13, 0.33, 0.23, 0.03, outline=0.004, bevel=0)
pyramid('monasteryroof', M['roof'], TX, TY, G + 0.155, 0.3, 0.07, outline=0.008)
lathe('finial', M['gold'], ((0.025, 0), (0.018, 0.03), (0.004, 0.07)), G + 0.22, TX, TY, segs=8, outline=0.003)
for j in range(4):
    box(f'monwin{j}', M['window'], TX - 0.12 + j * 0.08, TY - 0.113, G + 0.06, 0.03, 0.006, 0.04, outline=0, bevel=0)
lathe('stupa', M['white'], ((0.06, 0), (0.06, 0.03), (0.05, 0.07), (0.02, 0.09), (0.02, 0.13), (0.004, 0.18)), G - 0.005, TX + 0.35, TY - 0.15, segs=12, outline=0.006)
p0, p1 = (TX + 0.35, TY - 0.15, G + 0.17), (TX + 0.75, TY - 0.45, G + 0.05)
bar('flagstring', M['string'], p0, p1, 0.004, outline=0)
for j in range(8):
    f = (j + 0.5) / 8
    x, y, z = (p0[i] + (p1[i] - p0[i]) * f for i in range(3))
    box(f'flag{j}', M[f'f{j % 5}'], x, y, z - 0.03, 0.028, 0.006, 0.028, rot_z=math.atan2(p1[1] - p0[1], p1[0] - p0[0]), outline=0.002, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.3), (-0.65, -0.6), (0.1, -0.7), (-1.0, 0.0), (0.4, -0.55))):
    ball(f'rhodo{k}', M['rhodo'], x, y, G + 0.06, 0.08, outline=0.01)
    for j in range(4):
        a = 2 * math.pi * j / 4 + k
        ball(f'bloom{k}{j}', M['bloom'], x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), G + 0.1, 0.016, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
