# A cartoon Gamzigrad-Romuliana for the country maps, built in the set's shared look (../toon.py):
# the palace the Roman emperor Galerius built in eastern Serbia where he was born, its massive
# walls of banded stone and brick with their great round and polygonal towers, the gate, the
# temple of Jupiter on its high platform inside, and the green hills round it. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P gamzigrad.py -- gamzigrad-1024.png 1024 gamzigrad.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#d4c4a4', shadow_mul=(0.8, 0.8, 0.86), lift=0.16),
    'brick': toon('brick', '#c07658', lift=0.14),
    'paving': toon('paving', '#ddd0b4', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(904128)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


W, D = 1.2, 0.9
box('inside', M['paving'], 0.0, 0.0, G - 0.004, W, D, 0.008, outline=0.001, bevel=0)
# the walls, banded stone and brick
for k, (x, y, sx, sy) in enumerate(((0.0, -D / 2, W, 0.06), (0.0, D / 2, W, 0.06), (-W / 2, 0.0, 0.06, D), (W / 2, 0.0, 0.06, D))):
    h = 0.14 + 0.03 * rng.random()
    box(f'wall{k}', M['stone'], x, y, G - 0.005, sx, sy, h, outline=0.005, bevel=0)
    for b in range(2):
        box(f'wallband{k}{b}', M['brick'], x, y, G + 0.04 + b * 0.05, sx + 0.004, sy + 0.004, 0.015, outline=0, bevel=0)
# the towers
for k, (x, y) in enumerate(((-W / 2, -D / 2), (W / 2, -D / 2), (W / 2, D / 2), (-W / 2, D / 2), (-0.2, -D / 2), (0.2, -D / 2), (-W / 2, 0.0), (W / 2, 0.0))):
    poly = k >= 4
    h = 0.24 + 0.04 * rng.random()
    lathe(f'tower{k}', M['stone'], ((0.09, 0), (0.09, h)), G - 0.005, x, y, segs=8 if poly else 20, outline=0.005, smooth=False)
    for b in range(2):
        lathe(f'towerband{k}{b}', M['brick'], ((0.093, 0), (0.093, 0.015)), G + 0.05 + b * 0.07, x, y, segs=8 if poly else 20, outline=0, smooth=False)
# the gate between the front towers
arch('gate', M['dark'], 0.0, -D / 2 - 0.032, G - 0.005, 0.1, 0.13)

# ---------- the temple of Jupiter and the palace ruins ----------
TX, TY = 0.15, 0.15
box('podium', M['stone'], TX, TY, G - 0.005, 0.3, 0.38, 0.14, outline=0.005, bevel=0)
for k in range(6):
    box(f'templestep{k}', M['stone'], TX, TY - 0.19 - 0.012 - k * 0.02, G - 0.005, 0.16, 0.02, 0.14 - k * 0.022, outline=0.001, bevel=0)
for k in range(4):
    lathe(f'templecol{k}', M['stone'], ((0.016, 0), (0.016, 0.1 + 0.06 * (k % 2))), G + 0.135, TX - 0.11 + k * 0.073, TY - 0.15, segs=10, outline=0.001, smooth=False)
for k in range(6):
    x, y = -0.45 + 0.4 * rng.random(), -0.3 + 0.6 * rng.random()
    box(f'ruin{k}a', M['stone'], x, y, G - 0.005, 0.14, 0.02, 0.04 + 0.03 * rng.random(), outline=0.001, bevel=0)
    box(f'ruin{k}b', M['brick'], x - 0.07, y + 0.05, G - 0.005, 0.02, 0.1, 0.03 + 0.03 * rng.random(), outline=0.001, bevel=0)

for k in range(10):
    a = 2 * math.pi * k / 10 + 0.2
    x, y = 1.15 * math.cos(a), 1.05 * math.sin(a)
    if abs(x) < 0.5 and y < 0:
        continue
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
