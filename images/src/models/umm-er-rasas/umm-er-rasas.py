# A cartoon Umm er-Rasas for the country maps, built in the set's shared look (../toon.py): the
# Roman and Byzantine town in the Jordanian desert, its stylite tower standing alone, a tall
# square stone tower with a small room at the top where a hermit lived, and nearby the walled
# ruins of the town with the shelter over the Church of St Stephen's mosaic floor. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P umm-er-rasas.py -- umm-er-rasas-1024.png 1024 umm-er-rasas.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#dcc8a0', shadow_mul=(0.82, 0.8, 0.84), lift=0.18),
    'stone': toon('stone', '#d4bc94', shadow_mul=(0.8, 0.78, 0.84), lift=0.15),
    'stoneDark': toon('stoneDark', '#b09a76'),
    'roof': toon('roof', '#e8e4dc', lift=0.25),
    'iron': toon('iron', '#6a6a6e'),
    'mosaic': toon('mosaic', '#c88a5a', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'shrub': toon('shrub', '#9aa860', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(822842)

# ---------- the stylite tower ----------
TX, TY = -0.45, -0.1
box('towerbase', M['stoneDark'], TX, TY, G - 0.005, 0.18, 0.18, 0.05, outline=0.003, bevel=0)
box('tower', M['stone'], TX, TY, G + 0.04, 0.13, 0.13, 0.62, outline=0.007, bevel=0)
for k in range(5):
    box(f'course{k}', M['stoneDark'], TX, TY, G + 0.12 + k * 0.11, 0.135, 0.135, 0.008, outline=0, bevel=0)
box('towerroom', M['stone'], TX, TY, G + 0.655, 0.15, 0.15, 0.08, outline=0.004, bevel=0)
box('towerwin', M['dark'], TX, TY - 0.077, G + 0.67, 0.03, 0.006, 0.045, outline=0, bevel=0)
box('towerslit', M['dark'], TX, TY - 0.067, G + 0.4, 0.015, 0.006, 0.05, outline=0, bevel=0)
box('chapel', M['stone'], TX + 0.2, TY + 0.05, G - 0.005, 0.18, 0.16, 0.08, outline=0.003, bevel=0)

# ---------- the walled town and the church shelter ----------
WX, WY = 0.35, 0.3
pts = [(-0.4, -0.35), (0.42, -0.3), (0.45, 0.35), (-0.38, 0.38)]
for k in range(4):
    p0, p1 = pts[k], pts[(k + 1) % 4]
    for j in range(4):
        t0, t1 = j / 4, (j + 0.85) / 4
        a = (WX + p0[0] + (p1[0] - p0[0]) * t0, WY + p0[1] + (p1[1] - p0[1]) * t0)
        b = (WX + p0[0] + (p1[0] - p0[0]) * t1, WY + p0[1] + (p1[1] - p0[1]) * t1)
        bar(f'wall{k}{j}', M['stone'], (a[0], a[1], G + 0.025), (b[0], b[1], G + 0.025), 0.05 + 0.02 * rng.random(), outline=0.002)
SX, SY = WX + 0.05, WY - 0.05
box('mosaicfloor', M['mosaic'], SX, SY, G - 0.003, 0.32, 0.24, 0.01, outline=0.001, bevel=0)
for (ex, ey) in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
    rod(f'shelterpost{ex}{ey}', M['iron'], (SX + ex * 0.17, SY + ey * 0.13, G), (SX + ex * 0.17, SY + ey * 0.13, G + 0.2), 0.008, segs=6, outline=0.001)
box('shelterroof', M['roof'], SX, SY, G + 0.2, 0.4, 0.3, 0.02, outline=0.003, bevel=0)
for k in range(8):
    x, y = WX - 0.3 + 0.6 * rng.random(), WY - 0.25 + 0.5 * rng.random()
    if abs(x - SX) < 0.22 and abs(y - SY) < 0.16:
        continue
    box(f'ruin{k}', M['stone'], x, y, G - 0.005, 0.1, 0.02, 0.03 + 0.03 * rng.random(), rot_z=rng.random() * 1.5, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.85, -0.5), (-0.2, -0.8), (0.6, -0.6), (-0.9, 0.4))):
    b = ball(f'shrub{k}', M['shrub'], 0, 0, 0, 0.05, outline=0.004)
    b.scale = (1.2, 1.0, 0.6)
    b.location = (x, y, G + 0.015)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
