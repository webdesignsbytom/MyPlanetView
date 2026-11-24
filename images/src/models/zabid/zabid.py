# A cartoon Zabid for the country maps, built in the set's shared look (../toon.py): the old
# university town on the Tihama plain of Yemen, its whitewashed brick houses with carved
# plaster bands, flat roofs and courtyards, the Great Mosque's white minaret, and the domes of
# the Asha'ir mosque. Turned a little towards the camera.
# Run: blender -b --factory-startup -P zabid.py -- zabid-1024.png 1024 zabid.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e0cc9e', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'plaster': toon('plaster', '#d8ccb4'),
    'brick': toon('brick', '#c49064', lift=0.12),
    'dark': flat('dark', '#2e2622'),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(138986)

# ---------- the Great Mosque's minaret ----------
NX, NY = -0.2, 0.25
box('mosque', M['white'], NX + 0.18, NY + 0.1, G - 0.005, 0.5, 0.36, 0.14, outline=0.006, bevel=0)
for k in range(6):
    arch(f'mosquearch{k}', M['dark'], NX - 0.03 + k * 0.08, NY - 0.083, G - 0.005, 0.045, 0.09)
lathe('minaret', M['white'], ((0.06, 0), (0.06, 0.3), (0.075, 0.31), (0.075, 0.33), (0.05, 0.34), (0.05, 0.48), (0.065, 0.49), (0.065, 0.5), (0.035, 0.51), (0.035, 0.58), (0.0, 0.66)), G - 0.005, NX - 0.1, NY - 0.05, segs=8, outline=0.005, smooth=False)
box('minaretbase', M['white'], NX - 0.1, NY - 0.05, G - 0.005, 0.15, 0.15, 0.16, outline=0.004, bevel=0)
for k in range(3):
    box(f'minaretwin{k}', M['dark'], NX - 0.1, NY - 0.111, G + 0.2 + k * 0.1, 0.018, 0.006, 0.04, outline=0, bevel=0)

# ---------- the Asha'ir mosque's domes ----------
for k in range(3):
    lathe(f'ashairdome{k}', M['white'], [(0.07 * math.cos(a), 0.07 * math.sin(a)) for a in [j * math.pi / 12 for j in range(7)]], G + 0.135, NX + 0.05 + k * 0.13, NY + 0.18, segs=16, outline=0.004)

# ---------- the town's houses ----------
spots = [(-0.75, -0.25), (-0.5, -0.5), (-0.2, -0.55), (0.12, -0.5), (0.42, -0.45), (0.7, -0.2), (0.65, 0.2), (0.55, 0.55), (-0.7, 0.25), (-0.55, 0.6)]
for k, (x, y) in enumerate(spots):
    w, d = 0.2 + 0.06 * rng.random(), 0.2 + 0.05 * rng.random()
    h = 0.13 + 0.12 * rng.random()
    box(f'house{k}', M['white'] if k % 3 else M['brick'], x, y, G - 0.005, w, d, h, outline=0.005, bevel=0)
    box(f'housecornice{k}', M['plaster'], x, y, G + h - 0.02, w + 0.01, d + 0.01, 0.02, outline=0.001, bevel=0)
    box(f'houseparapet{k}', M['white'], x, y - d / 2 + 0.01, G + h, w, 0.02, 0.025, outline=0.001, bevel=0)
    box(f'housedoor{k}', M['dark'], x, y - d / 2 - 0.003, G - 0.005, 0.035, 0.006, 0.07, outline=0, bevel=0)
    for j in (-1, 1):
        box(f'housewin{k}{j}', M['dark'], x + j * w * 0.28, y - d / 2 - 0.003, G + h - 0.07, 0.025, 0.006, 0.03, outline=0, bevel=0)
for k, (x, y) in enumerate(((0.95, -0.25), (0.2, 0.85), (-0.95, -0.55))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + 0.3), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f'frond{k}{j}', M['palm'], (x + 0.03, y, G + 0.3), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), G + 0.25), 0.03, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
