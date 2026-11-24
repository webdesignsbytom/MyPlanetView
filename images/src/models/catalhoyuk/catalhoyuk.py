# A cartoon Çatalhöyük for the country maps, built in the set's shared look (../toon.py): the
# Neolithic town on the Konya plain of Turkey, nine thousand years old, its mud-brick houses
# packed wall to wall with no streets between, entered through hatches in their flat roofs by
# wooden ladders, the roofs stepping up and down, a bull's horns over one doorway, and the plain
# round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P catalhoyuk.py -- catalhoyuk-1024.png 1024 catalhoyuk.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#c8b688', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'mud': toon('mud', '#c49c6c', shadow_mul=(0.8, 0.74, 0.78), lift=0.12),
    'mudLight': toon('mudLight', '#d6b080', lift=0.15),
    'roof': toon('roof', '#b89060'),
    'wood': toon('wood', '#6a4a30'),
    'horn': toon('horn', '#f0e6cc', lift=0.2),
    'dark': flat('dark', '#2e2420'),
    'shrub': toon('shrub', '#8aa25a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(192522)

# ---------- the houses, wall to wall ----------
N = 5
S = 0.26
heights = {}
for i in range(N):
    for j in range(N):
        x, y = -0.52 + i * S, -0.52 + j * S
        if math.hypot(x, y) > 0.78:
            continue
        h = 0.1 + 0.06 * ((i * 7 + j * 3) % 4) + 0.02 * rng.random() + 0.04 * (j / N)
        heights[(i, j)] = h
        box(f'house{i}{j}', M['mud'] if (i + j) % 2 else M['mudLight'], x, y, G - 0.005, S, S, h, outline=0.005, bevel=0)
        box(f'roof{i}{j}', M['roof'], x, y, G + h - 0.006, S - 0.02, S - 0.02, 0.008, outline=0.001, bevel=0)
        box(f'hatch{i}{j}', M['dark'], x + 0.05, y + 0.03, G + h, 0.05, 0.05, 0.006, outline=0, bevel=0)
        if rng.random() < 0.7:
            for s in (-1, 1):
                bar(f'ladder{i}{j}{s}', M['wood'], (x + 0.05 + s * 0.018, y + 0.03, G + h - 0.04), (x + 0.05 + s * 0.018, y + 0.005, G + h + 0.12), 0.008, outline=0)
            for r in range(4):
                bar(f'rung{i}{j}{r}', M['wood'], (x + 0.032, y + 0.024 - r * 0.005, G + h + 0.01 + r * 0.03), (x + 0.068, y + 0.024 - r * 0.005, G + h + 0.01 + r * 0.03), 0.006, outline=0)
# the bull's horns over a doorway on the front, and a few small windows high in the walls
fx, fy = -0.52 + 2 * S, -0.52
box('frontdoor', M['dark'], fx, fy - S / 2 - 0.003, G + 0.04, 0.05, 0.006, 0.07, outline=0, bevel=0)
cyl('bullhead', M['mudLight'], 0.025, 0.02, segs=10, outline=0.002, matrix=Matrix.Translation((fx, fy - S / 2 - 0.01, G + 0.14)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    rod(f'horn{s}', M['horn'], (fx + s * 0.015, fy - S / 2 - 0.015, G + 0.15), (fx + s * 0.055, fy - S / 2 - 0.02, G + 0.2), 0.009, r2=0.003, segs=8, outline=0.002)
for k in range(5):
    x = -0.52 + k * S
    if (k, 0) in heights:
        box(f'win{k}', M['dark'], x - 0.06, -0.52 - S / 2 - 0.003, G + heights[(k, 0)] - 0.05, 0.03, 0.006, 0.02, outline=0, bevel=0)

for k in range(10):
    a = 2 * math.pi * k / 10 + 0.15
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.045, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (1.05 * math.cos(a), 1.05 * math.sin(a), G + 0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
