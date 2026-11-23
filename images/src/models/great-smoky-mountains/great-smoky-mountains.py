# A cartoon Great Smoky Mountains for the country maps, built in the set's shared look (../toon.py):
# ridge after ridge fading into blue haze, the smoke-like mist in their hollows, autumn trees, a
# log cabin with its stone chimney in a meadow, a split-rail fence, and a black bear. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P great-smoky-mountains.py -- great-smoky-mountains-1024.png 1024 great-smoky-mountains.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'ridge0': toon('ridge0', '#5a8a5a', shadow_mul=(0.76, 0.82, 0.86)),
    'ridge1': toon('ridge1', '#6a90a0', shadow_mul=(0.8, 0.84, 0.9)),
    'ridge2': toon('ridge2', '#88a8c8', shadow_mul=(0.82, 0.86, 0.92), lift=0.1),
    'ridge3': toon('ridge3', '#a8c0dc', shadow_mul=(0.84, 0.88, 0.94), lift=0.15),
    'mist': toon('mist', '#ffffff', shadow_mul=(0.88, 0.9, 0.97), lift=0.1),
    't0': toon('t0', '#e8802c'), 't1': toon('t1', '#d8402c'), 't2': toon('t2', '#f0c030', lift=0.2), 't3': toon('t3', '#4f8a40'),
    'trunk': toon('trunk', '#5a4a40'),
    'log': toon('log', '#8a6040', shadow_mul=(0.86, 0.8, 0.8)),
    'roof': toon('roof', '#6a5a50'),
    'chimney': toon('chimney', '#9a9088'),
    'bear': toon('bear', '#2e2a2a', shadow_mul=(0.84, 0.84, 0.9)),
    'snout': toon('snout', '#8a6a4a'),
    'window': flat('window', '#2e2420'),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(2221)


# ---------- the ridges: rows of rounded hills, bluer and hazier the further back ----------
ROWS = ((0.95, 0.5, 'ridge3', 7, 0.34), (0.68, 0.42, 'ridge2', 8, 0.3), (0.4, 0.32, 'ridge1', 9, 0.26), (0.16, 0.22, 'ridge0', 10, 0.22))
for row, (y, h, mat, n, r) in enumerate(ROWS):
    half = math.sqrt(max(0.0, 1.3 ** 2 - y * y))
    for j in range(n):
        x = -half + (j + 0.5) * 2 * half / n + rng.uniform(-0.04, 0.04)
        hh = h * rng.uniform(0.75, 1.1)
        b = ball(f'hill{row}{j}', M[mat], 0, 0, 0, r, outline=0.01)
        b.scale = (1.25, 0.8, hh / r)
        b.location = (x, y, G - 0.02)
        b.visible_shadow = False
for k, (x, y, z, r) in enumerate(((-0.55, 0.78, 0.3, 0.12), (0.25, 0.8, 0.34, 0.13), (0.8, 0.55, 0.26, 0.11), (-0.15, 0.52, 0.24, 0.11), (-0.85, 0.5, 0.2, 0.1), (0.45, 0.3, 0.18, 0.1))):
    b = ball(f'smoke{k}', M['mist'], 0, 0, 0, r, outline=0.005)
    b.scale = (2.2, 0.9, 0.5)
    b.location = (x, y, G + z)

# ---------- autumn trees ----------
for k in range(18):
    x, y = rng.uniform(-1.15, 1.15), rng.uniform(-0.2, 0.02)
    if math.hypot(x, y) > 1.2:
        continue
    rod(f'treetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.06), 0.01, segs=5, outline=0.002)
    ball(f'tree{k}', M[f't{k % 4}'], x, y, G + 0.11, rng.uniform(0.055, 0.075), outline=0.007)

# ---------- the cabin ----------
CX, CY = -0.25, -0.5
box('cabin', M['log'], CX, CY, G - 0.005, 0.3, 0.2, 0.13, outline=0.008, bevel=0)
for j in range(5):
    box(f'logline{j}', M['trunk'], CX, CY - 0.102, G + 0.015 + j * 0.025, 0.3, 0.006, 0.005, outline=0, bevel=0)
box('cabindoor', M['window'], CX - 0.05, CY - 0.104, G - 0.005, 0.05, 0.006, 0.09, outline=0, bevel=0)
box('cabinwindow', M['window'], CX + 0.07, CY - 0.104, G + 0.05, 0.05, 0.006, 0.04, outline=0, bevel=0)
loft('cabinroof', M['roof'], [[(CX - 0.17, CY - 0.13, G + 0.12), (CX + 0.17, CY - 0.13, G + 0.12), (CX + 0.17, CY + 0.13, G + 0.12), (CX - 0.17, CY + 0.13, G + 0.12)],
                              [(CX - 0.17, CY - 0.004, G + 0.21), (CX + 0.17, CY - 0.004, G + 0.21), (CX + 0.17, CY + 0.004, G + 0.21), (CX - 0.17, CY + 0.004, G + 0.21)]], outline=0.006)
box('chimney', M['chimney'], CX + 0.17, CY + 0.02, G - 0.005, 0.06, 0.06, 0.26, outline=0.005, bevel=0)
for j in range(9):
    x = 0.15 + j * 0.1
    rod(f'fencepost{j}', M['log'], (x, -0.7 + 0.03 * j, G), (x, -0.7 + 0.03 * j, G + 0.07), 0.007, segs=4, outline=0.001)
for z in (0.03, 0.06):
    bar(f'fencerail{z}', M['log'], (0.15, -0.7, G + z), (0.95, -0.46, G + z), 0.008, outline=0.001)

# ---------- the black bear ----------
BX, BY = 0.45, -0.25
for fx in (-0.045, 0.045):
    for s in (-1, 1):
        rod(f'bearleg{fx}{s}', M['bear'], (BX + fx, BY + s * 0.03, G), (BX + fx, BY + s * 0.03, G + 0.06), 0.018, segs=7, outline=0.003)
b = ball('bearbody', M['bear'], 0, 0, 0, 0.065, outline=0.007)
b.scale = (1.4, 0.9, 0.85)
b.location = (BX, BY, G + 0.1)
ball('bearhead', M['bear'], BX - 0.1, BY, G + 0.12, 0.038, outline=0.005)
ball('bearsnout', M['snout'], BX - 0.135, BY, G + 0.11, 0.016, outline=0.002)
for s in (-1, 1):
    ball(f'bearear{s}', M['bear'], BX - 0.095, BY + s * 0.028, G + 0.155, 0.013, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
