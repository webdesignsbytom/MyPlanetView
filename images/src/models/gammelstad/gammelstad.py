# A cartoon Gammelstad Church Town for the country maps, built in the set's shared look
# (../toon.py): the church town near Luleå in the north of Sweden, where farmers from far away
# stayed overnight for Sunday services: the big white medieval stone church with its steep
# roof, stepped gables and bell tower, and the four hundred little red wooden church
# cottages crowded round it in rows along narrow lanes. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gammelstad.py -- gammelstad-1024.png 1024 gammelstad.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'lane': toon('lane', '#c8bca4', lift=0.15),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'falu': toon('falu', '#a83a2e', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'roof': toon('roof', '#4a4a50'),
    'roofLight': toon('roofLight', '#8a8478'),
    'dark': flat('dark', '#2e2622'),
    'birch': toon('birch', '#7ab450', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#ece8e0'),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the church ----------
CX, CY = 0.0, 0.2
box('church', M['white'], CX, CY, G - 0.005, 0.5, 0.26, 0.24, outline=0.007, bevel=0)
gable('churchroof', M['roof'], CX, CY, G + 0.235, 0.5, 0.26, 0.22, ridge_x=True, over=0.012, outline=0.006)
for s in (-1, 1):
    for k in range(4):
        box(f'stepgable{s}{k}', M['white'], CX + s * 0.25, CY, G + 0.235 + k * 0.05, 0.03, 0.26 - k * 0.065, 0.05, outline=0.002, bevel=0)
for j in range(3):
    arch(f'churchwin{j}', M['dark'], CX - 0.12 + j * 0.12, CY - 0.133, G + 0.08, 0.04, 0.1)
box('porch', M['white'], CX + 0.05, CY - 0.18, G - 0.005, 0.12, 0.1, 0.14, outline=0.004, bevel=0)
gable('porchroof', M['roof'], CX + 0.05, CY - 0.18, G + 0.135, 0.12, 0.1, 0.07)
arch('porchdoor', M['dark'], CX + 0.05, CY - 0.233, G - 0.005, 0.04, 0.08)
# the bell tower
BX, BY = CX - 0.42, CY - 0.05
box('belltower', M['falu'], BX, BY, G - 0.005, 0.1, 0.1, 0.26, outline=0.005, bevel=0)
lathe('belltowerbase', M['roofLight'], ((0.08, 0), (0.06, 0.05)), G + 0.255, BX, BY, segs=8, outline=0.003, smooth=False)
lathe('belltowerspire', M['roof'], ((0.04, 0), (0.0, 0.18)), G + 0.3, BX, BY, segs=8, outline=0.003, smooth=False)

# ---------- the church cottages in rows ----------
for r in range(3):
    y = -0.25 - r * 0.22
    box(f'lane{r}', M['lane'], 0.0, y - 0.1, G - 0.004, 1.8, 0.05, 0.008, outline=0, bevel=0)
    for k in range(9):
        x = -0.85 + k * 0.2 + 0.05 * (r % 2)
        if math.hypot(x, y) > 1.02:
            continue
        box(f'cottage{r}{k}', M['falu'], x, y, G - 0.005, 0.16, 0.12, 0.08, outline=0.004, bevel=0)
        gable(f'cottageroof{r}{k}', M['roof'], x, y, G + 0.075, 0.16, 0.12, 0.06, ridge_x=True, over=0.008)
        box(f'cottagedoor{r}{k}', M['white'], x - 0.04, y - 0.063, G - 0.005, 0.03, 0.006, 0.055, outline=0, bevel=0)
        box(f'cottagewin{r}{k}', M['white'], x + 0.035, y - 0.063, G + 0.025, 0.03, 0.006, 0.03, outline=0, bevel=0)
for side in (-1, 1):
    for k in range(3):
        x, y = side * (0.45 + 0.18 * k), 0.45 + 0.1 * (k % 2)
        if math.hypot(x, y) > 1.0:
            continue
        box(f'backcottage{side}{k}', M['falu'], x, y, G - 0.005, 0.16, 0.12, 0.08, outline=0.004, bevel=0)
        gable(f'backcottageroof{side}{k}', M['roof'], x, y, G + 0.075, 0.16, 0.12, 0.06, ridge_x=True, over=0.008)

for k, (x, y) in enumerate(((-0.3, 0.7), (0.3, 0.72), (0.95, 0.0), (-0.95, 0.05))):
    rod(f'birchtrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.2), 0.012, segs=6, outline=0.002)
    b = ball(f'birch{k}', M['birch'], 0, 0, 0, 0.09, outline=0.007)
    b.scale = (1.0, 1.0, 1.3)
    b.location = (x, y, G + 0.26)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
