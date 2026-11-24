# A cartoon Dessau-Wörlitz Garden Realm for the country maps, built in the set's shared look
# (../toon.py): Prince Franz's landscape gardens on the Elbe in Saxony-Anhalt, Germany: Wörlitz
# Palace, the first neoclassical house in Germany, with its columned portico, on the lake's
# shore, the Gothic House with its pointed windows and battlements, the white arched bridges,
# a boat, and the clumps of old trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P worlitz.py -- worlitz-1024.png 1024 worlitz.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'yellow': toon('yellow', '#f0dca0', shadow_mul=(0.82, 0.8, 0.84), lift=0.2),
    'white': toon('white', '#f6f2ea', lift=0.25),
    'roof': toon('roof', '#6a6a72'),
    'gothic': toon('gothic', '#c8c0b0', lift=0.15),
    'green': toon('green3', '#5a8a6a'),
    'wood': toon('wood', '#6a4a30'),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#3e7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'treeLight': toon('treeLight', '#5a9a44', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


# ---------- the lake ----------
lake = [(-0.95, -0.35), (-0.3, -0.55), (0.4, -0.5), (0.95, -0.2), (0.9, 0.0), (0.3, -0.2), (-0.4, -0.15), (-0.9, -0.1)]
loft('lake', M['water'], [[(x, y, G - 0.004) for x, y in lake], [(x, y, G + 0.008) for x, y in lake]], outline=0.002)

# ---------- Wörlitz Palace ----------
PX, PY = -0.25, 0.3
box('palace', M['yellow'], PX, PY, G - 0.005, 0.56, 0.26, 0.2, outline=0.006, bevel=0)
hip('palaceroof', M['roof'], PX, PY, G + 0.195, 0.56, 0.26, 0.08, over=0.012)
box('belvedere', M['yellow'], PX, PY, G + 0.27, 0.14, 0.1, 0.05, outline=0.003, bevel=0)
box('portico', M['white'], PX, PY - 0.15, G - 0.005, 0.2, 0.06, 0.02, outline=0.002, bevel=0)
for j in range(4):
    lathe(f'col{j}', M['white'], ((0.014, 0), (0.014, 0.17)), G + 0.015, PX - 0.075 + j * 0.05, PY - 0.16, segs=10, outline=0.001)
box('entablature', M['white'], PX, PY - 0.15, G + 0.185, 0.22, 0.06, 0.025, outline=0.002, bevel=0)
gable('pediment', M['white'], PX, PY - 0.15, G + 0.21, 0.22, 0.06, 0.06)
for j in range(8):
    x = PX - 0.25 + j * 0.0714
    if abs(x - PX) < 0.1:
        continue
    box(f'palacewin{j}', M['white'], x, PY - 0.133, G + 0.04, 0.035, 0.006, 0.055, outline=0, bevel=0)
    box(f'palacewinup{j}', M['white'], x, PY - 0.133, G + 0.12, 0.035, 0.006, 0.045, outline=0, bevel=0)

# ---------- the Gothic House ----------
GX, GY = 0.5, 0.4
box('gothic', M['gothic'], GX, GY, G - 0.005, 0.26, 0.16, 0.22, outline=0.005, bevel=0)
for k in range(6):
    box(f'battlement{k}', M['gothic'], GX - 0.11 + k * 0.044, GY - 0.07, G + 0.215, 0.022, 0.02, 0.03, outline=0.001, bevel=0)
for j in range(3):
    loft(f'gothicwin{j}', M['dark'], [[(GX - 0.09 + j * 0.09 - 0.018, GY - 0.083, G + 0.06), (GX - 0.09 + j * 0.09 + 0.018, GY - 0.083, G + 0.06), (GX - 0.09 + j * 0.09 + 0.018, GY - 0.081, G + 0.06), (GX - 0.09 + j * 0.09 - 0.018, GY - 0.081, G + 0.06)],
                                       [(GX - 0.09 + j * 0.09 - 0.018, GY - 0.083, G + 0.14), (GX - 0.09 + j * 0.09 + 0.018, GY - 0.083, G + 0.14), (GX - 0.09 + j * 0.09 + 0.018, GY - 0.081, G + 0.14), (GX - 0.09 + j * 0.09 - 0.018, GY - 0.081, G + 0.14)],
                                       [(GX - 0.09 + j * 0.09 - 0.002, GY - 0.083, G + 0.18), (GX - 0.09 + j * 0.09 + 0.002, GY - 0.083, G + 0.18), (GX - 0.09 + j * 0.09 + 0.002, GY - 0.081, G + 0.18), (GX - 0.09 + j * 0.09 - 0.002, GY - 0.081, G + 0.18)]], outline=0)
box('gothictower', M['gothic'], GX + 0.15, GY + 0.04, G - 0.005, 0.08, 0.08, 0.32, outline=0.004, bevel=0)
lathe('gothicspire', M['green'], ((0.055, 0), (0.0, 0.14)), G + 0.315, GX + 0.15, GY + 0.04, segs=8, outline=0.003, smooth=False)

# ---------- the white bridges and a boat ----------
for k, (x, y, rot) in enumerate(((-0.65, -0.25, 0.25), (0.6, -0.12, -0.35))):
    objs = set(bpy.data.objects)
    for j in range(8):
        um = (j + 0.5) / 8
        z = G + 0.02 + 0.06 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
        box(f'bridge{k}{j}', M['white'], 0, -0.14 + 0.28 * um, z, 0.08, 0.037, 0.022, outline=0.001, bevel=0)
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z') @ o.matrix_world
loft('boat', M['wood'], [[(0.0, -0.36, G + 0.005), (0.15, -0.36, G + 0.005), (0.18, -0.34, G + 0.005), (0.15, -0.32, G + 0.005), (0.0, -0.32, G + 0.005)],
                         [(-0.01, -0.37, G + 0.03), (0.15, -0.37, G + 0.03), (0.2, -0.34, G + 0.035), (0.15, -0.31, G + 0.03), (-0.01, -0.31, G + 0.03)]], outline=0.002)

for k, (x, y) in enumerate(((-0.85, 0.35), (-0.65, 0.75), (0.0, 0.75), (0.9, 0.5), (0.2, 0.25), (-0.5, -0.8), (0.3, -0.85), (0.95, -0.6))):
    tree(f'tree{k}', x, y, r=0.1 + 0.02 * (k % 2), h=0.13, mat='tree' if k % 2 else 'treeLight')

bpy.context.view_layer.update()
turn(before, -20)
render(G)
