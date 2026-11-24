# A cartoon Vlkolínec for the country maps, built in the set's shared look (../toon.py): the hill
# village in central Slovakia, its log houses painted blue, ochre and white along the brook
# that runs down its one street, their steep shingle roofs and small windows, the wooden bell
# tower with its onion of shingles, a well, and the wooded hills round it. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P vlkolinec.py -- vlkolinec-1024.png 1024 vlkolinec.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'blue': toon('blue', '#8cb0d8', lift=0.18),
    'ochre': toon('ochre', '#e0b860', lift=0.18),
    'white': toon('white', '#f2eee4', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'log': toon('log', '#8a6040'),
    'shingle': toon('shingle', '#6e5240'),
    'stone': toon('stone', '#b8b0a0'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#2e2420'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(392365)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the brook down the street ----------
for k in range(10):
    y = -1.0 + k * 0.21
    box(f'brook{k}', M['water'], 0.04 * math.sin(k), y, G - 0.004, 0.06, 0.22, 0.01, rot_z=0.15 * math.cos(k), outline=0.001, bevel=0)

# ---------- the log houses, their gable ends to the street ----------
COLS = (M['blue'], M['ochre'], M['white'], M['blue'], M['white'], M['ochre'])
for k in range(6):
    for s in (-1, 1):
        y = -0.7 + k * 0.26
        x = s * 0.28
        if abs(y) > 0.95 or (s == 1 and k == 3):
            continue
        mat = COLS[(k + (s > 0) * 2) % 6]
        box(f'house{k}{s}', mat, x, y, G - 0.005, 0.24, 0.17, 0.11, outline=0.005, bevel=0)
        for j in range(4):
            box(f'log{k}{s}{j}', M['log'], x - s * 0.121, y, G + 0.01 + j * 0.027, 0.004, 0.17, 0.006, outline=0, bevel=0)
        gable(f'roof{k}{s}', M['shingle'], x, y, G + 0.105, 0.24, 0.17, 0.13, ridge_x=True, over=0.015)
        for j in (-1, 1):
            box(f'win{k}{s}{j}', M['dark'], x - s * 0.123, y + j * 0.04, G + 0.05, 0.006, 0.025, 0.03, outline=0, bevel=0)
        box(f'gableboard{k}{s}', M['log'], x - s * 0.125, y, G + 0.13, 0.006, 0.07, 0.04, outline=0, bevel=0)

# ---------- the bell tower and the well ----------
BX, BY = 0.3, 0.08
box('belltower', M['log'], BX, BY, G - 0.005, 0.12, 0.12, 0.3, outline=0.005, bevel=0)
box('belfry', M['white'], BX, BY, G + 0.295, 0.13, 0.13, 0.06, outline=0.003, bevel=0)
box('belfryopen', M['dark'], BX, BY - 0.066, G + 0.31, 0.06, 0.006, 0.035, outline=0, bevel=0)
lathe('bellroof', M['shingle'], ((0.1, 0), (0.06, 0.05), (0.075, 0.09), (0.04, 0.14), (0.0, 0.2)), G + 0.355, BX, BY, segs=8, outline=0.004, smooth=False)
rod('cross', M['log'], (BX, BY, G + 0.55), (BX, BY, G + 0.6), 0.006, segs=6, outline=0.001)
lathe('well', M['stone'], ((0.05, 0), (0.05, 0.05)), G - 0.005, -0.05, -0.85, segs=12, outline=0.003, smooth=False)
for s in (-1, 1):
    rod(f'wellpost{s}', M['log'], (-0.05 + s * 0.04, -0.85, G + 0.04), (-0.05 + s * 0.04, -0.85, G + 0.15), 0.007, segs=6, outline=0.001)
gable('wellroof', M['shingle'], -0.05, -0.85, G + 0.15, 0.12, 0.1, 0.06, ridge_x=True)

for k in range(12):
    a = 2 * math.pi * k / 12 + 0.1
    x, y = 1.1 * math.cos(a), 1.05 * math.sin(a)
    if abs(x) < 0.5 and y < 0:
        continue
    tree(f'tree{k}', x, y, r=0.09 + 0.03 * rng.random(), h=0.12 + 0.05 * rng.random())

bpy.context.view_layer.update()
turn(before, -20)
render(G)
