# A cartoon Decorated Farmhouse of Hälsingland for the country maps, built in the set's shared look
# (../toon.py): one of the big timber farmhouses of central Sweden built by rich farmers to
# show their wealth, two storeys of logs painted Falu red with white corners and window
# frames, the ornate carved porch painted in colours, the farmyard's other red buildings
# round it, the birch trees and the fields. Turned a little towards the camera.
# Run: blender -b --factory-startup -P halsingland.py -- halsingland-1024.png 1024 halsingland.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'field': toon('field', '#d8c070', lift=0.2),
    'falu': toon('falu', '#a83a2e', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'white': toon('white', '#f4f0e6', lift=0.22),
    'roof': toon('roof', '#4a4a50'),
    'blue': toon('blue', '#4a7ab0'),
    'green': toon('green2', '#4a9a6a'),
    'yard': toon('yard', '#c8b894', lift=0.15),
    'dark': flat('dark', '#2e2622'),
    'birch': toon('birch', '#7ab450', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#ece8e0'),
})

G = tile()
before = set(bpy.data.objects)

box('yard', M['yard'], 0.0, -0.1, G - 0.004, 0.9, 0.6, 0.008, outline=0.001, bevel=0)
for k in range(3):
    box(f'field{k}', M['field'], -0.6 + k * 0.6, 0.85, G - 0.004, 0.5, 0.28, 0.01, outline=0.001, bevel=0)


def farmhouse(name, x, y, w, d, floors, mat):
    H = 0.11 * floors
    box(name, mat, x, y, G - 0.005, w, d, H, outline=0.005, bevel=0)
    gable(name + 'roof', M['roof'], x, y, G + H - 0.005, w, d, 0.1, ridge_x=True, over=0.015)
    for e in (-1, 1):
        box(f'{name}corner{e}', M['white'], x + e * (w / 2 - 0.008), y - d / 2 - 0.003, G - 0.005, 0.016, 0.006, H, outline=0, bevel=0)
    for f in range(floors):
        for j in range(int(w / 0.08)):
            xx = x - w / 2 + 0.05 + j * (w - 0.1) / max(1, int(w / 0.08) - 1)
            box(f'{name}win{f}{j}', M['white'], xx, y - d / 2 - 0.003, G + 0.03 + f * 0.11, 0.035, 0.006, 0.05, outline=0, bevel=0)
            box(f'{name}glass{f}{j}', M['dark'], xx, y - d / 2 - 0.005, G + 0.035 + f * 0.11, 0.025, 0.004, 0.04, outline=0, bevel=0)


# ---------- the main farmhouse and its porch ----------
farmhouse('main', 0.0, 0.25, 0.56, 0.2, 2, M['falu'])
PX, PY = 0.0, 0.25 - 0.13
box('porch', M['blue'], PX, PY, G - 0.005, 0.12, 0.08, 0.2, outline=0.004, bevel=0)
gable('porchroof', M['green'], PX, PY, G + 0.195, 0.12, 0.08, 0.07, over=0.01)
for s in (-1, 1):
    rod(f'porchcol{s}', M['white'], (PX + s * 0.05, PY - 0.045, G), (PX + s * 0.05, PY - 0.045, G + 0.2), 0.008, segs=8, outline=0.001)
box('porchcarving', M['white'], PX, PY - 0.042, G + 0.15, 0.09, 0.006, 0.03, outline=0, bevel=0)
box('porchdoor', M['dark'], PX, PY - 0.042, G - 0.005, 0.05, 0.006, 0.11, outline=0, bevel=0)

# ---------- the farmyard's other buildings ----------
farmhouse('side1', -0.48, -0.15, 0.2, 0.36, 1, M['falu'])
farmhouse('side2', 0.5, -0.1, 0.26, 0.18, 1, M['falu'])
farmhouse('barn', 0.55, 0.55, 0.3, 0.18, 1, M['falu'])

for k, (x, y) in enumerate(((-0.85, 0.35), (-0.8, -0.6), (0.85, -0.55), (0.0, -0.75), (-0.35, 0.6))):
    rod(f'birchtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.2), 0.012, segs=6, outline=0.002)
    b = ball(f'birch{k}', M['birch'], 0, 0, 0, 0.09, outline=0.007)
    b.scale = (1.0, 1.0, 1.3)
    b.location = (x, y, G + 0.26)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
