# A cartoon Leaning Tower of Pisa for the country maps, built in the set's shared look (../toon.py):
# the white marble bell tower leaning on the Field of Miracles, its rings of arcaded galleries and
# the belfry on top, filling its tile, and the cathedral behind it with its striped walls, arcaded
# front and dome. Turned a little towards the camera.
# Run: blender -b --factory-startup -P leaning-tower.py -- leaning-tower-1024.png 1024 leaning-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'marble': toon('marble', '#f6f3ea', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'stripe': toon('stripe', '#a8a49a', shadow_mul=(0.82, 0.82, 0.9)),
    'roof': toon('roof', '#c4573a'),
    'dome': toon('dome', '#9a8a7a', shadow_mul=(0.84, 0.82, 0.86)),
    'window': flat('window', '#3a3640'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the cathedral, behind the tower ----------
CX, CY = -0.4, 0.45
NL, ND, NH = 0.95, 0.36, 0.3
box('nave', M['marble'], CX, CY, G - 0.005, NL, ND, NH, outline=0.014, bevel=0)
for j in range(6):
    box(f'navestripe{j}', M['stripe'], CX, CY - ND / 2 - 0.002, G + 0.04 + j * 0.045, NL, 0.006, 0.012, outline=0, bevel=0)
for j in range(9):
    box(f'navewin{j}', M['window'], CX - NL / 2 + 0.08 + j * (NL - 0.16) / 8, CY - ND / 2 - 0.004, G + 0.12, 0.03, 0.006, 0.07, outline=0, bevel=0)
gable('naveroof', M['roof'], CX, CY, G + NH - 0.005, NL, ND, 0.11, ridge_x=True, over=0.01, outline=0.01)
box('transept', M['marble'], CX + 0.18, CY, G - 0.005, 0.26, 0.7, 0.27, outline=0.01, bevel=0)
gable('transeptroof', M['roof'], CX + 0.18, CY, G + 0.265, 0.26, 0.7, 0.1, over=0.01, outline=0.008)
lathe('domedrum', M['marble'], ((0.12, 0), (0.12, 0.09)), G + 0.36, CX + 0.18, CY, segs=16, outline=0.006)
lathe('dome', M['dome'], ((0.125, 0), (0.1, 0.07), (0.006, 0.13)), G + 0.45, CX + 0.18, CY, segs=16, outline=0.006)
for row in range(3):
    for j in range(5):
        box(f'facadearch{row}{j}', M['window'], CX - NL / 2 - 0.003, CY - 0.13 + j * 0.065, G + 0.05 + row * 0.08, 0.006, 0.035, 0.05, outline=0, bevel=0)

# ---------- the Leaning Tower: built as rings along a tilted axis ----------
TX, TY = 0.2, -0.2
R, H = 0.33, 1.5
LEAN = Matrix.Translation((TX, TY, G - 0.005)) @ Matrix.Rotation(math.radians(6), 4, 'Y')


def up(h):
    return LEAN @ Matrix.Translation((0, 0, h))


cyl('towerbody', M['marble'], R, H, segs=36, outline=0.02, matrix=up(H / 2))
cyl('towerbase', M['marble'], R + 0.02, 0.05, segs=36, outline=0.008, matrix=up(0.025))
STEP = H / 8
for k in range(7):
    cyl(f'gallery{k}', M['marble'], R + 0.032, 0.03, segs=36, outline=0.006, matrix=up(STEP * (k + 1)))
    for j in range(16):
        a = 2 * math.pi * j / 16
        cyl(f'galleryarch{k}{j}', M['window'], 0.026, 0.09, segs=6, outline=0, matrix=up(STEP * (k + 1) - 0.08) @ Matrix.Translation(((R + 0.003) * math.cos(a), (R + 0.003) * math.sin(a), 0)))
for j in range(12):
    a = 2 * math.pi * j / 12
    cyl(f'basearch{j}', M['window'], 0.03, 0.11, segs=6, outline=0, matrix=up(0.1) @ Matrix.Translation(((R + 0.003) * math.cos(a), (R + 0.003) * math.sin(a), 0)))
cyl('belfry', M['marble'], 0.22, 0.17, segs=28, outline=0.012, matrix=up(H + 0.085))
for j in range(10):
    a = 2 * math.pi * j / 10
    cyl(f'belfryarch{j}', M['window'], 0.025, 0.09, segs=6, outline=0, matrix=up(H + 0.085) @ Matrix.Translation((0.222 * math.cos(a), 0.222 * math.sin(a), 0)))
cyl('belfrycap', M['marble'], 0.235, 0.025, segs=28, outline=0.006, matrix=up(H + 0.18))

turn(before, -20)
render(G)
