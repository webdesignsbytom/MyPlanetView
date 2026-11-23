# A cartoon Sanssouci for the country maps, built in the set's shared look (../toon.py): Frederick
# the Great's summer palace in Potsdam, its long yellow single storey and green copper dome on top
# of the six curving vineyard terraces with their glass niches, the great stairway up the middle,
# and the fountain at the foot. Turned a little towards the camera.
# Run: blender -b --factory-startup -P sanssouci.py -- sanssouci-1024.png 1024 sanssouci.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'terrace': toon('terrace', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'glass': toon('glass', '#7aa8c8', lift=0.3),
    'wallstone': toon('wallstone', '#e0d8c8', lift=0.12),
    'yellow': toon('yellow', '#f0c850', lift=0.2),
    'white': toon('white', '#f6f4ee', lift=0.2),
    'copper': toon('copper', '#5aa890', lift=0.15),
    'window': flat('window', '#3a4a5a'),
    'stair': toon('stair', '#d8d0c0'),
    'water': toon('water', '#5a9ac0', lift=0.3),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the six terraces ----------
N = 6
STEP_Y, STEP_Z = 0.1, 0.06
Y0 = -0.25
for t in range(N):
    y = Y0 + t * STEP_Y
    z = t * STEP_Z
    w = 1.3 - t * 0.04
    box(f'terrace{t}', M['terrace'], 0.0, (y + 0.95) / 2, G - 0.005, w, 0.95 - y, z + STEP_Z, outline=0.006, bevel=0)
    for j in range(12):
        x = -w / 2 + 0.06 + j * (w - 0.12) / 11
        if abs(x) < 0.08:
            continue
        box(f'niche{t}{j}', M['glass'], x, y - 0.001, G + z + 0.01, (w - 0.12) / 11 * 0.7, 0.006, STEP_Z * 0.75, outline=0, bevel=0)
    box(f'terraceedge{t}', M['wallstone'], 0.0, y, G + z + STEP_Z - 0.008, w, 0.012, 0.01, outline=0.002, bevel=0)
for t in range(N):
    box(f'stair{t}', M['stair'], 0.0, Y0 + t * STEP_Y + 0.02, G - 0.005, 0.12, 0.06, t * STEP_Z + STEP_Z + 0.004, outline=0.003, bevel=0)
T = G + N * STEP_Z

# ---------- the palace ----------
PY = Y0 + N * STEP_Y + 0.15
box('palace', M['yellow'], 0.0, PY, T - 0.005, 1.0, 0.18, 0.14, outline=0.01, bevel=0)
for j in range(13):
    x = -0.45 + j * 0.075
    if abs(x) < 0.12:
        continue
    box(f'palacewin{j}', M['window'], x, PY - 0.092, T + 0.02, 0.035, 0.006, 0.09, outline=0, bevel=0)
    box(f'herm{j}', M['white'], x + 0.037, PY - 0.094, T + 0.01, 0.012, 0.006, 0.11, outline=0, bevel=0)
box('palacecornice', M['white'], 0.0, PY, T + 0.13, 1.02, 0.2, 0.02, outline=0.004, bevel=0)
loft('palaceroof', M['copper'], [[(-0.5, PY - 0.1, T + 0.148), (0.5, PY - 0.1, T + 0.148), (0.5, PY + 0.1, T + 0.148), (-0.5, PY + 0.1, T + 0.148)],
                                 [(-0.45, PY - 0.03, T + 0.2), (0.45, PY - 0.03, T + 0.2), (0.45, PY + 0.03, T + 0.2), (-0.45, PY + 0.03, T + 0.2)]], outline=0.006)
lathe('drum', M['yellow'], ((0.11, 0), (0.11, 0.08)), T + 0.13, 0.0, PY - 0.03, segs=20, outline=0.006)
for j in range(5):
    a = math.radians(225 + j * 22)
    box(f'drumwin{j}', M['window'], 0.108 * math.cos(a), PY - 0.03 + 0.108 * math.sin(a), T + 0.15, 0.03, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('dome', M['copper'], ((0.12, 0), (0.11, 0.06), (0.06, 0.12), (0.004, 0.14)), T + 0.21, 0.0, PY - 0.03, segs=22, outline=0.007)
lathe('domecrown', M['yellow'], ((0.025, 0), (0.004, 0.05)), T + 0.345, 0.0, PY - 0.03, segs=8, outline=0.002)

# ---------- the fountain and trees ----------
lathe('fountainbasin', M['wallstone'], ((0.2, 0), (0.2, 0.03)), G - 0.005, 0.0, -0.6, segs=24, outline=0.005)
lathe('fountainwater', M['water'], ((0.18, 0), (0.18, 0.034)), G - 0.005, 0.0, -0.6, segs=24, outline=0.002)
lathe('fountainjet', M['white'], ((0.02, 0), (0.008, 0.18)), G + 0.025, 0.0, -0.6, segs=8, outline=0.002)
for k, (x, y) in enumerate(((-0.9, -0.5), (0.9, -0.5), (-0.55, -0.85), (0.55, -0.85))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.008)

turn(before, -20)
render(G)
