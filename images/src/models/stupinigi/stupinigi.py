# A cartoon Palazzina di Caccia of Stupinigi for the country maps, built in the set's shared look
# (../toon.py): the Savoy kings' baroque hunting lodge outside Turin, Italy, one of the
# Residences of the Royal House of Savoy: Juvarra's great oval hall in the middle under its
# stepped dome crowned by the bronze stag, the long wings reaching out from it in a St
# Andrew's cross, the courtyard before it, and the avenue of the park. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P stupinigi.py -- stupinigi-1024.png 1024 stupinigi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'wall': toon('wall', '#f0d8b0', shadow_mul=(0.82, 0.8, 0.84), lift=0.2),
    'white': toon('white', '#f6f2ea', lift=0.25),
    'roof': toon('roof', '#b8603e'),
    'dome': toon('dome', '#9a8a7a'),
    'bronze': toon('bronze', '#6a5a3a', lift=0.2),
    'path': toon('path2', '#e2d6bc', lift=0.18),
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


box('avenue', M['path'], 0.0, -0.75, G - 0.004, 0.16, 0.6, 0.008, outline=0.001, bevel=0)
lathe('court', M['path'], ((0.5, 0), (0.5, 0.008)), G - 0.004, 0.0, -0.25, segs=32, outline=0.001)

# ---------- the oval hall ----------
HX, HY = 0.0, 0.15
lathe('hall', M['wall'], ((0.16, 0), (0.16, 0.26)), G - 0.005, HX, HY, segs=24, outline=0.006)
for j in range(8):
    a = -math.pi / 2 + (j - 3.5) * 0.3
    b = box(f'hallwin{j}', M['white'], 0, 0, 0, 0.035, 0.008, 0.12, outline=0, bevel=0)
    b.matrix_world = Matrix.Translation((HX + 0.162 * math.cos(a), HY + 0.162 * math.sin(a), G + 0.08)) @ Matrix.Rotation(a + math.pi / 2, 4, 'Z') @ b.matrix_world
lathe('dome1', M['dome'], ((0.17, 0), (0.15, 0.05), (0.12, 0.07)), G + 0.255, HX, HY, segs=24, outline=0.004)
lathe('dome2', M['dome'], ((0.1, 0), (0.1, 0.04), (0.08, 0.07), (0.04, 0.09)), G + 0.32, HX, HY, segs=24, outline=0.004)
# the bronze stag on top
SZ = G + 0.41
b = ball('stagbody', M['bronze'], 0, 0, 0, 0.03, outline=0.002)
b.scale = (1.6, 0.8, 0.8)
b.location = (HX, HY, SZ + 0.04)
for (dx, dy) in ((-0.03, -0.012), (-0.03, 0.012), (0.03, -0.012), (0.03, 0.012)):
    rod(f'stagleg{dx}{dy}', M['bronze'], (HX + dx, HY + dy, SZ), (HX + dx, HY + dy, SZ + 0.04), 0.005, segs=6, outline=0)
rod('stagneck', M['bronze'], (HX + 0.035, HY, SZ + 0.045), (HX + 0.05, HY, SZ + 0.08), 0.008, segs=6, outline=0)
for s in (-1, 1):
    bar(f'antler{s}', M['bronze'], (HX + 0.05, HY + s * 0.005, SZ + 0.085), (HX + 0.045, HY + s * 0.03, SZ + 0.12), 0.005, outline=0)

# ---------- the wings in a St Andrew's cross ----------
for k, a in enumerate((math.radians(-35), math.radians(-145), math.radians(35), math.radians(145))):
    L = 0.6 if k < 2 else 0.42
    cx, cy = HX + (0.16 + L / 2) * math.cos(a), HY + (0.16 + L / 2) * math.sin(a)
    objs = set(bpy.data.objects)
    box(f'wing{k}', M['wall'], 0, 0, G - 0.005, L, 0.14, 0.15, outline=0.005, bevel=0)
    hip(f'wingroof{k}', M['roof'], 0, 0, G + 0.145, L, 0.14, 0.07, over=0.01)
    for j in range(int(L / 0.07)):
        box(f'wingwin{k}{j}', M['white'], -L / 2 + 0.04 + j * 0.07, -0.073, G + 0.04, 0.03, 0.006, 0.06, outline=0, bevel=0)
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = Matrix.Translation((cx, cy, 0)) @ Matrix.Rotation(a if math.cos(a) > 0 else a + math.pi, 4, 'Z') @ o.matrix_world

for k, (x, y) in enumerate(((-0.25, -0.8), (0.25, -0.8), (-0.25, -1.05), (0.25, -1.05), (-0.85, 0.55), (0.85, 0.55), (0.0, 0.85))):
    tree(f'tree{k}', x, y, r=0.08, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
