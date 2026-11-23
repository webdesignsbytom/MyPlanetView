# A cartoon Leaning Tower of Pisa for the country maps, built in the set's shared look (../toon.py):
# the white marble bell tower leaning on the Field of Miracles, its rings of arcaded galleries and
# the belfry on top, the cathedral beside it with its striped walls, arcaded front and dome, and
# the lawn round them. Turned a little towards the camera.
# Run: blender -b --factory-startup -P leaning-tower.py -- leaning-tower-1024.png 1024 leaning-tower.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path2', '#e2d8c2', lift=0.25),
    'marble': toon('marble', '#f6f3ea', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'stripe': toon('stripe', '#a8a49a', shadow_mul=(0.82, 0.82, 0.9)),
    'roof': toon('roof', '#c4573a'),
    'dome': toon('dome', '#9a8a7a', shadow_mul=(0.84, 0.82, 0.86)),
    'window': flat('window', '#3a3640'),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

box('path', M['path'], 0.0, -0.5, G - 0.004, 1.8, 0.14, 0.008, outline=0.003, bevel=0)

# ---------- the cathedral ----------
CX, CY = -0.25, 0.35
box('nave', M['marble'], CX, CY, G - 0.005, 0.7, 0.26, 0.2, outline=0.014, bevel=0)
for j in range(5):
    box(f'navestripe{j}', M['stripe'], CX, CY - 0.132, G + 0.03 + j * 0.035, 0.7, 0.006, 0.01, outline=0, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.35, CY - 0.13, G + 0.195), (CX + 0.35, CY - 0.13, G + 0.195), (CX + 0.35, CY + 0.13, G + 0.195), (CX - 0.35, CY + 0.13, G + 0.195)],
                             [(CX - 0.35, CY - 0.005, G + 0.27), (CX + 0.35, CY - 0.005, G + 0.27), (CX + 0.35, CY + 0.005, G + 0.27), (CX - 0.35, CY + 0.005, G + 0.27)]],
     outline=0.01)
box('transept', M['marble'], CX + 0.12, CY, G - 0.005, 0.18, 0.5, 0.18, outline=0.01, bevel=0)
lathe('domedrum', M['marble'], ((0.08, 0), (0.08, 0.06)), G + 0.25, CX + 0.12, CY, segs=12, outline=0.006)
lathe('dome', M['dome'], ((0.085, 0), (0.07, 0.05), (0.004, 0.09)), G + 0.31, CX + 0.12, CY, segs=12, outline=0.006)
box('facade', M['marble'], CX - 0.36, CY, G - 0.005, 0.04, 0.3, 0.3, outline=0.01, bevel=0)
for row in range(4):
    for j in range(5):
        box(f'facadearch{row}{j}', M['window'], CX - 0.382, CY - 0.12 + j * 0.06, G + 0.05 + row * 0.06, 0.006, 0.03, 0.035, outline=0, bevel=0)

# ---------- the Leaning Tower: built as rings along a tilted axis ----------
TX, TY = 0.5, -0.05
LEAN = Matrix.Translation((TX, TY, G - 0.005)) @ Matrix.Rotation(math.radians(7), 4, 'Y')


def up(h):
    return LEAN @ Matrix.Translation((0, 0, h))


cyl('towerbody', M['marble'], 0.165, 0.76, segs=28, outline=0.016, matrix=LEAN)
for k in range(7):
    cyl(f'gallery{k}', M['marble'], 0.182, 0.018, segs=28, outline=0.005, matrix=up(0.095 + k * 0.095))
    for j in range(12):
        a = 2 * math.pi * j / 12
        cyl(f'galleryarch{k}{j}', M['window'], 0.016, 0.047, segs=6, outline=0, matrix=up(0.04 + k * 0.095) @ Matrix.Translation((0.167 * math.cos(a), 0.167 * math.sin(a), 0)))
cyl('belfry', M['marble'], 0.115, 0.1, segs=24, outline=0.01, matrix=up(0.76))
cyl('belfrycap', M['marble'], 0.12, 0.016, segs=24, outline=0.005, matrix=up(0.86))

turn(before, -20)
render(G)
