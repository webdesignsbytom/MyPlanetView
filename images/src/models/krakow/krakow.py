# A cartoon Kraków for the country maps, built in the set's shared look (../toon.py): the Main
# Market Square, St Mary's Basilica in red brick with its two unequal towers, the taller crowned
# with its spired helmet and gilded crown, the long Renaissance Cloth Hall with its arcades and
# carved attic, the Town Hall tower, horse-drawn carriages, and flower stalls. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P krakow.py -- krakow-1024.png 1024 krakow.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'square': toon('square', '#c8bca4', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'brick': toon('brick', '#a8503a', shadow_mul=(0.86, 0.76, 0.72)),
    'copper': toon('copper', '#4f9a80', shadow_mul=(0.78, 0.86, 0.84), lift=0.15),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'cream': toon('cream', '#f0e2c0', shadow_mul=(0.86, 0.82, 0.8), lift=0.15),
    'roof': toon('roof', '#b8503a'),
    'window': flat('window', '#3a3640'),
    'horse': toon('horse', '#f2ede4', lift=0.2),
    'carriage': toon('carriage', '#2e2a30'),
    'f0': toon('f0', '#e8402c'), 'f1': toon('f1', '#f0c030'), 'f2': toon('f2', '#e86a9a'),
})

G = tile(M['square'])
before = set(bpy.data.objects)
rng = random.Random(1951)

# ---------- St Mary's Basilica ----------
BX, BY = -0.55, 0.35
box('nave', M['brick'], BX + 0.05, BY + 0.15, G - 0.005, 0.24, 0.5, 0.24, outline=0.012, bevel=0)
loft('naveroof', M['roof'], [[(BX - 0.07, BY - 0.1, G + 0.235), (BX + 0.17, BY - 0.1, G + 0.235), (BX + 0.17, BY + 0.4, G + 0.235), (BX - 0.07, BY + 0.4, G + 0.235)],
                             [(BX + 0.046, BY - 0.1, G + 0.33), (BX + 0.054, BY - 0.1, G + 0.33), (BX + 0.054, BY + 0.4, G + 0.33), (BX + 0.046, BY + 0.4, G + 0.33)]],
     outline=0.01)
box('towertall', M['brick'], BX - 0.05, BY - 0.12, G - 0.005, 0.11, 0.11, 0.56, outline=0.012, bevel=0)
lathe('helmet', M['copper'], ((0.06, 0), (0.05, 0.05), (0.02, 0.12), (0.004, 0.22)), G + 0.555, BX - 0.05, BY - 0.12, segs=8, outline=0.007, smooth=False)
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2
    lathe(f'turret{k}', M['copper'], ((0.016, 0), (0.004, 0.08)), G + 0.555, BX - 0.05 + 0.055 * math.cos(a), BY - 0.12 + 0.055 * math.sin(a), segs=6, outline=0.002, smooth=False)
ball('crown', M['gold'], BX - 0.05, BY - 0.12, G + 0.78, 0.016, outline=0.003)
box('towershort', M['brick'], BX + 0.15, BY - 0.12, G - 0.005, 0.1, 0.1, 0.44, outline=0.012, bevel=0)
lathe('towershortcap', M['copper'], ((0.055, 0), (0.04, 0.04), (0.02, 0.08), (0.004, 0.12)), G + 0.435, BX + 0.15, BY - 0.12, segs=10, outline=0.006)
for k in range(3):
    box(f'towerwin{k}', M['window'], BX - 0.05, BY - 0.177, G + 0.15 + k * 0.12, 0.025, 0.006, 0.06, outline=0, bevel=0)
box('portal', M['window'], BX + 0.05, BY - 0.103, G, 0.05, 0.006, 0.1, outline=0, bevel=0)

# ---------- the Cloth Hall ----------
CX, CY = 0.3, 0.15
box('clothhall', M['cream'], CX, CY, G - 0.005, 0.8, 0.26, 0.18, outline=0.012, bevel=0)
for j in range(10):
    x = CX - 0.36 + j * 0.08
    box(f'arcade{j}', M['window'], x, CY - 0.133, G, 0.045, 0.006, 0.08, outline=0, bevel=0)
box('clothhallroof', M['roof'], CX, CY, G + 0.175, 0.76, 0.22, 0.04, outline=0.006, bevel=0)
for j in range(16):
    x = CX - 0.38 + j * 0.05
    box(f'attic{j}', M['cream'], x, CY - 0.125, G + 0.17, 0.03, 0.02, 0.06 if j % 2 else 0.04, outline=0.002, bevel=0)

# ---------- the Town Hall tower ----------
TX, TY = 0.7, -0.35
box('townhalltower', M['brick'], TX, TY, G - 0.005, 0.1, 0.1, 0.4, outline=0.01, bevel=0)
lathe('townhallcap', M['copper'], ((0.055, 0), (0.04, 0.05), (0.02, 0.08), (0.03, 0.1), (0.004, 0.18)), G + 0.395, TX, TY, segs=8, outline=0.006)

# ---------- carriages and flower stalls ----------
for k, (x, y) in enumerate(((-0.25, -0.35), (0.15, -0.55))):
    box(f'carriage{k}', M['carriage'], x, y, G + 0.04, 0.12, 0.08, 0.07, outline=0.005, bevel=0)
    for fy in (-0.02, 0.02):
        rod(f'horseleg{k}{fy}', M['horse'], (x + 0.12, y + fy, G), (x + 0.12, y + fy, G + 0.06), 0.008, segs=5, outline=0.002)
    b = ball(f'horse{k}', M['horse'], 0, 0, 0, 0.03, outline=0.004)
    b.scale = (1.6, 0.8, 0.8)
    b.location = (x + 0.12, y, G + 0.075)
    ball(f'horsehead{k}', M['horse'], x + 0.18, y, G + 0.1, 0.016, outline=0.003)
for k in range(4):
    x = -0.75 + k * 0.15
    box(f'stall{k}', M['cream'], x, -0.65, G - 0.005, 0.1, 0.08, 0.05, outline=0.004, bevel=0)
    for j in range(3):
        ball(f'flower{k}{j}', M[f'f{j}'], x - 0.03 + j * 0.03, -0.65, G + 0.06, 0.014, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
