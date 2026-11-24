# A cartoon Saint-Savin-sur-Gartempe for the country maps, built in the set's shared look
# (../toon.py): the Romanesque abbey church in Poitou, France, the "Sistine Chapel of Romanesque
# art" for the painted vault of its nave: the long nave under its stone-slab roof, the tall
# porch tower at the west end crowned by a slender Gothic stone spire, the round chapels of the
# east end, the abbey's buildings beside it, and the old bridge over the Gartempe. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P saint-savin.py -- saint-savin-1024.png 1024 saint-savin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#e4d4b0', shadow_mul=(0.8, 0.8, 0.86), lift=0.18),
    'roof': toon('roof', '#9a8a78'),
    'tileRoof': toon('tileRoof', '#b8603e'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)

def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


loft('river', M['water'], [strip(-0.95, -0.65, 1.32, G - 0.004), strip(-0.95, -0.65, 1.32, G + 0.008)], outline=0.002)

# ---------- the church ----------
CX, CY = 0.1, 0.15
box('nave', M['stone'], CX, CY, G - 0.005, 0.64, 0.24, 0.22, outline=0.007, bevel=0)
gable('naveroof', M['roof'], CX, CY, G + 0.215, 0.64, 0.24, 0.1, ridge_x=True, over=0.012)
for s in (-1, 1):
    box(f'aisle{s}', M['stone'], CX, CY + s * 0.15, G - 0.005, 0.6, 0.08, 0.14, outline=0.004, bevel=0)
for j in range(5):
    arch(f'navewin{j}', M['dark'], CX - 0.24 + j * 0.12, CY - 0.193, G + 0.04, 0.035, 0.08)
# the east end's round chapels
lathe('apse', M['stone'], ((0.1, 0), (0.1, 0.18)), G - 0.005, CX + 0.33, CY, segs=20, outline=0.005)
lathe('apseroof', M['roof'], ((0.105, 0), (0.0, 0.07)), G + 0.175, CX + 0.33, CY, segs=20, outline=0.003)
for j, a in enumerate((-0.9, 0.0, 0.9)):
    x, y = CX + 0.33 + 0.12 * math.cos(a), CY + 0.12 * math.sin(a)
    lathe(f'chapel{j}', M['stone'], ((0.045, 0), (0.045, 0.1)), G - 0.005, x, y, segs=12, outline=0.003)
    lathe(f'chapelroof{j}', M['roof'], ((0.05, 0), (0.0, 0.04)), G + 0.095, x, y, segs=12, outline=0.002)
# the west tower and its spire
TX, TY = CX - 0.38, CY
box('tower', M['stone'], TX, TY, G - 0.005, 0.16, 0.16, 0.38, outline=0.006, bevel=0)
arch('porch', M['dark'], TX - 0.083, TY, G - 0.005, 0.06, 0.12, face='x')
arch('towerfront', M['dark'], TX, TY - 0.083, G - 0.005, 0.06, 0.12)
for z in (0.22, 0.31):
    arch(f'towerwin{z}', M['dark'], TX, TY - 0.083, G + z, 0.03, 0.06)
lathe('spirebase', M['stone'], ((0.08, 0), (0.08, 0.03)), G + 0.375, TX, TY, segs=8, outline=0.003, smooth=False)
lathe('spire', M['stone'], ((0.07, 0), (0.0, 0.4)), G + 0.405, TX, TY, segs=8, outline=0.005, smooth=False)
for j in range(4):
    a = j * math.pi / 2 + math.pi / 4
    lathe(f'pinnacle{j}', M['stone'], ((0.015, 0), (0.0, 0.08)), G + 0.405, TX + 0.075 * math.cos(a), TY + 0.075 * math.sin(a), segs=6, outline=0.001, smooth=False)

# ---------- the abbey buildings ----------
box('abbey', M['stone'], CX + 0.05, CY + 0.42, G - 0.005, 0.5, 0.18, 0.18, outline=0.005, bevel=0)
hip('abbeyroof', M['tileRoof'], CX + 0.05, CY + 0.42, G + 0.175, 0.5, 0.18, 0.08, over=0.012)

# ---------- the old bridge ----------
for j in range(10):
    um = (j + 0.5) / 10
    z = G + 0.02 + 0.06 * abs(math.sin(um * 3 * math.pi))
    box(f'bridge{j}', M['stone'], -0.35, -0.98 + 0.36 * um, G - 0.005, 0.1, 0.038, z - G + 0.03, outline=0.001, bevel=0)

for k, (x, y) in enumerate(((0.75, -0.35), (0.85, 0.2), (-0.8, -0.35), (-0.9, 0.3), (0.3, -0.5), (-0.4, 0.75))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
