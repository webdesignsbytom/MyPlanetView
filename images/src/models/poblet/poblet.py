# A cartoon Poblet Monastery for the country maps, built in the set's shared look (../toon.py): the
# great Cistercian abbey in Catalonia, its Royal Gate between two massive polygonal towers with
# battlements, the walls round the monastery, the church's baroque front and long Gothic nave, its
# octagonal bell tower (cimbori) over the crossing, the cloister beside it, and the vineyards and
# wooded hills round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P poblet.py -- poblet-1024.png 1024 poblet.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'stone': toon('stone', '#dcc8a4', shadow_mul=(0.86, 0.82, 0.8), lift=0.12),
    'stoneDark': toon('stoneDark', '#bba684'),
    'roof': toon('roof', '#b8603e'),
    'dark': flat('dark', '#2e2622'),
    'vine': toon('vine', '#5a8a3a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the walls round the monastery ----------
WX0, WX1, WY0, WY1 = -0.7, 0.7, -0.35, 0.75
for k, (x0, y0, x1, y1) in enumerate(((WX0, WY0, -0.14, WY0), (0.14, WY0, WX1, WY0), (WX0, WY0, WX0, WY1), (WX1, WY0, WX1, WY1), (WX0, WY1, WX1, WY1))):
    bar(f'wall{k}', M['stone'], (x0, y0, G + 0.08), (x1, y1, G + 0.08), 0.16, outline=0.005)
    n = int(math.hypot(x1 - x0, y1 - y0) / 0.06)
    for j in range(n):
        t = (j + 0.5) / n
        box(f'wallmerlon{k}{j}', M['stoneDark'], x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, G + 0.16, 0.025, 0.025, 0.03, outline=0.001, bevel=0)

# ---------- the Royal Gate between its two towers ----------
for s in (-1, 1):
    lathe(f'gatetower{s}', M['stone'], ((0.1, 0), (0.1, 0.36)), G - 0.005, s * 0.14, WY0, segs=6, outline=0.006, smooth=False)
    for j in range(6):
        a = 2 * math.pi * j / 6
        box(f'gatetowermerlon{s}{j}', M['stoneDark'], s * 0.14 + 0.085 * math.cos(a), WY0 + 0.085 * math.sin(a), G + 0.355, 0.03, 0.03, 0.035, outline=0.001, bevel=0)
box('gatearch', M['stone'], 0, WY0, G - 0.005, 0.2, 0.12, 0.28, outline=0.006, bevel=0)
box('gatedoor', M['dark'], 0, WY0 - 0.063, G - 0.005, 0.08, 0.006, 0.15, outline=0, bevel=0)
cyl('gatedoortop', M['dark'], 0.04, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0, WY0 - 0.063, G + 0.145)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(4):
    box(f'gatemerlon{j}', M['stoneDark'], -0.075 + j * 0.05, WY0 - 0.05, G + 0.275, 0.025, 0.02, 0.035, outline=0.001, bevel=0)

# ---------- the church: front, nave and the octagonal cimbori ----------
CX, CY = -0.15, 0.28
box('nave', M['stone'], CX, CY + 0.1, G - 0.005, 0.28, 0.6, 0.28, outline=0.008, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.15, CY - 0.2, G + 0.275), (CX + 0.15, CY - 0.2, G + 0.275), (CX + 0.15, CY + 0.4, G + 0.275), (CX - 0.15, CY + 0.4, G + 0.275)],
                             [(CX - 0.004, CY - 0.2, G + 0.36), (CX + 0.004, CY - 0.2, G + 0.36), (CX + 0.004, CY + 0.4, G + 0.36), (CX - 0.004, CY + 0.4, G + 0.36)]], outline=0.005)
box('front', M['stone'], CX, CY - 0.2, G - 0.005, 0.3, 0.05, 0.34, outline=0.006, bevel=0)
box('frontdoor', M['dark'], CX, CY - 0.228, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
cyl('frontrose', M['dark'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((CX, CY - 0.228, G + 0.24)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for s in (-1, 1):
    lathe(f'frontpinnacle{s}', M['stone'], ((0.02, 0), (0.003, 0.08)), G + 0.335, CX + s * 0.13, CY - 0.2, segs=6, outline=0.001, smooth=False)
lathe('cimbori', M['stone'], ((0.09, 0), (0.09, 0.16)), G + 0.31, CX, CY + 0.2, segs=8, outline=0.005, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    box(f'cimboriwin{k}', M['dark'], CX + 0.086 * math.cos(a), CY + 0.2 + 0.086 * math.sin(a), G + 0.35, 0.004, 0.03, 0.08, rot_z=a, outline=0, bevel=0)
lathe('cimboriroof', M['roof'], ((0.095, 0), (0.003, 0.12)), G + 0.465, CX, CY + 0.2, segs=8, outline=0.004, smooth=False)

# ---------- the cloister and the monks' buildings ----------
KX, KY = 0.28, 0.35
for k in range(4):
    a = k * math.pi / 2
    nx, ny = round(math.cos(a)), round(math.sin(a))
    box(f'cloisterwing{k}', M['stone'], KX + nx * 0.17, KY + ny * 0.17, G - 0.005, 0.1 if nx else 0.44, 0.44 if nx else 0.1, 0.14, outline=0.005, bevel=0)
    box(f'cloisterroof{k}', M['roof'], KX + nx * 0.17, KY + ny * 0.17, G + 0.135, 0.12 if nx else 0.46, 0.46 if nx else 0.12, 0.025, outline=0.002, bevel=0)
box('cloistergarth', M['grass'], KX, KY, G - 0.004, 0.24, 0.24, 0.012, outline=0, bevel=0)

# ---------- vineyards and trees outside ----------
for s in (-1, 1):
    for j in range(5):
        y = -0.6 - j * 0.07
        w = 2 * math.sqrt(max(0.0, 1.3 ** 2 - y * y)) * 0.3
        box(f'vinerow{s}{j}', M['vine'], s * 0.65, y, G - 0.003, w, 0.025, 0.03, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.95, 0.2), (0.95, 0.2), (-0.65, 0.95), (0.6, 0.95))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
