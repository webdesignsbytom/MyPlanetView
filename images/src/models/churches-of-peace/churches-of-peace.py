# A cartoon Church of Peace for the country maps, built in the set's shared look (../toon.py): the
# great Lutheran half-timbered church at Świdnica in Silesia, Poland, built in a single year of
# wood, clay and straw as the peace of 1648 allowed, its dark timber frame over white infill,
# the cross plan with its steep tiled roofs, the porches, the separate wooden bell tower, and
# the graveyard trees round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P churches-of-peace.py -- churches-of-peace-1024.png 1024 churches-of-peace.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'white': toon('white', '#f2ece0', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'timber': toon('timber', '#4a3022'),
    'roof': toon('roof', '#b45a3a'),
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



def timbered(name, x, y, w, d, h):
    box(name, M['white'], x, y, G - 0.005, w, d, h, outline=0.005, bevel=0)
    n = max(3, int(w / 0.06))
    for j in range(n + 1):
        xx = x - w / 2 + j * w / n
        box(f'{name}postf{j}', M['timber'], xx, y - d / 2 - 0.003, G - 0.005, 0.01, 0.006, h, outline=0, bevel=0)
    m = max(3, int(d / 0.06))
    for j in range(m + 1):
        yy = y - d / 2 + j * d / m
        box(f'{name}posts{j}', M['timber'], x + w / 2 + 0.003, yy, G - 0.005, 0.006, 0.01, h, outline=0, bevel=0)
    for z in (h * 0.5, h - 0.01):
        box(f'{name}railf{z:.3f}', M['timber'], x, y - d / 2 - 0.003, G - 0.005 + z, w, 0.006, 0.01, outline=0, bevel=0)
        box(f'{name}rails{z:.3f}', M['timber'], x + w / 2 + 0.003, y, G - 0.005 + z, 0.006, d, 0.01, outline=0, bevel=0)
    for j in range(n):
        xx = x - w / 2 + (j + 0.5) * w / n
        bar(f'{name}brace{j}', M['timber'], (xx - w / n / 2, y - d / 2 - 0.004, G), (xx + w / n / 2, y - d / 2 - 0.004, G + h * 0.48), 0.008, outline=0)
        box(f'{name}win{j}', M['dark'], xx, y - d / 2 - 0.004, G + h * 0.6, 0.02, 0.004, h * 0.25, outline=0, bevel=0)


# ---------- the church on its cross plan ----------
CX, CY = 0.0, 0.15
timbered('nave', CX, CY, 0.32, 0.8, 0.26)
gable('naveroof', M['roof'], CX, CY, G + 0.255, 0.32, 0.8, 0.22, over=0.02, outline=0.006)
timbered('transept', CX, CY, 0.8, 0.3, 0.24)
gable('transeptroof', M['roof'], CX, CY, G + 0.235, 0.8, 0.3, 0.2, ridge_x=True, over=0.02, outline=0.006)
for s in (-1, 1):
    timbered(f'porch{s}', CX + s * 0.26, CY - 0.22, 0.14, 0.12, 0.13)
    gable(f'porchroof{s}', M['roof'], CX + s * 0.26, CY - 0.22, G + 0.125, 0.14, 0.12, 0.08, over=0.01)
box('frontdoor', M['dark'], CX, CY - 0.404, G - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)

# ---------- the bell tower ----------
BX, BY = 0.6, -0.45
timbered('belltower', BX, BY, 0.12, 0.12, 0.34)
hip('belltowercap', M['roof'], BX, BY, G + 0.335, 0.12, 0.12, 0.12, over=0.02)

box('path', M['path'], CX, CY - 0.7, G - 0.004, 0.12, 0.5, 0.008, outline=0.001, bevel=0)
for k, (x, y) in enumerate(((-0.75, -0.45), (-0.85, 0.3), (-0.55, 0.8), (0.55, 0.75), (0.9, 0.2), (0.35, -0.9))):
    tree(f'tree{k}', x, y, r=0.11, h=0.15)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
