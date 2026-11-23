# A cartoon Graz Clock Tower for the country maps, built in the set's shared look (../toon.py): the
# Uhrturm on the wooded Schlossberg, its white tower with the wooden gallery and the four great
# clock faces whose big hand tells the hour, under its pointed roof with the little lantern, the
# octagonal bell tower nearby, and the red roofs of the old town at the hill's foot. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P graz-clock-tower.py -- graz-clock-tower-1024.png 1024 graz-clock-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#c8c0b0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'hill': toon('hill', '#5a9a44', shadow_mul=(0.72, 0.8, 0.74)),
    'rock': toon('rock', '#a89c88'),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'stone': toon('stone', '#c8bca0'),
    'wood': toon('wood', '#6a4a30'),
    'slate': toon('slate', '#4a4e56'),
    'black': flat('black', '#1e1e22'),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'roof': toon('roof', '#c4603e'),
    'ochre': toon('ochre', '#ecc888', lift=0.1),
    'window': flat('window', '#3a3a42'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2531)

HX, HY = 0.05, 0.3
hl = lathe('schlossberg', M['hill'], ((0.7, 0), (0.55, 0.14), (0.35, 0.26), (0.24, 0.29)), G - 0.01, HX, HY, segs=28, outline=0.01)
hl.visible_shadow = False
for k in range(22):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.3, 0.62)
    x, y = HX + r * math.cos(a), HY + r * math.sin(a)
    z = G + 0.28 * max(0.0, min(1.0, (0.7 - r) / 0.42))
    if math.hypot(x, y) > 1.05:
        continue
    ball(f'tree{k}', M['tree'], x, y, z + 0.04, rng.uniform(0.05, 0.075), outline=0.006)
T = G + 0.28

# ---------- the clock tower ----------
CX, CY = HX - 0.12, HY - 0.15
box('bastion', M['stone'], CX, CY, T - 0.06, 0.2, 0.2, 0.08, outline=0.005, bevel=0)
box('tower', M['white'], CX, CY, T - 0.005, 0.14, 0.14, 0.24, outline=0.007, bevel=0)
box('gallery', M['wood'], CX, CY, T + 0.235, 0.18, 0.18, 0.05, outline=0.004, bevel=0)
for side in range(4):
    a = -math.pi / 2 + side * math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    cx, cy = CX + nx * 0.073, CY + ny * 0.073
    m = Matrix.Translation((cx, cy, T + 0.15)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X')
    cyl(f'clockrim{side}', M['black'], 0.058, 0.006, segs=24, outline=0, matrix=m)
    m2 = Matrix.Translation((cx + nx * 0.002, cy + ny * 0.002, T + 0.15)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X')
    cyl(f'clockface{side}', M['white'], 0.05, 0.006, segs=24, outline=0, matrix=m2)
    tx, ty = -ny, nx
    bar(f'hourhand{side}', M['gold'], (cx + nx * 0.006, cy + ny * 0.006, T + 0.15), (cx + nx * 0.006 + tx * 0.04, cy + ny * 0.006 + ty * 0.04, T + 0.17), 0.009, outline=0)
    bar(f'minutehand{side}', M['black'], (cx + nx * 0.007, cy + ny * 0.007, T + 0.15), (cx + nx * 0.007, cy + ny * 0.007, T + 0.18), 0.006, outline=0)
pyramid('roof', M['slate'], CX, CY, T + 0.28, 0.2, 0.14, outline=0.004)
lathe('lantern', M['slate'], ((0.02, 0), (0.02, 0.04), (0.004, 0.08)), T + 0.4, CX, CY, segs=8, outline=0.002, smooth=False)
ball('lanternball', M['gold'], CX, CY, T + 0.485, 0.01, outline=0)

# ---------- the bell tower ----------
lathe('belltower', M['white'], ((0.05, 0), (0.05, 0.2)), T - 0.005, HX + 0.15, HY + 0.08, segs=8, outline=0.004, smooth=False)
lathe('belltowercap', M['slate'], ((0.055, 0), (0.035, 0.04), (0.004, 0.09)), T + 0.195, HX + 0.15, HY + 0.08, segs=8, outline=0.003, smooth=False)

# ---------- the old town ----------
for k in range(12):
    x = -0.85 + (k % 6) * 0.3 + rng.uniform(-0.03, 0.03)
    y = -0.72 + (k // 6) * 0.24
    if math.hypot(x, y) > 1.08 or math.hypot(x - HX, y - HY) < 0.72:
        continue
    h = rng.uniform(0.12, 0.18)
    box(f'house{k}', M[('ochre', 'white')[k % 2]], x, y, G - 0.005, 0.22, 0.16, h, outline=0.005, bevel=0)
    for r in range(2):
        box(f'housewin{k}{r}', M['window'], x, y - 0.083, G + 0.04 + r * 0.05, 0.15, 0.006, 0.022, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.11, y - 0.08, G + h - 0.005), (x + 0.11, y - 0.08, G + h - 0.005), (x + 0.11, y + 0.08, G + h - 0.005), (x - 0.11, y + 0.08, G + h - 0.005)],
                                      [(x - 0.11, y - 0.004, G + h + 0.07), (x + 0.11, y - 0.004, G + h + 0.07), (x + 0.11, y + 0.004, G + h + 0.07), (x - 0.11, y + 0.004, G + h + 0.07)]], outline=0.004)

turn(before, -20)
render(G)
