# A cartoon Lorsch Abbey for the country maps, built in the set's shared look (../toon.py): the
# Carolingian abbey in Hesse, Germany, its famous gatehouse, the Torhalle, a little hall over
# three round arches between engaged columns, faced in a chequer of red and white stone with a
# row of pointed gables above, its steep roof, and behind it the surviving piece of the abbey
# church on the lawn. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lorsch.py -- lorsch-1024.png 1024 lorsch.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'red': toon('red', '#c4604a', shadow_mul=(0.78, 0.7, 0.74), lift=0.14),
    'white': toon('white', '#f0ece0', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'sandstone': toon('sandstone', '#d4a07a', lift=0.15),
    'roof': toon('roof', '#5a5a62'),
    'path': toon('path2', '#e0d4b8', lift=0.18),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)


box('path', M['path'], 0.0, -0.35, G - 0.004, 0.18, 1.2, 0.008, outline=0.001, bevel=0)

# ---------- the Torhalle ----------
TX, TY = 0.0, -0.05
W, D, H = 0.62, 0.26, 0.36
box('hall', M['sandstone'], TX, TY, G - 0.005, W, D, H, outline=0.007, bevel=0)
gable('hallroof', M['roof'], TX, TY, G + H - 0.005, W, D, 0.22, ridge_x=True, over=0.02, outline=0.006)
for s in (-1, 1):
    gable(f'gableend{s}', M['sandstone'], TX + s * (W / 2 - 0.005), TY, G + H - 0.005, 0.01, D, 0.2, outline=0.003)
FY = TY - D / 2 - 0.004
# the three arches between engaged half-columns
for j, x in enumerate((-0.2, 0.0, 0.2)):
    arch(f'arch{j}', M['dark'], TX + x, FY, G - 0.005, 0.12, 0.18)
for j, x in enumerate((-0.3, -0.1, 0.1, 0.3)):
    rod(f'halfcol{j}', M['white'], (TX + x, FY - 0.01, G - 0.005), (TX + x, FY - 0.01, G + 0.17), 0.016, segs=8, outline=0.001)
    box(f'capital{j}', M['white'], TX + x, FY - 0.01, G + 0.17, 0.04, 0.03, 0.02, outline=0.001, bevel=0)
box('cornice1', M['white'], TX, FY - 0.004, G + 0.19, W, 0.012, 0.014, outline=0.001, bevel=0)
# the chequer of red and white stones over the arches
for r in range(3):
    for c in range(16):
        if (r + c) % 2:
            continue
        box(f'cheq{r}{c}', M['red'], TX - W / 2 + 0.02 + c * 0.0387, FY - 0.002, G + 0.205 + r * 0.028, 0.034, 0.004, 0.025, outline=0, bevel=0)
    for c in range(16):
        if (r + c) % 2 == 0:
            continue
        box(f'cheqw{r}{c}', M['white'], TX - W / 2 + 0.02 + c * 0.0387, FY - 0.002, G + 0.205 + r * 0.028, 0.034, 0.004, 0.025, outline=0, bevel=0)
# the row of little pointed gables and pilasters
for j in range(10):
    x = TX - W / 2 + 0.04 + j * (W - 0.08) / 9
    box(f'pilaster{j}', M['white'], x, FY - 0.004, G + 0.29, 0.014, 0.006, 0.05, outline=0, bevel=0)
    if j < 9:
        loft(f'pointed{j}', M['white'], [[(x + 0.005, FY - 0.006, G + 0.33), (x + (W - 0.08) / 9 - 0.005, FY - 0.006, G + 0.33), (x + (W - 0.08) / 9 - 0.005, FY - 0.001, G + 0.33), (x + 0.005, FY - 0.001, G + 0.33)],
                                         [(x + (W - 0.08) / 18 - 0.002, FY - 0.006, G + 0.355), (x + (W - 0.08) / 18 + 0.002, FY - 0.006, G + 0.355), (x + (W - 0.08) / 18 + 0.002, FY - 0.001, G + 0.355), (x + (W - 0.08) / 18 - 0.002, FY - 0.001, G + 0.355)]], outline=0)

# ---------- the abbey church's surviving bay ----------
CX, CY = 0.15, 0.6
box('church', M['sandstone'], CX, CY, G - 0.005, 0.3, 0.3, 0.36, outline=0.006, bevel=0)
gable('churchroof', M['roof'], CX, CY, G + 0.355, 0.3, 0.3, 0.16, over=0.015)
for j in range(2):
    arch(f'churchwin{j}', M['dark'], CX - 0.06 + j * 0.12, CY - 0.153, G + 0.17, 0.045, 0.12)
arch('churchdoor', M['dark'], CX, CY - 0.153, G - 0.005, 0.06, 0.11)

for k, (x, y) in enumerate(((-0.75, 0.45), (-0.55, 0.85), (0.75, 0.5), (-0.8, -0.5), (0.8, -0.45), (0.65, 0.9))):
    tree(f'tree{k}', x, y, r=0.1, h=0.14)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
