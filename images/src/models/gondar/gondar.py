# A cartoon Gondar for the country maps, built in the set's shared look (../toon.py): Fasilides'
# castle in the Royal Enclosure, its brown basalt walls and battlements, the round corner towers
# under their domes, the tall square tower, the enclosure wall round it, and the trees of the
# compound. Turned a little towards the camera.
# Run: blender -b --factory-startup -P gondar.py -- gondar-1024.png 1024 gondar.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#8a6a52', shadow_mul=(0.86, 0.8, 0.8)),
    'stoneLight': toon('stoneLight', '#a8866a', shadow_mul=(0.86, 0.8, 0.8)),
    'dome': toon('dome', '#9a7a60', shadow_mul=(0.86, 0.8, 0.8)),
    'window': flat('window', '#2e2a28'),
    'trim': toon('trim', '#d8c8a8', lift=0.15),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1489)


def battlements(name, x, y, w, d, z):
    for j in range(int(w / 0.05)):
        box(f'{name}mx{j}', M['stone'], x - w / 2 + 0.025 + j * 0.05, y - d / 2, z, 0.025, 0.03, 0.03, outline=0.003, bevel=0)


# ---------- the castle ----------
CX, CY = 0.0, 0.2
box('keep', M['stone'], CX, CY, G - 0.005, 0.52, 0.32, 0.26, outline=0.014, bevel=0)
battlements('keep', CX, CY, 0.52, 0.32, G + 0.25)
box('band', M['trim'], CX, CY, G + 0.12, 0.525, 0.325, 0.015, outline=0.003, bevel=0)
for row in range(2):
    for j in range(5):
        box(f'win{row}{j}', M['window'], CX - 0.2 + j * 0.1, CY - 0.164, G + 0.05 + row * 0.11, 0.03, 0.006, 0.05, outline=0, bevel=0)
box('door', M['window'], CX, CY - 0.164, G, 0.06, 0.006, 0.09, outline=0, bevel=0)
# the tall square tower
TX, TY = CX + 0.14, CY + 0.05
box('tower', M['stoneLight'], TX, TY, G - 0.005, 0.16, 0.16, 0.46, outline=0.012, bevel=0)
battlements('tower', TX, TY, 0.16, 0.16, G + 0.45)
for j in range(3):
    box(f'towerwin{j}', M['window'], TX, TY - 0.084, G + 0.29 + j * 0.05, 0.025, 0.006, 0.03, outline=0, bevel=0)
# the round domed corner towers
for k, (x, y, h) in enumerate(((CX - 0.27, CY - 0.17, 0.3), (CX + 0.27, CY - 0.17, 0.32), (CX - 0.27, CY + 0.17, 0.28), (CX + 0.27, CY + 0.17, 0.3))):
    lathe(f'round{k}', M['stone'], ((0.075, 0), (0.075, h)), G - 0.005, x, y, segs=16, outline=0.01)
    lathe(f'rounddome{k}', M['dome'], ((0.078, 0), (0.07, 0.04), (0.045, 0.075), (0.004, 0.095)), G - 0.005 + h, x, y, segs=16, outline=0.008)
    box(f'roundwin{k}', M['window'], x, y - 0.074, G + h * 0.6, 0.022, 0.006, 0.04, outline=0, bevel=0)

# ---------- the enclosure wall, trees ----------
for k, (x0, y0, x1, y1) in enumerate(((-1.05, -0.55, 1.05, -0.55), (-1.05, -0.55, -1.0, 0.6), (1.05, -0.55, 1.0, 0.6))):
    L = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'enclosure{k}', M['stoneLight'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, L, 0.05, 0.1, rot_z=a, outline=0.008, bevel=0)
box('gate', M['stone'], 0.0, -0.55, G - 0.005, 0.18, 0.08, 0.16, outline=0.01, bevel=0)
box('gateopen', M['window'], 0.0, -0.594, G, 0.07, 0.006, 0.1, outline=0, bevel=0)
for k, (x, y) in enumerate(((-0.65, -0.2), (0.65, -0.25), (-0.7, 0.5), (0.7, 0.55), (-0.45, -0.4), (0.45, -0.38))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.014, segs=6, outline=0.004)
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, rng.uniform(0.08, 0.1), outline=0.012)

turn(before, -20)
render(G)
