# A cartoon Muskau Park for the country maps, built in the set's shared look (../toon.py): Prince
# Pückler's great English landscape park astride the Neisse on the border of Poland and
# Germany, the New Castle with its round towers and steep roofs on the water, the lawns and the
# clumps of trees, and the little bridges over the river and its loops. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P muskau.py -- muskau-1024.png 1024 muskau.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'wall': toon('wall', '#f0e6cc', shadow_mul=(0.82, 0.82, 0.88), lift=0.2),
    'trim': toon('trim', '#c8b48c'),
    'roof': toon('roof', '#b85a3a'),
    'bridge': toon('bridge', '#f2eee4', lift=0.2),
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


# ---------- the river's loop and the castle pond ----------
pts = [(-1.18, 0.5), (-0.8, 0.45), (-0.4, 0.62), (0.1, 0.55), (0.6, 0.65), (1.0, 0.5), (1.22, 0.36)]
for k in range(len(pts) - 1):
    bar(f'river{k}', M['water'], (pts[k][0], pts[k][1], G - 0.074), (pts[k + 1][0], pts[k + 1][1], G - 0.074), 0.16, outline=0)
lathe('pond', M['water'], ((0.42, 0), (0.42, 0.006)), G - 0.004, -0.05, -0.05, segs=32, outline=0.002)

# ---------- the New Castle on its island ----------
CX, CY = -0.05, -0.05
lathe('island', M['grass'], ((0.28, 0), (0.28, 0.02)), G - 0.004, CX, CY, segs=24, outline=0.002)
box('castle', M['wall'], CX, CY, G + 0.01, 0.36, 0.22, 0.2, outline=0.006, bevel=0)
hip('castleroof', M['roof'], CX, CY, G + 0.205, 0.36, 0.22, 0.12, over=0.01)
for s in (-1, 1):
    lathe(f'tower{s}', M['wall'], ((0.06, 0), (0.06, 0.28)), G + 0.01, CX + s * 0.18, CY - 0.1, segs=16, outline=0.004)
    lathe(f'towercap{s}', M['roof'], ((0.07, 0), (0.0, 0.14)), G + 0.285, CX + s * 0.18, CY - 0.1, segs=16, outline=0.004)
box('centretower', M['wall'], CX, CY - 0.11, G + 0.01, 0.1, 0.06, 0.32, outline=0.004, bevel=0)
hip('centretowercap', M['roof'], CX, CY - 0.11, G + 0.325, 0.11, 0.07, 0.1)
for j in range(6):
    box(f'win{j}', M['dark'], CX - 0.14 + j * 0.056, CY - 0.113, G + 0.08, 0.022, 0.006, 0.04, outline=0, bevel=0)
box('trimband', M['trim'], CX, CY - 0.112, G + 0.14, 0.34, 0.004, 0.01, outline=0, bevel=0)
# the bridges
for k, (x, y, rot) in enumerate(((CX, CY - 0.36, 0.0), (0.45, 0.58, math.pi / 2 + 0.1), (-0.6, 0.5, math.pi / 2 - 0.2))):
    objs = set(bpy.data.objects)
    for j in range(8):
        um = (j + 0.5) / 8
        z = G + 0.02 + 0.05 * math.sqrt(max(0.0, 1 - (2 * um - 1) ** 2))
        box(f'bridge{k}{j}', M['bridge'], -0.0, -0.12 + 0.24 * um, z, 0.08, 0.032, 0.02, outline=0.001, bevel=0)
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z') @ o.matrix_world

# ---------- clumps of trees on the lawns ----------
for k, (x, y) in enumerate(((-0.75, -0.25), (-0.65, -0.65), (0.55, -0.3), (0.75, -0.6), (0.3, -0.85), (-0.9, 0.2), (0.85, 0.1), (-0.2, 0.9), (0.4, 0.95))):
    tree(f'tree{k}', x, y, r=0.1, h=0.12, mat='tree' if k % 2 else 'treeLight')

bpy.context.view_layer.update()
turn(before, -20)
render(G)
