# A cartoon San Gimignano for the country maps, built in the set's shared look (../toon.py): the
# Tuscan hill town of towers, its tall square stone towers of the old rival families standing over
# the red roofs inside the town walls, the cypresses and vineyards on the slopes round it. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P san-gimignano.py -- san-gimignano-1024.png 1024 san-gimignano.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'fields': toon('fields', '#a8b860', shadow_mul=(0.76, 0.8, 0.72), lift=0.2),
    'hill': toon('hill', '#8aa850', shadow_mul=(0.74, 0.8, 0.72)),
    'vine': toon('vine', '#5a8a3a'),
    'stone': toon('stone', '#d8c4a0', shadow_mul=(0.86, 0.82, 0.78), lift=0.1),
    'stoneDark': toon('stoneDark', '#b8a07c', shadow_mul=(0.86, 0.82, 0.78)),
    'roof': toon('roof', '#c4603e'),
    'window': flat('window', '#3a2e28'),
    'cypress': toon('cypress', '#3f6a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['fields'])
before = set(bpy.data.objects)
rng = random.Random(2293)

hl = lathe('hill', M['hill'], ((1.0, 0), (0.82, 0.1), (0.62, 0.17)), G - 0.01, 0.0, 0.1, segs=28, outline=0.01)
hl.visible_shadow = False
for j in range(7):
    a = math.radians(205 + j * 18)
    for k in range(3):
        r = 0.78 + k * 0.06
        bar(f'vinerow{j}{k}', M['vine'], (r * math.cos(a - 0.06), 0.1 + r * math.sin(a - 0.06), G + 0.15 - k * 0.04), (r * math.cos(a + 0.06), 0.1 + r * math.sin(a + 0.06), G + 0.15 - k * 0.04), 0.014, outline=0)
T = G + 0.165

# ---------- the walls ----------
for k in range(16):
    a0, a1 = 2 * math.pi * k / 16, 2 * math.pi * (k + 1) / 16
    x0, y0 = 0.6 * math.cos(a0), 0.1 + 0.6 * math.sin(a0)
    x1, y1 = 0.6 * math.cos(a1), 0.1 + 0.6 * math.sin(a1)
    box(f'townwall{k}', M['stoneDark'], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.02, math.hypot(x1 - x0, y1 - y0) + 0.01, 0.04, 0.08, rot_z=math.atan2(y1 - y0, x1 - x0), outline=0.004, bevel=0)

# ---------- the houses ----------
for k in range(20):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.1, 0.5)
    x, y = r * math.cos(a), 0.1 + r * math.sin(a)
    h = rng.uniform(0.06, 0.1)
    box(f'house{k}', M['stone'], x, y, T - 0.005, 0.11, 0.1, h, rot_z=a, outline=0.004, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, T + h - 0.005, 0.12, 0.04, outline=0.003)

# ---------- the towers ----------
TOWERS = ((-0.25, 0.25, 0.62), (-0.1, 0.35, 0.72), (0.05, 0.2, 0.55), (0.2, 0.32, 0.66), (0.35, 0.15, 0.48), (-0.35, 0.0, 0.45), (0.1, -0.05, 0.4), (-0.05, 0.5, 0.5), (0.3, 0.45, 0.42))
for k, (x, y, h) in enumerate(TOWERS):
    w = 0.07 + 0.01 * (k % 3)
    box(f'tower{k}', M['stone' if k % 2 == 0 else 'stoneDark'], x, y, T - 0.005, w, w, h, outline=0.006, bevel=0)
    for j in range(int(h / 0.12)):
        box(f'towerslit{k}{j}', M['window'], x, y - w / 2 - 0.003, T + 0.08 + j * 0.12, 0.015, 0.006, 0.035, outline=0, bevel=0)

for k in range(10):
    a = math.radians(200 + k * 15)
    r = 0.9
    x, y = r * math.cos(a), 0.1 + r * math.sin(a)
    if math.hypot(x, y) > 1.2:
        continue
    lathe(f'cypress{k}', M['cypress'], ((0.03, 0), (0.04, 0.06), (0.025, 0.16), (0.004, 0.22)), G + 0.05, x, y, segs=8, outline=0.004)

turn(before, -20)
render(G)
