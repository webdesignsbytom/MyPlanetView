# A cartoon Yellowstone for the country maps, built in the set's shared look (../toon.py): Old
# Faithful erupting, its tall column of white water and steam over the pale sinter mound and its
# orange and yellow mats, the wooden boardwalk round it with a few watchers, a bison grazing, and
# the dark lodgepole pines behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P old-faithful.py -- old-faithful-1024.png 1024 old-faithful.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#9ab868', shadow_mul=(0.74, 0.8, 0.74), lift=0.2),
    'sinter': toon('sinter', '#ece8e0', shadow_mul=(0.82, 0.84, 0.9), lift=0.12),
    'mat': toon('mat', '#e88a3a', lift=0.2),
    'matYellow': toon('matYellow', '#f0c840', lift=0.25),
    'pool': toon('pool', '#4ab0d0', lift=0.3),
    'steam': toon('steam', '#ffffff', shadow_mul=(0.86, 0.9, 0.97), lift=0.1),
    'board': toon('board', '#9a7050'),
    'pine': toon('pine', '#2f5a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
    'bison': toon('bison', '#4a3428', shadow_mul=(0.86, 0.82, 0.8)),
    'bisonMane': toon('bisonMane', '#6a4a30'),
    'horn': toon('horn', '#e8e0d0'),
    'c0': toon('c0', '#e8402c'), 'c1': toon('c1', '#2f6fc0'), 'c2': toon('c2', '#f0c030', lift=0.25),
    'skin': toon('skin', '#e8b890'),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(2081)

# ---------- the sinter mound and its mats ----------
GX, GY = 0.0, 0.1
lathe('mattOuter', M['mat'], ((0.75, 0), (0.75, 0.008)), G - 0.004, GX, GY, segs=28, outline=0.003)
lathe('matInner', M['matYellow'], ((0.6, 0), (0.6, 0.014)), G - 0.004, GX, GY, segs=28, outline=0.003)
lathe('mound', M['sinter'], ((0.5, 0), (0.35, 0.06), (0.18, 0.1)), G - 0.005, GX, GY, segs=24, outline=0.008)
lathe('vent', M['pool'], ((0.06, 0), (0.06, 0.012)), G + 0.09, GX, GY, segs=14, outline=0.002)

# ---------- the eruption ----------
lathe('jet', M['steam'], ((0.05, 0), (0.07, 0.2), (0.09, 0.45), (0.11, 0.7), (0.004, 0.82)), G + 0.09, GX, GY, segs=14, outline=0.008)
for k, (dx, dz, r) in enumerate(((0.0, 0.85, 0.11), (0.09, 0.78, 0.08), (-0.09, 0.76, 0.08), (0.05, 0.95, 0.09), (-0.06, 0.62, 0.07), (0.08, 0.55, 0.06))):
    ball(f'puff{k}', M['steam'], GX + dx, GY + 0.01 * k, G + dz, r, outline=0.007)
for k in range(6):
    a = 2 * math.pi * k / 6
    ball(f'splash{k}', M['steam'], GX + 0.14 * math.cos(a), GY + 0.14 * math.sin(a), G + 0.12, 0.04, outline=0.004)

# ---------- the boardwalk and the watchers ----------
for k in range(18):
    a0, a1 = math.radians(195 + k * 8.5), math.radians(195 + (k + 1) * 8.5)
    x0, y0, x1, y1 = GX + 0.88 * math.cos(a0), GY + 0.7 * math.sin(a0), GX + 0.88 * math.cos(a1), GY + 0.7 * math.sin(a1)
    box(f'board{k}', M['board'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.02, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.1, 0.015, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.003, bevel=0)
for k, a in enumerate((240, 262, 285, 300)):
    a = math.radians(a)
    x, y = GX + 0.88 * math.cos(a), GY + 0.7 * math.sin(a)
    b = ball(f'person{k}', M[f'c{k % 3}'], 0, 0, 0, 0.022, outline=0.003)
    b.scale = (1.0, 1.0, 1.8)
    b.location = (x, y, G + 0.07)
    ball(f'personhead{k}', M['skin'], x, y, G + 0.12, 0.016, outline=0.002)

# ---------- the bison ----------
BX, BY = 0.85, -0.25
for fx in (-0.05, 0.05):
    for s in (-1, 1):
        rod(f'bisonleg{fx}{s}', M['bison'], (BX + fx, BY + s * 0.03, G), (BX + fx, BY + s * 0.03, G + 0.07), 0.013, segs=6, outline=0.003)
b = ball('bisonbody', M['bison'], 0, 0, 0, 0.065, outline=0.007)
b.scale = (1.4, 0.85, 0.85)
b.location = (BX, BY, G + 0.11)
ball('bisonhump', M['bisonMane'], BX - 0.045, BY, G + 0.15, 0.055, outline=0.006)
ball('bisonhead', M['bison'], BX - 0.11, BY, G + 0.09, 0.035, outline=0.004)
for s in (-1, 1):
    bar(f'bisonhorn{s}', M['horn'], (BX - 0.11, BY + s * 0.025, G + 0.115), (BX - 0.12, BY + s * 0.045, G + 0.14), 0.008, outline=0)

# ---------- the lodgepole pines ----------
for k in range(12):
    x = -1.05 + k * 0.19
    y = 0.95 + rng.uniform(-0.1, 0.15) - 0.25 * (abs(x) > 0.75)
    if math.hypot(x, y) > 1.28:
        continue
    h = rng.uniform(0.32, 0.42)
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.012, segs=6, outline=0.003)
    lathe(f'pine{k}', M['pine'], ((0.07, 0), (0.05, h * 0.4), (0.004, h)), G + 0.06, x, y, segs=8, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
